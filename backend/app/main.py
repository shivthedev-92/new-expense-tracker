from datetime import date, datetime, timedelta
import json

import httpx
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Loan, Transaction, TransactionKind, User
from .schemas import (
    AuthResponse,
    ChatRequest,
    ChatResponse,
    LoanIn,
    LoanOut,
    LoginRequest,
    ProfileUpdate,
    ReceiptAnalysis,
    RegisterRequest,
    TransactionIn,
    TransactionOut,
    UserOut,
)

app = FastAPI(title="Expense Tracker API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@app.on_event("startup")
def initialize_database() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        with engine.begin() as connection:
            columns = {column["name"] for column in inspect(connection).get_columns("transactions")}
            if "excluded_from_totals" not in columns:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN excluded_from_totals BOOLEAN NOT NULL DEFAULT FALSE"))
            if "alias" not in columns:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN alias VARCHAR(160)"))
            loan_columns = {column["name"] for column in inspect(connection).get_columns("loans")}
            if "account_type" not in loan_columns:
                connection.execute(text("ALTER TABLE loans ADD COLUMN account_type VARCHAR(40) NOT NULL DEFAULT 'loan'"))
            if "tenure_months" not in loan_columns:
                connection.execute(text("ALTER TABLE loans ADD COLUMN tenure_months INTEGER"))
            if "periods_paid" not in loan_columns:
                connection.execute(text("ALTER TABLE loans ADD COLUMN periods_paid INTEGER"))
            for column_name in ["credit_limit", "card_outstanding", "emi_outstanding", "monthly_emi", "minimum_due"]:
                if column_name not in loan_columns:
                    connection.execute(text(f"ALTER TABLE loans ADD COLUMN {column_name} FLOAT"))
            if "emi_plans" not in loan_columns:
                connection.execute(text("ALTER TABLE loans ADD COLUMN emi_plans JSON"))
    except SQLAlchemyError as exc:
        print(f"Database initialization skipped: {exc}")


def create_token(user: User) -> str:
    payload = {"sub": str(user.id), "email": user.email}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def seed_user_data(db: Session, user: User) -> None:
    if db.scalar(select(func.count(Transaction.id)).where(Transaction.user_id == user.id)):
        return

    samples = [
        ("expense", "Travel", "Los Angeles Trip", None, "Hotel booking", 740, -2),
        ("expense", "Food", "Los Angeles Trip", None, "Dinner downtown", 92, -1),
        ("expense", "Rent", None, None, "Apartment rent", 1450, -9),
        ("expense", "Utilities", None, None, "Electricity bill", 128, -6),
        ("expense", "Subscriptions", None, None, "Streaming bundle", 46, -3),
        ("income", "Salary", None, "Salary", "Acme Payroll", 7200, -12),
        ("income", "Credit Card", None, "Credit Card", "Cashback rewards", 85, -5),
    ]
    for kind, category, group, source, merchant, amount, offset in samples:
        db.add(
            Transaction(
                user_id=user.id,
                kind=TransactionKind(kind),
                category=category,
                group_name=group,
                source=source,
                merchant=merchant,
                amount=amount,
                spent_on=date.today() + timedelta(days=offset),
            )
        )
    db.add(Loan(user_id=user.id, account_type="loan", lender="Home Loan", principal=240000, outstanding=214500, emi=1850, due_day=1, interest_rate=6.4))
    db.add(Loan(user_id=user.id, account_type="loan", lender="Car Loan", principal=28000, outstanding=16400, emi=540, due_day=3, interest_rate=7.1))
    db.commit()


async def ask_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "think": False,
                "options": {"num_predict": 512, "temperature": 0.2},
            },
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("message", {}).get("content", "") or payload.get("response", "") or payload.get("thinking", "")


def extract_json_object(text: str) -> dict | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


@app.post("/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(email=payload.email, name=payload.name, password_hash=pwd_context.hash(payload.password), salary=0)
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthResponse(access_token=create_token(user), user=user)


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(access_token=create_token(user), user=user)


@app.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@app.patch("/me", response_model=UserOut)
def update_me(payload: ProfileUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Transaction).where(Transaction.user_id == user.id).order_by(Transaction.spent_on.desc())).all()


@app.post("/transactions", response_model=TransactionOut)
def create_transaction(payload: TransactionIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    transaction = Transaction(user_id=user.id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.get("/transactions/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@app.put("/transactions/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    payload: TransactionIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in payload.model_dump().items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return None


@app.get("/loans", response_model=list[LoanOut])
def list_loans(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Loan).where(Loan.user_id == user.id).order_by(Loan.due_day)).all()


@app.post("/loans", response_model=LoanOut)
def create_loan(payload: LoanIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    loan = Loan(user_id=user.id, **payload.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@app.put("/loans/{loan_id}", response_model=LoanOut)
def update_loan(
    loan_id: int,
    payload: LoanIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    loan = db.scalar(select(Loan).where(Loan.id == loan_id, Loan.user_id == user.id))
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    for key, value in payload.model_dump().items():
        setattr(loan, key, value)
    db.commit()
    db.refresh(loan)
    return loan


@app.delete("/loans/{loan_id}", status_code=204)
def delete_loan(loan_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    loan = db.scalar(select(Loan).where(Loan.id == loan_id, Loan.user_id == user.id))
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    db.delete(loan)
    db.commit()
    return None


@app.get("/dashboard")
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Transaction).where(Transaction.user_id == user.id)).all()
    loans = db.scalars(select(Loan).where(Loan.user_id == user.id)).all()
    today = date.today()
    current_month = [r for r in rows if r.spent_on.year == today.year and r.spent_on.month == today.month]
    previous_month_date = today.replace(day=1) - timedelta(days=1)
    previous_month = [r for r in rows if r.spent_on.year == previous_month_date.year and r.spent_on.month == previous_month_date.month]

    def total(items, kind):
        return sum(item.amount for item in items if item.kind == kind)

    expenses = total(current_month, TransactionKind.expense)
    income = total(current_month, TransactionKind.income) + user.salary
    prev_expenses = total(previous_month, TransactionKind.expense)
    category_totals = {}
    for item in current_month:
        if item.kind == TransactionKind.expense:
            category_totals[item.category] = category_totals.get(item.category, 0) + item.amount
    leakage = sorted(category_totals.items(), key=lambda pair: pair[1], reverse=True)[:3]

    return {
        "total_expenses": expenses,
        "total_income": income,
        "net_cashflow": income - expenses,
        "loan_emi_total": sum(loan.emi for loan in loans),
        "previous_month_expenses": prev_expenses,
        "month_over_month_delta": expenses - prev_expenses,
        "money_leakage": [{"category": category, "amount": amount} for category, amount in leakage],
    }


@app.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest):
    prompt = (
        "You are Hermes.Exp, a concise personal finance assistant for an expense tracker. "
        "Answer using the user's transaction and receipt context when provided. "
        "If the user asks for analysis, include practical money leakage or categorization insight.\n\n"
        f"Context:\n{payload.context or 'No additional context provided.'}\n\n"
        f"User question:\n{payload.message}"
    )
    try:
        text = await ask_ollama(prompt)
    except httpx.HTTPError as exc:
        return {
            "answer": f"Ollama is unavailable: {exc}. Start Ollama and make sure `{settings.ollama_model}` is installed.",
            "raw_model_output": None,
        }
    return {"answer": text.strip() or "I could not generate a response.", "raw_model_output": text}


@app.post("/ai/receipt", response_model=ReceiptAnalysis)
async def analyze_receipt(prompt: str = Form("Extract expense details from this receipt."), file: UploadFile = File(...)):
    contents = await file.read()
    user_prompt = (
        "You are Hermes.Exp, a receipt and invoice extraction assistant. "
        "Return only compact JSON with merchant, amount, category, spent_on as YYYY-MM-DD, and notes. "
        "If a value is unknown, infer cautiously from the prompt or use null for notes. "
        f"\n\nUser request: {prompt}\n"
        f"Uploaded file metadata: name={file.filename}, content_type={file.content_type}, bytes={len(contents)}.\n"
        "Note: this local endpoint receives file metadata for now; if OCR text is included in the user request, use it."
    )
    try:
        text = await ask_ollama(user_prompt)
    except httpx.HTTPError as exc:
        return {
            "summary": f"Ollama is unavailable: {exc}. Receipt was accepted for manual review.",
            "extracted_expense": None,
            "raw_model_output": None,
        }

    extracted = None
    parsed = extract_json_object(text)
    if parsed:
        amount = parsed.get("amount") or 0
        spent_on = parsed.get("spent_on") or datetime.utcnow().date().isoformat()
        extracted = {
            "merchant": parsed.get("merchant", "Receipt upload"),
            "amount": float(amount),
            "category": parsed.get("category", "Uncategorized"),
            "spent_on": spent_on,
            "notes": parsed.get("notes"),
        }

    return {
        "summary": "Receipt analyzed with local Qwen model." if extracted else "Receipt analyzed, but no structured expense could be extracted.",
        "extracted_expense": extracted,
        "raw_model_output": text,
    }
