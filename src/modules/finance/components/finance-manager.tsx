"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  PiggyBank,
  Smartphone,
  TrendingUp,
  BarChart3,
  PieChart,
  Receipt,
  Tag,
} from "lucide-react";
import {
  createAccountAction,
  createTransactionAction,
  createSavingsGoalAction,
  deleteTransactionAction,
} from "../actions/finance.actions";
import { WhatsAppSyncCard } from "./whatsapp-sync-card";
import { UserWhatsappConnection } from "@/lib/db/schema";
import { DonutChart, DonutSegment } from "@/components/ui/donut-chart";
import { FinanceSummary } from "../queries/finance.queries";

interface AccountItem {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  currentBalance: number;
}

interface CategoryItem {
  id: string;
  name: string;
  type: string;
}

interface TransactionItem {
  id: string;
  amount: string;
  type: string;
  description: string | null;
  transactionDate: Date;
  accountId: string;
  accountName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  source?: string | null;
  receiptUrl?: string | null;
  rawMessage?: string | null;
}

interface SavingsItem {
  id: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date | null;
}

export function FinanceManager({
  accounts,
  categories,
  transactions,
  savings,
  summary,
  whatsappConnection,
}: {
  accounts: AccountItem[];
  categories: CategoryItem[];
  transactions: TransactionItem[];
  savings: SavingsItem[];
  summary: FinanceSummary;
  whatsappConnection: UserWhatsappConnection | null;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "savings" | "whatsapp">("overview");
  const [periodView, setPeriodView] = useState<"daily" | "monthly" | "all_time">("monthly");
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isAddingSavings, setIsAddingSavings] = useState(false);

  // New Transaction State
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txAccountId, setTxAccountId] = useState(accounts[0]?.id || "");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txDescription, setTxDescription] = useState("");

  // New Account State
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"bank" | "cash" | "ewallet" | "other">("bank");
  const [openingBalance, setOpeningBalance] = useState("0");

  // New Savings State
  const [savingsTitle, setSavingsTitle] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txAccountId) return;

    startTransition(async () => {
      await createTransactionAction({
        accountId: txAccountId,
        categoryId: txCategoryId || null,
        type: txType,
        amount: txAmount,
        description: txDescription.trim() || undefined,
      });
      setTxAmount("");
      setTxDescription("");
      setIsAddingTx(false);
    });
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    startTransition(async () => {
      await createAccountAction({
        name: accountName.trim(),
        accountType,
        openingBalance: openingBalance || "0",
      });
      setAccountName("");
      setOpeningBalance("0");
      setIsAddingAccount(false);
    });
  };

  const handleCreateSavings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingsTitle.trim() || !savingsTarget) return;

    startTransition(async () => {
      await createSavingsGoalAction({
        title: savingsTitle.trim(),
        targetAmount: savingsTarget,
        currentAmount: "0",
      });
      setSavingsTitle("");
      setSavingsTarget("");
      setIsAddingSavings(false);
    });
  };

  const handleDeleteTx = (id: string) => {
    startTransition(async () => {
      await deleteTransactionAction(id);
    });
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  let incomeTitle = "Pemasukan Bulan Ini";
  let incomeSub = "Cashflow bulan berjalan";
  let incomeValue = summary.monthlyIncome || 0;

  let expenseTitle = "Pengeluaran Bulan Ini";
  let expenseSub = "Total belanja bulan ini";
  let expenseValue = summary.monthlyExpense || 0;

  if (periodView === "daily") {
    incomeTitle = "Pemasukan Hari Ini";
    incomeSub = "Cashflow masuk hari ini";
    incomeValue = summary.todayIncome || 0;

    expenseTitle = "Pengeluaran Hari Ini";
    expenseSub = "Total belanja & tagihan hari ini";
    expenseValue = summary.todayExpense || 0;
  } else if (periodView === "all_time") {
    incomeTitle = "Total Seluruh Pemasukan";
    incomeSub = "Akumulasi seluruh waktu";
    incomeValue = summary.allTimeIncome || 0;

    expenseTitle = "Total Seluruh Pengeluaran";
    expenseSub = "Akumulasi seluruh waktu";
    expenseValue = summary.allTimeExpense || 0;
  }

  const displayedTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.transactionDate);
    if (periodView === "daily") {
      return txDate >= startOfToday;
    }
    if (periodView === "monthly") {
      return txDate >= startOfMonth;
    }
    return true; // all_time
  });

  const [financeChartMode, setFinanceChartMode] = useState<"category" | "cashflow" | "accounts">("category");

  const accountSegments: DonutSegment[] = accounts
    .filter((a) => a.currentBalance > 0)
    .map((acc, idx) => ({
      name: acc.name,
      value: acc.currentBalance,
      color: [
        "var(--domain-finance)",
        "var(--domain-work)",
        "var(--domain-learning)",
        "var(--domain-goals)",
        "var(--domain-life)",
        "var(--domain-knowledge)",
      ][idx % 6],
      formattedValue: formatIDR(acc.currentBalance),
    }));

  const categorySegments: DonutSegment[] = (summary.topExpenseCategories || [])
    .slice(0, 6)
    .filter((cat) => cat.amount > 0)
    .map((cat, idx) => ({
      name: cat.name,
      value: cat.amount,
      color: [
        "var(--danger)",
        "var(--domain-work)",
        "var(--domain-learning)",
        "var(--domain-goals)",
        "var(--domain-life)",
        "var(--domain-knowledge)",
      ][idx % 6],
      formattedValue: formatIDR(cat.amount),
    }));

  const cashflowSegments: DonutSegment[] = [
    {
      name: "Pengeluaran",
      value: expenseValue > 0 ? expenseValue : 1,
      color: "var(--danger)",
      formattedValue: formatIDR(expenseValue),
    },
    {
      name: "Tabungan Bersih",
      value: Math.max(1, incomeValue - expenseValue),
      color: "var(--success)",
      formattedValue: formatIDR(Math.max(0, incomeValue - expenseValue)),
    },
  ];

  const activeDonutSegments =
    financeChartMode === "category"
      ? categorySegments.length > 0
        ? categorySegments
        : [{ name: "Belanja", value: expenseValue || 1, color: "var(--danger)", formattedValue: formatIDR(expenseValue) }]
      : financeChartMode === "cashflow"
      ? cashflowSegments
      : accountSegments.length > 0
      ? accountSegments
      : [{ name: "Saldo", value: summary.totalBalance || 1, color: "var(--domain-finance)", formattedValue: formatIDR(summary.totalBalance) }];

  const activeCenterLabel =
    financeChartMode === "category"
      ? formatIDR(expenseValue).replace(/(\.00|,00)$/, "")
      : financeChartMode === "cashflow"
      ? `${summary.monthlySavingsRate || 0}%`
      : formatIDR(summary.totalBalance).replace(/(\.00|,00)$/, "");

  const activeCenterSublabel =
    financeChartMode === "category"
      ? "Total Belanja"
      : financeChartMode === "cashflow"
      ? "Rasio Tabungan"
      : "Total Saldo";

  return (
    <div className="space-y-6 select-none">
      {/* Period View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-0.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-nowrap">
          {(["daily", "monthly", "all_time"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setPeriodView(view)}
              className={`h-7 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                periodView === view
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {view === "daily" ? "Harian" : view === "monthly" ? "Bulanan" : "Semua Waktu"}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[var(--foreground-muted)]">
          {periodView === "daily" && (
            <span>
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(now)}
            </span>
          )}
          {periodView === "monthly" && (
            <span>
              {new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(now)}
            </span>
          )}
          {periodView === "all_time" && <span>Semua transaksi tercatat</span>}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="text-xs text-[var(--foreground-muted)]">Total Saldo Bersih</div>
          <div className={`text-xl font-medium tracking-tight mt-2 tabular-nums ${summary.totalBalance < 0 ? "text-[var(--danger)]" : "text-[var(--foreground)]"}`}>
            {formatIDR(summary.totalBalance)}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] mt-1 truncate">
            Dari {accounts.length} akun terdaftar
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="truncate">{incomeTitle}</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" />
          </div>
          <div className="text-xl font-medium tracking-tight text-[var(--success)] mt-2 tabular-nums">
            {formatIDR(incomeValue)}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] mt-1 truncate">{incomeSub}</div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="truncate">{expenseTitle}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--danger)] flex-shrink-0" />
          </div>
          <div className="text-xl font-medium tracking-tight text-[var(--foreground)] mt-2 tabular-nums">
            {formatIDR(expenseValue)}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] mt-1 truncate">
            {summary.dailyAvgExpense ? `Rata-rata: ${formatIDR(summary.dailyAvgExpense)}/hari` : expenseSub}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="truncate">Arus Kas Bersih</span>
            <TrendingUp className={`w-3.5 h-3.5 flex-shrink-0 ${incomeValue - expenseValue >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`} />
          </div>
          <div className={`text-xl font-medium tracking-tight mt-2 tabular-nums ${incomeValue - expenseValue >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {incomeValue - expenseValue >= 0 ? "+" : ""}{formatIDR(incomeValue - expenseValue)}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] mt-1 truncate">
            {periodView === "monthly" && summary.monthlySavingsRate !== undefined
              ? `${summary.monthlySavingsRate}% rasio tabungan`
              : incomeValue - expenseValue >= 0
              ? "Surplus cashflow"
              : "Defisit cashflow"}
          </div>
        </div>
      </div>

      {/* Financial Health & Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Stat 1: Savings Goal Progress */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <PiggyBank className="w-3.5 h-3.5 text-amber-500" />
              Progres Dana Tabungan
            </span>
            <span className="font-mono text-[11px] font-medium text-[var(--foreground)]">
              {summary.savingsProgressRate || 0}%
            </span>
          </div>
          <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--foreground)] transition-all rounded-full"
              style={{ width: `${summary.savingsProgressRate || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)]">
            <span>{formatIDR(summary.totalSavingsCurrent || 0)} terkumpul</span>
            <span>Target: {formatIDR(summary.totalSavingsTarget || 0)}</span>
          </div>
        </div>

        {/* Stat 2: Daily Burn Rate */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              Kecepatan Belanja Harian
            </span>
            <span className="font-mono text-[10px] text-[var(--foreground-muted)]">Bulan Ini</span>
          </div>
          <div className="text-xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {formatIDR(summary.dailyAvgExpense || 0)}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">/ hari</span>
          </div>
          <p className="text-[11px] text-[var(--foreground-muted)]">
            Estimasi laju belanja harian untuk menjaga stabilitas anggaran
          </p>
        </div>

        {/* Stat 3: Transaction Volume & Active Accounts */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
              Volume Transaksi & Akun
            </span>
            <span className="font-mono text-[10px] text-[var(--foreground-muted)]">{accounts.length} Akun</span>
          </div>
          <div className="text-xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {summary.totalTransactionsCount || transactions.length}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">transaksi tercatat</span>
          </div>
          <p className="text-[11px] text-[var(--foreground-muted)]">
            Sinkronisasi otomatis melalui input manual, WhatsApp bot, & struk OCR
          </p>
        </div>
      </div>

      {/* Donut Chart & Cashflow Intelligence Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Donut Chart with View Mode Switcher */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
              <div>
                <h3 className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
                  {financeChartMode === "category"
                    ? "Distribusi Pengeluaran per Kategori"
                    : financeChartMode === "cashflow"
                    ? "Rasio Arus Kas (Masuk vs Keluar)"
                    : "Alokasi Saldo Akun & E-Wallet"}
                </h3>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  {financeChartMode === "category"
                    ? "Proporsi belanja berdasarkan pos kategori pengeluaran"
                    : financeChartMode === "cashflow"
                    ? "Perbandingan uang masuk terhadap pengeluaran & tabungan"
                    : "Sebaran likuiditas kekayaan di seluruh rekening"}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[10px] font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFinanceChartMode("category")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  financeChartMode === "category"
                    ? "bg-[var(--surface-card)] text-[var(--foreground)] font-semibold shadow-xs"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Kategori
              </button>
              <button
                type="button"
                onClick={() => setFinanceChartMode("cashflow")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  financeChartMode === "cashflow"
                    ? "bg-[var(--surface-card)] text-[var(--foreground)] font-semibold shadow-xs"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Arus Kas
              </button>
              <button
                type="button"
                onClick={() => setFinanceChartMode("accounts")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  financeChartMode === "accounts"
                    ? "bg-[var(--surface-card)] text-[var(--foreground)] font-semibold shadow-xs"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Akun
              </button>
            </div>
          </div>

          <div className="flex justify-center py-1">
            <DonutChart
              segments={activeDonutSegments}
              centerLabel={activeCenterLabel}
              centerSublabel={activeCenterSublabel}
              size={155}
              strokeWidth={16}
              showLegend={true}
              legendPosition="right"
            />
          </div>

          <div className="pt-2 border-t border-[var(--border)]/50 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--foreground-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              Masuk: {formatIDR(incomeValue)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
              Keluar: {formatIDR(expenseValue)}
            </span>
            <span className="text-[var(--foreground)] font-medium">
              Net: {incomeValue - expenseValue >= 0 ? "+" : ""}{formatIDR(incomeValue - expenseValue)}
            </span>
          </div>
        </div>

        {/* Right (5 cols): Cashflow & Expense Intelligence Metrics */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
              <h3 className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
                Intelijen Arus Kas & Belanja
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)]">
              {summary.totalTransactionsCount || 0} total transaksi
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--foreground-muted)] flex items-center justify-between">
                <span>Uang Masuk</span>
                <ArrowDownRight className="w-3 h-3 text-[var(--success)]" />
              </div>
              <div className="text-sm font-semibold text-[var(--success)] tabular-nums truncate">
                {formatIDR(incomeValue)}
              </div>
              <div className="text-[9px] font-mono text-[var(--foreground-muted)]">
                {summary.incomeCount || 0} kali transaksi
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--foreground-muted)] flex items-center justify-between">
                <span>Uang Keluar</span>
                <ArrowUpRight className="w-3 h-3 text-[var(--danger)]" />
              </div>
              <div className="text-sm font-semibold text-[var(--danger)] tabular-nums truncate">
                {formatIDR(expenseValue)}
              </div>
              <div className="text-[9px] font-mono text-[var(--foreground-muted)]">
                {summary.expenseCount || 0} kali transaksi
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--foreground-muted)]">
                Rata-rata / Belanja
              </div>
              <div className="text-sm font-semibold text-[var(--foreground)] tabular-nums truncate">
                {formatIDR(summary.avgExpensePerTx || 0)}
              </div>
              <div className="text-[9px] font-mono text-[var(--foreground-muted)]">
                Beban: {summary.expenseToIncomeRatio || 0}% pemasukan
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-1">
              <div className="text-[10px] text-[var(--foreground-muted)]">
                Pengeluaran Terbesar
              </div>
              <div className="text-sm font-semibold text-[var(--foreground)] tabular-nums truncate">
                {summary.largestExpense ? formatIDR(summary.largestExpense.amount) : "-"}
              </div>
              <div className="text-[9px] text-[var(--foreground-muted)] truncate font-mono">
                {summary.largestExpense ? summary.largestExpense.description : "Belum ada"}
              </div>
            </div>
          </div>

          {/* Top Categories Mini Progress List */}
          {summary.topExpenseCategories && summary.topExpenseCategories.length > 0 && (
            <div className="pt-2.5 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-amber-500" />
                  Top Kategori Pengeluaran
                </span>
                <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                  {summary.topExpenseCategories.length} kategori
                </span>
              </div>

              <div className="space-y-1.5">
                {summary.topExpenseCategories.slice(0, 3).map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--foreground)] truncate">{cat.name}</span>
                      <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                        {formatIDR(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--surface-raised)] h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--danger)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === "overview"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Daftar Akun
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{accounts.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === "transactions"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Riwayat Transaksi
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{displayedTransactions.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("savings")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === "savings"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Target Tabungan
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{savings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === "whatsapp"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp Sync</span>
            {whatsappConnection?.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {accounts.length > 0 && (
            <button
              onClick={() => setIsAddingTx(!isAddingTx)}
              className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Catat Transaksi</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingAccount(!isAddingAccount)}
            className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors cursor-pointer flex-1 sm:flex-none"
          >
            <Wallet className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {isAddingTx && (
        <form
          onSubmit={handleCreateTx}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h3 className="text-xs font-medium text-[var(--foreground)]">Catat Transaksi Keuangan</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTxType("expense")}
                className={`h-6 px-2 text-[11px] rounded ${
                  txType === "expense"
                    ? "bg-[var(--danger)] text-white font-medium"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setTxType("income")}
                className={`h-6 px-2 text-[11px] rounded ${
                  txType === "income"
                    ? "bg-[var(--success)] text-white font-medium"
                    : "text-[var(--foreground-muted)]"
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <input
              type="number"
              required
              autoFocus
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Nominal (Rp)..."
              className="h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
            />
            <select
              value={txAccountId}
              onChange={(e) => setTxAccountId(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountType})
                </option>
              ))}
            </select>
            <select
              value={txCategoryId}
              onChange={(e) => setTxCategoryId(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            >
              <option value="">Tanpa Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="Deskripsi transaksi..."
              className="h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingTx(false)}
              className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !txAmount || !txAccountId}
              className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      )}

      {/* Add Account Form */}
      {isAddingAccount && (
        <form
          onSubmit={handleCreateAccount}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <h3 className="text-xs font-medium text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
            Tambah Akun / Rekening Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              autoFocus
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nama akun (misal: BCA, Tunai, Gopay)..."
              className="h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            />
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "bank" | "cash" | "ewallet" | "other")}
              className="h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            >
              <option value="bank">Bank</option>
              <option value="cash">Tunai / Dompet</option>
              <option value="ewallet">E-Wallet</option>
              <option value="other">Lainnya</option>
            </select>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="Saldo awal (Rp)..."
              className="h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingAccount(false)}
              className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !accountName.trim()}
              className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
            >
              Simpan Akun
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Account Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accounts.length === 0 ? (
            <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
              Belum ada akun keuangan terdaftar. Tekan &quot;Tambah Akun&quot; untuk mulai mencatat saldo Anda.
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--foreground)]">{acc.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--surface-raised)] text-[var(--foreground-muted)] border border-[var(--border)]">
                    {acc.accountType}
                  </span>
                </div>
                <div className="text-lg font-medium tracking-tight text-[var(--foreground)] tabular-nums">
                  {formatIDR(acc.currentBalance)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Transactions List */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {displayedTransactions.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
              {periodView === "daily" && "Belum ada transaksi yang dicatat untuk hari ini."}
              {periodView === "monthly" && "Belum ada transaksi yang dicatat untuk bulan ini."}
              {periodView === "all_time" && "Belum ada riwayat transaksi yang dicatat."}
            </div>
          ) : (
            (() => {
              const groups: { dateLabel: string; items: TransactionItem[]; dayExpense: number; dayIncome: number }[] = [];
              const map = new Map<string, { dateLabel: string; items: TransactionItem[]; dayExpense: number; dayIncome: number }>();

              displayedTransactions.forEach((tx) => {
                const d = new Date(tx.transactionDate);
                const isInvalid = isNaN(d.getTime());
                const key = isInvalid ? "unknown" : d.toISOString().split("T")[0];

                let label = "Tanggal Lain";
                if (!isInvalid) {
                  const isToday = d.toDateString() === now.toDateString();
                  const yesterday = new Date(now);
                  yesterday.setDate(now.getDate() - 1);
                  const isYesterday = d.toDateString() === yesterday.toDateString();

                  const formatted = new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(d);

                  label = isToday ? `Hari ini · ${formatted}` : isYesterday ? `Kemarin · ${formatted}` : formatted;
                }

                let grp = map.get(key);
                if (!grp) {
                  grp = { dateLabel: label, items: [], dayExpense: 0, dayIncome: 0 };
                  map.set(key, grp);
                  groups.push(grp);
                }

                grp.items.push(tx);
                const amt = Number(tx.amount || 0);
                if (tx.type === "expense") grp.dayExpense += amt;
                else if (tx.type === "income") grp.dayIncome += amt;
              });

              return groups.map((grp, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-mono text-[var(--foreground-muted)]">
                    <span className="font-medium text-[var(--foreground-secondary)]">{grp.dateLabel}</span>
                    <span className="tabular-nums">
                      {grp.dayExpense > 0 && <span className="text-[var(--danger)]">-{formatIDR(grp.dayExpense)}</span>}
                      {grp.dayExpense > 0 && grp.dayIncome > 0 && <span className="mx-1.5 text-[var(--border)]">|</span>}
                      {grp.dayIncome > 0 && <span className="text-[var(--success)]">+{formatIDR(grp.dayIncome)}</span>}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {grp.items.map((tx) => {
                      const isIncome = tx.type === "income";

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] text-xs hover:border-[var(--border-active)] transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isIncome
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : "bg-[var(--danger)]/10 text-[var(--danger)]"
                              }`}
                            >
                              {isIncome ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-[var(--foreground)] truncate">
                                  {tx.description || (isIncome ? "Pemasukan" : "Pengeluaran")}
                                </p>
                                {tx.source === "whatsapp_text" && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[var(--surface-raised)] text-[var(--foreground-muted)] border border-[var(--border)] flex-shrink-0">
                                    WhatsApp
                                  </span>
                                )}
                                {tx.source === "whatsapp_receipt" && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-[var(--surface-raised)] text-[var(--foreground-muted)] border border-[var(--border)] flex-shrink-0">
                                    Struk OCR
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--foreground-muted)] mt-0.5 truncate">
                                <span>{tx.accountName}</span>
                                <span>·</span>
                                <span>
                                  {new Intl.DateTimeFormat("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(tx.transactionDate))}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-1">
                            <span
                              className={`font-mono font-medium tabular-nums whitespace-nowrap ${
                                isIncome ? "text-[var(--success)]" : "text-[var(--foreground)]"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatIDR(Number(tx.amount))}
                            </span>
                            <button
                              onClick={() => handleDeleteTx(tx.id)}
                              className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded cursor-pointer"
                              title="Hapus transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      )}

      {/* Tab 3: Savings Goals */}
      {activeTab === "savings" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--foreground-muted)]">
              Target dana tabungan & tujuan finansial
            </span>
            <button
              onClick={() => setIsAddingSavings(!isAddingSavings)}
              className="text-xs text-[var(--foreground)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Target Tabungan</span>
            </button>
          </div>

          {isAddingSavings && (
            <form
              onSubmit={handleCreateSavings}
              className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  autoFocus
                  value={savingsTitle}
                  onChange={(e) => setSavingsTitle(e.target.value)}
                  placeholder="Nama target (misal: Dana Darurat, Liburan)..."
                  className="h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <input
                  type="number"
                  required
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  placeholder="Target nominal (Rp)..."
                  className="h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingSavings(false)}
                  className="h-7 px-2.5 text-xs text-[var(--foreground-muted)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !savingsTitle.trim() || !savingsTarget}
                  className="h-7 px-3 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {savings.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada target tabungan yang dibuat.
              </div>
            ) : (
              savings.map((s) => {
                const target = Number(s.targetAmount) || 1;
                const current = Number(s.currentAmount) || 0;
                const progressPct = Math.min(100, Math.round((current / target) * 100));

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                        <PiggyBank className="w-3.5 h-3.5 text-amber-500" />
                        {s.title}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                        {progressPct}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[11px] text-[var(--foreground)]">
                        {formatIDR(current)}
                      </span>
                      <span className="text-[11px] text-[var(--foreground-muted)]">
                        Target: {formatIDR(target)}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--foreground)] opacity-80 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: WhatsApp Sync & Live Simulator */}
      {activeTab === "whatsapp" && (
        <WhatsAppSyncCard
          connection={whatsappConnection}
          accounts={accounts}
          onTransactionConfirmed={(confirmedDate) => {
            setActiveTab("transactions");
            const d = new Date(confirmedDate);
            if (!isNaN(d.getTime())) {
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
              if (d < startOfMonth) {
                setPeriodView("all_time");
              }
            }
          }}
        />
      )}
    </div>
  );
}
