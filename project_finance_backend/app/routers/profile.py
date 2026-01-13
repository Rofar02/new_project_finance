from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Users
from app.api.dependencies import get_db, get_current_user
from app.schemas.users import ReadUser
from fastapi import Depends, APIRouter

from app.models import Transactions

router = APIRouter()


@router.get("/me", response_model=ReadUser)
async def get_current_user_info(current_user: Users = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.get("/profile")
async def get_current_profile(
    current_user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):

    income_transactions = select(func.sum(Transactions.amount)).where(
        Transactions.user_id == current_user.id,
        Transactions.transaction_type == "income",
    )

    expense_transactions = select(func.sum(Transactions.amount)).where(
        Transactions.user_id == current_user.id,
        Transactions.transaction_type == "expense",
    )

    income_res = await db.execute(income_transactions)
    expense_res = await db.execute(expense_transactions)

    total_income = income_res.scalar() or 0
    total_expense = expense_res.scalar() or 0

    return {
        "user_id": current_user.id,
        "user_email": current_user.email,
        "user_name": current_user.username,
        "income": total_income,
        "expense": total_expense,
        "balance": current_user.balance,
    }
