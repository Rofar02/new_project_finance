from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.models import Transactions
from app.models.transaction import TransactionType


async def get_stats_for_period(
    db: AsyncSession,
    user_id: int,
    date_from: date,
    date_to: date,
    group_by: str,
):
    if group_by == "day":
        period = func.date(Transactions.created_at)
    elif group_by == "month":
        period = func.date_trunc("month", Transactions.created_at)
    elif group_by == "year":
        period = func.date_trunc("year", Transactions.created_at)
    else:
        raise ValueError("Invalid group_by")

    query = (
        select(
            period.label("period"),
            func.sum(
                case(
                    (
                        Transactions.transaction_type == TransactionType.INCOME,
                        Transactions.amount,
                    ),
                    else_=0,
                )
            ).label("income"),
            func.sum(
                case(
                    (
                        Transactions.transaction_type == TransactionType.EXPENSE,
                        Transactions.amount,
                    ),
                    else_=0,
                )
            ).label("expense"),
        )
        .where(
            Transactions.user_id == user_id,
            Transactions.created_at >= date_from,
            Transactions.created_at <= date_to,
        )
        .group_by(period)
        .order_by(period)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "period": row.period.isoformat(),
            "income": row.income or 0,
            "expense": row.expense or 0,
        }
        for row in rows
    ]
