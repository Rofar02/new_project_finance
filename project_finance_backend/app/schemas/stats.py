from pydantic import BaseModel


class StatsItem(BaseModel):
    period: str
    income: float
    expense: float
