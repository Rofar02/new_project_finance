from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


from app.models import Categories, Users
from app.schemas.categories import CategoryCreate, CategoryUpdate


async def create_category(
    current_user: Users, db: AsyncSession, category_data: CategoryCreate
):
    db_category = category_data.model_dump(exclude_unset=True)
    category = Categories(**db_category, user_id=current_user.id)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def get_categories(
    current_user: Users, db: AsyncSession, skip: int = 0, limit: int = 100
):
    query = (
        select(Categories)
        .where(Categories.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


async def get_categories_id(db: AsyncSession, category_id: int, current_user: Users):
    query = select(Categories).where(
        Categories.id == category_id, Categories.user_id == current_user.id
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_category(
    db: AsyncSession,
    category_id: int,
    category_data: CategoryUpdate,
    current_user: Users,
):
    category = await get_categories_id(db, category_id, current_user)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found or forbidden")

    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category_id: int, current_user: Users):
    category = await get_categories_id(db, category_id, current_user)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found or forbidden")
    await db.delete(category)
    await db.commit()
    return category
