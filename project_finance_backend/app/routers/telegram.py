from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.dependencies import get_db, get_current_user
from app.core.telegram_verification import verify_telegram_webapp_data
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import Users
from app.crud.user import create_user, get_users_id, update_user, get_hash_password
from app.schemas.users import CreateUser, UpdateUser
from datetime import timedelta

router = APIRouter(prefix="/telegram", tags=["telegram"])


class TelegramAuthRequest(BaseModel):
    init_data: str


class TelegramLinkRequest(BaseModel):
    init_data: str
    email: EmailStr
    password: str


class TelegramAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    is_new_user: bool
    needs_link: bool = False  # Нужно ли связать с существующим аккаунтом


class SetPasswordRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/auth", response_model=TelegramAuthResponse)
async def telegram_auth(
    request: TelegramAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Аутентификация через Telegram WebApp
    
    Верифицирует initData от Telegram и создает/находит пользователя
    """
    import logging
    import json
    from urllib.parse import unquote
    
    logger = logging.getLogger(__name__)
    
    logger.info(f"Telegram auth request received, init_data length: {len(request.init_data)}")
    
    # Верифицируем данные от Telegram
    verified_data = verify_telegram_webapp_data(
        request.init_data,
        settings.telegram_bot_token
    )
    
    if not verified_data:
        logger.error("Telegram data verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram data - verification failed"
        )
    
    logger.info(f"Telegram data verified successfully, keys: {list(verified_data.keys())}")
    
    # Парсим данные пользователя
    user_data_str = verified_data.get("user")
    if not user_data_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User data not found"
        )
    
    # Декодируем URL-encoded строку и парсим JSON
    try:
        decoded_user = unquote(user_data_str)
        user_data = json.loads(decoded_user)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user data format: {str(e)}"
        )
    
    telegram_id = user_data.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram ID not found"
        )
    
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip()
    telegram_username = user_data.get("username", "")
    
    # Ищем пользователя по username (формат tg_123456789)
    username = f"tg_{telegram_id}"
    result = await db.execute(
        select(Users).where(Users.username == username)
    )
    user = result.scalar_one_or_none()
    is_new_user = False
    needs_link = False
    
    if not user:
        # Пользователь еще не связан с Telegram
        # Нужно связать с существующим аккаунтом или создать новый
        needs_link = True
        # НЕ создаем пользователя сразу - ждем связывания через /link
        # Возвращаем временный ответ без токена
        return TelegramAuthResponse(
            access_token="",  # Пустой токен, нужно связать аккаунт
            token_type="bearer",
            user={
                "id": 0,
                "username": username,
                "email": "",
                "balance": 0.0,
                "telegram_id": telegram_id,
                "telegram_name": full_name
            },
            is_new_user=True,
            needs_link=True
        )
    
    # Создаем JWT токен
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        user_id=user.id,
        expires_delta=access_token_expires
    )
    
    return TelegramAuthResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "balance": user.balance,
            "telegram_id": telegram_id,
            "telegram_name": full_name
        },
        is_new_user=is_new_user,
        needs_link=needs_link
    )


@router.post("/link")
async def link_telegram_account(
    request: TelegramLinkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Связывание Telegram аккаунта с существующим аккаунтом
    
    Пользователь вводит email и пароль один раз, после этого его Telegram
    связывается с существующим аккаунтом
    """
    import logging
    import json
    from urllib.parse import unquote
    from app.crud.user import verify_password
    
    logger = logging.getLogger(__name__)
    
    # Верифицируем данные от Telegram
    verified_data = verify_telegram_webapp_data(
        request.init_data,
        settings.telegram_bot_token
    )
    
    if not verified_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram data"
        )
    
    # Парсим данные пользователя Telegram
    user_data_str = verified_data.get("user")
    if not user_data_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User data not found"
        )
    
    try:
        decoded_user = unquote(user_data_str)
        user_data = json.loads(decoded_user)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user data format: {str(e)}"
        )
    
    telegram_id = user_data.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram ID not found"
        )
    
    # Ищем существующего пользователя по email
    existing_user_result = await db.execute(
        select(Users).where(Users.email == request.email)
    )
    existing_user = existing_user_result.scalar_one_or_none()
    
    if not existing_user:
        # Пользователя с таким email нет - создаем нового
        # Используем Telegram username и устанавливаем email и пароль
        telegram_username = f"tg_{telegram_id}"
        
        # Проверяем, не занят ли username
        existing_username_result = await db.execute(
            select(Users).where(Users.username == telegram_username)
        )
        if existing_username_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telegram account already linked"
            )
        
        # Создаем нового пользователя
        user_data_create = CreateUser(
            username=telegram_username,
            email=request.email,
            hashed_password=request.password,
            balance=0.0
        )
        
        existing_user = await create_user(db, user_data_create)
    else:
        # Пользователь существует - проверяем пароль
        if not verify_password(request.password, existing_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
    
    # Проверяем, не связан ли уже этот Telegram с другим аккаунтом
    telegram_username = f"tg_{telegram_id}"
    telegram_user_result = await db.execute(
        select(Users).where(Users.username == telegram_username)
    )
    telegram_user = telegram_user_result.scalar_one_or_none()
    
    if telegram_user and telegram_user.id != existing_user.id:
        # Если Telegram уже связан с другим аккаунтом, удаляем временного пользователя
        await db.delete(telegram_user)
        await db.commit()
    
    # Обновляем username существующего пользователя на Telegram username
    # Это свяжет аккаунты - теперь пользователь может входить через Telegram
    existing_user.username = telegram_username
    db.add(existing_user)
    await db.commit()
    await db.refresh(existing_user)
    
    # Создаем JWT токен
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        user_id=existing_user.id,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "username": existing_user.username,
            "email": existing_user.email,
            "balance": existing_user.balance,
            "telegram_id": telegram_id
        },
        "message": "Telegram account linked successfully"
    }
