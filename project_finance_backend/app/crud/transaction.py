from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.transaction import Transactions, TransactionType
from app.schemas.transactions import TransactionCreate, UpdateTransaction
from app.models import Users, Categories


async def create_transaction(
    current_user: Users, db: AsyncSession, transaction_create: TransactionCreate
):
    new_transaction_obj = Transactions(
        **transaction_create.model_dump(exclude={"user_id"}), user_id=current_user.id
    )

    category = await db.execute(
        select(Categories).where(
            Categories.id == transaction_create.category_id,
            Categories.user_id == current_user.id,
        )
    )
    category = category.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if new_transaction_obj.transaction_type == TransactionType.INCOME:
        current_user.balance += new_transaction_obj.amount
    elif new_transaction_obj.transaction_type == TransactionType.EXPENSE:
        current_user.balance -= new_transaction_obj.amount

    db.add(new_transaction_obj)
    await db.commit()
    await db.refresh(new_transaction_obj, ["category"])
    return new_transaction_obj


async def get_transactions(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(Transactions).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_transactions_id(db: AsyncSession, transaction_id: int):
    query = select(Transactions).where(Transactions.id == transaction_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_transaction(
    current_user: Users,
    db: AsyncSession,
    transaction_id: int,
    transaction_data: UpdateTransaction,
):
    db_transaction = await get_transactions_id(db, transaction_id)

    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if db_transaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    updated_transaction = transaction_data.model_dump(exclude_unset=True)

    if db_transaction.transaction_type == TransactionType.INCOME:
        current_user.balance -= db_transaction.amount
    elif db_transaction.transaction_type == TransactionType.EXPENSE:
        current_user.balance += db_transaction.amount

    for key, value in updated_transaction.items():
        setattr(db_transaction, key, value)

    if db_transaction.transaction_type == TransactionType.INCOME:
        current_user.balance += db_transaction.amount
    elif db_transaction.transaction_type == TransactionType.EXPENSE:
        current_user.balance -= db_transaction.amount

    db.add(db_transaction)
    db.add(current_user)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def delete_transaction(
    current_user: Users, db: AsyncSession, transaction_id: int
):
    db_transaction = await get_transactions_id(db, transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Проверяем, что транзакция принадлежит текущему пользователю
    if db_transaction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Обновляем баланс пользователя
    if db_transaction.transaction_type == TransactionType.INCOME:
        current_user.balance -= db_transaction.amount
    elif db_transaction.transaction_type == TransactionType.EXPENSE:
        current_user.balance += db_transaction.amount

    # Удаляем транзакцию (правильный синтаксис для async SQLAlchemy 2.0)
    await db.delete(db_transaction)
    db.add(current_user)
    await db.commit()
    return db_transaction
