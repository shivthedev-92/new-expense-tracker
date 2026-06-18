import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowUpDown,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  Pencil,
  FileUp,
  Landmark,
  LayoutDashboard,
  Moon,
  Paperclip,
  Pin,
  Plus,
  Save,
  Trash2,
  Search,
  Settings,
  Sun,
  Table2,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";

const transactionsSeed = [
  { id: 1, kind: "expense", category: "Travel", group: "Los Angeles Trip", merchant: "Hotel booking", amount: 740, date: "2026-06-11", source: "Credit Card" },
  { id: 2, kind: "expense", category: "Food", group: "Los Angeles Trip", merchant: "Dinner downtown", amount: 92, date: "2026-06-12", source: "Credit Card" },
  { id: 3, kind: "expense", category: "Rent", group: "", merchant: "Apartment rent", amount: 1450, date: "2026-06-04", source: "Bank" },
  { id: 4, kind: "expense", category: "Utilities", group: "", merchant: "Electricity bill", amount: 128, date: "2026-06-07", source: "Bank" },
  { id: 5, kind: "income", category: "Salary", group: "", merchant: "Acme Payroll", amount: 7200, date: "2026-06-01", source: "Salary" },
  { id: 6, kind: "income", category: "Credit Card", group: "", merchant: "Cashback rewards", amount: 85, date: "2026-06-09", source: "Credit Card" },
  { id: 7, kind: "expense", category: "Subscriptions", group: "", merchant: "Streaming bundle", amount: 46, date: "2026-06-10", source: "Credit Card" },
  { id: 8, kind: "expense", category: "Groceries", group: "", merchant: "Whole Market", amount: 214, date: "2026-06-13", source: "Debit Card" },
];

const loansSeed = [
  { id: 1, accountType: "loan", lender: "Home Loan", principal: 240000, outstanding: 214500, emi: 1850, dueDay: 1, rate: 6.4, tenureMonths: 180, periodsPaid: 14, schedule: [{ dueDate: "2026-06-01", amount: 1850, paidDate: "2026-06-01" }] },
  { id: 2, accountType: "loan", lender: "Car Loan", principal: 28000, outstanding: 16400, emi: 540, dueDay: 3, rate: 7.1, tenureMonths: 60, periodsPaid: 21, schedule: [{ dueDate: "2026-06-03", amount: 540, paidDate: "2026-06-05" }] },
  { id: 3, accountType: "loan", lender: "Education Loan", principal: 42000, outstanding: 17800, emi: 620, dueDay: 5, rate: 5.8, tenureMonths: 84, periodsPaid: 39, schedule: [{ dueDate: "2026-06-05", amount: 620, paidDate: "" }] },
  { id: 4, accountType: "credit-card", lender: "Travel Credit Card", principal: 100000, outstanding: 93000, emi: 7500, dueDay: 12, rate: 36, creditLimit: 100000, cardOutstanding: 93000, emiOutstanding: 50000, monthlyEmi: 7500, minimumDue: 12000, emiPlans: [{ name: "MacBook EMI", purchased: "Laptop", loanedAmount: 90000, outstanding: 50000, monthlyEmi: 7500, totalEmis: 12, completedEmis: 5 }], schedule: [] },
];

const commitmentsSeed = [
  { id: 1, name: "Rent", amount: 1450, dueDay: 4, category: "Housing" },
  { id: 2, name: "Electricity", amount: 128, dueDay: 7, category: "Utilities" },
  { id: 3, name: "Streaming bundle", amount: 46, dueDay: 10, category: "Subscriptions" },
];

const nav = [
  ["Dashboard", LayoutDashboard],
  ["Transaction Log", Table2],
  ["Loans", Landmark],
  ["AI Chat", Bot],
  ["Graph Builder", BarChart3],
  ["Profile Settings", Settings],
];

const themeStyles = {
  emerald: {
    gradient: "from-emerald-600 to-teal-500",
    activeNav: "bg-emerald-500/20",
    button: "bg-emerald-600 hover:bg-emerald-700",
    accent: "text-emerald-600",
    bar: "bg-emerald-500",
    soft: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-300",
    chart: "#059669",
    chartAlt: "#0f766e",
  },
  blue: {
    gradient: "from-sky-600 to-cyan-500",
    activeNav: "bg-sky-500/20",
    button: "bg-sky-600 hover:bg-sky-700",
    accent: "text-sky-600",
    bar: "bg-sky-500",
    soft: "bg-sky-100 text-sky-700",
    ring: "ring-sky-300",
    chart: "#0284c7",
    chartAlt: "#0891b2",
  },
  rose: {
    gradient: "from-rose-600 to-pink-500",
    activeNav: "bg-rose-500/20",
    button: "bg-rose-600 hover:bg-rose-700",
    accent: "text-rose-600",
    bar: "bg-rose-500",
    soft: "bg-rose-100 text-rose-700",
    ring: "ring-rose-300",
    chart: "#e11d48",
    chartAlt: "#db2777",
  },
  amber: {
    gradient: "from-amber-500 to-orange-500",
    activeNav: "bg-amber-500/20",
    button: "bg-amber-500 hover:bg-amber-600",
    accent: "text-amber-600",
    bar: "bg-amber-500",
    soft: "bg-amber-100 text-amber-700",
    ring: "ring-amber-300",
    chart: "#f59e0b",
    chartAlt: "#ea580c",
  },
};

const referenceDate = "2026-06-13";
const apiBaseUrl = "http://127.0.0.1:8000";
const authStorageKey = "hermes_exp_auth_token";
const onboardingStoragePrefix = "hermes_exp_onboarded";
const incomeSourcesStoragePrefix = "hermes_exp_income_sources";
const incomeChartColor = "#16a34a";
const expenseChartColor = "#dc2626";

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function chartMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function monthKey(value) {
  return value.slice(0, 7);
}

function monthLabel(value) {
  return parseDate(`${value}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function shiftMonth(value, offset) {
  const date = parseDate(`${value}-01`);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function latestTransactionDate(transactions) {
  return transactions
    .map((transaction) => transaction.date)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1) || referenceDate;
}

function countedTransactions(transactions) {
  return transactions.filter((transaction) => !transaction.excludedFromTotals);
}

function daysBetween(start, end) {
  return Math.floor((parseDate(end) - parseDate(start)) / 86400000);
}

export function getTransactionsForView(transactions, view, anchorDate = referenceDate) {
  if (view === "All") {
    return transactions;
  }

  const anchor = parseDate(anchorDate);
  return transactions.filter((transaction) => {
    const date = parseDate(transaction.date);
    const diff = daysBetween(transaction.date, anchorDate);

    if (view === "Daily") {
      return transaction.date === anchorDate;
    }
    if (view === "Weekly") {
      return diff >= 0 && diff < 7;
    }
    if (view === "Fortnight") {
      return diff >= 0 && diff < 14;
    }
    return date.getFullYear() === anchor.getFullYear() && date.getMonth() === anchor.getMonth();
  });
}

export function transactionMonthOptions(transactions, fallbackDate = referenceDate) {
  const months = [...new Set(transactions.map((transaction) => monthKey(transaction.date)).filter(Boolean))].sort().reverse();
  return months.length ? months : [monthKey(fallbackDate)];
}

export function monthlyComparisonData(transactions, latestMonth = monthKey(latestTransactionDate(transactions)), recurringIncome = 0, monthCount = 6) {
  const months = Array.from({ length: monthCount }, (_, index) => shiftMonth(latestMonth, index - monthCount + 1));
  const rows = Object.fromEntries(months.map((month) => [month, { month, name: monthLabel(month), expense: 0, income: 0, hasData: false }]));

  countedTransactions(transactions).forEach((transaction) => {
    const transactionMonth = monthKey(transaction.date);
    const row = rows[transactionMonth];
    if (!row) return;
    row.hasData = true;
    if (transaction.kind === "expense") {
      row.expense += transaction.amount;
    } else if (transaction.kind === "income") {
      row.income += transaction.amount;
    }
  });

  return months.map((month) => {
    const row = rows[month];
    return {
      ...row,
      income: row.hasData ? row.income + recurringIncome : 0,
    };
  });
}

export function categoryLeakageForMonth(transactions, selectedMonth) {
  const totals = countedTransactions(transactions)
    .filter((transaction) => transaction.kind === "expense" && monthKey(transaction.date) === selectedMonth)
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((first, second) => second.value - first.value);
}

export function normalizeTransactionForm(formData) {
  const next = Object.fromEntries(formData.entries());
  return {
    kind: next.kind,
    category: next.category.trim(),
    group: next.group.trim(),
    merchant: next.merchant.trim(),
    alias: next.alias?.trim() || "",
    amount: Number(next.amount),
    date: next.date,
    source: next.source,
    notes: next.notes?.trim() || "",
  };
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseStatementAmount(value) {
  const cleaned = String(value || "").replace(/[₹,\s]/g, "").replace(/[()]/g, "-");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeStatementDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const yearFirst = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+\d{1,2}:\d{2})?$/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const [, first, second, yearValue] = slash;
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return `${year}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`;
  }
  return referenceDate;
}

function pickStatementValue(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== "") {
      return row[alias];
    }
  }
  return "";
}

export function parseStatementCsv(text, statementType = "bank") {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    const description = pickStatementValue(row, ["description", "narration", "merchant", "details", "particulars", "transactiondetails"]) || "Statement transaction";
    const date = normalizeStatementDate(pickStatementValue(row, ["date", "transactiondate", "posteddate", "valuedate"]));
    const debit = parseStatementAmount(pickStatementValue(row, ["debit", "withdrawal", "withdrawals", "withdrawalamt", "paidout", "dr"]));
    const credit = parseStatementAmount(pickStatementValue(row, ["credit", "deposit", "deposits", "depositamt", "paidin", "cr"]));
    const signedAmount = parseStatementAmount(pickStatementValue(row, ["amount", "amt", "transactionamount", "value"]));
    const type = pickStatementValue(row, ["debitcredit", "type", "kind", "transactiontype"]).toLowerCase();
    const creditMarker = type.includes("cr") || type.includes("credit");
    const isCreditCardCredit = statementType === "credit-card" && creditMarker;
    const isIncome = isCreditCardCredit || (statementType === "bank" && (credit > 0 || creditMarker || signedAmount > 0 && !debit));
    const amount = Math.abs(debit || credit || signedAmount);

    if (!amount) return null;
    return {
      kind: isIncome ? "income" : "expense",
      category: isIncome ? "Statement Income" : "Uncategorized",
      group: "",
      merchant: description,
      alias: "",
      amount,
      date,
      source: statementType === "credit-card" ? "Credit Card" : "Bank",
      excludedFromTotals: isCreditCardCredit,
      notes: "",
    };
  }).filter(Boolean);
}

export function normalizeLoanForm(formData) {
  const next = Object.fromEntries(formData.entries());
  const accountType = next.accountType || "loan";
  const trackCardEmis = Boolean(next.trackCardEmis);
  const creditLimit = Number(next.creditLimit || next.principal || 0);
  const cardOutstanding = Number(next.cardOutstanding || next.outstanding || 0);
  const explicitEmiPlan = accountType === "credit-card" && trackCardEmis && (next.emiPlanName || next.emiPurchased || next.emiLoanedAmount || next.emiCurrentOutstanding)
    ? [{
      name: String(next.emiPlanName || "Converted EMI").trim(),
      purchased: String(next.emiPurchased || "").trim(),
      loanedAmount: Number(next.emiLoanedAmount || 0),
      outstanding: Number(next.emiCurrentOutstanding || 0),
      monthlyEmi: Number(next.emiPlanMonthlyEmi || 0),
      apr: Number(next.emiPlanApr || next.rate || 0),
      roi: Number(next.emiPlanRoi || 0),
      totalEmis: Number(next.emiPlanTotalEmis || 0),
      completedEmis: Number(next.emiPlanCompletedEmis || 0),
    }]
    : [];
  const parsedEmiPlans = accountType === "credit-card" && trackCardEmis ? parseCardEmiPlans(next.emiPlans || "") : [];
  const emiPlans = explicitEmiPlan.length ? explicitEmiPlan : parsedEmiPlans;
  const monthlyEmi = emiPlans.length ? emiPlans.reduce((sum, plan) => sum + Number(plan.monthlyEmi || 0), 0) : Number(next.monthlyEmi || next.emi || 0);
  const emiOutstanding = trackCardEmis && emiPlans?.length
    ? emiPlans.reduce((sum, plan) => sum + plan.outstanding, 0)
    : trackCardEmis ? Number(next.emiOutstanding || 0) : 0;
  return {
    accountType,
    lender: next.lender.trim(),
    principal: accountType === "credit-card" ? creditLimit : Number(next.principal),
    outstanding: accountType === "credit-card" ? cardOutstanding : Number(next.outstanding),
    emi: accountType === "credit-card" ? (trackCardEmis ? monthlyEmi : 0) : Number(next.emi),
    dueDay: Number(next.dueDay),
    rate: Number(next.rate),
    tenureMonths: accountType === "credit-card" ? null : Number(next.tenureMonths || 0),
    periodsPaid: accountType === "credit-card" ? null : Number(next.periodsPaid || 0),
    creditLimit: accountType === "credit-card" ? creditLimit : null,
    cardOutstanding: accountType === "credit-card" ? cardOutstanding : null,
    emiOutstanding: accountType === "credit-card" ? emiOutstanding : null,
    monthlyEmi: accountType === "credit-card" ? (trackCardEmis ? (monthlyEmi || emiPlans?.reduce((sum, plan) => sum + plan.monthlyEmi, 0) || 0) : 0) : null,
    minimumDue: accountType === "credit-card" ? Number(next.minimumDue || 0) : null,
    emiPlans,
    schedule: [],
  };
}

export function parseCardEmiPlans(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^loan\s*name/i.test(line) && !/^name\s*,/i.test(line))
    .map((line) => {
      const cells = splitCsvLine(line);
      const [name = "", purchased = "", third = "", fourth = "", fifth = "", sixth = "", seventh = "", eighth = "", ninth = ""] = cells;
      const legacyRow = cells.length <= 5;
      const loanedAmount = legacyRow ? Number(third) : Number(third);
      const outstanding = legacyRow ? Number(third) : Number(fourth);
      const monthlyEmi = legacyRow ? Number(fourth) : Number(fifth);
      const totalEmis = legacyRow ? Number(fifth) : Number(sixth);
      const completedEmis = legacyRow || !Number.isFinite(Number(seventh)) ? Math.max(0, totalEmis - (outstanding && monthlyEmi ? Math.ceil(outstanding / monthlyEmi) : 0)) : Number(seventh);
      return {
        name: name.trim(),
        purchased: purchased.trim(),
        loanedAmount,
        outstanding,
        monthlyEmi,
        apr: Number(eighth || 0),
        roi: Number(ninth || 0),
        totalEmis,
        completedEmis,
      };
    })
    .filter((plan) => plan.name && Number.isFinite(plan.outstanding) && Number.isFinite(plan.monthlyEmi));
}

export function parseRepaymentSchedule(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^due\s*date/i.test(line) && !/^dueDate/i.test(line))
    .map((line) => {
      const [dueDate = "", amount = "", paidDate = ""] = line.split(",").map((part) => part.trim());
      return { dueDate, amount: Number(amount), paidDate };
    })
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.dueDate) && Number.isFinite(row.amount));
}

export function currentMonthPaymentStatus(loan, anchorDate = referenceDate) {
  const currentMonth = monthKey(anchorDate);
  const payment = loan.schedule?.find((row) => monthKey(row.dueDate) === currentMonth);
  if (!payment) {
    return { label: "No schedule", tone: "slate", payment: null, projectedOutstanding: loan.outstanding };
  }
  const paidDate = payment.paidDate || "";
  const projectedOutstanding = paidDate ? Math.max(0, loan.outstanding - payment.amount) : loan.outstanding;
  if (!paidDate) {
    return { label: parseDate(payment.dueDate) < parseDate(anchorDate) ? "Overdue" : "Due", tone: parseDate(payment.dueDate) < parseDate(anchorDate) ? "rose" : "amber", payment, projectedOutstanding };
  }
  if (parseDate(paidDate) <= parseDate(payment.dueDate)) {
    return { label: "Paid on time", tone: "emerald", payment, projectedOutstanding };
  }
  return { label: "Paid late", tone: "amber", payment, projectedOutstanding };
}

export function loanIncomeImpact(loans, commitments, salary) {
  const emi = loans.reduce((sum, item) => {
    if (item.accountType !== "credit-card") {
      return sum + Number(item.emi || 0);
    }
    const planMonthlyEmi = (item.emiPlans || []).reduce((planSum, plan) => planSum + Number(plan.monthlyEmi || 0), 0);
    return sum + (planMonthlyEmi || Number(item.monthlyEmi || 0));
  }, 0);
  const recurring = commitments.reduce((sum, item) => sum + item.amount, 0);
  const committed = emi + recurring;
  return {
    emi,
    recurring,
    committed,
    ratio: salary ? Math.round((committed / salary) * 100) : 0,
    available: salary - committed,
  };
}

function readUploadedText(file) {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function transactionFromApi(transaction) {
  return {
    id: transaction.id,
    kind: transaction.kind,
    category: transaction.category,
    group: transaction.group_name || "",
    merchant: transaction.merchant,
    alias: transaction.alias || "",
    amount: transaction.amount,
    date: transaction.spent_on,
    source: transaction.source || "Credit Card",
    excludedFromTotals: Boolean(transaction.excluded_from_totals),
    notes: transaction.notes || "",
  };
}

function transactionToApi(transaction) {
  return {
    kind: transaction.kind,
    category: transaction.category,
    group_name: transaction.group || null,
    merchant: transaction.merchant,
    alias: transaction.alias || null,
    amount: transaction.amount,
    spent_on: transaction.date,
    source: transaction.source || null,
    excluded_from_totals: Boolean(transaction.excludedFromTotals),
    notes: transaction.notes || null,
  };
}

function loanFromApi(loan) {
  return {
    id: loan.id,
    accountType: loan.account_type || "loan",
    lender: loan.lender,
    principal: loan.principal,
    outstanding: loan.outstanding,
    emi: loan.emi,
    dueDay: loan.due_day,
    rate: loan.interest_rate,
    tenureMonths: loan.tenure_months ?? null,
    periodsPaid: loan.periods_paid ?? null,
    creditLimit: loan.credit_limit ?? null,
    cardOutstanding: loan.card_outstanding ?? null,
    emiOutstanding: loan.emi_outstanding ?? null,
    monthlyEmi: loan.monthly_emi ?? null,
    minimumDue: loan.minimum_due ?? null,
    emiPlans: loan.emi_plans || [],
    schedule: [],
  };
}

function loanToApi(loan) {
  return {
    account_type: loan.accountType || "loan",
    lender: loan.lender,
    principal: loan.principal,
    outstanding: loan.outstanding,
    emi: loan.emi,
    due_day: loan.dueDay,
    interest_rate: loan.rate,
    tenure_months: loan.tenureMonths,
    periods_paid: loan.periodsPaid,
    credit_limit: loan.creditLimit,
    card_outstanding: loan.cardOutstanding,
    emi_outstanding: loan.emiOutstanding,
    monthly_emi: loan.monthlyEmi,
    minimum_due: loan.minimumDue,
    emi_plans: loan.emiPlans,
  };
}

function onboardingStorageKey(user) {
  return `${onboardingStoragePrefix}:${user?.email || "local"}`;
}

function incomeSourcesStorageKey(user) {
  return `${incomeSourcesStoragePrefix}:${user?.email || "local"}`;
}

function readStoredIncomeSources(user) {
  try {
    return JSON.parse(localStorage.getItem(incomeSourcesStorageKey(user)) || "[]");
  } catch {
    return [];
  }
}

async function apiRequest(path, { token, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.detail || message;
    } catch {
      // Keep the status message when the response is not JSON.
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function receiptExpenseToTransaction(expense) {
  return {
    kind: "expense",
    category: expense.category || "Receipts",
    group: "",
    merchant: expense.merchant || "AI extracted receipt",
    amount: Number(expense.amount || 0),
    date: expense.spent_on || referenceDate,
    source: "Credit Card",
  };
}

function transactionContext(transactions) {
  return transactions
    .slice(0, 20)
    .map((transaction) => `${transaction.date}: ${transaction.kind} ${transaction.category} ${transaction.merchant} ${money(transaction.amount)} via ${transaction.source}`)
    .join("\n");
}

export function App({ initialToken, initialUser, skipInitialLoad = false } = {}) {
  const [active, setActive] = useState("Dashboard");
  const [dark, setDark] = useState(false);
  const [theme, setTheme] = useState("emerald");
  const [token, setToken] = useState(() => initialToken || localStorage.getItem(authStorageKey) || "");
  const [user, setUser] = useState(initialUser || null);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(Boolean(token && !skipInitialLoad && !initialUser));
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [transactions, setTransactions] = useState(transactionsSeed);
  const [loans, setLoans] = useState(loansSeed);
  const [commitments, setCommitments] = useState(commitmentsSeed);
  const [view, setView] = useState("All");
  const [salary, setSalary] = useState(initialUser?.salary ?? 7200);
  const [incomeSources, setIncomeSources] = useState([]);
  const [profileImage, setProfileImage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState([
    { id: 1, title: "June grocery receipt", pinned: true, messages: [{ role: "assistant", content: "Upload a receipt or ask a spending question. I will use local Ollama/Qwen through the FastAPI backend." }] },
    { id: 2, title: "LA trip invoices", pinned: false, messages: [{ role: "assistant", content: "Grouped hotel and meal expenses under Los Angeles Trip." }] },
  ]);
  const [aiDraftExpense, setAiDraftExpense] = useState(null);
  const currentTheme = themeStyles[theme];
  const hasSession = Boolean(token || user);

  useEffect(() => {
    if (!token || skipInitialLoad) return;
    let cancelled = false;

    async function loadAccount() {
      setIsLoadingAccount(true);
      setAccountError("");
      try {
        const [profile, transactionRows, loanRows] = await Promise.all([
          apiRequest("/me", { token }),
          apiRequest("/transactions", { token }),
          apiRequest("/loans", { token }),
        ]);
        if (cancelled) return;
        setUser(profile);
        setSalary(profile.salary);
        setTheme(profile.theme || "emerald");
        setDark(Boolean(profile.dark_mode));
        setProfileImage(profile.profile_picture_url || "");
        setIncomeSources(readStoredIncomeSources(profile));
        setTransactions(transactionRows.map(transactionFromApi));
        setLoans(loanRows.map(loanFromApi));
        setNeedsOnboarding(!localStorage.getItem(onboardingStorageKey(profile)));
      } catch (error) {
        if (cancelled) return;
        localStorage.removeItem(authStorageKey);
        setToken("");
        setUser(null);
        setAccountError(error.message);
      } finally {
        if (!cancelled) {
          setIsLoadingAccount(false);
        }
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [token, skipInitialLoad]);

  async function submitAuth(formData) {
    setIsAuthenticating(true);
    setAuthError("");
    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const payload = {
        email: formData.get("email").trim(),
        password: formData.get("password"),
        ...(authMode === "register" ? { name: formData.get("name").trim() } : {}),
      };
      const result = await apiRequest(endpoint, { method: "POST", body: payload });
      localStorage.setItem(authStorageKey, result.access_token);
      setToken(result.access_token);
      setUser(result.user);
      setSalary(result.user.salary);
      setTheme(result.user.theme || "emerald");
      setDark(Boolean(result.user.dark_mode));
      setProfileImage(result.user.profile_picture_url || "");
      setIncomeSources(readStoredIncomeSources(result.user));
      setNeedsOnboarding(authMode === "register" || !localStorage.getItem(onboardingStorageKey(result.user)));
    } catch (error) {
      setAuthError(authMode === "login" && error.message === "Invalid email or password" ? "Invalid email or password. If this is your first time, create a new account first." : error.message);
    } finally {
      setIsAuthenticating(false);
    }
  }

  function logout() {
    localStorage.removeItem(authStorageKey);
    setToken("");
    setUser(null);
    setActive("Dashboard");
    setNeedsOnboarding(false);
    setTransactions(transactionsSeed);
    setLoans(loansSeed);
    setIncomeSources([]);
  }

  async function completeOnboarding(formData) {
    const nextProfile = {
      name: formData.get("name").trim(),
      salary: Number(formData.get("salary")),
      theme: formData.get("theme"),
    };
    if (!nextProfile.name || !Number.isFinite(nextProfile.salary) || nextProfile.salary < 0) {
      setOnboardingError("Enter your name and monthly income to continue.");
      return;
    }

    setIsSavingOnboarding(true);
    setOnboardingError("");
    try {
      const updatedUser = token
        ? await apiRequest("/me", { token, method: "PATCH", body: nextProfile })
        : { ...user, ...nextProfile };
      setUser(updatedUser);
      setSalary(updatedUser.salary);
      setTheme(updatedUser.theme || nextProfile.theme || "emerald");
      localStorage.setItem(onboardingStorageKey(updatedUser), "true");
      setIncomeSources(readStoredIncomeSources(updatedUser));
      setNeedsOnboarding(false);
      setActive("Dashboard");
    } catch (error) {
      setOnboardingError(error.message);
    } finally {
      setIsSavingOnboarding(false);
    }
  }

  const metrics = useMemo(() => {
    const counted = countedTransactions(transactions);
    const expense = counted.filter((t) => t.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
    const incomeSourceTotal = incomeSources.reduce((sum, item) => sum + item.amount, 0);
    const income = counted.filter((t) => t.kind === "income").reduce((sum, item) => sum + item.amount, 0) + salary + incomeSourceTotal;
    const emi = loans.reduce((sum, item) => sum + item.emi, 0);
    const categoryTotals = counted.filter((t) => t.kind === "expense").reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
    return {
      expense,
      income,
      recurringIncome: salary + incomeSourceTotal,
      emi,
      net: income - expense - emi,
      categoryData: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
    };
  }, [transactions, loans, salary, incomeSources]);
  const profileIncomeTotal = salary + incomeSources.reduce((sum, item) => sum + item.amount, 0);

  function addIncomeSource(source) {
    setIncomeSources((items) => {
      const next = [{ id: Date.now(), ...source }, ...items];
      if (user) {
        localStorage.setItem(incomeSourcesStorageKey(user), JSON.stringify(next));
      }
      return next;
    });
  }

  function deleteIncomeSource(sourceId) {
    setIncomeSources((items) => {
      const next = items.filter((item) => item.id !== sourceId);
      if (user) {
        localStorage.setItem(incomeSourcesStorageKey(user), JSON.stringify(next));
      }
      return next;
    });
  }

  async function addTransaction(transaction) {
    if (token) {
      const created = await apiRequest("/transactions", { token, method: "POST", body: transactionToApi(transaction) });
      setTransactions((items) => [transactionFromApi(created), ...items]);
      return;
    }
    setTransactions((items) => [{ id: Date.now(), ...transaction }, ...items]);
  }

  async function updateTransaction(transactionId, transaction) {
    if (token) {
      const updated = await apiRequest(`/transactions/${transactionId}`, { token, method: "PUT", body: transactionToApi(transaction) });
      setTransactions((items) => items.map((item) => (item.id === transactionId ? transactionFromApi(updated) : item)));
      return;
    }
    setTransactions((items) => items.map((item) => (item.id === transactionId ? { ...item, ...transaction } : item)));
  }

  async function deleteTransaction(transactionId) {
    if (token) {
      await apiRequest(`/transactions/${transactionId}`, { token, method: "DELETE" });
    }
    setTransactions((items) => items.filter((item) => item.id !== transactionId));
  }

  async function addLoan(loan) {
    if (token) {
      const created = await apiRequest("/loans", { token, method: "POST", body: loanToApi(loan) });
      setLoans((items) => [loanFromApi(created), ...items]);
      return;
    }
    setLoans((items) => [{ id: Date.now(), ...loan }, ...items]);
  }

  async function updateLoan(loanId, loan) {
    if (token) {
      const updated = await apiRequest(`/loans/${loanId}`, { token, method: "PUT", body: loanToApi(loan) });
      setLoans((items) => items.map((item) => (item.id === loanId ? { ...loanFromApi(updated), schedule: item.schedule || [] } : item)));
      return;
    }
    setLoans((items) => items.map((item) => (item.id === loanId ? { ...item, ...loan, schedule: loan.schedule.length ? loan.schedule : item.schedule || [] } : item)));
  }

  async function deleteLoan(loanId) {
    if (token) {
      await apiRequest(`/loans/${loanId}`, { token, method: "DELETE" });
    }
    setLoans((items) => items.filter((item) => item.id !== loanId));
  }

  function uploadLoanSchedule(loanId, schedule) {
    setLoans((items) => items.map((item) => (item.id === loanId ? { ...item, schedule } : item)));
  }

  function addCommitment(commitment) {
    setCommitments((items) => [{ id: Date.now(), ...commitment }, ...items]);
  }

  function updateCommitment(commitmentId, commitment) {
    setCommitments((items) => items.map((item) => (item.id === commitmentId ? { ...item, ...commitment } : item)));
  }

  function deleteCommitment(commitmentId) {
    setCommitments((items) => items.filter((item) => item.id !== commitmentId));
  }

  async function logCommitment(commitment) {
    const dueDay = String(Math.min(28, Math.max(1, Number(commitment.dueDay || 1)))).padStart(2, "0");
    await addTransaction({
      kind: "expense",
      category: commitment.category || "Commitments",
      group: "Monthly Commitments",
      merchant: commitment.name,
      alias: "",
      amount: Number(commitment.amount),
      date: `${monthKey(referenceDate)}-${dueDay}`,
      source: "Commitment",
      excludedFromTotals: true,
      notes: "Monthly commitment logged from profile settings.",
    });
  }

  function addChatExpense() {
    if (!aiDraftExpense) return;
    addTransaction(receiptExpenseToTransaction(aiDraftExpense));
    setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, messages: [...chat.messages, { role: "assistant", content: `Added ${aiDraftExpense.merchant} for ${money(aiDraftExpense.amount)} to transactions.` }] } : chat));
    setAiDraftExpense(null);
  }

  async function sendChat({ message, file }) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !file) return;

    const userMessage = file ? `${trimmedMessage || "Analyze this receipt."} Attached: ${file.name}` : trimmedMessage;
    setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, messages: [...chat.messages, { role: "user", content: userMessage }] } : chat));

    try {
      if (file) {
        const formData = new FormData();
        formData.set("prompt", trimmedMessage || "Extract the transaction details from this receipt or invoice.");
        formData.set("file", file);
        const response = await fetch(`${apiBaseUrl}/ai/receipt`, { method: "POST", body: formData });
        if (!response.ok) throw new Error(`Receipt analysis failed with ${response.status}`);
        const result = await response.json();
        if (result.extracted_expense) {
          setAiDraftExpense(result.extracted_expense);
        }
        const content = result.extracted_expense
          ? `${result.summary} Found ${result.extracted_expense.merchant} for ${money(result.extracted_expense.amount)} in ${result.extracted_expense.category}.`
          : result.summary;
        setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, messages: [...chat.messages, { role: "assistant", content }] } : chat));
      } else {
        const response = await fetch(`${apiBaseUrl}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedMessage, context: transactionContext(transactions) }),
        });
        if (!response.ok) throw new Error(`AI chat failed with ${response.status}`);
        const result = await response.json();
        setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, messages: [...chat.messages, { role: "assistant", content: result.answer }] } : chat));
      }
    } catch (error) {
      setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, messages: [...chat.messages, { role: "assistant", content: error.message }] } : chat));
    }
    setChatInput("");
  }

  if (!hasSession) {
    return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={submitAuth} error={authError || accountError} isSubmitting={isAuthenticating} />;
  }

  if (isLoadingAccount) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">Loading your workspace</p>
          <p className="mt-2 text-xl font-semibold">Hermes.Exp</p>
        </div>
      </main>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen user={user} salary={salary} theme={theme} onSubmit={completeOnboarding} error={onboardingError} isSubmitting={isSavingOnboarding} />;
  }

  return (
    <main className={dark ? "dark min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-slate-100 text-slate-950"}>
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <aside className="bg-slate-950 p-5 text-slate-200 max-lg:hidden">
          <div className="mb-8 flex items-center gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${currentTheme.gradient}`}>
              <WalletCards size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Hermes.Exp</h1>
              <p className="text-xs text-slate-400">Expense intelligence</p>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map(([label, Icon]) => (
              <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active === label ? `${currentTheme.activeNav} text-white` : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-10 rounded-lg border border-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Protected access</p>
            <p className="mt-2 text-sm text-slate-300">JWT login is wired in FastAPI. Use the backend to persist private bills and invoices.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <Topbar dark={dark} setDark={setDark} active={active} setActive={setActive} user={user} onLogout={logout} />
          <div className="p-6 max-sm:p-4">
            {active === "Dashboard" && <Dashboard metrics={metrics} transactions={transactions} loans={loans} theme={currentTheme} />}
            {active === "Transaction Log" && <TransactionLog transactions={transactions} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} view={view} setView={setView} theme={currentTheme} />}
            {active === "Calendar" && <CalendarView transactions={transactions} theme={currentTheme} />}
            {active === "Loans" && <Loans loans={loans} metrics={metrics} salary={profileIncomeTotal} commitments={commitments} onAdd={addLoan} onUpdate={updateLoan} onDelete={deleteLoan} onScheduleUpload={uploadLoanSchedule} theme={currentTheme} />}
            {active === "AI Chat" && <AIChat chats={chats} setChats={setChats} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} addChatExpense={addChatExpense} aiDraftExpense={aiDraftExpense} theme={currentTheme} />}
            {active === "Graph Builder" && <GraphBuilder data={metrics.categoryData} transactions={transactions} theme={currentTheme} />}
            {active === "Profile Settings" && <ProfileSettings user={user} dark={dark} setDark={setDark} theme={theme} setTheme={setTheme} salary={salary} incomeSources={incomeSources} onAddIncomeSource={addIncomeSource} onDeleteIncomeSource={deleteIncomeSource} commitments={commitments} onAddCommitment={addCommitment} onUpdateCommitment={updateCommitment} onDeleteCommitment={deleteCommitment} onLogCommitment={logCommitment} profileImage={profileImage} setProfileImage={setProfileImage} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthScreen({ mode, setMode, onSubmit, error, isSubmitting }) {
  function submit(event) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-[1fr_460px] max-lg:grid-cols-1">
        <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white max-lg:hidden">
          <img src="/homepage-image.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <WalletCards size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Hermes.Exp</h1>
              <p className="text-sm text-slate-200">Private expense intelligence</p>
            </div>
          </div>
          <div className="relative max-w-xl">
            <p className="text-sm uppercase tracking-wide text-emerald-200">Personal finance workspace</p>
            <h2 className="mt-4 text-5xl font-semibold leading-tight">Track spending, loans, EMIs, and monthly commitments with your own account.</h2>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-slate-200">JWT</p><p className="mt-1 font-semibold">Protected API</p></div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-slate-200">Postgres</p><p className="mt-1 font-semibold">Persisted data</p></div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-slate-200">INR</p><p className="mt-1 font-semibold">Local currency</p></div>
            </div>
          </div>
          <p className="relative text-sm text-slate-200">Use a fresh account for trial data. Existing accounts can sign back in anytime.</p>
        </section>

        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-white">
                <WalletCards size={23} />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Hermes.Exp</h1>
                <p className="text-sm text-slate-500">Private expense intelligence</p>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-sm text-slate-500">{mode === "register" ? "Create your trial workspace" : "Sign in to your workspace"}</p>
              <h2 className="mt-1 text-3xl font-semibold">{mode === "register" ? "New account" : "Welcome back"}</h2>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="label">Name</label>
                  <input name="name" className="input w-full" placeholder="Your name" autoComplete="name" required />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input w-full" placeholder="you@example.com" autoComplete="email" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" className="input w-full" placeholder="Password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={6} required />
              </div>
              {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {isSubmitting ? "Please wait" : mode === "register" ? "Create account" : "Login"}
              </button>
            </form>
            <div className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
              {mode === "register" ? "Already have an account?" : "Starting fresh with trial data?"}{" "}
              <button type="button" onClick={() => setMode(mode === "register" ? "login" : "register")} className="font-semibold text-emerald-700">
                {mode === "register" ? "Login" : "Create account"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function OnboardingScreen({ user, salary, theme, onSubmit, error, isSubmitting }) {
  function submit(event) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-[1fr_520px] max-lg:grid-cols-1">
        <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white max-lg:hidden">
          <img src="/homepage-image.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <WalletCards size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Hermes.Exp</h1>
              <p className="text-sm text-slate-200">Set up your workspace</p>
            </div>
          </div>
          <div className="relative max-w-xl">
            <p className="text-sm uppercase tracking-wide text-emerald-200">Fresh account setup</p>
            <h2 className="mt-4 text-5xl font-semibold leading-tight">Start with your profile first, then add real transactions, loans, and bills.</h2>
          </div>
          <p className="relative text-sm text-slate-200">New accounts now start empty so the dashboard reflects your own finances.</p>
        </section>

        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6">
              <p className="text-sm text-slate-500">Before opening the dashboard</p>
              <h2 className="mt-1 text-3xl font-semibold">Introduce yourself</h2>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input w-full" defaultValue={user?.name || ""} placeholder="Your name" required />
              </div>
              <div>
                <label className="label">Monthly income</label>
                <input name="salary" className="input w-full" type="number" min="0" step="0.01" defaultValue={salary || ""} placeholder="Monthly income in INR" required />
              </div>
              <div>
                <label className="label">Theme</label>
                <select name="theme" className="input w-full" defaultValue={theme}>
                  <option value="emerald">Emerald</option>
                  <option value="blue">Blue</option>
                  <option value="rose">Rose</option>
                  <option value="amber">Amber</option>
                </select>
              </div>
              {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <button disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {isSubmitting ? "Saving" : "Start dashboard"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Topbar({ active, dark, setDark, setActive, user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 max-sm:px-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hello, {user?.name || "Shiv"}</p>
        <h2 className="text-2xl font-semibold max-sm:text-xl">{active}</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 max-md:hidden">
          <Search size={17} className="text-slate-400" />
          <input className="w-56 bg-transparent text-sm outline-none" placeholder="Search anything" />
        </div>
        <IconButton icon={CalendarDays} label="Calendar" onClick={() => setActive("Calendar")} />
        <IconButton icon={Bell} label="Notifications" />
        <button onClick={() => setDark(!dark)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" aria-label="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={onLogout} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          Logout
        </button>
      </div>
    </header>
  );
}

function IconButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" aria-label={label} title={label}>
      <Icon size={18} />
    </button>
  );
}

function Dashboard({ metrics, transactions, loans, theme }) {
  const monthOptions = transactionMonthOptions(transactions);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  useEffect(() => {
    if (!monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);
  const monthlyComparison = monthlyComparisonData(transactions, monthOptions[0], metrics.recurringIncome);
  const leakageData = categoryLeakageForMonth(transactions, selectedMonth);
  const expenseGroups = Object.values(transactions
    .filter((transaction) => transaction.kind === "expense" && transaction.group && !transaction.excludedFromTotals)
    .reduce((groups, transaction) => {
      groups[transaction.group] ||= { name: transaction.group, total: 0, count: 0 };
      groups[transaction.group].total += transaction.amount;
      groups[transaction.group].count += 1;
      return groups;
    }, {}))
    .sort((first, second) => second.total - first.total);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <Metric title="Total Expenses" value={money(metrics.expense)} delta="+16%" icon={CreditCard} tone="emerald" />
        <Metric title="Total Income" value={money(metrics.income)} delta="+8%" icon={ArrowDownToLine} tone="sky" />
        <Metric title="Loan EMIs" value={money(metrics.emi)} delta="Due start of month" icon={Landmark} tone="amber" />
        <Metric title="Net Cashflow" value={money(metrics.net)} delta="After EMI" icon={WalletCards} tone="rose" />
      </div>
      <div className="grid grid-cols-[1.5fr_1fr] gap-5 max-xl:grid-cols-1">
        <Panel title="Monthly Comparison">
          <div data-testid="monthly-comparison-chart" data-income-color={incomeChartColor} data-expense-color={expenseChartColor}>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={chartMoney} />
                <Tooltip formatter={(value, name) => [chartMoney(value), name]} />
                <Bar dataKey="expense" name="Expense" fill={expenseChartColor} radius={[8, 8, 0, 0]} />
                <Bar dataKey="income" name="Income" fill={incomeChartColor} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Money Leakage"
          action={
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800" aria-label="Leakage month">
              {monthOptions.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}
            </select>
          }
        >
          <div className="space-y-4">
            {leakageData.slice(0, 5).map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span>{money(item.value)}</span></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-2 rounded-full ${theme.bar}`} style={{ width: `${Math.min(100, (item.value / Math.max(leakageData[0]?.value || 1, 1)) * 100)}%` }} /></div>
              </div>
            ))}
            {!leakageData.length && <p className="text-sm text-slate-500 dark:text-slate-400">No leakage recorded for {monthLabel(selectedMonth)}.</p>}
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Panel title="Expense Groups">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            {expenseGroups.map((group) => (
              <div key={group.name} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800">
                <div>
                  <span className="font-medium">{group.name}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group.count} transaction{group.count === 1 ? "" : "s"}</p>
                </div>
                <span className="font-semibold">{money(group.total)}</span>
              </div>
            ))}
            {!expenseGroups.length && <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No grouped expenses yet.</div>}
          </div>
        </Panel>
        <Panel title="Loan Snapshot">
          <div className="grid gap-3">
            {loans.map((loan) => <div key={loan.id} className="flex items-center justify-between rounded-lg bg-slate-100 p-4 dark:bg-slate-800"><span>{loan.lender}</span><span>{money(loan.emi)} EMI</span></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({ title, value, delta, icon: Icon, tone }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-700", sky: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", rose: "bg-rose-100 text-rose-700" };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-lg ${colors[tone]}`}><Icon size={20} /></div><span className="text-xs text-slate-400">{delta}</span></div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3>{action}</div>
      {children}
    </section>
  );
}

const emptyTransactionForm = {
  kind: "expense",
  merchant: "",
  category: "Uncategorized",
  group: "",
  source: "Credit Card",
  alias: "",
  amount: "",
  date: "2026-06-13",
  excludedFromTotals: false,
  notes: "",
};

const transactionCategories = [
  "Uncategorized",
  "Food",
  "Rent",
  "Groceries",
  "Utilities",
  "Salary",
  "Fuel",
  "Shopping",
  "Loan EMI",
  "Subscriptions",
  "Travel",
  "Healthcare",
  "Education",
  "Insurance",
  "Entertainment",
  "ATM Withdrawal",
  "Friend Ledger",
  "Deposited",
  "Statement Income",
  "Other Income",
];

function CategorySelect({ value, onChange, className = "input", label = "Category" }) {
  return (
    <select name="category" value={value} onChange={onChange} className={className} aria-label={label} required>
      {transactionCategories.map((category) => <option key={category}>{category}</option>)}
    </select>
  );
}

function GroupSelect({ value, groups, onSelect, className = "input", label = "Group" }) {
  return (
    <select value={value} onChange={onSelect} className={className} aria-label={label}>
      <option value="">No group</option>
      {groups.map((group) => <option key={group} value={group}>{group}</option>)}
      <option value="__new__">Create new group</option>
    </select>
  );
}

function TransactionLog({ transactions, onAdd, onUpdate, onDelete, view, setView, theme }) {
  const [form, setForm] = useState(emptyTransactionForm);
  const [editingId, setEditingId] = useState(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [statementType, setStatementType] = useState("bank");
  const [importRows, setImportRows] = useState([]);
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [expandedTransactionIds, setExpandedTransactionIds] = useState([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const transactionFormRef = useRef(null);
  const transactionMonths = useMemo(() => Array.from(new Set(transactions.map((transaction) => monthKey(transaction.date)).filter(Boolean))).sort().reverse(), [transactions]);
  const latestMonth = transactionMonths[0] || monthKey(referenceDate);
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);
  useEffect(() => {
    if (!transactionMonths.includes(selectedMonth)) {
      setSelectedMonth(latestMonth);
    }
  }, [latestMonth, selectedMonth, transactionMonths]);
  const viewAnchorDate = view === "Monthly" ? `${selectedMonth}-01` : latestTransactionDate(transactions);
  const visibleTransactions = getTransactionsForView(transactions, view, viewAnchorDate);
  const transactionGroups = Array.from(new Set(transactions.map((transaction) => transaction.group).filter(Boolean))).sort((first, second) => first.localeCompare(second));
  const [merchantSearch, setMerchantSearch] = useState("");
  const [tableFilters, setTableFilters] = useState({ kind: [], category: [], group: [], source: [], totals: [] });
  const [sortConfig, setSortConfig] = useState({ field: "date", direction: "desc" });
  const filterOptions = useMemo(() => ({
    kind: Array.from(new Set(visibleTransactions.map((transaction) => transaction.kind))).sort(),
    category: Array.from(new Set(visibleTransactions.map((transaction) => transaction.category))).sort((first, second) => first.localeCompare(second)),
    group: Array.from(new Set(visibleTransactions.map((transaction) => transaction.group || "General"))).sort((first, second) => first.localeCompare(second)),
    source: Array.from(new Set(visibleTransactions.map((transaction) => transaction.source || "Other"))).sort((first, second) => first.localeCompare(second)),
    totals: ["Counted", "Excluded"],
  }), [visibleTransactions]);
  const filteredTransactions = useMemo(() => {
    const search = merchantSearch.trim().toLowerCase();
    const valueForSort = (transaction) => {
      if (sortConfig.field === "amount") return transaction.amount;
      if (sortConfig.field === "date") return transaction.date;
      if (sortConfig.field === "totals") return transaction.excludedFromTotals ? "Excluded" : "Counted";
      if (sortConfig.field === "group") return transaction.group || "General";
      return transaction[sortConfig.field] || "";
    };

    return visibleTransactions
      .filter((transaction) => !search || transaction.merchant.toLowerCase().includes(search))
      .filter((transaction) => !tableFilters.kind.length || tableFilters.kind.includes(transaction.kind))
      .filter((transaction) => !tableFilters.category.length || tableFilters.category.includes(transaction.category))
      .filter((transaction) => !tableFilters.group.length || tableFilters.group.includes(transaction.group || "General"))
      .filter((transaction) => !tableFilters.source.length || tableFilters.source.includes(transaction.source || "Other"))
      .filter((transaction) => !tableFilters.totals.length || tableFilters.totals.includes(transaction.excludedFromTotals ? "Excluded" : "Counted"))
      .sort((first, second) => {
        const firstValue = valueForSort(first);
        const secondValue = valueForSort(second);
        const comparison = typeof firstValue === "number"
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue));
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
  }, [merchantSearch, sortConfig, tableFilters, visibleTransactions]);
  const filteredExpenseTotal = filteredTransactions.filter((transaction) => transaction.kind === "expense" && !transaction.excludedFromTotals).reduce((sum, transaction) => sum + transaction.amount, 0);
  const filteredTransactionIds = useMemo(() => filteredTransactions.map((transaction) => transaction.id), [filteredTransactions]);
  const selectedVisibleCount = selectedTransactionIds.filter((id) => filteredTransactionIds.includes(id)).length;
  const allVisibleSelected = filteredTransactionIds.length > 0 && selectedVisibleCount === filteredTransactionIds.length;

  useEffect(() => {
    setSelectedTransactionIds((current) => current.filter((id) => transactions.some((transaction) => transaction.id === id)));
  }, [transactions]);

  function toggleTableFilter(field, value) {
    setTableFilters((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  }

  function sortBy(field) {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  function toggleTransactionDetails(transactionId) {
    setExpandedTransactionIds((current) => (
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId]
    ));
  }

  function toggleSelectedTransaction(transactionId) {
    setSelectedTransactionIds((current) => (
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId]
    ));
  }

  function toggleAllVisibleTransactions() {
    setSelectedTransactionIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredTransactionIds.includes(id));
      }
      return Array.from(new Set([...current, ...filteredTransactionIds]));
    });
  }

  function confirmDelete(message) {
    return typeof globalThis.confirm === "function" ? globalThis.confirm(message) : true;
  }

  async function deleteSingleTransaction(transaction) {
    if (!confirmDelete(`Delete this transaction?\n\n${transaction.alias || transaction.merchant} - ${money(transaction.amount)} on ${transaction.date}`)) {
      return;
    }
    setIsDeletingTransactions(true);
    setDeleteError("");
    try {
      await onDelete(transaction.id);
      setSelectedTransactionIds((current) => current.filter((id) => id !== transaction.id));
    } catch (error) {
      setDeleteError(error.message || "Could not delete transaction.");
    } finally {
      setIsDeletingTransactions(false);
    }
  }

  async function deleteSelectedTransactions() {
    if (!selectedTransactionIds.length) return;
    if (!confirmDelete(`Delete ${selectedTransactionIds.length} selected transaction${selectedTransactionIds.length === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    setIsDeletingTransactions(true);
    setDeleteError("");
    try {
      for (const transactionId of selectedTransactionIds) {
        await onDelete(transactionId);
      }
      setSelectedTransactionIds([]);
    } catch (error) {
      setDeleteError(error.message || "Could not delete selected transactions.");
    } finally {
      setIsDeletingTransactions(false);
    }
  }

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function selectGroup(event) {
    const nextGroup = event.target.value;
    if (nextGroup === "__new__") {
      setIsCreatingGroup(true);
      setForm((current) => ({ ...current, group: "" }));
      return;
    }
    setIsCreatingGroup(false);
    setForm((current) => ({ ...current, group: nextGroup }));
  }

  function transactionFromForm() {
    return {
      kind: form.kind,
      category: form.category.trim(),
      group: form.group.trim(),
      merchant: form.merchant.trim(),
      alias: form.alias.trim(),
      amount: Number(form.amount),
      date: form.date,
      source: form.source,
      excludedFromTotals: Boolean(form.excludedFromTotals),
      notes: form.notes.trim(),
    };
  }

  async function saveTransaction(transactionId = editingId) {
    const transaction = transactionFromForm();
    if (!transaction.merchant || !transaction.category || !transaction.amount || !transaction.date) {
      setTransactionError("Merchant, category, amount, and date are required.");
      return;
    }

    setIsSavingTransaction(true);
    setTransactionError("");
    try {
      if (transactionId) {
        await onUpdate(transactionId, transaction);
      } else {
        await onAdd(transaction);
      }
      setEditingId(null);
      setIsCreatingGroup(false);
      setForm(emptyTransactionForm);
    } catch (error) {
      setTransactionError(error.message || "Could not save transaction.");
    } finally {
      setIsSavingTransaction(false);
    }
  }

  function submitTransaction(event) {
    event.preventDefault();
    saveTransaction();
  }

  function editTransaction(transaction) {
    setTransactionError("");
    setEditingId(transaction.id);
    setIsCreatingGroup(false);
    setForm({
      kind: transaction.kind,
      merchant: transaction.merchant,
      category: transaction.category,
      group: transaction.group || "",
      source: transaction.source,
      alias: transaction.alias || "",
      amount: String(transaction.amount),
      date: transaction.date,
      excludedFromTotals: Boolean(transaction.excludedFromTotals),
      notes: transaction.notes || "",
    });
    setExpandedTransactionIds((current) => current.includes(transaction.id) ? current : [...current, transaction.id]);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreatingGroup(false);
    setTransactionError("");
    setForm(emptyTransactionForm);
  }

  async function uploadStatement(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = parseStatementCsv(await readUploadedText(file), statementType);
    setImportRows(rows);
    setImportMessage(rows.length ? `Ready to import ${rows.length} transaction${rows.length === 1 ? "" : "s"} from ${file.name}.` : `No transactions found in ${file.name}.`);
    event.target.value = "";
  }

  async function importStatementRows() {
    if (!importRows.length) return;
    setIsImporting(true);
    try {
      for (const row of importRows) {
        await onAdd(row);
      }
      setImportMessage(`Imported ${importRows.length} transaction${importRows.length === 1 ? "" : "s"}.`);
      setImportRows([]);
    } catch (error) {
      setImportMessage(error.message);
    } finally {
      setIsImporting(false);
    }
  }

  function HeaderSortButton({ field }) {
    const active = sortConfig.field === field;
    return (
      <button onClick={() => sortBy(field)} className={`grid h-7 w-7 place-items-center rounded-md ${active ? theme.soft : "hover:bg-slate-200 dark:hover:bg-slate-700"}`} aria-label={`Sort ${field}`}>
        <ArrowUpDown size={14} />
      </button>
    );
  }

  function HeaderFilterMenu({ field, label }) {
    const selected = tableFilters[field];
    return (
      <details className="relative">
        <summary className={`grid h-7 w-7 cursor-pointer list-none place-items-center rounded-md ${selected.length ? theme.soft : "hover:bg-slate-200 dark:hover:bg-slate-700"}`} aria-label={`Filter ${label}`}>
          <Filter size={14} />
        </summary>
        <div className="absolute left-0 z-20 mt-2 min-w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
            {!!selected.length && <button onClick={() => setTableFilters((current) => ({ ...current, [field]: [] }))} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">Clear</button>}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {filterOptions[field].map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                <input type="checkbox" checked={selected.includes(item)} onChange={() => toggleTableFilter(field, item)} className="h-4 w-4" aria-label={`${label} ${item}`} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    );
  }

  function HeaderControls({ label, sortField, filterField }) {
    return (
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortField && <HeaderSortButton field={sortField} />}
        {filterField && <HeaderFilterMenu field={filterField} label={label} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Panel title="Import Statement">
        <div className="grid grid-cols-[220px_1fr_auto] items-end gap-3 max-lg:grid-cols-1">
          <div>
            <label className="label">Statement type</label>
            <select value={statementType} onChange={(event) => setStatementType(event.target.value)} className="input w-full">
              <option value="bank">Bank statement</option>
              <option value="credit-card">Credit card statement</option>
            </select>
          </div>
          <label className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 text-sm dark:border-slate-700">
            <Upload size={16} /> Upload CSV
            <input type="file" accept=".csv,text/csv,text/plain" className="hidden" aria-label="Upload statement CSV" onChange={uploadStatement} />
          </label>
          <button onClick={importStatementRows} disabled={!importRows.length || isImporting} className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50 ${theme.button}`}>
            <FileUp size={16} /> {isImporting ? "Importing" : "Import"}
          </button>
        </div>
        {importMessage && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{importMessage}</p>}
        {!!importRows.length && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr><th className="p-3">Date</th><th>Merchant</th><th>Type</th><th>Source</th><th className="pr-3 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {importRows.slice(0, 5).map((row, index) => (
                  <tr key={`${row.date}-${row.merchant}-${index}`} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3">{row.date}</td><td>{row.merchant}</td><td>{row.kind}</td><td>{row.source}</td><td className="pr-3 text-right font-semibold">{money(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div ref={transactionFormRef}>
        <Panel
          title={editingId ? "Edit Transaction" : "Add Transaction"}
          action={
            <div className="flex gap-2">
              {editingId && <button onClick={cancelEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button>}
              <button type="submit" form="transaction-form" disabled={isSavingTransaction} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${theme.button}`}>
                <Plus size={16} /> {editingId ? (isSavingTransaction ? "Saving" : "Save") : "Add New"}
              </button>
            </div>
          }
        >
          <form id="transaction-form" onSubmit={submitTransaction} className="grid grid-cols-10 gap-3 max-2xl:grid-cols-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
            <select name="kind" value={form.kind} onChange={updateField} className="input"><option>expense</option><option>income</option></select>
            <input name="merchant" value={form.merchant} onChange={updateField} className="input" placeholder="Merchant" required />
            <input name="alias" value={form.alias} onChange={updateField} className="input" placeholder="Name" />
            <CategorySelect value={form.category} onChange={updateField} />
            <div className="space-y-2">
              <GroupSelect value={isCreatingGroup ? "__new__" : form.group} groups={transactionGroups} onSelect={selectGroup} />
              {isCreatingGroup && <input name="group" value={form.group} onChange={updateField} className="input" placeholder="New group name" aria-label="New group name" />}
            </div>
            <select name="source" value={form.source} onChange={updateField} className="input"><option>Bank</option><option>Salary</option><option>Credit Card</option><option>Debit Card</option><option>Other Income</option></select>
            <input name="amount" value={form.amount} onChange={updateField} type="number" min="0" step="0.01" className="input" placeholder="Amount" required />
            <input name="date" value={form.date} onChange={updateField} type="date" className="input" required />
            <input name="notes" value={form.notes} onChange={updateField} className="input" placeholder="Notes" />
            <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700">
              <input name="excludedFromTotals" type="checkbox" checked={form.excludedFromTotals} onChange={updateField} className="h-4 w-4" />
              Exclude totals
            </label>
          </form>
          {transactionError && <p className="mt-3 text-sm font-medium text-rose-600">{transactionError}</p>}
        </Panel>
      </div>
      <Panel title="All Transactions" action={
        <div className="flex flex-wrap gap-2">
          {["All", "Daily", "Weekly", "Fortnight", "Monthly"].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-sm ${view === item ? `${theme.button} text-white` : "bg-slate-100 dark:bg-slate-800"}`}>{item}</button>)}
          <select value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setView("Monthly"); }} className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800" aria-label="Transaction month">
            {transactionMonths.length ? transactionMonths.map((item) => (
              <option key={item} value={item}>{parseDate(`${item}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>
            )) : <option value={selectedMonth}>No months</option>}
          </select>
        </div>
      }>
        <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredTransactions.length} of {visibleTransactions.length} transaction{visibleTransactions.length === 1 ? "" : "s"} for {view.toLowerCase()} view. Expenses total {money(filteredExpenseTotal)}.
          </div>
          <div className="flex flex-wrap gap-2">
            {!!selectedTransactionIds.length && (
              <button onClick={deleteSelectedTransactions} disabled={isDeletingTransactions} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 disabled:opacity-60 dark:border-rose-900">
                <Trash2 size={16} /> Delete selected ({selectedTransactionIds.length})
              </button>
            )}
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Download size={16} /> Export CSV</button>
          </div>
        </div>
        {deleteError && <p className="mb-3 text-sm font-medium text-rose-600">{deleteError}</p>}
        <div className="mb-4 max-w-sm">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={merchantSearch} onChange={(event) => setMerchantSearch(event.target.value)} className="input search-input w-full" placeholder="Search merchant" aria-label="Search merchant" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="p-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisibleTransactions} className="h-4 w-4" aria-label="Select all visible transactions" />
                </th>
                <th><HeaderControls label="Type" sortField="kind" filterField="kind" /></th>
                <th>Name</th>
                <th><HeaderControls label="Category" sortField="category" filterField="category" /></th>
                <th><HeaderControls label="Group" sortField="group" filterField="group" /></th>
                <th><HeaderControls label="Source" sortField="source" filterField="source" /></th>
                <th><HeaderControls label="Date" sortField="date" /></th>
                <th className="pr-4 text-right"><div className="flex justify-end"><HeaderControls label="Amount" sortField="amount" /></div></th>
                <th><HeaderControls label="Totals" sortField="totals" filterField="totals" /></th>
                <th className="pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => {
                const isEditing = editingId === t.id;
                const isExpanded = expandedTransactionIds.includes(t.id);
                return (
                  <React.Fragment key={t.id}>
                    <tr
                      onClick={() => toggleTransactionDetails(t.id)}
                      aria-label={`${t.kind} ${t.alias || "Unnamed"} ${t.merchant} ${t.category} ${t.group || "General"} ${t.source} ${t.date} ${money(t.amount)} ${t.excludedFromTotals ? "Excluded" : "Counted"}`}
                      className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/30 ${isEditing ? "bg-slate-50 dark:bg-slate-800/40" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedTransactionIds.includes(t.id)}
                          onChange={() => toggleSelectedTransaction(t.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4"
                          aria-label={`Select ${t.merchant}`}
                        />
                      </td>
                      <td>
                        {isEditing ? (
                          <select name="kind" value={form.kind} onChange={updateField} onClick={(event) => event.stopPropagation()} className="input min-w-28"><option>expense</option><option>income</option></select>
                        ) : (
                          <span className={`rounded-full px-2 py-1 text-xs ${t.kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.kind}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input name="alias" value={form.alias} onChange={updateField} onClick={(event) => event.stopPropagation()} className="input min-w-40" aria-label="Edit name" placeholder="Name" />
                        ) : (
                          <div className="font-medium">{t.alias || "Unnamed"}</div>
                        )}
                      </td>
                      <td onClick={(event) => isEditing && event.stopPropagation()}>{isEditing ? <CategorySelect value={form.category} onChange={updateField} className="input min-w-40" label="Edit category" /> : t.category}</td>
                      <td onClick={(event) => isEditing && event.stopPropagation()}>
                        {isEditing ? (
                          <div className="space-y-2">
                            <GroupSelect value={isCreatingGroup ? "__new__" : form.group} groups={transactionGroups} onSelect={selectGroup} className="input min-w-40" label="Edit group" />
                            {isCreatingGroup && <input name="group" value={form.group} onChange={updateField} className="input min-w-40" aria-label="New group name" placeholder="New group name" />}
                          </div>
                        ) : (t.group || "General")}
                      </td>
                      <td>
                        {isEditing ? (
                          <select name="source" value={form.source} onChange={updateField} onClick={(event) => event.stopPropagation()} className="input min-w-36" aria-label="Edit source">
                            <option>Bank</option><option>Salary</option><option>Credit Card</option><option>Debit Card</option><option>Other Income</option>
                          </select>
                        ) : t.source}
                      </td>
                      <td>{isEditing ? <input name="date" value={form.date} onChange={updateField} onClick={(event) => event.stopPropagation()} type="date" className="input min-w-36" aria-label="Edit date" /> : t.date}</td>
                      <td className="pr-4 text-right font-semibold">
                        {isEditing ? <input name="amount" value={form.amount} onChange={updateField} onClick={(event) => event.stopPropagation()} type="number" min="0" step="0.01" className="input ml-auto min-w-28 text-right" aria-label="Edit amount" /> : money(t.amount)}
                      </td>
                      <td>
                        {isEditing ? (
                          <label onClick={(event) => event.stopPropagation()} className="flex min-w-32 items-center gap-2 text-xs">
                            <input name="excludedFromTotals" type="checkbox" checked={form.excludedFromTotals} onChange={updateField} className="h-4 w-4" />
                            Exclude
                          </label>
                        ) : (
                          <span className={`rounded-full px-2 py-1 text-xs ${t.excludedFromTotals ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {t.excludedFromTotals ? "Excluded" : "Counted"}
                          </span>
                        )}
                      </td>
                      <td className="pr-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={(event) => { event.stopPropagation(); saveTransaction(t.id); }} disabled={isSavingTransaction} className={`grid h-9 w-9 place-items-center rounded-lg text-white disabled:opacity-60 ${theme.button}`} aria-label={`Save ${t.merchant}`} title="Save">
                                <Save size={16} />
                              </button>
                              <button onClick={(event) => { event.stopPropagation(); cancelEdit(); }} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Cancel ${t.merchant}`} title="Cancel">×</button>
                            </>
                          ) : (
                            <>
                              <button onClick={(event) => { event.stopPropagation(); editTransaction(t); }} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Edit ${t.merchant}`} title="Edit">
                                <Pencil size={16} />
                              </button>
                              <button onClick={(event) => { event.stopPropagation(); deleteSingleTransaction(t); }} disabled={isDeletingTransactions} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 disabled:opacity-60 dark:border-slate-700" aria-label={`Delete ${t.merchant}`} title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={`border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/20 ${isEditing ? "dark:bg-slate-800/40" : ""}`}>
                        <td colSpan="10" className="px-3 py-4">
                          {isEditing ? (
                            <div className="grid grid-cols-[minmax(220px,1fr)_minmax(280px,2fr)] gap-3 max-lg:grid-cols-1">
                              <div>
                                <label className="label">Merchant</label>
                                <input name="merchant" value={form.merchant} onChange={updateField} className="input w-full" aria-label="Edit merchant" />
                              </div>
                              <div>
                                <label className="label">Notes</label>
                                <input name="notes" value={form.notes} onChange={updateField} className="input w-full" aria-label="Edit notes" placeholder="Notes" />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-[minmax(220px,1fr)_minmax(280px,2fr)] gap-4 text-sm max-lg:grid-cols-1">
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">Merchant</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{t.merchant}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">Notes</p>
                                <p className="mt-1 text-slate-600 dark:text-slate-300">{t.notes || "No notes added."}</p>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!filteredTransactions.length && (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-slate-500 dark:text-slate-400">No transactions in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CalendarView({ transactions, theme }) {
  const availableMonths = Array.from(new Set(transactions.map((transaction) => monthKey(transaction.date)).filter(Boolean))).sort().reverse();
  const latestMonth = availableMonths[0] || monthKey(referenceDate);
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);
  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(latestMonth);
    }
  }, [availableMonths, latestMonth, selectedMonth]);

  const anchorDate = transactions.find((transaction) => monthKey(transaction.date) === selectedMonth)?.date || `${selectedMonth}-01`;
  const monthDate = parseDate(`${selectedMonth}-01`);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthLabel = monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const cells = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const transactionsByDate = transactions
    .filter((transaction) => parseDate(transaction.date).getMonth() === month && parseDate(transaction.date).getFullYear() === year)
    .reduce((acc, transaction) => {
      acc[transaction.date] ||= [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});

  return (
    <Panel
      title="Transaction Calendar"
      action={
        <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={`rounded-lg px-3 py-2 text-sm ${theme.soft}`} aria-label="Calendar month">
          {availableMonths.length ? availableMonths.map((item) => (
            <option key={item} value={item}>{parseDate(`${item}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>
          )) : <option value={selectedMonth}>{monthLabel}</option>}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 border-l border-t border-slate-200 text-sm dark:border-slate-800">
          {weekdayLabels.map((label) => (
            <div key={label} className="border-b border-r border-slate-200 bg-slate-100 p-3 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            const dateKey = cell.day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}` : "";
            const dayTransactions = transactionsByDate[dateKey] || [];
            const countedDayTransactions = countedTransactions(dayTransactions);
            const expenseTransactions = countedDayTransactions.filter((transaction) => transaction.kind === "expense");
            const incomeTotal = countedDayTransactions.filter((transaction) => transaction.kind === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
            const expenseTotal = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
            const spendBadge = expenseTotal >= 10000 ? "bg-rose-600 text-white" : "bg-amber-300 text-amber-950";
            const sourceTotals = expenseTransactions.reduce((acc, transaction) => {
              const source = transaction.source || "Other";
              acc[source] = (acc[source] || 0) + transaction.amount;
              return acc;
            }, {});
            const sourceTooltip = Object.entries(sourceTotals)
              .sort((first, second) => second[1] - first[1])
              .map(([source, total]) => `${source}: ${money(total)}`)
              .join("\n");
            const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
              acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
              return acc;
            }, {});
            const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

            return (
              <div key={cell.key} className="min-h-32 border-b border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                {cell.day && (
                  <div className="flex h-full flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm font-semibold ${dateKey === anchorDate ? `${theme.button} text-white` : "bg-slate-100 dark:bg-slate-800"}`}>{cell.day}</span>
                      <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {expenseTotal > 0 && (
                          <div className={`rounded-full px-2 py-1 shadow-sm ${spendBadge}`} title={sourceTooltip} aria-label={`Spend by source: ${sourceTooltip.replace(/\n/g, ", ")}`}>
                            {money(expenseTotal)}
                          </div>
                        )}
                        {incomeTotal > 0 && <div className="text-emerald-600">+{money(incomeTotal)}</div>}
                      </div>
                    </div>
                    {highestCategory && (
                      <div className={`rounded-lg px-2 py-1 text-xs font-medium ${theme.soft}`}>
                        High: {highestCategory[0]} {money(highestCategory[1])}
                      </div>
                    )}
                    <div className="space-y-1">
                      {dayTransactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className={`truncate rounded px-2 py-1 text-xs ${transaction.kind === "income" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-slate-100 dark:bg-slate-800"}`} title={`${transaction.category}: ${transaction.merchant}`}>
                          {transaction.excludedFromTotals ? "Excluded · " : ""}{transaction.kind === "income" ? "+" : ""}{transaction.category} · {money(transaction.amount)}
                        </div>
                      ))}
                      {dayTransactions.length > 3 && <div className="text-xs text-slate-500">+{dayTransactions.length - 3} more</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

const emptyLoanForm = {
  accountType: "loan",
  lender: "",
  principal: "",
  outstanding: "",
  emi: "",
  dueDay: "1",
  rate: "",
  tenureMonths: "",
  periodsPaid: "",
  creditLimit: "",
  cardOutstanding: "",
  emiOutstanding: "",
  monthlyEmi: "",
  minimumDue: "",
  emiPlans: "",
  trackCardEmis: false,
  emiPlanName: "",
  emiPurchased: "",
  emiLoanedAmount: "",
  emiCurrentOutstanding: "",
  emiPlanMonthlyEmi: "",
  emiPlanApr: "",
  emiPlanRoi: "",
  emiPlanTotalEmis: "",
  emiPlanCompletedEmis: "",
};

const emptyCommitmentForm = {
  name: "",
  amount: "",
  dueDay: "1",
  category: "Bills",
};

function Loans({ loans, salary, commitments, onAdd, onUpdate, onDelete, onScheduleUpload, theme }) {
  const [loanForm, setLoanForm] = useState(emptyLoanForm);
  const [editingId, setEditingId] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const impact = loanIncomeImpact(loans, commitments, salary);

  function updateLoanField(event) {
    const { name, type, checked, value } = event.target;
    setLoanForm((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (name === "accountType" && value === "loan") {
        next.trackCardEmis = false;
      }
      return next;
    });
  }

  function submitLoan(event) {
    event.preventDefault();
    const loan = normalizeLoanForm(new FormData(event.currentTarget));
    const isCreditCard = loan.accountType === "credit-card";
    if (!loan.lender || !loan.dueDay || (isCreditCard ? (!loan.creditLimit || !loan.cardOutstanding) : (!loan.principal || !loan.outstanding || !loan.emi))) {
      return;
    }
    if (editingId) {
      onUpdate(editingId, loan);
    } else {
      onAdd(loan);
    }
    setEditingId(null);
    setLoanForm(emptyLoanForm);
    setIsAccountModalOpen(false);
  }

  function openAddAccount() {
    setEditingId(null);
    setLoanForm(emptyLoanForm);
    setIsAccountModalOpen(true);
  }

  function editLoan(loan) {
    setEditingId(loan.id);
    const firstPlan = loan.emiPlans?.[0] || {};
    const emiPlansText = (loan.emiPlans || []).map((plan) => [plan.name, plan.purchased, plan.loanedAmount ?? plan.outstanding, plan.outstanding, plan.monthlyEmi, plan.totalEmis || "", plan.completedEmis || ""].join(",")).join("\n");
    setLoanForm({
      accountType: loan.accountType || "loan",
      lender: loan.lender,
      principal: String(loan.principal),
      outstanding: String(loan.outstanding),
      emi: String(loan.emi),
      dueDay: String(loan.dueDay),
      rate: String(loan.rate),
      tenureMonths: String(loan.tenureMonths ?? ""),
      periodsPaid: String(loan.periodsPaid ?? ""),
      creditLimit: String(loan.creditLimit ?? loan.principal ?? ""),
      cardOutstanding: String(loan.cardOutstanding ?? loan.outstanding ?? ""),
      emiOutstanding: String(loan.emiOutstanding ?? ""),
      monthlyEmi: String(loan.monthlyEmi ?? loan.emi ?? ""),
      minimumDue: String(loan.minimumDue ?? ""),
      emiPlans: emiPlansText,
      trackCardEmis: Boolean(emiPlansText || loan.emiOutstanding || loan.monthlyEmi),
      emiPlanName: firstPlan.name || "",
      emiPurchased: firstPlan.purchased || "",
      emiLoanedAmount: String(firstPlan.loanedAmount ?? ""),
      emiCurrentOutstanding: String(firstPlan.outstanding ?? loan.emiOutstanding ?? ""),
      emiPlanMonthlyEmi: String(firstPlan.monthlyEmi ?? loan.monthlyEmi ?? ""),
      emiPlanApr: String(firstPlan.apr ?? ""),
      emiPlanRoi: String(firstPlan.roi ?? ""),
      emiPlanTotalEmis: String(firstPlan.totalEmis ?? ""),
      emiPlanCompletedEmis: String(firstPlan.completedEmis ?? ""),
    });
    setIsAccountModalOpen(true);
  }

  function cancelLoanEdit() {
    setEditingId(null);
    setLoanForm(emptyLoanForm);
    setIsAccountModalOpen(false);
  }

  async function uploadSchedule(event, loanId) {
    const file = event.target.files?.[0];
    if (!file) return;
    const schedule = parseRepaymentSchedule(await readUploadedText(file));
    onScheduleUpload(loanId, schedule);
    event.target.value = "";
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 max-xl:grid-cols-1">
      <div className="space-y-5">
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{editingId ? "Edit Account" : "Add Account"}</h3>
                <button onClick={cancelLoanEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button>
              </div>
              <form id="loan-form" onSubmit={submitLoan} className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <label className="label">Account type<select name="accountType" value={loanForm.accountType} onChange={updateLoanField} className="input mt-1 w-full" aria-label="Account type"><option value="loan">Loan</option><option value="credit-card">Credit Card</option></select></label>
                {loanForm.accountType === "credit-card" ? (
                  <>
                    <label className="label">Card name<input name="lender" value={loanForm.lender} onChange={updateLoanField} className="input mt-1 w-full" placeholder="HDFC Regalia" required /></label>
                    <label className="label">Credit limit<input name="creditLimit" value={loanForm.creditLimit} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="100000" required /></label>
                    <label className="label">Total outstanding<input name="cardOutstanding" value={loanForm.cardOutstanding} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="93000" required /></label>
                    <label className="label">Minimum due<input name="minimumDue" value={loanForm.minimumDue} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="12000" /></label>
                    <label className="label">Card due day<input name="dueDay" value={loanForm.dueDay} onChange={updateLoanField} type="number" min="1" max="31" className="input mt-1 w-full" placeholder="12" required /></label>
                    <label className="label">APR %<input name="rate" value={loanForm.rate} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="36" /></label>
                    <label className="col-span-full inline-flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      <input name="trackCardEmis" type="checkbox" checked={loanForm.trackCardEmis} onChange={updateLoanField} />
                      Track converted-to-EMI purchases
                    </label>
                    {loanForm.trackCardEmis && (
                      <>
                        <label className="label">EMI loan name<input name="emiPlanName" value={loanForm.emiPlanName} onChange={updateLoanField} className="input mt-1 w-full" placeholder="Phone EMI" /></label>
                        <label className="label">Purchased item<input name="emiPurchased" value={loanForm.emiPurchased} onChange={updateLoanField} className="input mt-1 w-full" placeholder="iPhone" /></label>
                        <label className="label">Converted amount<input name="emiLoanedAmount" value={loanForm.emiLoanedAmount} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="90000" /></label>
                        <label className="label">Current outstanding after EMIs<input name="emiCurrentOutstanding" value={loanForm.emiCurrentOutstanding} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="50000" /></label>
                        <label className="label">Monthly EMI<input name="emiPlanMonthlyEmi" value={loanForm.emiPlanMonthlyEmi} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="7000" /></label>
                        <label className="label">APR %<input name="emiPlanApr" value={loanForm.emiPlanApr} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="36" /></label>
                        <label className="label">ROI %<input name="emiPlanRoi" value={loanForm.emiPlanRoi} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="14" /></label>
                        <label className="label">Total EMIs<input name="emiPlanTotalEmis" value={loanForm.emiPlanTotalEmis} onChange={updateLoanField} type="number" min="0" step="1" className="input mt-1 w-full" placeholder="12" /></label>
                        <label className="label">EMIs completed<input name="emiPlanCompletedEmis" value={loanForm.emiPlanCompletedEmis} onChange={updateLoanField} type="number" min="0" step="1" className="input mt-1 w-full" placeholder="5" /></label>
                        <div className="col-span-full rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                          <div className="mb-2 flex justify-between text-sm">
                            <span>Outstanding split preview</span>
                            <span>{money(Math.max(0, Number(loanForm.cardOutstanding || 0) - Number(loanForm.emiCurrentOutstanding || 0)))} regular · {money(Number(loanForm.emiCurrentOutstanding || 0))} EMI</span>
                          </div>
                          <div className="flex h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div className="h-2 bg-rose-500" style={{ width: `${Number(loanForm.creditLimit || 0) ? Math.min(100, (Math.max(0, Number(loanForm.cardOutstanding || 0) - Number(loanForm.emiCurrentOutstanding || 0)) / Number(loanForm.creditLimit || 1)) * 100) : 0}%` }} />
                            <div className="h-2 bg-amber-400" style={{ width: `${Number(loanForm.creditLimit || 0) ? Math.min(100, (Number(loanForm.emiCurrentOutstanding || 0) / Number(loanForm.creditLimit || 1)) * 100) : 0}%` }} />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label className="label">Lender<input name="lender" value={loanForm.lender} onChange={updateLoanField} className="input mt-1 w-full" placeholder="Personal Loan" required /></label>
                    <label className="label">Principal<input name="principal" value={loanForm.principal} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="100000" required /></label>
                    <label className="label">Outstanding<input name="outstanding" value={loanForm.outstanding} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="80000" required /></label>
                    <label className="label">EMI<input name="emi" value={loanForm.emi} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="5000" required /></label>
                    <label className="label">Tenure / periods<input name="tenureMonths" value={loanForm.tenureMonths} onChange={updateLoanField} type="number" min="1" step="1" className="input mt-1 w-full" placeholder="60" /></label>
                    <label className="label">Periods paid<input name="periodsPaid" value={loanForm.periodsPaid} onChange={updateLoanField} type="number" min="0" step="1" className="input mt-1 w-full" placeholder="12" /></label>
                    <label className="label">Loan due day<input name="dueDay" value={loanForm.dueDay} onChange={updateLoanField} type="number" min="1" max="31" className="input mt-1 w-full" placeholder="15" required /></label>
                    <label className="label">ROI %<input name="rate" value={loanForm.rate} onChange={updateLoanField} type="number" min="0" step="0.01" className="input mt-1 w-full" placeholder="11.5" /></label>
                  </>
                )}
                <div className="col-span-full flex justify-end gap-2">
                  <button type="button" onClick={cancelLoanEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button>
                  <button type="submit" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${theme.button}`}>{editingId ? <Save size={16} /> : <Plus size={16} />} {editingId ? "Save" : "Add Account"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Panel title="Loan Accounts" action={<button onClick={openAddAccount} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${theme.button}`}><Plus size={16} /> New Account</button>}>
          <div className="space-y-3">
            {loans.map((loan) => {
              const status = currentMonthPaymentStatus(loan);
              const isCreditCard = loan.accountType === "credit-card";
              const creditLimit = Number(loan.creditLimit ?? loan.principal ?? 0);
              const cardOutstanding = Number(loan.cardOutstanding ?? loan.outstanding ?? 0);
              const emiPlans = loan.emiPlans || [];
              const planEmiOutstanding = emiPlans.reduce((sum, plan) => sum + Number(plan.outstanding || 0), 0);
              const planMonthlyEmi = emiPlans.reduce((sum, plan) => sum + Number(plan.monthlyEmi || 0), 0);
              const emiOutstanding = planEmiOutstanding || Number(loan.emiOutstanding || 0);
              const regularOutstanding = Math.max(0, cardOutstanding - emiOutstanding);
              const monthlyEmi = planMonthlyEmi || Number(loan.monthlyEmi || 0);
              const minimumDue = Number(loan.minimumDue || 0);
              const regularRatio = creditLimit ? Math.min(100, (regularOutstanding / creditLimit) * 100) : 0;
              const emiRatio = creditLimit ? Math.min(100, (emiOutstanding / creditLimit) * 100) : 0;
              const paidRatio = isCreditCard
                ? Math.min(100, Math.max(0, creditLimit ? (cardOutstanding / creditLimit) * 100 : 0))
                : Math.min(100, Math.max(0, 100 - (loan.outstanding / loan.principal) * 100));
              const tenureMonths = Number(loan.tenureMonths || 0);
              const basePeriodsPaid = Number(loan.periodsPaid || 0);
              const currentMonthPaid = !isCreditCard && status.payment?.paidDate ? 1 : 0;
              const completedPeriods = tenureMonths ? Math.min(tenureMonths, basePeriodsPaid + currentMonthPaid) : basePeriodsPaid;
              const remainingPeriods = tenureMonths ? Math.max(0, tenureMonths - completedPeriods) : null;
              const statusColor = {
                emerald: "bg-emerald-100 text-emerald-700",
                amber: "bg-amber-100 text-amber-700",
                rose: "bg-rose-100 text-rose-700",
                slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              }[status.tone];
              return (
                <div key={loan.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{loan.lender}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{isCreditCard ? "Credit Card" : "Loan"} · {isCreditCard ? "APR" : "ROI"} {loan.rate}% · Due day {loan.dueDay}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editLoan(loan)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Edit ${loan.lender}`} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(loan.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 dark:border-slate-700" aria-label={`Delete ${loan.lender}`} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    {isCreditCard ? (
                      <div className="flex h-2">
                        <div className="h-2 bg-rose-500" style={{ width: `${regularRatio}%` }} />
                        <div className="h-2 bg-amber-400" style={{ width: `${emiRatio}%` }} />
                      </div>
                    ) : (
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${paidRatio}%` }} />
                    )}
                  </div>
                  {isCreditCard ? (
                    <>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Regular outstanding</span>
                        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Converted to EMI</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-2">
                        <span>Credit limit {money(creditLimit)}</span>
                        <span>Total outstanding {money(cardOutstanding)}</span>
                        <span>Utilization {Math.round(paidRatio)}%</span>
                        <span>Regular outstanding {money(regularOutstanding)}</span>
                        <span>EMI outstanding {money(emiOutstanding)}</span>
                        <span>Monthly EMI {monthlyEmi ? money(monthlyEmi) : "None"}</span>
                        <span>Minimum due {minimumDue ? money(minimumDue) : "Not set"}</span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-3 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <span>Loan name</span>
                          <span>Purchased</span>
                          <span>Total loaned</span>
                          <span>Outstanding</span>
                          <span>Monthly EMI</span>
                          <span>Rate</span>
                          <span>Completed</span>
                        </div>
                        {emiPlans.length ? emiPlans.map((plan, index) => (
                          <div key={`${plan.name}-${index}`} className="grid grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-t border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
                            <span className="font-medium">{plan.name}</span>
                            <span>{plan.purchased || "Not specified"}</span>
                            <span>{money(plan.loanedAmount ?? plan.outstanding)}</span>
                            <span>{money(plan.outstanding)}</span>
                            <span>{money(plan.monthlyEmi)}</span>
                            <span>{plan.roi ? `${plan.roi}% ROI` : plan.apr ? `${plan.apr}% APR` : "-"}</span>
                            <span>{Number(plan.totalEmis) > 0 ? `${Number(plan.completedEmis || 0)}/${Number(plan.totalEmis)}` : "-"}</span>
                          </div>
                        )) : (
                          <div className="border-t border-slate-100 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">No credit card EMI plans recorded.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm max-lg:grid-cols-2">
                        <span>Principal {money(loan.principal)}</span>
                        <span>Outstanding {money(loan.outstanding)}</span>
                        <span>EMI {money(loan.emi)}</span>
                        <span>Tenure {tenureMonths ? `${tenureMonths} months` : "Not set"}</span>
                        <span>Periods {tenureMonths ? `${completedPeriods}/${tenureMonths} paid` : "Not set"}</span>
                        <span>Remaining {remainingPeriods !== null ? `${remainingPeriods} months` : "Not set"}</span>
                        <span>After current EMI {money(status.projectedOutstanding)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusColor}`}>
                          {status.tone === "emerald" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          {status.label}
                        </span>
                        {status.payment && <span className="text-sm text-slate-500 dark:text-slate-400">Due {status.payment.dueDate} · Paid {status.payment.paidDate || "not paid"} · {money(status.payment.amount)}</span>}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700" title="Upload CSV with dueDate, amount, paidDate columns">
                          <Upload size={16} /> Upload schedule
                          <input type="file" accept=".csv,text/csv,text/plain" className="hidden" aria-label={`Upload repayment schedule for ${loan.lender}`} onChange={(event) => uploadSchedule(event, loan.id)} />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

      </div>

      <Panel title="Income Impact">
        <p className="text-sm text-slate-500 dark:text-slate-400">Monthly income</p>
        <p className="text-3xl font-semibold">{money(salary)}</p>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Total EMI at month start</p>
        <p className="text-3xl font-semibold text-rose-600">{money(impact.emi)}</p>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Bills and commitments</p>
        <p className="text-3xl font-semibold text-amber-600">{money(impact.recurring)}</p>
        <div className="mt-5 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Committed income ratio</span>
            <span className="font-semibold">{impact.ratio}%</span>
          </div>
          <div className="h-2 rounded-full bg-white dark:bg-slate-950"><div className={`h-2 rounded-full ${impact.ratio > 60 ? "bg-rose-500" : impact.ratio > 40 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, impact.ratio)}%` }} /></div>
        </div>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Available after EMI and commitments</p>
        <p className={`text-3xl font-semibold ${impact.available < 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(impact.available)}</p>
      </Panel>
    </div>
  );
}

function AIChat({ chats, setChats, chatInput, setChatInput, sendChat, addChatExpense, aiDraftExpense, theme }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const activeMessages = chats[0].messages.map((message) => typeof message === "string" ? { role: "assistant", content: message } : message);

  async function submitChat() {
    const message = chatInput;
    const file = selectedFile;
    if (!message.trim() && !file) return;

    setIsSending(true);
    setChatInput("");
    setSelectedFile(null);
    try {
      await sendChat({ message, file });
    } catch (error) {
      setChatInput(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-5 max-lg:grid-cols-1">
      <Panel title="History">
        <div className="space-y-2">
          {chats.map((chat) => (
            <button key={chat.id} className="flex w-full items-center justify-between rounded-lg bg-slate-100 p-3 text-left text-sm dark:bg-slate-800">
              <span>{chat.title}</span>{chat.pinned && <Pin size={15} />}
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Receipt Assistant" action={<button onClick={() => setChats((items) => items.map((chat, index) => index === 0 ? { ...chat, pinned: !chat.pinned } : chat))} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" title="Pin chat"><Pin size={17} /></button>}>
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <Upload size={20} /><span className="text-sm text-slate-500">{selectedFile ? `Ready to analyze ${selectedFile.name}` : "Upload receipt or invoice, then ask what to extract."}</span>
        </div>
        <div className="h-[360px] space-y-3 overflow-y-auto rounded-lg bg-slate-100 p-4 dark:bg-slate-950">
          {activeMessages.map((message, index) => (
            <div key={index} className={`max-w-[75%] rounded-lg p-3 text-sm ${message.role === "user" ? `ml-auto ${theme.button} text-white` : "bg-white dark:bg-slate-800"}`}>
              {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : message.content}
            </div>
          ))}
        </div>
        {aiDraftExpense && (
          <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${theme.soft}`}>
            Draft expense: {aiDraftExpense.merchant} · {money(aiDraftExpense.amount)} · {aiDraftExpense.category}
          </div>
        )}
        <div className="mt-4 flex gap-2 max-md:flex-wrap">
          <label className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" title="Attach file">
            <Paperclip size={18} />
            <input type="file" aria-label="Attach file" className="hidden" accept="image/*,.pdf,.txt" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          </label>
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !isSending && submitChat()} className="input flex-1" placeholder="Ask about a receipt or your spending" />
          <button onClick={submitChat} disabled={isSending} className={`rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60 ${theme.button}`}>{isSending ? "Thinking" : "Send"}</button>
          <button onClick={addChatExpense} disabled={!aiDraftExpense} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm disabled:opacity-50 dark:border-slate-700"><FileUp size={16} /> Add Expense</button>
        </div>
      </Panel>
    </div>
  );
}

function MarkdownMessage({ content }) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  function flushList() {
    if (listItems.length) {
      blocks.push(<ul key={`list-${blocks.length}`} className="ml-4 list-disc space-y-1">{listItems}</ul>);
      listItems = [];
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushList();
      blocks.push(<p key={`heading-${index}`} className="font-semibold">{renderInlineMarkdown(heading[1])}</p>);
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(<li key={`item-${index}`}>{renderInlineMarkdown(bullet[1])}</li>);
      return;
    }

    flushList();
    blocks.push(<p key={`p-${index}`}>{renderInlineMarkdown(trimmed)}</p>);
  });
  flushList();

  return <div className="space-y-2 leading-relaxed">{blocks}</div>;
}

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700">{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function GraphBuilder({ data, transactions, theme }) {
  const [chart, setChart] = useState("Pie");
  const monthly = transactions.map((t) => ({ name: t.merchant.slice(0, 10), amount: t.amount }));
  return (
    <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:grid-cols-1">
      <Panel title="Builder">
        <label className="label">Chart type</label>
        <select value={chart} onChange={(event) => setChart(event.target.value)} className="input mb-4"><option>Pie</option><option>Bar</option><option>Line</option></select>
        <label className="label">Dataset</label>
        <select className="input mb-4"><option>Category leakage</option><option>Transaction amounts</option><option>Income vs expense</option></select>
        <button className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${theme.button}`}><BarChart3 size={16} /> Build Graph</button>
      </Panel>
      <Panel title="Custom Insight">
        <ResponsiveContainer width="100%" height={430}>
          {chart === "Pie" ? (
            <PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={140} label>{data.map((_, index) => <Cell key={index} fill={["#14b8a6", "#0ea5e9", "#f43f5e", "#f59e0b", "#8b5cf6"][index % 5]} />)}</Pie><Tooltip /></PieChart>
          ) : chart === "Bar" ? (
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#14b8a6" /></BarChart>
          ) : (
            <LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="amount" stroke="#14b8a6" strokeWidth={3} /></LineChart>
          )}
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

const emptyIncomeSourceForm = {
  name: "",
  amount: "",
  type: "Salary",
};

function ProfileSettings({ user, dark, setDark, theme, setTheme, salary, incomeSources, onAddIncomeSource, onDeleteIncomeSource, commitments, onAddCommitment, onUpdateCommitment, onDeleteCommitment, onLogCommitment, profileImage, setProfileImage }) {
  const selectedTheme = themeStyles[theme];
  const [incomeForm, setIncomeForm] = useState(emptyIncomeSourceForm);
  const [commitmentForm, setCommitmentForm] = useState(emptyCommitmentForm);
  const [editingCommitmentId, setEditingCommitmentId] = useState(null);
  const incomeSourcesTotal = incomeSources.reduce((sum, item) => sum + item.amount, 0);
  const commitmentsTotal = commitments.reduce((sum, item) => sum + item.amount, 0);
  const salaryIncomeTotal = incomeSources.filter((item) => item.type === "Salary").reduce((sum, item) => sum + item.amount, 0);
  const fixedSalaryTotal = salary + salaryIncomeTotal;
  const monthlyIncomeTotal = salary + incomeSourcesTotal;
  const incomeAfterCommitments = monthlyIncomeTotal - commitmentsTotal;

  function updateIncomeField(event) {
    setIncomeForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitIncomeSource(event) {
    event.preventDefault();
    const source = {
      name: incomeForm.name.trim(),
      amount: Number(incomeForm.amount),
      type: incomeForm.type,
    };
    if (!source.name || !source.amount) {
      return;
    }
    onAddIncomeSource(source);
    setIncomeForm(emptyIncomeSourceForm);
  }

  function updateCommitmentField(event) {
    setCommitmentForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitCommitment(event) {
    event.preventDefault();
    const commitment = {
      name: commitmentForm.name.trim(),
      amount: Number(commitmentForm.amount),
      dueDay: Number(commitmentForm.dueDay),
      category: commitmentForm.category.trim() || "Bills",
    };
    if (!commitment.name || !commitment.amount || !commitment.dueDay) return;
    if (editingCommitmentId) {
      onUpdateCommitment(editingCommitmentId, commitment);
    } else {
      onAddCommitment(commitment);
    }
    setCommitmentForm(emptyCommitmentForm);
    setEditingCommitmentId(null);
  }

  function editCommitment(commitment) {
    setEditingCommitmentId(commitment.id);
    setCommitmentForm({
      name: commitment.name,
      amount: String(commitment.amount),
      dueDay: String(commitment.dueDay),
      category: commitment.category,
    });
  }

  function cancelCommitmentEdit() {
    setEditingCommitmentId(null);
    setCommitmentForm(emptyCommitmentForm);
  }

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1">
      <Panel title="Profile">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <div><label className="label">Name</label><input className="input w-full" value={user?.name || ""} readOnly /></div>
          <div><label className="label">Email</label><input className="input w-full" value={user?.email || ""} readOnly /></div>
          <div>
            <label className="label">Fixed salary</label>
            <div className="flex min-h-[42px] items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold dark:bg-slate-800">{money(fixedSalaryTotal)}</div>
          </div>
          <div>
            <label className="label">Monthly income total</label>
            <div className="flex min-h-[42px] items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold dark:bg-slate-800">{money(monthlyIncomeTotal)}</div>
          </div>
          <div>
            <label className="label">Monthly commitment deductions</label>
            <div className="flex min-h-[42px] items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-amber-600 dark:bg-slate-800">{money(commitmentsTotal)}</div>
          </div>
          <div>
            <label className="label">Income after commitments</label>
            <div className={`flex min-h-[42px] items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold dark:bg-slate-800 ${incomeAfterCommitments < 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(incomeAfterCommitments)}</div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">{profileImage ? <img src={profileImage} className="h-full w-full object-cover" /> : <UserRound size={32} />}</div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
            <Upload size={16} /> Upload profile pic
            <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && setProfileImage(URL.createObjectURL(event.target.files[0]))} />
          </label>
        </div>
      </Panel>
      <Panel title="Additional Income Sources">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Use this for income beyond fixed salary, such as freelance, rental, business, or investment income.</p>
        <form onSubmit={submitIncomeSource} className="space-y-3">
          <div>
            <label className="label">Source name</label>
            <input name="name" value={incomeForm.name} onChange={updateIncomeField} className="input w-full" placeholder="Freelance, rental income, dividends" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select name="type" value={incomeForm.type} onChange={updateIncomeField} className="input w-full">
                <option>Salary</option>
                <option>Freelance</option>
                <option>Business</option>
                <option>Rental</option>
                <option>Investment</option>
                <option>Other Income</option>
              </select>
            </div>
            <div>
              <label className="label">Monthly amount</label>
              <input name="amount" value={incomeForm.amount} onChange={updateIncomeField} type="number" min="0" step="0.01" className="input w-full" placeholder="Amount" required />
            </div>
          </div>
          <button className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${selectedTheme.button}`}>
            <Plus size={16} /> Add income source
          </button>
        </form>
        <div className="mt-5 space-y-2">
          {incomeSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
              <div>
                <p className="font-medium">{source.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{source.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{money(source.amount)}</span>
                <button onClick={() => onDeleteIncomeSource(source.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 dark:border-slate-700" aria-label={`Delete ${source.name}`} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!incomeSources.length && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">No additional income sources added.</p>}
        </div>
      </Panel>
      <Panel title="Monthly Commitments">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Use this for recurring salary deductions that are not loans. You can log a monthly entry into transactions as excluded to keep it visible without double-counting totals.</p>
        <form onSubmit={submitCommitment} className="space-y-3">
          <div>
            <label className="label">Commitment name</label>
            <input name="name" value={commitmentForm.name} onChange={updateCommitmentField} className="input w-full" placeholder="Rent, insurance, SIP" required />
          </div>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <div>
              <label className="label">Commitment amount</label>
              <input name="amount" value={commitmentForm.amount} onChange={updateCommitmentField} type="number" min="0" step="0.01" className="input w-full" placeholder="Commitment amount" required />
            </div>
            <div>
              <label className="label">Due day</label>
              <input name="dueDay" value={commitmentForm.dueDay} onChange={updateCommitmentField} type="number" min="1" max="31" className="input w-full" placeholder="Day" required />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" value={commitmentForm.category} onChange={updateCommitmentField} className="input w-full" placeholder="Bills" />
            </div>
          </div>
          <div className="flex gap-2">
            {editingCommitmentId && <button type="button" onClick={cancelCommitmentEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button>}
            <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${selectedTheme.button}`}>
              {editingCommitmentId ? <Save size={16} /> : <Plus size={16} />} {editingCommitmentId ? "Save commitment" : "Add commitment"}
            </button>
          </div>
        </form>
        <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {commitments.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_120px_90px_132px] items-center gap-3 p-3 text-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{item.category}</p>
              </div>
              <span>{money(item.amount)}</span>
              <span>Day {item.dueDay}</span>
              <div className="flex gap-2">
                <button onClick={() => onLogCommitment(item)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Log ${item.name}`} title="Log this month">
                  <Table2 size={16} />
                </button>
                <button onClick={() => editCommitment(item)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Edit ${item.name}`} title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => onDeleteCommitment(item.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 dark:border-slate-700" aria-label={`Delete ${item.name}`} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!commitments.length && <p className="p-3 text-sm text-slate-500 dark:text-slate-400">No monthly commitments added.</p>}
        </div>
      </Panel>
      <Panel title="Appearance">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
          <span>Dark mode</span>
          <button onClick={() => setDark(!dark)} className={`h-7 w-12 rounded-full p-1 ${dark ? selectedTheme.button : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${dark ? "translate-x-5" : ""}`} /></button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(themeStyles).map((item) => <button key={item} onClick={() => setTheme(item)} className={`h-9 rounded-lg bg-gradient-to-br ${themeStyles[item].gradient} ${theme === item ? `ring-2 ${themeStyles[item].ring}` : ""}`} aria-label={`${item} theme`} title={`${item} theme`} />)}
        </div>
      </Panel>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
