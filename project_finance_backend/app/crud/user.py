from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import Users
from app.schemas.users import CreateUser, UpdateUser

import bcrypt


def get_hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


async def create_user(db: AsyncSession, user_data: CreateUser):
    db_user = user_data.model_dump(exclude_unset=True)
    db_user["hashed_password"] = get_hash_password(user_data.hashed_password)
    
    # Если username не указан, генерируем его из email
    if not db_user.get("username"):
        # Берем часть до @ из email
        email_local = user_data.email.split("@")[0]
        # Убираем все не-буквенно-цифровые символы и ограничиваем длину
        username_base = "".join(c for c in email_local if c.isalnum() or c in "._-")[:20]
        
        # Проверяем уникальность и добавляем суффикс если нужно
        username = username_base
        counter = 1
        while True:
            result = await db.execute(select(Users).where(Users.username == username))
            if result.scalar_one_or_none() is None:
                break
            username = f"{username_base}{counter}"
            counter += 1
        
        db_user["username"] = username
    
    user = Users(**db_user)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(Users).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_users_id(db: AsyncSession, user_id: int):
    query = select(Users).where(Users.id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_user(db: AsyncSession, user_id: int, user_data: UpdateUser):
    db_user = await get_users_id(db, user_id)
    if not db_user:
        return None

    update_data = user_data.model_dump(exclude_unset=True)

    # если приходит новый пароль, хэшируем его и сохраняем в hashed_password
    if "hashed_password" in update_data and update_data["hashed_password"]:
        update_data["hashed_password"] = get_hash_password(
            update_data.pop("hashed_password")
        )

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def delete_user(db: AsyncSession, user_id: int):
    db_user = await get_users_id(db, user_id)
    if not db_user:
        return None
    await db.delete(db_user)
    await db.commit()
    return db_user


async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int):
    """Получить пользователя по Telegram ID"""
    username = f"tg_{telegram_id}"
    query = select(Users).where(Users.username == username)
    result = await db.execute(query)
    return result.scalar_one_or_none()