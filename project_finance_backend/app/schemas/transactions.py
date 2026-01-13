from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    category_id: int
    amount: float = Field(..., ge=0)
    transaction_type: TransactionType
    description: str | None = None


class TransactionCreate(TransactionBase):
    pass


class CategoryInfo(BaseModel):
    id: int
    name: str
    type: str
    color: str | None = None
    icon: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ReadTransaction(BaseModel):
    id: int
    amount: float
    category_id: int
    transaction_type: TransactionType
    description: str | None = None
    created_at: datetime
    category: Optional[CategoryInfo] = None

    model_config = ConfigDict(from_attributes=True)


class UpdateTransaction(BaseModel):
    category_id: int | None = None
    amount: float | None = None
    transaction_type: str | None = None
    description: str | None = None
