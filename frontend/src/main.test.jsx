import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App, getTransactionsForView, normalizeTransactionForm } from "./main.jsx";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normalizeTransactionForm", () => {
  it("converts browser form data into a transaction object", () => {
    const formData = new FormData();
    formData.set("kind", "expense");
    formData.set("merchant", "  Coffee Shop  ");
    formData.set("category", "  Food ");
    formData.set("group", "  Work ");
    formData.set("source", "Credit Card");
    formData.set("amount", "12.75");
    formData.set("date", "2026-06-13");

    expect(normalizeTransactionForm(formData)).toEqual({
      kind: "expense",
      merchant: "Coffee Shop",
      category: "Food",
      group: "Work",
      source: "Credit Card",
      amount: 12.75,
      date: "2026-06-13",
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
    expect(getTransactionsForView(rows, "Daily").map((row) => row.merchant)).toEqual(["Today"]);
    expect(getTransactionsForView(rows, "Weekly").map((row) => row.merchant)).toEqual(["Today", "This week"]);
    expect(getTransactionsForView(rows, "Fortnight").map((row) => row.merchant)).toEqual(["Today", "This week", "This fortnight", "Previous month"]);
    expect(getTransactionsForView(rows, "Monthly").map((row) => row.merchant)).toEqual(["Today", "This week", "This fortnight"]);
  });
});

describe("Transaction Log", () => {
  it("creates, updates, and deletes a transaction from the table", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    await user.type(screen.getByPlaceholderText("Merchant"), "Coffee Shop");
    await user.type(screen.getByPlaceholderText("Category"), "Food");
    await user.type(screen.getByPlaceholderText("Group, e.g. LA trip"), "Work");
    await user.selectOptions(screen.getByDisplayValue("Credit Card"), "Debit Card");
    await user.type(screen.getByPlaceholderText("Amount"), "12.75");
    const dateInput = screen.getByDisplayValue("2026-06-13");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-06-14");
    await user.click(screen.getByRole("button", { name: /add new/i }));

    const createdRow = screen.getByRole("row", { name: /Coffee Shop Food Work Debit Card 2026-06-14 \$13/i });
    expect(createdRow).toBeInTheDocument();

    await user.click(within(createdRow).getByRole("button", { name: /edit coffee shop/i }));
    const merchantInput = screen.getByDisplayValue("Coffee Shop");
    await user.clear(merchantInput);
    await user.type(merchantInput, "Coffee Roasters");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByRole("row", { name: /Coffee Roasters Food Work Debit Card 2026-06-14 \$13/i })).toBeInTheDocument();

    const updatedRow = screen.getByRole("row", { name: /Coffee Roasters/i });
    await user.click(within(updatedRow).getByRole("button", { name: /delete coffee roasters/i }));

    expect(screen.queryByText("Coffee Roasters")).not.toBeInTheDocument();
  });

  it("changes the table when period tabs are selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByText("Apartment rent")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Daily" }));

    expect(screen.getByText(/Showing 1 transaction for daily view/i)).toBeInTheDocument();
    expect(screen.getByText("Whole Market")).toBeInTheDocument();
    expect(screen.queryByText("Apartment rent")).not.toBeInTheDocument();
  });

  it("opens the calendar from the top icon and shows day expense blocks", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByText("Expense Calendar")).toBeInTheDocument();
    expect(screen.getByText("High: Groceries $214")).toBeInTheDocument();
  });

  it("applies the selected color theme and shows the Hermes.Exp name", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("Hermes.Exp")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));
    await user.click(screen.getByRole("button", { name: "blue theme" }));
    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByRole("button", { name: /add new/i })).toHaveClass("bg-sky-600");
  });

  it("applies the selected color theme to the monthly comparison graph", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "Profile Settings" }));
    await user.click(screen.getByRole("button", { name: "blue theme" }));
    await user.click(screen.getByRole("button", { name: "Dashboard" }));

    expect(screen.getByText("Monthly Comparison")).toBeInTheDocument();
    expect(screen.getByTestId("monthly-comparison-chart")).toHaveAttribute("data-chart-color", "#0284c7");
    expect(screen.getByTestId("monthly-comparison-chart")).toHaveAttribute("data-chart-alt-color", "#0891b2");
  });

  it("sends text questions to the AI chat endpoint", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Your largest current leak is rent.", raw_model_output: "Your largest current leak is rent." }),
    });
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AI Chat" }));
    await user.upload(screen.getByLabelText("Attach file"), new File(["receipt"], "receipt.txt", { type: "text/plain" }));
    await user.type(screen.getByPlaceholderText("Ask about a receipt or your spending"), "Extract this receipt");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Draft expense: Corner Cafe · $19 · Food")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Expense" }));
    await user.click(screen.getByRole("button", { name: "Transaction Log" }));

    expect(screen.getByText("Corner Cafe")).toBeInTheDocument();
  });
});
