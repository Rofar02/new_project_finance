from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from app.crud import category
from app.schemas.categories import CategoryCreate, CategoryRead, CategoryUpdate
from app.api.dependencies import get_db, get_current_user
from app.models import Users

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryRead])
async def read_categories(
    current_user: Users = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    read_category = await category.get_categories(
        current_user, db, skip=skip, limit=limit
    )
    return read_category


@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    read_category = await category.get_categories_id(db, category_id, current_user)
    if not read_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return read_category


@router.post("/", response_model=CategoryRead)
async def create_category(
    category_create: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    new_category = await category.create_category(current_user, db, category_create)
    return new_category


@router.put("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    updated_category = await category.update_category(
        db, category_id, category_update, current_user
    )
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    deleted_category = await category.delete_category(db, category_id, current_user)
    return {"detail": f"Category {category_id} deleted"}
