from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.stats import get_stats_for_period

from app.api.dependencies import get_db, get_current_user
from app.models import Users
from app.schemas.stats import StatsItem

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/", response_model=list[StatsItem])
async def get_stats(
    date_from: date = Query(..., description="Начало периода (YYYY-MM-DD)"),
    date_to: date = Query(..., description="Конец периода (YYYY-MM-DD)"),
    group_by: str = Query("month", enum=["day", "month", "year"]),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return await get_stats_for_period(
        db=db,
        user_id=current_user.id,
        date_from=date_from,
        date_to=date_to,
        group_by=group_by,
    )
