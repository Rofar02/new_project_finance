from pydantic import BaseModel, ConfigDict, Field, EmailStr, AfterValidator
from datetime import datetime
from typing import Annotated


def to_lower(v: str) -> str:
    return v.lower()


class UserBase(BaseModel):
    username: str
    email: Annotated[EmailStr, AfterValidator(to_lower)]
    balance: float
    is_admin: bool = False


class CreateUser(BaseModel):
    username: str | None = None  # Опциональное, будет сгенерировано из email если не указано
    email: Annotated[EmailStr, AfterValidator(to_lower)]
    hashed_password: str
    balance: float = 0.0
    is_admin: bool = False


class ReadUser(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UpdateUser(UserBase):
    username: str | None = None
    email: Annotated[EmailStr | None, AfterValidator(to_lower)] = None
    balance: float | None = None
    hashed_password: str | None = None
