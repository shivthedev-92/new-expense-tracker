from datetime import date

from pydantic import BaseModel, EmailStr

from .models import TransactionKind


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(LoginRequest):
    name: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    salary: float
    theme: str
    dark_mode: bool
    profile_picture_url: str | None = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    user: UserOut


class TransactionIn(BaseModel):
    kind: TransactionKind = TransactionKind.expense
    category: str
    group_name: str | None = None
    source: str | None = None
    merchant: str
    amount: float
    spent_on: date
    notes: str | None = None


class TransactionOut(TransactionIn):
    id: int

    class Config:
        from_attributes = True


class LoanIn(BaseModel):
    lender: str
    principal: float
    outstanding: float
    emi: float
    due_day: int = 1
    interest_rate: float = 0


class LoanOut(LoanIn):
    id: int

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: str | None = None
    salary: float | None = None
    theme: str | None = None
    dark_mode: bool | None = None
    profile_picture_url: str | None = None


class ReceiptExpense(BaseModel):
    merchant: str
    amount: float
    category: str
    spent_on: date
    notes: str | None = None


class ReceiptAnalysis(BaseModel):
    summary: str
    extracted_expense: ReceiptExpense | None = None
    raw_model_output: str | None = None


class ChatRequest(BaseModel):
    message: str
    context: str | None = None


class ChatResponse(BaseModel):
    answer: str
    raw_model_output: str | None = None
