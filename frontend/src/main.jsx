import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CreditCard,
  Download,
  Pencil,
  FileUp,
  Landmark,
  LayoutDashboard,
  Moon,
  Paperclip,
  Pin,
  Plus,
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
  Area,
  AreaChart,
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
  { id: 1, lender: "Home Loan", principal: 240000, outstanding: 214500, emi: 1850, dueDay: 1, rate: 6.4 },
  { id: 2, lender: "Car Loan", principal: 28000, outstanding: 16400, emi: 540, dueDay: 3, rate: 7.1 },
  { id: 3, lender: "Education Loan", principal: 42000, outstanding: 17800, emi: 620, dueDay: 5, rate: 5.8 },
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

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function daysBetween(start, end) {
  return Math.floor((parseDate(end) - parseDate(start)) / 86400000);
}

export function getTransactionsForView(transactions, view, anchorDate = referenceDate) {
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

export function normalizeTransactionForm(formData) {
  const next = Object.fromEntries(formData.entries());
  return {
    kind: next.kind,
    category: next.category.trim(),
    group: next.group.trim(),
    merchant: next.merchant.trim(),
    amount: Number(next.amount),
    date: next.date,
    source: next.source,
  };
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

export function App() {
  const [active, setActive] = useState("Dashboard");
  const [dark, setDark] = useState(false);
  const [theme, setTheme] = useState("emerald");
  const [transactions, setTransactions] = useState(transactionsSeed);
  const [loans] = useState(loansSeed);
  const [view, setView] = useState("Monthly");
  const [salary, setSalary] = useState(7200);
  const [profileImage, setProfileImage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState([
    { id: 1, title: "June grocery receipt", pinned: true, messages: [{ role: "assistant", content: "Upload a receipt or ask a spending question. I will use local Ollama/Qwen through the FastAPI backend." }] },
    { id: 2, title: "LA trip invoices", pinned: false, messages: [{ role: "assistant", content: "Grouped hotel and meal expenses under Los Angeles Trip." }] },
  ]);
  const [aiDraftExpense, setAiDraftExpense] = useState(null);
  const currentTheme = themeStyles[theme];

  const metrics = useMemo(() => {
    const expense = transactions.filter((t) => t.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
    const income = transactions.filter((t) => t.kind === "income").reduce((sum, item) => sum + item.amount, 0) + salary;
    const emi = loans.reduce((sum, item) => sum + item.emi, 0);
    const categoryTotals = transactions.filter((t) => t.kind === "expense").reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
    return {
      expense,
      income,
      emi,
      net: income - expense - emi,
      categoryData: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
    };
  }, [transactions, loans, salary]);

  function addTransaction(transaction) {
    setTransactions((items) => [
      { id: Date.now(), ...transaction },
      ...items,
    ]);
  }

  function updateTransaction(transactionId, transaction) {
    setTransactions((items) => items.map((item) => (item.id === transactionId ? { ...item, ...transaction } : item)));
  }

  function deleteTransaction(transactionId) {
    setTransactions((items) => items.filter((item) => item.id !== transactionId));
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
          <Topbar dark={dark} setDark={setDark} active={active} setActive={setActive} />
          <div className="p-6 max-sm:p-4">
            {active === "Dashboard" && <Dashboard metrics={metrics} transactions={transactions} loans={loans} theme={currentTheme} />}
            {active === "Transaction Log" && <TransactionLog transactions={transactions} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} view={view} setView={setView} theme={currentTheme} />}
            {active === "Calendar" && <CalendarView transactions={transactions} theme={currentTheme} />}
            {active === "Loans" && <Loans loans={loans} metrics={metrics} salary={salary} />}
            {active === "AI Chat" && <AIChat chats={chats} setChats={setChats} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} addChatExpense={addChatExpense} aiDraftExpense={aiDraftExpense} theme={currentTheme} />}
            {active === "Graph Builder" && <GraphBuilder data={metrics.categoryData} transactions={transactions} theme={currentTheme} />}
            {active === "Profile Settings" && <ProfileSettings dark={dark} setDark={setDark} theme={theme} setTheme={setTheme} salary={salary} setSalary={setSalary} profileImage={profileImage} setProfileImage={setProfileImage} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function Topbar({ active, dark, setDark, setActive }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 max-sm:px-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hello, Shiv</p>
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
  const trend = [
    { month: "Feb", expense: 2200, income: 6900 },
    { month: "Mar", expense: 2480, income: 7100 },
    { month: "Apr", expense: 3010, income: 7200 },
    { month: "May", expense: 2760, income: 7200 },
    { month: "Jun", expense: metrics.expense, income: metrics.income },
  ];
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
          <div data-testid="monthly-comparison-chart" data-chart-color={theme.chart} data-chart-alt-color={theme.chartAlt}>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="monthly-comparison-income" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.chart} stopOpacity={0.3} /><stop offset="95%" stopColor={theme.chart} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area dataKey="income" stroke={theme.chart} fill="url(#monthly-comparison-income)" />
                <Line dataKey="expense" stroke={theme.chartAlt} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Money Leakage">
          <div className="space-y-4">
            {metrics.categoryData.slice(0, 5).map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span>{money(item.value)}</span></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className={`h-2 rounded-full ${theme.bar}`} style={{ width: `${Math.min(100, item.value / 18)}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        <Panel title="Expense Groups">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            {transactions.filter((t) => t.group).map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-100 p-4 last:border-0 dark:border-slate-800">
                <span>{t.group}</span><span className="font-semibold">{money(t.amount)}</span>
              </div>
            ))}
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
  category: "",
  group: "",
  source: "Credit Card",
  amount: "",
  date: "2026-06-13",
};

function TransactionLog({ transactions, onAdd, onUpdate, onDelete, view, setView, theme }) {
  const [form, setForm] = useState(emptyTransactionForm);
  const [editingId, setEditingId] = useState(null);
  const visibleTransactions = getTransactionsForView(transactions, view);
  const visibleExpenseTotal = visibleTransactions.filter((transaction) => transaction.kind === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitTransaction(event) {
    event.preventDefault();
    const transaction = normalizeTransactionForm(new FormData(event.currentTarget));
    if (!transaction.merchant || !transaction.category || !transaction.amount || !transaction.date) {
      return;
    }

    if (editingId) {
      onUpdate(editingId, transaction);
    } else {
      onAdd(transaction);
    }
    setEditingId(null);
    setForm(emptyTransactionForm);
  }

  function editTransaction(transaction) {
    setEditingId(transaction.id);
    setForm({
      kind: transaction.kind,
      merchant: transaction.merchant,
      category: transaction.category,
      group: transaction.group || "",
      source: transaction.source,
      amount: String(transaction.amount),
      date: transaction.date,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyTransactionForm);
  }

  return (
    <div className="space-y-5">
      <Panel
        title={editingId ? "Edit Transaction" : "Add Transaction"}
        action={
          <div className="flex gap-2">
            {editingId && <button onClick={cancelEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">Cancel</button>}
            <button type="submit" form="transaction-form" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${theme.button}`}>
              <Plus size={16} /> {editingId ? "Save" : "Add New"}
            </button>
          </div>
        }
      >
        <form id="transaction-form" onSubmit={submitTransaction} className="grid grid-cols-7 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
          <select name="kind" value={form.kind} onChange={updateField} className="input"><option>expense</option><option>income</option></select>
          <input name="merchant" value={form.merchant} onChange={updateField} className="input" placeholder="Merchant" required />
          <input name="category" value={form.category} onChange={updateField} className="input" placeholder="Category" required />
          <input name="group" value={form.group} onChange={updateField} className="input" placeholder="Group, e.g. LA trip" />
          <select name="source" value={form.source} onChange={updateField} className="input"><option>Salary</option><option>Credit Card</option><option>Debit Card</option><option>Other Income</option></select>
          <input name="amount" value={form.amount} onChange={updateField} type="number" min="0" step="0.01" className="input" placeholder="Amount" required />
          <input name="date" value={form.date} onChange={updateField} type="date" className="input" required />
        </form>
      </Panel>
      <Panel title="All Transactions" action={<div className="flex gap-2">{["Daily", "Weekly", "Fortnight", "Monthly"].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-sm ${view === item ? `${theme.button} text-white` : "bg-slate-100 dark:bg-slate-800"}`}>{item}</button>)}</div>}>
        <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {visibleTransactions.length} transaction{visibleTransactions.length === 1 ? "" : "s"} for {view.toLowerCase()} view. Expenses total {money(visibleExpenseTotal)}.
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"><Download size={16} /> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr><th className="p-3">Type</th><th>Merchant</th><th>Category</th><th>Group</th><th>Source</th><th>Date</th><th className="text-right pr-4">Amount</th><th className="text-right pr-4">Actions</th></tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${t.kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.kind}</span></td>
                  <td>{t.merchant}</td><td>{t.category}</td><td>{t.group || "General"}</td><td>{t.source}</td><td>{t.date}</td>
                  <td className="pr-4 text-right font-semibold">{money(t.amount)}</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editTransaction(t)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-700" aria-label={`Edit ${t.merchant}`} title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-rose-600 dark:border-slate-700" aria-label={`Delete ${t.merchant}`} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleTransactions.length && (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500 dark:text-slate-400">No transactions in this period.</td>
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
  const monthDate = parseDate(referenceDate);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const cells = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const expenseByDate = transactions
    .filter((transaction) => transaction.kind === "expense" && parseDate(transaction.date).getMonth() === month && parseDate(transaction.date).getFullYear() === year)
    .reduce((acc, transaction) => {
      acc[transaction.date] ||= [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});

  return (
    <Panel
      title="Expense Calendar"
      action={<span className={`rounded-lg px-3 py-2 text-sm ${theme.soft}`}>June 2026</span>}
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
            const dayTransactions = expenseByDate[dateKey] || [];
            const total = dayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
            const categoryTotals = dayTransactions.reduce((acc, transaction) => {
              acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
              return acc;
            }, {});
            const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

            return (
              <div key={cell.key} className="min-h-32 border-b border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                {cell.day && (
                  <div className="flex h-full flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm font-semibold ${dateKey === referenceDate ? `${theme.button} text-white` : "bg-slate-100 dark:bg-slate-800"}`}>{cell.day}</span>
                      {total > 0 && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{money(total)}</span>}
                    </div>
                    {highestCategory && (
                      <div className={`rounded-lg px-2 py-1 text-xs font-medium ${theme.soft}`}>
                        High: {highestCategory[0]} {money(highestCategory[1])}
                      </div>
                    )}
                    <div className="space-y-1">
                      {dayTransactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className="truncate rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800" title={`${transaction.category}: ${transaction.merchant}`}>
                          {transaction.category} · {money(transaction.amount)}
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

function Loans({ loans, metrics, salary }) {
  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 max-xl:grid-cols-1">
      <Panel title="Loan Accounts">
        <div className="space-y-3">
          {loans.map((loan) => (
            <div key={loan.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{loan.lender}</h3><span>{loan.rate}%</span></div>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-sky-500" style={{ width: `${100 - (loan.outstanding / loan.principal) * 100}%` }} /></div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm"><span>Outstanding {money(loan.outstanding)}</span><span>EMI {money(loan.emi)}</span><span>Due day {loan.dueDay}</span></div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Monthly Deduction">
        <p className="text-sm text-slate-500 dark:text-slate-400">Fixed salary</p>
        <p className="text-3xl font-semibold">{money(salary)}</p>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Total EMI at month start</p>
        <p className="text-3xl font-semibold text-rose-600">{money(metrics.emi)}</p>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Available after EMI</p>
        <p className="text-3xl font-semibold text-emerald-600">{money(salary - metrics.emi)}</p>
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

function ProfileSettings({ dark, setDark, theme, setTheme, salary, setSalary, profileImage, setProfileImage }) {
  const selectedTheme = themeStyles[theme];
  return (
    <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1">
      <Panel title="Profile">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <div><label className="label">Name</label><input className="input" defaultValue="Shiv" /></div>
          <div><label className="label">Email</label><input className="input" defaultValue="shiv@example.com" /></div>
          <div><label className="label">Fixed salary</label><input className="input" type="number" value={salary} onChange={(event) => setSalary(Number(event.target.value))} /></div>
          <div><label className="label">Income source</label><select className="input"><option>Salary</option><option>Credit Card</option><option>Other Income</option></select></div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">{profileImage ? <img src={profileImage} className="h-full w-full object-cover" /> : <UserRound size={32} />}</div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
            <Upload size={16} /> Upload profile pic
            <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && setProfileImage(URL.createObjectURL(event.target.files[0]))} />
          </label>
        </div>
      </Panel>
      <Panel title="Appearance">
        <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
          <span>Dark mode</span>
          <button onClick={() => setDark(!dark)} className={`h-7 w-12 rounded-full p-1 ${dark ? selectedTheme.button : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${dark ? "translate-x-5" : ""}`} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(themeStyles).map((item) => <button key={item} onClick={() => setTheme(item)} className={`h-16 rounded-lg bg-gradient-to-br ${themeStyles[item].gradient} ${theme === item ? `ring-4 ${themeStyles[item].ring}` : ""}`} aria-label={`${item} theme`} />)}
        </div>
      </Panel>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
