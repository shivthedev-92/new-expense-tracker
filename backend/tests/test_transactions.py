from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import create_loan, create_transaction, delete_loan, delete_transaction, get_transaction, list_loans, list_transactions, update_loan, update_transaction
from app.models import Loan, Transaction, TransactionKind, User
from app.schemas import LoanIn, TransactionIn


engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add(User(id=1, email="test@example.com", name="Test User", password_hash="x", salary=7200))
    db.add(User(id=2, email="other@example.com", name="Other User", password_hash="x", salary=5000))
    db.commit()
    db.close()


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def user():
    return User(id=1, email="test@example.com", name="Test User", password_hash="x", salary=7200)


def transaction_payload(**overrides):
    payload = {
        "kind": TransactionKind.expense,
        "category": "Food",
        "group_name": "Los Angeles Trip",
        "source": "Credit Card",
        "merchant": "Dinner downtown",
        "alias": "Team dinner",
        "amount": 92.5,
        "spent_on": date(2026, 6, 13),
        "notes": "Client dinner",
    }
    payload.update(overrides)
    return TransactionIn(**payload)


def loan_payload(**overrides):
    payload = {
        "lender": "Home Loan",
        "account_type": "loan",
        "principal": 240000,
        "outstanding": 214500,
        "emi": 1850,
        "due_day": 1,
        "interest_rate": 6.4,
        "tenure_months": 180,
        "periods_paid": 12,
    }
    payload.update(overrides)
    return LoanIn(**payload)


def test_create_and_list_transactions_for_current_user(db, user):
    created = create_transaction(transaction_payload(excluded_from_totals=True), user, db)

    assert created.id > 0
    assert created.merchant == "Dinner downtown"
    assert created.alias == "Team dinner"
    assert created.notes == "Client dinner"
    assert created.amount == 92.5
    assert created.excluded_from_totals is True

    rows = list_transactions(user, db)

    assert rows == [created]


def test_get_update_and_delete_transaction(db, user):
    created = create_transaction(transaction_payload(), user, db)

    fetched = get_transaction(created.id, user, db)
    assert fetched.category == "Food"

    updated_payload = transaction_payload(category="Travel", merchant="Airport taxi", alias="Airport ride", amount=48.25, excluded_from_totals=True, notes=None)
    updated = update_transaction(created.id, updated_payload, user, db)

    assert updated.merchant == "Airport taxi"
    assert updated.alias == "Airport ride"
    assert updated.category == "Travel"
    assert updated.amount == 48.25
    assert updated.excluded_from_totals is True

    assert delete_transaction(created.id, user, db) is None

    with pytest.raises(HTTPException) as exc:
        get_transaction(created.id, user, db)
    assert exc.value.status_code == 404


def test_transaction_crud_does_not_cross_user_boundary(db, user):
    other_user_transaction = Transaction(
        user_id=2,
        kind=TransactionKind.expense,
        category="Hidden",
        merchant="Other user merchant",
        amount=10,
        spent_on=date(2026, 6, 13),
    )
    db.add(other_user_transaction)
    db.commit()

    with pytest.raises(HTTPException) as get_exc:
        get_transaction(other_user_transaction.id, user, db)
    assert get_exc.value.status_code == 404

    with pytest.raises(HTTPException) as update_exc:
        update_transaction(other_user_transaction.id, transaction_payload(), user, db)
    assert update_exc.value.status_code == 404

    with pytest.raises(HTTPException) as delete_exc:
        delete_transaction(other_user_transaction.id, user, db)
    assert delete_exc.value.status_code == 404


def test_create_list_update_and_delete_loans_for_current_user(db, user):
    created = create_loan(loan_payload(), user, db)

    assert created.id > 0
    assert created.lender == "Home Loan"
    assert created.account_type == "loan"
    assert created.tenure_months == 180
    assert created.periods_paid == 12

    assert list_loans(user, db) == [created]

    updated = update_loan(created.id, loan_payload(lender="Refinanced Home Loan", interest_rate=6.1), user, db)

    assert updated.lender == "Refinanced Home Loan"
    assert updated.interest_rate == 6.1

    card = create_loan(loan_payload(account_type="credit-card", lender="Travel Credit Card", principal=150000, outstanding=42000, emi=7000), user, db)
    assert card.account_type == "credit-card"

    card_with_breakdown = create_loan(loan_payload(
        account_type="credit-card",
        lender="Rewards Card",
        principal=100000,
        outstanding=93000,
        emi=7500,
        credit_limit=100000,
        card_outstanding=93000,
        emi_outstanding=50000,
        monthly_emi=7500,
        minimum_due=12000,
        emi_plans=[{"name": "MacBook EMI", "purchased": "Laptop", "loanedAmount": 90000, "outstanding": 50000, "monthlyEmi": 7500, "totalEmis": 12, "completedEmis": 5}],
    ), user, db)
    assert card_with_breakdown.card_outstanding == 93000
    assert card_with_breakdown.emi_outstanding == 50000
    assert card_with_breakdown.monthly_emi == 7500
    assert card_with_breakdown.emi_plans[0]["purchased"] == "Laptop"

    assert delete_loan(created.id, user, db) is None
    assert list_loans(user, db) == [card, card_with_breakdown]


def test_loan_crud_does_not_cross_user_boundary(db, user):
    other_user_loan = Loan(
        user_id=2,
        account_type="loan",
        lender="Other User Loan",
        principal=100000,
        outstanding=90000,
        emi=2500,
        due_day=8,
        interest_rate=10.5,
    )
    db.add(other_user_loan)
    db.commit()

    with pytest.raises(HTTPException) as update_exc:
        update_loan(other_user_loan.id, loan_payload(), user, db)
    assert update_exc.value.status_code == 404

    with pytest.raises(HTTPException) as delete_exc:
        delete_loan(other_user_loan.id, user, db)
    assert delete_exc.value.status_code == 404
