from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, Float, Boolean
from datetime import datetime

from app.models.transaction import Transactions
from .base import Base


class Users(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now())
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    categories: Mapped[list["Categories"]] = relationship(
        "Categories", back_populates="user"
    )
    transactions: Mapped[list["Transactions"]] = relationship(
        "Transactions", back_populates="user"
    )
