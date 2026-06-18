from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TransactionKind(str, Enum):
    expense = "expense"
    income = "income"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    salary: Mapped[float] = mapped_column(Float, default=0)
    theme: Mapped[str] = mapped_column(String(32), default="emerald")
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    profile_picture_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    loans: Mapped[list["Loan"]] = relationship(back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[TransactionKind] = mapped_column(SqlEnum(TransactionKind), default=TransactionKind.expense)
    category: Mapped[str] = mapped_column(String(120), index=True)
    group_name: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    merchant: Mapped[str] = mapped_column(String(160))
    alias: Mapped[str | None] = mapped_column(String(160), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    spent_on: Mapped[date] = mapped_column(Date, default=date.today)
    excluded_from_totals: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="transactions")


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    lender: Mapped[str] = mapped_column(String(160))
    principal: Mapped[float] = mapped_column(Float)
    outstanding: Mapped[float] = mapped_column(Float)
    emi: Mapped[float] = mapped_column(Float)
    due_day: Mapped[int] = mapped_column(Integer, default=1)
    interest_rate: Mapped[float] = mapped_column(Float, default=0)

    user: Mapped[User] = relationship(back_populates="loans")
