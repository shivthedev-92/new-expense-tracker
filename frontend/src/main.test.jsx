import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App, categoryLeakageForMonth, currentMonthPaymentStatus, getTransactionsForView, loanIncomeImpact, monthlyComparisonData, normalizeTransactionForm, parseCardEmiPlans, parseRepaymentSchedule, parseStatementCsv } from "./main.jsx";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function renderApp() {
  return render(<App initialUser={{ name: "Shiv", email: "shiv@example.com", salary: 7200 }} skipInitialLoad />);
}

function renderFreshApp() {
  return render(<App initialUser={{ name: "Sivarajan", email: "sivarajan@example.com", salary: 0 }} skipInitialLoad />);
}

describe("normalizeTransactionForm", () => {
  it("converts browser form data into a transaction object", () => {
    const formData = new FormData();
    formData.set("kind", "expense");
    formData.set("merchant", "  Coffee Shop  ");
    formData.set("alias", "  Cafe visit ");
    formData.set("category", "  Food ");
    formData.set("group", "  Work ");
    formData.set("source", "Credit Card");
    formData.set("amount", "12.75");
    formData.set("date", "2026-06-13");
    formData.set("notes", "  Client sync ");

    expect(normalizeTransactionForm(formData)).toEqual({
      kind: "expense",
      merchant: "Coffee Shop",
      category: "Food",
      group: "Work",
      source: "Credit Card",
      alias: "Cafe visit",
      amount: 12.75,
      date: "2026-06-13",
      notes: "Client sync",
    });
  });
});

describe("getTransactionsForView", () => {
  const rows = [
    { id: 1, kind: "expense", merchant: "Today", date: "2026-06-13", amount: 10 },
    { id: 2, kind: "expense", merchant: "This week", date: "2026-06-08", amount: 20 },
    { id: 3, kind: "expense", merchant: "This fortnight", date: "2026-06-01", amount: 30 },
    { id: 4, kind: "expense", merchant: "Previous month", date: "2026-05-31", amount: 40 },
  ];

  it("filters daily, weekly, fortnight, and monthly ranges", () => {
    expect(getTransactionsForView(rows, "All").map((row) => row.merchant)).toEqual(["Today", "This week", "This fortnight", "Previous month"]);
    expect(getTransactionsForView(rows, "Daily").map((row) => row.merchant)).toEqual(["Today"]);
    expect(getTransactionsForView(rows, "Weekly").map((row) => row.merchant)).toEqual(["Today", "This week"]);
    expect(getTransactionsForView(rows, "Fortnight").map((row) => row.merchant)).toEqual(["Today", "This week", "This fortnight", "Previous month"]);
    expect(getTransactionsForView(rows, "Monthly").map((row) => row.merchant)).toEqual(["Today", "This week", "This fortnight"]);
  });
});

describe("loan helpers", () => {
  it("parses repayment schedules and detects current-month payment status", () => {
    const schedule = parseRepaymentSchedule("dueDate,amount,paidDate\n2026-06-05,620,2026-06-04");

    expect(schedule).toEqual([{ dueDate: "2026-06-05", amount: 620, paidDate: "2026-06-04" }]);
    expect(currentMonthPaymentStatus({ outstanding: 17800, schedule })).toMatchObject({
      label: "Paid on time",
      projectedOutstanding: 17180,
    });
  });

  it("calculates income impact from EMIs and recurring commitments", () => {
    expect(loanIncomeImpact([{ emi: 1850 }, { emi: 540 }], [{ amount: 1450 }, { amount: 128 }], 7200)).toEqual({
      emi: 2390,
      recurring: 1578,
      committed: 3968,
      ratio: 55,
      available: 3232,
    });
  });

  it("parses credit card EMI plan rows", () => {
    expect(parseCardEmiPlans("loan name,purchased item,total loaned,current outstanding,monthly EMI,total EMIs,completed EMIs\nMacBook EMI,Laptop,90000,50000,7500,12,5")).toEqual([
      { name: "MacBook EMI", purchased: "Laptop", loanedAmount: 90000, outstanding: 50000, monthlyEmi: 7500, apr: 0, roi: 0, totalEmis: 12, completedEmis: 5 },
    ]);
  });
});

describe("dashboard month helpers", () => {
  it("builds six months of income and expense comparison data", () => {
    const rows = [
      { kind: "expense", category: "Food", amount: 120, date: "2026-06-14" },
      { kind: "income", category: "Salary", amount: 2500, date: "2026-06-15" },
      { kind: "expense", category: "Travel", amount: 900, date: "2026-05-01" },
      { kind: "expense", category: "Education", amount: 700, date: "2026-04-12" },
      { kind: "income", category: "Refund", amount: 300, date: "2026-04-20" },
    ];

    expect(monthlyComparisonData(rows, "2026-06", 90000)).toEqual([
      { month: "2026-01", name: "Jan 2026", expense: 0, income: 0, hasData: false },
      { month: "2026-02", name: "Feb 2026", expense: 0, income: 0, hasData: false },
      { month: "2026-03", name: "Mar 2026", expense: 0, income: 0, hasData: false },
      { month: "2026-04", name: "Apr 2026", expense: 700, income: 90300, hasData: true },
      { month: "2026-05", name: "May 2026", expense: 900, income: 90000, hasData: true },
      { month: "2026-06", name: "Jun 2026", expense: 120, income: 92500, hasData: true },
    ]);
  });

  it("groups money leakage by category for a selected month", () => {
    const rows = [
      { kind: "expense", category: "Food", amount: 120, date: "2026-06-14" },
      { kind: "expense", category: "Food", amount: 80, date: "2026-06-15" },
      { kind: "expense", category: "Travel", amount: 900, date: "2026-05-01" },
      { kind: "expense", category: "Bills", amount: 500, date: "2026-06-17", excludedFromTotals: true },
    ];

    expect(categoryLeakageForMonth(rows, "2026-06")).toEqual([{ name: "Food", value: 200 }]);
  });
});

describe("parseStatementCsv", () => {
  it("maps bank debit and credit rows into transactions", () => {
    expect(parseStatementCsv("Date,Description,Debit,Credit\n2026-06-14,Coffee Shop,120,\n2026-06-15,Client Payment,,2500", "bank")).toEqual([
      expect.objectContaining({ kind: "expense", merchant: "Coffee Shop", amount: 120, source: "Bank" }),
      expect.objectContaining({ kind: "income", merchant: "Client Payment", amount: 2500, source: "Bank" }),
    ]);
  });

  it("maps credit card amount rows into expenses", () => {
    expect(parseStatementCsv("Date,Merchant,Amount\n14/06/2026,Online Store,999", "credit-card")).toEqual([
      expect.objectContaining({ kind: "expense", merchant: "Online Store", amount: 999, date: "2026-06-14", source: "Credit Card" }),
    ]);
  });

  it("maps cleaned credit card statement columns and excludes card payments", () => {
    const rows = parseStatementCsv(
      "Transaction type,Primary / Addon Customer Name,DATE,Description,AMT,Debit /Credit,REWARDS\nDomestic,SIVARAJAN K,2026-05-12,AMAZON SELLER SERVICES BANGALORE,\"1,747.00\",,\nDomestic,SIVARAJAN K,2026-05-20,CREDIT CARD PAYMENT Net Banking,\"2,500.00\",Cr,",
      "credit-card",
    );

    expect(rows).toEqual([
      expect.objectContaining({ kind: "expense", merchant: "AMAZON SELLER SERVICES BANGALORE", amount: 1747, date: "2026-05-12", source: "Credit Card", excludedFromTotals: false }),
      expect.objectContaining({ kind: "income", merchant: "CREDIT CARD PAYMENT Net Banking", amount: 2500, date: "2026-05-20", source: "Credit Card", excludedFromTotals: true }),
    ]);
  });
});

describe("Transaction Log", () => {
  it("registers and logs in through the FastAPI auth endpoints", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ name: "Trial User", email: "trial@example.com", salary: 90000, theme: "emerald", dark_mode: false }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ access_token: "jwt-token", user: { name: "Trial User", email: "trial@example.com", salary: 0, theme: "emerald", dark_mode: false } }),
      };
    });

    render(<App skipInitialLoad />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("you@example.com"), "trial@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8000/auth/login", expect.objectContaining({ method: "POST" }));
    expect(localStorage.getItem("hermes_exp_auth_token")).toBe("jwt-token");

    expect(await screen.findByRole("heading", { name: "Introduce yourself" })).toBeInTheDocument();
    await user.clear(screen.getByDisplayValue("Trial User"));
    await user.type(screen.getByPlaceholderText("Your name"), "Trial User");
    await user.clear(screen.getByPlaceholderText("Monthly income in INR"));
    await user.type(screen.getByPlaceholderText("Monthly income in INR"), "90000");
    await user.click(screen.getByRole("button", { name: "Start dashboard" }));

    expect(await screen.findByRole("button", { name: "Logout" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Profile Settings" }));
    expect(screen.getByDisplayValue("Trial User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("trial@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Logout" }));
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await user.type(screen.getByPlaceholderText("Your name"), "Trial User");
    await user.type(screen.getByPlaceholderText("you@example.com"), "trial@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8000/auth/register", expect.objectContaining({ method: "POST" }));
  });

  it("explains failed login for users who have not created an account", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid email or password" }),
    });

    render(<App skipInitialLoad />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "new@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid email or password. If this is your first time, create a new account first.")).toBeInTheDocument();
  });

  it("creates, updates, and deletes a transaction from the table", async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    await user.type(screen.getByPlaceholderText("Merchant"), "Coffee Shop");
    await user.type(screen.getByPlaceholderText("Name"), "Morning coffee");
    await user.selectOptions(screen.getByLabelText("Category"), "Food");
    await user.selectOptions(screen.getByLabelText("Group"), "Create new group");
    await user.type(screen.getByLabelText("New group name"), "Work");
    await user.selectOptions(screen.getByDisplayValue("Credit Card"), "Debit Card");
    await user.type(screen.getByPlaceholderText("Amount"), "12.75");
    const dateInput = screen.getByDisplayValue("2026-06-13");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-06-14");
    await user.type(screen.getByPlaceholderText("Notes"), "Client catch-up");
    await user.click(screen.getByRole("button", { name: /add new/i }));

    const createdRow = screen.getByRole("row", { name: /expense Morning coffee Coffee Shop Food Work Debit Card 2026-06-14 ₹13 Counted/i });
    expect(createdRow).toBeInTheDocument();

    await user.click(within(createdRow).getByRole("button", { name: /edit coffee shop/i }));
    const merchantInput = screen.getByLabelText("Edit merchant");
    await user.clear(merchantInput);
    await user.type(merchantInput, "Coffee Roasters");
    await user.clear(screen.getByLabelText("Edit name"));
    await user.type(screen.getByLabelText("Edit name"), "Roasters");
    await user.click(screen.getByRole("button", { name: /save coffee shop/i }));

    expect(screen.getByRole("row", { name: /expense Roasters Coffee Roasters Food Work Debit Card 2026-06-14 ₹13 Counted/i })).toBeInTheDocument();

    const updatedRow = screen.getByRole("row", { name: /expense Roasters Coffee Roasters Food Work Debit Card 2026-06-14 ₹13 Counted/i });
    await user.click(within(updatedRow).getByRole("button", { name: /delete coffee roasters/i }));

    expect(confirmMock).toHaveBeenCalledWith(expect.stringMatching(/Delete this transaction/i));
    expect(screen.queryByText("Coffee Roasters")).not.toBeInTheDocument();
  });

  it("requires confirmation before deleting selected transactions", async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));
    await user.click(screen.getByLabelText("Select Whole Market"));
    await user.click(screen.getByLabelText("Select Dinner downtown"));

    expect(screen.getByRole("button", { name: "Delete selected (2)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete selected (2)" }));

    expect(confirmMock).toHaveBeenCalledWith(expect.stringMatching(/Delete 2 selected transactions/i));
    expect(screen.getByRole("row", { name: /Whole Market/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Dinner downtown/i })).toBeInTheDocument();
  });

  it("aggregates dashboard expense groups by group name", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Expense Groups")).toBeInTheDocument();
    const losAngelesGroup = screen.getByText("Los Angeles Trip").closest(".flex");
    expect(losAngelesGroup).toHaveTextContent("2 transactions");
    expect(losAngelesGroup).toHaveTextContent("₹832");

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));
    expect(screen.getByLabelText("Group")).toHaveTextContent("Los Angeles Trip");
  });

  it("keeps excluded repeated payments visible but removes them from totals", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByText(/Expenses total ₹2,670/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Merchant"), "Credit card bill payment");
    await user.selectOptions(screen.getByLabelText("Category"), "Loan EMI");
    await user.selectOptions(screen.getByDisplayValue("Credit Card"), "Bank");
    await user.type(screen.getByPlaceholderText("Amount"), "50000");
    await user.click(screen.getByLabelText("Exclude totals"));
    await user.click(screen.getByRole("button", { name: /add new/i }));

    const excludedRow = screen.getByRole("row", { name: /expense Unnamed Credit card bill payment Loan EMI General Bank 2026-06-13 ₹50,000 Excluded/i });
    expect(excludedRow).toBeInTheDocument();
    expect(screen.getByText(/Expenses total ₹2,670/i)).toBeInTheDocument();
  });

  it("changes the table when period tabs are selected", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByText(/Showing 8 of 8 transactions for all view/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Apartment rent/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Daily" }));

    expect(screen.getByText(/Showing 1 of 1 transaction for daily view/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Whole Market/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Apartment rent/i })).not.toBeInTheDocument();
  });

  it("searches, filters, and sorts the transaction table", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    await user.type(screen.getByLabelText("Search merchant"), "rent");
    expect(screen.getByText(/Showing 1 of 8 transactions for all view/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Apartment rent/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Whole Market/i })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search merchant"));
    await user.click(screen.getByLabelText("Filter Source"));
    await user.click(screen.getByLabelText("Source Bank"));
    expect(screen.getByText(/Showing 2 of 8 transactions for all view/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Electricity bill/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Whole Market/i })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Source Bank"));
    await user.click(screen.getByLabelText(/Sort amount/i));
    const firstDataRow = screen.getAllByRole("row")[1];
    expect(firstDataRow).toHaveAccessibleName(/Acme Payroll/i);
  });

  it("shows previous loaded months from the transaction month selector", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));
    await user.type(screen.getByPlaceholderText("Merchant"), "April Books");
    await user.selectOptions(screen.getByLabelText("Category"), "Education");
    await user.type(screen.getByPlaceholderText("Amount"), "875");
    const dateInput = screen.getByDisplayValue("2026-06-13");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-04-12");
    await user.click(screen.getByRole("button", { name: /add new/i }));

    await user.selectOptions(screen.getByLabelText("Transaction month"), "2026-04");

    expect(screen.getByText(/Showing 1 of 1 transaction for monthly view/i)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /April Books/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Apartment rent/i })).not.toBeInTheDocument();
  });

  it("imports transactions from bank statement CSV", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));
    await user.upload(
      screen.getByLabelText("Upload statement CSV"),
      new File(["Date,Description,Debit,Credit\n2026-06-14,Coffee Shop,120,\n2026-06-15,Client Payment,,2500"], "bank.csv", { type: "text/csv" }),
    );

    expect(await screen.findByText("Ready to import 2 transactions from bank.csv.")).toBeInTheDocument();
    expect(screen.getByText("Client Payment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByText("Imported 2 transactions.")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /expense Unnamed Coffee Shop Uncategorized General Bank 2026-06-14 ₹120 Counted/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /income Unnamed Client Payment Statement Income General Bank 2026-06-15 ₹2,500 Counted/i })).toBeInTheDocument();

    const importedRow = screen.getByRole("row", { name: /expense Unnamed Coffee Shop Uncategorized General Bank 2026-06-14 ₹120 Counted/i });
    await user.click(within(importedRow).getByRole("button", { name: /edit coffee shop/i }));

    expect(screen.getByRole("heading", { name: "Edit Transaction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Edit source")).toHaveValue("Bank");
  });

  it("opens the calendar from the top icon and shows day expense blocks", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Transaction Calendar")).toBeInTheDocument();
    expect(screen.getByText("High: Groceries ₹214")).toBeInTheDocument();
  });

  it("shows calendar day spend tooltip split by source", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));
    await user.type(screen.getByPlaceholderText("Merchant"), "Card Lunch");
    await user.selectOptions(screen.getByLabelText("Category"), "Food");
    await user.type(screen.getByPlaceholderText("Amount"), "300");
    await user.click(screen.getByRole("button", { name: /add new/i }));

    await user.type(screen.getByPlaceholderText("Merchant"), "Bank Lunch");
    await user.selectOptions(screen.getByLabelText("Category"), "Food");
    await user.selectOptions(screen.getByDisplayValue("Credit Card"), "Bank");
    await user.type(screen.getByPlaceholderText("Amount"), "200");
    await user.click(screen.getByRole("button", { name: /add new/i }));

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    const spendBadge = screen.getByLabelText("Spend by source: Credit Card: ₹300, Debit Card: ₹214, Bank: ₹200");
    expect(spendBadge).toHaveAttribute("title", "Credit Card: ₹300\nDebit Card: ₹214\nBank: ₹200");
  });

  it("applies the selected color theme and shows the Hermes.Exp name", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText("Hermes.Exp")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));
    await user.click(screen.getByRole("button", { name: "blue theme" }));
    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByRole("button", { name: /add new/i })).toHaveClass("bg-sky-600");
  });

  it("keeps semantic colors on the monthly comparison graph across themes", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));
    await user.click(screen.getByRole("button", { name: "blue theme" }));
    await user.click(screen.getByRole("button", { name: "Dashboard" }));

    expect(screen.getByText("Monthly Comparison")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-comparison-chart")).toHaveAttribute("data-income-color", "#16a34a");
    expect(screen.getByTestId("monthly-comparison-chart")).toHaveAttribute("data-expense-color", "#dc2626");
  });

  it("adds and removes income sources from profile settings", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));

    expect(screen.getByText("Additional Income Sources")).toBeInTheDocument();
    expect(screen.getAllByText("₹7,200")).toHaveLength(2);

    await user.type(screen.getByPlaceholderText("Freelance, rental income, dividends"), "Freelance Design");
    await user.selectOptions(screen.getByDisplayValue("Salary"), "Freelance");
    await user.type(screen.getByPlaceholderText("Amount"), "5000");
    await user.click(screen.getByRole("button", { name: "Add income source" }));

    expect(screen.getByText("Freelance Design")).toBeInTheDocument();
    expect(screen.getAllByText("Freelance").length).toBeGreaterThan(1);
    expect(screen.getByText("₹12,200")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Freelance Design" }));

    expect(screen.queryByText("Freelance Design")).not.toBeInTheDocument();
    expect(screen.getAllByText("₹7,200")).toHaveLength(2);
  });

  it("shows salary income sources in the fixed salary total", async () => {
    const user = userEvent.setup();
    renderFreshApp();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));

    expect(screen.getAllByText("₹0")).toHaveLength(2);
    await user.type(screen.getByPlaceholderText("Freelance, rental income, dividends"), "Primary Salary");
    await user.type(screen.getByPlaceholderText("Amount"), "90000");
    await user.click(screen.getByRole("button", { name: "Add income source" }));

    expect(screen.getAllByText("₹90,000")).toHaveLength(3);
  });

  it("manages monthly commitments from profile settings and logs excluded entries", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));

    expect(screen.getByText("Monthly Commitments")).toBeInTheDocument();
    expect(screen.getByText("Income after commitments")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Rent, insurance, SIP"), "Gym Plan");
    await user.type(screen.getByPlaceholderText("Commitment amount"), "2500");
    await user.clear(screen.getByPlaceholderText("Day"));
    await user.type(screen.getByPlaceholderText("Day"), "9");
    await user.clear(screen.getByPlaceholderText("Bills"));
    await user.type(screen.getByPlaceholderText("Bills"), "Wellness");
    await user.click(screen.getByRole("button", { name: "Add commitment" }));

    expect(screen.getByText("Gym Plan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Gym Plan" }));
    const nameInput = screen.getByDisplayValue("Gym Plan");
    await user.clear(nameInput);
    await user.type(nameInput, "Gym Plus");
    await user.click(screen.getByRole("button", { name: "Save commitment" }));

    expect(screen.getByText("Gym Plus")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log Gym Plus" }));
    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByRole("row", { name: /expense Unnamed Gym Plus Wellness Monthly Commitments Commitment 2026-06-09 ₹2,500 Excluded/i })).toBeInTheDocument();
  });

  it("sends text questions to the AI chat endpoint", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Your largest current leak is rent.", raw_model_output: "Your largest current leak is rent." }),
    });
    renderApp();

    await user.click(screen.getByRole("button", { name: "AI Chat" }));
    await user.type(screen.getByPlaceholderText("Ask about a receipt or your spending"), "Where am I overspending?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Your largest current leak is rent.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/ai/chat", expect.objectContaining({ method: "POST" }));
  });

  it("clears the chat input immediately after sending", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Done", raw_model_output: "Done" }),
    });
    renderApp();

    await user.click(screen.getByRole("button", { name: "AI Chat" }));
    const input = screen.getByPlaceholderText("Ask about a receipt or your spending");
    await user.type(input, "Clear this after send");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(input).toHaveValue("");
    expect(await screen.findByText("Done")).toBeInTheDocument();
  });

  it("renders assistant markdown as formatted content", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "### Insight\n- **Food** is high\n- Check `subscriptions`", raw_model_output: "" }),
    });
    renderApp();

    await user.click(screen.getByRole("button", { name: "AI Chat" }));
    await user.type(screen.getByPlaceholderText("Ask about a receipt or your spending"), "Format this");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Insight")).toHaveClass("font-semibold");
    expect(screen.getByText("Food").tagName).toBe("STRONG");
    expect(screen.getByText("subscriptions").tagName).toBe("CODE");
  });

  it("analyzes an uploaded receipt and adds the extracted expense", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: "Receipt analyzed with local Qwen model.",
        extracted_expense: {
          merchant: "Corner Cafe",
          amount: 18.5,
          category: "Food",
          spent_on: "2026-06-13",
          notes: "Breakfast",
        },
      }),
    });
    renderApp();

    await user.click(screen.getByRole("button", { name: "AI Chat" }));
    await user.upload(screen.getByLabelText("Attach file"), new File(["receipt"], "receipt.txt", { type: "text/plain" }));
    await user.type(screen.getByPlaceholderText("Ask about a receipt or your spending"), "Extract this receipt");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Draft expense: Corner Cafe · ₹19 · Food")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Expense" }));
    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByRole("row", { name: /Corner Cafe/i })).toBeInTheDocument();
  });

  it("creates, updates, deletes loans and tracks repayment schedule status", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Loans" }));

    expect(screen.getByText("Committed income ratio")).toBeInTheDocument();
    expect(screen.getByText("Paid on time")).toBeInTheDocument();
    expect(screen.getByText("Paid late")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Account" }));
    await user.type(screen.getByLabelText("Lender"), "Personal Loan");
    await user.type(screen.getByLabelText("Principal"), "100000");
    await user.type(screen.getByLabelText("Outstanding"), "80000");
    await user.type(screen.getByLabelText("EMI"), "5000");
    await user.type(screen.getByLabelText("Tenure / periods"), "24");
    await user.type(screen.getByLabelText("Periods paid"), "4");
    await user.clear(screen.getByLabelText("Loan due day"));
    await user.type(screen.getByLabelText("Loan due day"), "15");
    await user.type(screen.getByLabelText("ROI %"), "11.5");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(screen.getByText("Personal Loan")).toBeInTheDocument();
    expect(screen.getByText(/ROI 11.5%/)).toBeInTheDocument();
    expect(screen.getByText("Tenure 24 months")).toBeInTheDocument();
    expect(screen.getByText("Periods 4/24 paid")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Personal Loan" }));
    const lenderInput = screen.getByDisplayValue("Personal Loan");
    await user.clear(lenderInput);
    await user.type(lenderInput, "Updated Personal Loan");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Updated Personal Loan")).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText("Upload repayment schedule for Updated Personal Loan"),
      new File(["dueDate,amount,paidDate\n2026-06-15,5000,2026-06-14"], "schedule.csv", { type: "text/csv" }),
    );

    await waitFor(() => expect(screen.getByText(/Due 2026-06-15 · Paid 2026-06-14 · ₹5,000/)).toBeInTheDocument());
    expect(screen.getByText("Periods 5/24 paid")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Updated Personal Loan" }));

    expect(screen.queryByText("Updated Personal Loan")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Account" }));
    await user.selectOptions(screen.getByLabelText("Account type"), "credit-card");
    await user.type(screen.getByLabelText("Card name"), "Travel Card");
    await user.type(screen.getByLabelText("Credit limit"), "150000");
    await user.type(screen.getByLabelText("Total outstanding"), "93000");
    await user.type(screen.getByLabelText("Minimum due"), "12000");
    await user.clear(screen.getByLabelText("Card due day"));
    await user.type(screen.getByLabelText("Card due day"), "12");
    await user.click(screen.getByLabelText("Track converted-to-EMI purchases"));
    await user.type(screen.getByLabelText("EMI loan name"), "Phone EMI");
    await user.type(screen.getByLabelText("Purchased item"), "iPhone");
    await user.type(screen.getByLabelText("Converted amount"), "90000");
    await user.type(screen.getByLabelText("Current outstanding after EMIs"), "50000");
    await user.type(screen.getByLabelText("Monthly EMI"), "7000");
    await user.type(screen.getByLabelText("ROI %"), "14");
    await user.type(screen.getByLabelText("Total EMIs"), "12");
    await user.type(screen.getByLabelText("EMIs completed"), "5");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(screen.getByText("Travel Card")).toBeInTheDocument();
    expect(screen.getAllByText(/Credit Card · APR/).length).toBeGreaterThan(0);
    expect(screen.getByText("Credit limit ₹1,50,000")).toBeInTheDocument();
    expect(screen.getAllByText("Regular outstanding ₹43,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("EMI outstanding ₹50,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Phone EMI")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getAllByText("5/12").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "New Account" }));
    await user.selectOptions(screen.getByLabelText("Account type"), "credit-card");
    await user.type(screen.getByLabelText("Card name"), "No EMI Card");
    await user.type(screen.getByLabelText("Credit limit"), "100000");
    await user.type(screen.getByLabelText("Total outstanding"), "43000");
    await user.clear(screen.getByLabelText("Card due day"));
    await user.type(screen.getByLabelText("Card due day"), "18");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(screen.getByText("No EMI Card")).toBeInTheDocument();
    expect(screen.getAllByText("Monthly EMI None").length).toBeGreaterThan(0);
  });
});
