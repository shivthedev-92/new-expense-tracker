from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import create_transaction, delete_transaction, get_transaction, list_transactions, update_transaction
from app.models import Transaction, TransactionKind, User
from app.schemas import TransactionIn


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
        "amount": 92.5,
        "spent_on": date(2026, 6, 13),
        "notes": "Client dinner",
    }
    payload.update(overrides)
    return TransactionIn(**payload)


def test_create_and_list_transactions_for_current_user(db, user):
    created = create_transaction(transaction_payload(), user, db)

    assert created.id > 0
    assert created.merchant == "Dinner downtown"
    assert created.amount == 92.5

    rows = list_transactions(user, db)

    assert rows == [created]


def test_get_update_and_delete_transaction(db, user):
    created = create_transaction(transaction_payload(), user, db)

    fetched = get_transaction(created.id, user, db)
    assert fetched.category == "Food"

    updated_payload = transaction_payload(category="Travel", merchant="Airport taxi", amount=48.25, notes=None)
    updated = update_transaction(created.id, updated_payload, user, db)

    assert updated.merchant == "Airport taxi"
    assert updated.category == "Travel"
    assert updated.amount == 48.25

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
