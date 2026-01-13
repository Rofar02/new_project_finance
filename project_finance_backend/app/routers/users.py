from fastapi import Depends, APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.schemas.users import ReadUser, UpdateUser, CreateUser
from app.api.dependencies import get_db, get_current_admin
from app.models import Users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[ReadUser])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_admin: Users = Depends(get_current_admin),
):
    users = await user_crud.get_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=ReadUser)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_users_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=ReadUser)
async def create_user(user_data: CreateUser, db: AsyncSession = Depends(get_db)):
    created_user = await user_crud.create_user(db, user_data)
    return created_user


@router.put("/{user_id}", response_model=ReadUser)
async def update_user(
    user_id: int,
    user_data: UpdateUser,
    db: AsyncSession = Depends(get_db),
    current_admin: Users = Depends(get_current_admin),
):
    updated_user = await user_crud.update_user(db, user_id, user_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Users = Depends(get_current_admin),
):
    deleted_user = await user_crud.delete_user(db, user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": f"User {user_id} deleted"}
