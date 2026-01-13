from datetime import timedelta

from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user
from app.crud.user import verify_password
from app.core.security import create_access_token
from app.core.config import settings

from app.schemas.auth import TokenRequest, TokenResponse
from app.models import Users

router = APIRouter()


@router.post("/token", response_model=TokenResponse)
async def verify_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    # Приводим email к нижнему регистру, так как при регистрации email сохраняется в нижнем регистре
    email_lower = form_data.username.lower()
    
    result = await db.execute(select(Users).where(Users.email == email_lower))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    password_valid = verify_password(form_data.password, user.hashed_password)
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        user_id=user.id,
        expires_delta=access_token_expires,
    )
    return TokenResponse(access_token=access_token, token_type="bearer")
