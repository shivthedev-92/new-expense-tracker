# Expense Tracker

Full-stack expense tracker built from `new-expense-tracker.txt`.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Local LLM: Ollama with `qwen3:8b`

## Run locally

1. Start Postgres:

```bash
docker compose up -d postgres
```

2. Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

4. Open `http://localhost:5173`.

## Environment

Copy `.env.example` to `.env` if you want to override defaults.

The app defaults to:

- `DATABASE_URL=postgresql+psycopg://expense:expense@localhost:5433/expense_tracker`
- `OLLAMA_MODEL=qwen3:8b`
- `OLLAMA_URL=http://127.0.0.1:11434`

## Included Screens

- Dashboard with spending, income, loan, money leakage, and historical comparison widgets
- Transaction Log with daily, weekly, fortnight, and monthly views
- Loan tracker with EMI totals
- AI receipt chat with conversation history, pinning, upload flow, and add-as-expense action
- Graph builder for custom spending charts
- Profile settings with salary, income sources, profile picture, themes, and dark/light mode
- Export controls for user expenses
