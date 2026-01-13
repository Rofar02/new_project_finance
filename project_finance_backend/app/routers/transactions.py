from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud import transaction
from app.schemas.transactions import (
    TransactionCreate,
    ReadTransaction,
    UpdateTransaction,
)
from app.api.dependencies import get_db, get_current_user
from app.models import Users
from app.models import Transactions
from app.models.transaction import TransactionType

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[ReadTransaction])
async def read_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    result = await db.execute(
        select(Transactions)
        .where(Transactions.user_id == current_user.id)
        .options(selectinload(Transactions.category))
        .offset(skip)
        .limit(limit)
        .order_by(Transactions.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{transaction_id}", response_model=ReadTransaction)
async def read_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    result = await db.execute(
        select(Transactions)
        .where(Transactions.id == transaction_id)
        .options(selectinload(Transactions.category))
    )
    transaction_obj = result.scalar_one_or_none()
    
    if not transaction_obj:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return transaction_obj


@router.post("/", response_model=ReadTransaction)
async def create_transaction(
    transaction_create: TransactionCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_transaction_obj = await transaction.create_transaction(
        current_user, db, transaction_create
    )
    return new_transaction_obj


@router.put("/{transaction_id}", response_model=ReadTransaction)
async def update_transaction(
    transaction_id: int,
    transaction_data: UpdateTransaction,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    transaction_obj = await transaction.update_transaction(
        current_user, db, transaction_id, transaction_data
    )
    return transaction_obj


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    transaction_obj = await transaction.delete_transaction(
        current_user, db, transaction_id
    )
    return transaction_obj
