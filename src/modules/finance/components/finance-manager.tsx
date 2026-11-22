"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  PiggyBank,
  Smartphone,
  TrendingUp,
  BarChart3,
  PieChart,
  Receipt,
  Tag,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  Info,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  HandCoins,
} from "lucide-react";
import {
  createAccountAction,
  createTransactionAction,
  createSavingsGoalAction,
  depositToSavingsGoalAction,
  withdrawFromSavingsGoalAction,
  deleteSavingsGoalAction,
  deleteTransactionAction,
  deleteAllTransactionsAction,
  createDebtAction,
  payDebtAction,
  deleteDebtAction,
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
  financeAccountId?: string | null;
  accountName?: string | null;
  createdAt?: Date;
}

interface DebtItem {
  id: string;
  type: string; // "debt" | "receivable"
  personName: string;
  amount: string;
  paidAmount: string;
  dueDate: Date | null;
  status: string; // "unpaid" | "partial" | "paid"
  notes: string | null;
  isInstallment?: boolean;
  totalInstallments?: number;
  paidInstallments?: number;
  installmentAmount?: string | null;
  dueDay?: number | null;
  interestType?: string | null; // "none" | "percentage_monthly" | "fixed_amount"
  interestRate?: string | null;
  interestAmount?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function FinanceManager({
  accounts,
  categories,
  transactions,
  savings,
  debts,
  summary,
  whatsappConnection,
}: {
  accounts: AccountItem[];
  categories: CategoryItem[];
  transactions: TransactionItem[];
  savings: SavingsItem[];
  debts: DebtItem[];
  summary: FinanceSummary;
  whatsappConnection: UserWhatsappConnection | null;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "savings" | "debts" | "whatsapp">("overview");
  const [periodView, setPeriodView] = useState<"daily" | "monthly" | "all_time">("monthly");
  const [financeChartMode, setFinanceChartMode] = useState<"category" | "cashflow" | "accounts">("category");

  // Dialog & Form states
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isAddingSavings, setIsAddingSavings] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Debt & Receivable State
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [debtType, setDebtType] = useState<"debt" | "receivable">("debt");
  const [debtPersonName, setDebtPersonName] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  const [debtIsInstallment, setDebtIsInstallment] = useState(false);
  const [debtTotalInstallments, setDebtTotalInstallments] = useState("3");
  const [debtInstallmentAmount, setDebtInstallmentAmount] = useState("");
  const [debtDueDay, setDebtDueDay] = useState("25");
  const [debtInterestType, setDebtInterestType] = useState<"none" | "percentage_monthly" | "fixed_amount">("none");
  const [debtInterestRate, setDebtInterestRate] = useState("");
  const [debtFixedInterest, setDebtFixedInterest] = useState("");

  const [activePayDebt, setActivePayDebt] = useState<DebtItem | null>(null);
  const [payDebtAmount, setPayDebtAmount] = useState("");
  const [payDebtAccountId, setPayDebtAccountId] = useState(accounts[0]?.id || "");
  const [debtFilter, setDebtFilter] = useState<"all" | "debt" | "receivable" | "unpaid" | "paid">("all");

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

  // Transfer State
  const [transferFromAccountId, setTransferFromAccountId] = useState(accounts[0]?.id || "");
  const [transferToAccountId, setTransferToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");

  // New Savings Goal State
  const [savingsTitle, setSavingsTitle] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [savingsAccountId, setSavingsAccountId] = useState(accounts[0]?.id || "");
  const [savingsTargetDate, setSavingsTargetDate] = useState("");

  // Inline Goal Action (Deposit / Withdraw)
  const [activeGoalAction, setActiveGoalAction] = useState<{
    goalId: string;
    mode: "deposit" | "withdraw";
  } | null>(null);
  const [goalActionAmount, setGoalActionAmount] = useState("");
  const [goalActionAccountId, setGoalActionAccountId] = useState(accounts[0]?.id || "");

  // Top-Up / Tambah Saldo State
  const [topUpAccountId, setTopUpAccountId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpCategoryId, setTopUpCategoryId] = useState("");
  const [topUpDescription, setTopUpDescription] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAccountId || !topUpAmount) return;

    startTransition(async () => {
      const acc = accounts.find((a) => a.id === topUpAccountId);
      await createTransactionAction({
        accountId: topUpAccountId,
        type: "income",
        amount: topUpAmount,
        categoryId: topUpCategoryId || null,
        description: topUpDescription.trim() || `Tambah Saldo: ${acc?.name || "Akun"}`,
      });
      setTopUpAccountId(null);
      setTopUpAmount("");
      setTopUpCategoryId("");
      setTopUpDescription("");
    });
  };

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

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromAccountId || !transferToAccountId || !transferAmount) return;
    if (transferFromAccountId === transferToAccountId) {
      alert("Akun asal dan akun tujuan tidak boleh sama");
      return;
    }

    startTransition(async () => {
      const fromName = accounts.find((a) => a.id === transferFromAccountId)?.name || "Akun Asal";
      const toName = accounts.find((a) => a.id === transferToAccountId)?.name || "Akun Tujuan";
      await createTransactionAction({
        accountId: transferFromAccountId,
        transferToAccountId: transferToAccountId,
        type: "transfer",
        amount: transferAmount,
        description: transferDescription.trim() || `Transfer dari ${fromName} ke ${toName}`,
      });
      setTransferAmount("");
      setTransferDescription("");
      setIsTransferring(false);
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
        targetDate: savingsTargetDate ? savingsTargetDate : null,
        financeAccountId: savingsAccountId || null,
      });
      setSavingsTitle("");
      setSavingsTarget("");
      setSavingsTargetDate("");
      setIsAddingSavings(false);
    });
  };

  const handleGoalDeposit = (goalId: string) => {
    if (!goalActionAmount || !goalActionAccountId) return;

    startTransition(async () => {
      await depositToSavingsGoalAction({
        goalId,
        accountId: goalActionAccountId,
        amount: goalActionAmount,
      });
      setActiveGoalAction(null);
      setGoalActionAmount("");
    });
  };

  const handleGoalWithdraw = (goalId: string) => {
    if (!goalActionAmount || !goalActionAccountId) return;

    startTransition(async () => {
      await withdrawFromSavingsGoalAction({
        goalId,
        accountId: goalActionAccountId,
        amount: goalActionAmount,
      });
      setActiveGoalAction(null);
      setGoalActionAmount("");
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!confirm("Hapus target tabungan ini?")) return;
    startTransition(async () => {
      await deleteSavingsGoalAction(goalId);
    });
  };

  const handleDeleteTx = (id: string) => {
    startTransition(async () => {
      await deleteTransactionAction(id);
    });
  };

  const handleDeleteAllTx = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data riwayat transaksi? Tindakan ini permanen dan tidak dapat dibatalkan.")) return;
    startTransition(async () => {
      await deleteAllTransactionsAction();
    });
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtPersonName.trim() || !debtAmount) return;

    startTransition(async () => {
      await createDebtAction({
        type: debtType,
        personName: debtPersonName.trim(),
        amount: debtAmount,
        dueDate: debtDueDate || null,
        notes: debtNotes.trim() || null,
        isInstallment: debtIsInstallment,
        totalInstallments: debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1,
        installmentAmount: debtIsInstallment && debtInstallmentAmount ? debtInstallmentAmount : null,
        dueDay: debtIsInstallment && debtDueDay ? parseInt(debtDueDay) : null,
        interestType: debtInterestType,
        interestRate: debtInterestType === "percentage_monthly" ? debtInterestRate : null,
        interestAmount: debtInterestType === "fixed_amount" ? debtFixedInterest : null,
      });
      setIsAddingDebt(false);
      setDebtPersonName("");
      setDebtAmount("");
      setDebtDueDate("");
      setDebtNotes("");
      setDebtIsInstallment(false);
      setDebtTotalInstallments("3");
      setDebtInstallmentAmount("");
      setDebtDueDay("25");
      setDebtInterestType("none");
      setDebtInterestRate("");
      setDebtFixedInterest("");
    });
  };

  const handlePayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayDebt || !payDebtAmount) return;

    startTransition(async () => {
      await payDebtAction({
        debtId: activePayDebt.id,
        amount: payDebtAmount,
        accountId: payDebtAccountId || null,
      });
      setActivePayDebt(null);
      setPayDebtAmount("");
    });
  };

  const handleDeleteDebt = (debtId: string) => {
    if (!confirm("Hapus catatan utang/piutang ini?")) return;
    startTransition(async () => {
      await deleteDebtAction(debtId);
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

  const filteredDebts = debts.filter((d) => {
    if (debtFilter === "debt") return d.type === "debt";
    if (debtFilter === "receivable") return d.type === "receivable";
    if (debtFilter === "unpaid") return d.status !== "paid";
    if (debtFilter === "paid") return d.status === "paid";
    return true;
  });

  const activeDebtsCount = debts.filter((d) => d.status !== "paid").length;

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
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Total Saldo Bersih</span>
            <Wallet className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
          </div>
          <div className={`text-xl font-medium tracking-tight mt-2 tabular-nums ${summary.totalBalance < 0 ? "text-[var(--danger)]" : "text-[var(--foreground)]"}`}>
            {formatIDR(summary.totalBalance)}
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)] mt-1 truncate font-mono">
            Bebas: {formatIDR(summary.freeBalance || 0)} · Terkunci: {formatIDR(summary.totalSavingsCurrent || 0)}
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

      {/* NEW: Saran Pengeluaran & Anggaran Cerdas (Financial Intelligence & Safe-to-Spend) */}
      <div className="p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" strokeWidth={1.5} />
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)] tracking-tight">
                Saran Pengeluaran & Anggaran Cerdas
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Rekomendasi otomatis berbasis pola arus kas, batas belanja aman harian, dan alokasi tabungan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] font-medium">
              Batas Belanja: {formatIDR(summary.safeDailySpend || 0)} / hari
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-500 font-medium">
              Saldo Bebas: {formatIDR(summary.freeBalance || 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(summary.financialAdvice && summary.financialAdvice.length > 0
            ? summary.financialAdvice
            : [
                {
                  type: "tip" as const,
                  title: "Prinsip Anggaran 50/30/20",
                  description:
                    "Alokasikan 50% untuk kebutuhan pokok, 30% untuk gaya hidup, dan 20% langsung diamankan ke tabungan atau target impian.",
                  metric: "50 : 30 : 20",
                },
                {
                  type: "info" as const,
                  title: "Batas Belanja Aman Harian",
                  description: `Batas pengeluaran aman Anda saat ini adalah ${formatIDR(summary.safeDailySpend || 0)} per hari agar arus kas tetap surplus.`,
                  metric: `${formatIDR(summary.safeDailySpend || 0)} / hari`,
                },
                {
                  type: "success" as const,
                  title: "Integrasi Tabungan & Rekening",
                  description:
                    "Dana yang Anda setorkan ke target belanja otomatis mengurangi saldo rekening dan terpisah dari saldo bebas belanja.",
                  metric: "Terintegrasi",
                },
              ]
          ).map((adv, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-[var(--surface-raised)]/50 border border-[var(--border)] flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    {adv.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    {adv.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {adv.type === "info" && <Info className="w-3.5 h-3.5 text-blue-500" />}
                    {adv.type === "tip" && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                    {adv.title}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                  {adv.description}
                </p>
              </div>

              {adv.metric && (
                <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--foreground-muted)]">Indikator</span>
                  <span className="font-semibold text-[var(--foreground)]">{adv.metric}</span>
                </div>
              )}
            </div>
          ))}
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
            Target Belanja & Tabungan
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{savings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("debts")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === "debts"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
            <span>Utang & Piutang</span>
            {activeDebtsCount > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--surface-raised)] text-[var(--foreground-muted)] border border-[var(--border)]">
                {activeDebtsCount}
              </span>
            )}
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
              className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer flex-1 sm:flex-none shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Catat Transaksi</span>
            </button>
          )}
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
                  {acc.name} ({formatIDR(acc.currentBalance)})
                </option>
              ))}
            </select>
            <select
              value={txCategoryId}
              onChange={(e) => setTxCategoryId(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            >
              <option value="">Pilih Kategori (Opsional)</option>
              {categories
                .filter((c) => c.type === txType)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <input
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="Catatan / keterangan..."
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

      {/* Tab 1: Account Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Total Saldo Terdaftar</span>
                <span className="font-semibold text-[var(--foreground)] tabular-nums">{formatIDR(summary.totalBalance)}</span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Saldo Bebas (Safe to Spend)</span>
                <span className="font-semibold text-emerald-500 tabular-nums">{formatIDR(summary.freeBalance || 0)}</span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Terkunci di Target Tabungan</span>
                <span className="font-semibold text-amber-500 tabular-nums">{formatIDR(summary.totalSavingsCurrent || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTopUpAccountId(accounts[0]?.id || null);
                  setTopUpAmount("");
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Saldo</span>
              </button>
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferring(!isTransferring);
                    setIsAddingAccount(false);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] cursor-pointer flex items-center gap-1.5 transition-colors ${
                    isTransferring ? "bg-[var(--surface-raised)] border-blue-500/50 text-blue-500" : ""
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3 text-blue-500" />
                  <span>Transfer Saldo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsAddingAccount(!isAddingAccount);
                  setIsTransferring(false);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] font-medium cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isAddingAccount ? "bg-[var(--surface-raised)] border-[var(--border-active)]" : ""
                }`}
              >
                <Wallet className="w-3 h-3 text-[var(--foreground-muted)]" />
                <span>Tambah Akun</span>
              </button>
            </div>
          </div>

          {/* Transfer Antar Akun Form */}
          {isTransferring && (
            <form
              onSubmit={handleTransfer}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-medium text-[var(--foreground)]">Transfer Saldo Antar Rekening</h3>
                </div>
                <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                  Memindahkan saldo tanpa memengaruhi cashflow belanja
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Dari Rekening</label>
                  <select
                    value={transferFromAccountId}
                    onChange={(e) => setTransferFromAccountId(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatIDR(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Ke Rekening</label>
                  <select
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === transferFromAccountId}>
                        {acc.name} ({formatIDR(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Nominal Transfer (Rp)</label>
                  <input
                    type="number"
                    required
                    autoFocus
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Nominal (Rp)..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Keterangan Transfer</label>
                  <input
                    type="text"
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    placeholder="Contoh: Tarik Tunai ATM, Top up Gopay..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTransferring(false)}
                  className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !transferAmount || transferFromAccountId === transferToAccountId}
                  className="h-8 px-3.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  Proses Transfer
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {accounts.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada akun keuangan terdaftar. Tekan &quot;Tambah Akun&quot; untuk mulai mencatat saldo Anda.
              </div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{acc.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--foreground-muted)] border border-[var(--border)]">
                      {acc.accountType}
                    </span>
                  </div>
                  <div className="text-xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
                    {formatIDR(acc.currentBalance)}
                  </div>

                  {/* Inline Top-Up Form */}
                  {topUpAccountId === acc.id ? (
                    <form onSubmit={handleTopUp} className="pt-2 border-t border-[var(--border)] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[var(--foreground)]">
                        <span>Tambah Saldo: {acc.name}</span>
                        <button
                          type="button"
                          onClick={() => setTopUpAccountId(null)}
                          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="number"
                          required
                          autoFocus
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          placeholder="Nominal saldo (Rp)..."
                          className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                        />
                        <select
                          value={topUpCategoryId}
                          onChange={(e) => setTopUpCategoryId(e.target.value)}
                          className="w-full h-8 px-2 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                        >
                          <option value="">Pilih Kategori Pemasukan (Opsional)</option>
                          {categories
                            .filter((c) => c.type === "income")
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          value={topUpDescription}
                          onChange={(e) => setTopUpDescription(e.target.value)}
                          placeholder="Keterangan (misal: Setor Tunai, Gaji, Top Up)..."
                          className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="submit"
                          disabled={isPending || !topUpAmount}
                          className="h-7 px-3 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Konfirmasi Setor Saldo
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="pt-2.5 border-t border-[var(--border)]/50 flex items-center justify-between text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setTopUpAccountId(acc.id);
                          setTopUpAmount("");
                          setTopUpDescription("");
                        }}
                        className="h-7 px-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
                      >
                        <Plus className="w-3 h-3 text-emerald-500" />
                        <span>Tambah Saldo</span>
                      </button>

                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTransferFromAccountId(acc.id);
                            setIsTransferring(true);
                          }}
                          className="h-7 px-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-blue-500" />
                          <span>Transfer</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Transactions List */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono text-[var(--foreground-muted)]">
              {displayedTransactions.length > 0
                ? `${displayedTransactions.length} transaksi tercatat`
                : "0 transaksi"}
            </span>
            {displayedTransactions.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllTx}
                disabled={isPending}
                className="px-2.5 py-1 text-[11px] rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus Semua Transaksi</span>
              </button>
            )}
          </div>

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
                      const isTransfer = tx.type === "transfer";

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] text-xs hover:border-[var(--border-active)] transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isTransfer
                                  ? "bg-blue-500/10 text-blue-500"
                                  : isIncome
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : "bg-[var(--danger)]/10 text-[var(--danger)]"
                              }`}
                            >
                              {isTransfer ? (
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              ) : isIncome ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-[var(--foreground)] truncate">
                                  {tx.description || (isTransfer ? "Transfer Antar Akun" : isIncome ? "Pemasukan" : "Pengeluaran")}
                                </p>
                                {isTransfer && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 flex-shrink-0">
                                    Transfer
                                  </span>
                                )}
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
                                {tx.categoryName && <span>· {tx.categoryName}</span>}
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
                                isTransfer
                                  ? "text-blue-500"
                                  : isIncome
                                  ? "text-[var(--success)]"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {isTransfer ? "⇄ " : isIncome ? "+" : "-"}
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

      {/* Tab 3: Target Belanja & Tabungan Masa Depan (Wishlist & Purchase Goals) */}
      {activeTab === "savings" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Total Sasaran Pembelian</span>
                <span className="font-semibold text-[var(--foreground)] tabular-nums">{formatIDR(summary.totalSavingsTarget || 0)}</span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Terkumpul Saat Ini</span>
                <span className="font-semibold text-emerald-500 tabular-nums">
                  {formatIDR(summary.totalSavingsCurrent || 0)} ({summary.savingsProgressRate || 0}%)
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Sisa Dana Dibutuhkan</span>
                <span className="font-semibold text-amber-500 tabular-nums">
                  {formatIDR(Math.max(0, (summary.totalSavingsTarget || 0) - (summary.totalSavingsCurrent || 0)))}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAddingSavings(!isAddingSavings)}
              className="h-8 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-medium cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Target Pembelian Baru</span>
            </button>
          </div>

          {/* Add Goal Form */}
          {isAddingSavings && (
            <form
              onSubmit={handleCreateSavings}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
            >
              <h3 className="text-xs font-semibold text-[var(--foreground)] pb-2 border-b border-[var(--border)] flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                Tambah Rencana Belanja / Target Masa Depan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Mau Beli Apa / Nama Target</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={savingsTitle}
                    onChange={(e) => setSavingsTitle(e.target.value)}
                    placeholder="Contoh: MacBook M3, DP Motor, Liburan..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Target Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={savingsTarget}
                    onChange={(e) => setSavingsTarget(e.target.value)}
                    placeholder="Contoh: 15000000..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Rekening Penampung</label>
                  <select
                    value={savingsAccountId}
                    onChange={(e) => setSavingsAccountId(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatIDR(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Target Tanggal Mau Terbeli (Opsional)</label>
                  <input
                    type="date"
                    value={savingsTargetDate}
                    onChange={(e) => setSavingsTargetDate(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingSavings(false)}
                  className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !savingsTitle.trim() || !savingsTarget}
                  className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                >
                  Simpan Rencana Target
                </button>
              </div>
            </form>
          )}

          {/* Savings Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savings.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada target pembelian yang dibuat. Tekan tombol &quot;Target Pembelian Baru&quot; untuk merencanakan barang impian atau dana tabungan Anda.
              </div>
            ) : (
              savings.map((s) => {
                const target = Number(s.targetAmount) || 1;
                const current = Number(s.currentAmount) || 0;
                const progressPct = Math.min(100, Math.round((current / target) * 100));
                const remaining = Math.max(0, target - current);
                const isComplete = current >= target;

                // Hitung estimasi waktu tercapai berdasarkan monthlyNetSavings
                let velocityEstimate = "";
                if (isComplete) {
                  velocityEstimate = "🎉 Target sudah tercapai 100%! Siap untuk dibeli.";
                } else if (summary.monthlyNetSavings > 0) {
                  const monthsLeft = Math.ceil(remaining / summary.monthlyNetSavings);
                  velocityEstimate = `Estimasi terbeli dalam ~${monthsLeft} bulan berdasarkan laju tabungan Anda (${formatIDR(summary.monthlyNetSavings)}/bulan)`;
                } else {
                  velocityEstimate = "Arus kas saat ini sedang defisit atau belum mencatat surplus bulanan.";
                }

                // Hitung kebutuhan tabungan bulanan jika ada targetDate
                let deadlineInfo = "";
                if (s.targetDate && !isComplete) {
                  const targetTime = new Date(s.targetDate).getTime();
                  const nowTime = new Date().getTime();
                  const diffDays = Math.max(1, Math.round((targetTime - nowTime) / (1000 * 60 * 60 * 24)));
                  const diffMonths = Math.max(1, Math.round(diffDays / 30));
                  const neededPerMonth = Math.round(remaining / diffMonths);
                  deadlineInfo = `Deadline: ${new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(new Date(s.targetDate))} (Perlu ${formatIDR(neededPerMonth)}/bulan)`;
                }

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <h4 className="text-xs font-semibold text-[var(--foreground)] truncate">
                            {s.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                          isComplete
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--foreground-muted)]"
                        }`}>
                          {progressPct}% {isComplete && "TERCAPAI"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[12px] font-semibold text-[var(--foreground)] tabular-nums">
                          {formatIDR(current)}
                        </span>
                        <span className="text-[11px] text-[var(--foreground-muted)] tabular-nums">
                          Target: {formatIDR(target)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[var(--surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? "bg-emerald-500" : "bg-[var(--foreground)]"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Velocity & Deadline Intelligence */}
                      <div className="p-2 rounded-lg bg-[var(--surface-raised)]/40 border border-[var(--border)]/50 space-y-1 text-[10px]">
                        <p className="text-[var(--foreground-muted)] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span>{velocityEstimate}</span>
                        </p>
                        {deadlineInfo && (
                          <p className="text-purple-500 font-mono flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{deadlineInfo}</span>
                          </p>
                        )}
                        <p className="text-[var(--foreground-muted)] font-mono">
                          {s.accountName ? `Rekening Sumber: ${s.accountName}` : "Rekening: Akun Umum"} · Sisa: {formatIDR(remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Action Panel for Setor / Tarik */}
                    <div className="pt-2 border-t border-[var(--border)] space-y-2">
                      {activeGoalAction?.goalId === s.id ? (
                        <div className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--foreground)]">
                            <span>{activeGoalAction.mode === "deposit" ? "Setor Tabungan ke Target" : "Tarik Dana dari Target"}</span>
                            <button
                              type="button"
                              onClick={() => setActiveGoalAction(null)}
                              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={goalActionAccountId}
                              onChange={(e) => setGoalActionAccountId(e.target.value)}
                              className="h-8 px-2 text-[11px] rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                            >
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} ({formatIDR(acc.currentBalance)})
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              autoFocus
                              value={goalActionAmount}
                              onChange={(e) => setGoalActionAmount(e.target.value)}
                              placeholder="Nominal (Rp)..."
                              className="h-8 px-2.5 text-[11px] rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-0.5">
                            <button
                              type="button"
                              disabled={isPending || !goalActionAmount}
                              onClick={() => {
                                if (activeGoalAction.mode === "deposit") {
                                  handleGoalDeposit(s.id);
                                } else {
                                  handleGoalWithdraw(s.id);
                                }
                              }}
                              className={`h-7 px-3 text-[11px] font-medium rounded text-white cursor-pointer ${
                                activeGoalAction.mode === "deposit"
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {activeGoalAction.mode === "deposit" ? "Konfirmasi Setor" : "Konfirmasi Tarik"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveGoalAction({ goalId: s.id, mode: "deposit" });
                                setGoalActionAccountId(s.financeAccountId || accounts[0]?.id || "");
                                setGoalActionAmount("");
                              }}
                              className="h-7 px-2.5 text-[11px] font-medium rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <ArrowDownCircle className="w-3 h-3 text-emerald-500" />
                              <span>Setor Dana</span>
                            </button>

                            {current > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveGoalAction({ goalId: s.id, mode: "withdraw" });
                                  setGoalActionAccountId(s.financeAccountId || accounts[0]?.id || "");
                                  setGoalActionAmount("");
                                }}
                                className="h-7 px-2.5 text-[11px] font-medium rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <ArrowUpCircle className="w-3 h-3 text-blue-500" />
                                <span>Tarik Dana</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(s.id)}
                            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded cursor-pointer"
                            title="Hapus target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Utang & Piutang */}
      {activeTab === "debts" && (
        <div className="space-y-4">
          {/* Header Summary Cards */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Total Utang (Kewajiban Saya)</span>
                <span className="font-semibold text-rose-500 tabular-nums">
                  {formatIDR(summary.totalDebtRemaining || 0)}
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Total Piutang (Hak Tagih Saya)</span>
                <span className="font-semibold text-emerald-500 tabular-nums">
                  {formatIDR(summary.totalReceivableRemaining || 0)}
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
              <div>
                <span className="text-[10px] text-[var(--foreground-muted)] block">Posisi Bersih (Piutang - Utang)</span>
                <span
                  className={`font-semibold tabular-nums ${
                    (summary.totalReceivableRemaining || 0) >= (summary.totalDebtRemaining || 0)
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {formatIDR((summary.totalReceivableRemaining || 0) - (summary.totalDebtRemaining || 0))}
                </span>
              </div>
              {(summary.monthlyInstallmentDue || 0) > 0 && (
                <>
                  <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
                  <div>
                    <span className="text-[10px] text-[var(--foreground-muted)] block">Tagihan Cicilan Bulan Ini</span>
                    <span className="font-semibold text-blue-500 tabular-nums">
                      {formatIDR(summary.monthlyInstallmentDue)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAddingDebt(!isAddingDebt);
                setActivePayDebt(null);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-medium cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Catat Utang / Piutang</span>
            </button>
          </div>

          {/* Form Tambah Utang / Piutang */}
          {isAddingDebt && (
            <form
              onSubmit={handleCreateDebt}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[var(--foreground)]" />
                  <h3 className="text-xs font-medium text-[var(--foreground)]">Catat Utang atau Piutang Baru</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDebtType("debt")}
                    className={`h-6 px-2.5 text-[11px] rounded cursor-pointer transition-colors ${
                      debtType === "debt"
                        ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 font-medium"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Utang Saya (Saya Meminjam)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType("receivable")}
                    className={`h-6 px-2.5 text-[11px] rounded cursor-pointer transition-colors ${
                      debtType === "receivable"
                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-medium"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Piutang Saya (Dipinjam Orang)
                  </button>
                </div>
              </div>

              {/* Skema Pelunasan */}
              <div className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-[var(--foreground)] block">Skema Pembayaran</span>
                  <span className="text-[10px] text-[var(--foreground-muted)]">
                    {debtIsInstallment
                      ? "Cicilan bulanan berkala dengan tenor (seperti pinjaman online/bank)"
                      : "Pembayaran tempo tunggal (sekali lunas)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDebtIsInstallment(false)}
                    className={`h-6 px-2.5 text-[11px] rounded cursor-pointer transition-colors ${
                      !debtIsInstallment
                        ? "bg-[var(--surface-card)] text-[var(--foreground)] font-semibold border border-[var(--border)] shadow-xs"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Sekali Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDebtIsInstallment(true);
                      const p = Number(debtAmount) || 0;
                      const m = parseInt(debtTotalInstallments) || 3;
                      let intr = 0;
                      if (debtInterestType === "percentage_monthly" && debtInterestRate) {
                        intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                      } else if (debtInterestType === "fixed_amount" && debtFixedInterest) {
                        intr = Math.round(Number(debtFixedInterest) || 0);
                      }
                      if (p > 0) {
                        setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                      }
                    }}
                    className={`h-6 px-2.5 text-[11px] rounded cursor-pointer transition-colors ${
                      debtIsInstallment
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Cicilan Bulanan (Tenor)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                    {debtType === "debt" ? "Pemberi Pinjaman (Nama Orang / Bank / Pinjol)" : "Peminjam (Nama Orang / Teman)"}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={debtPersonName}
                    onChange={(e) => setDebtPersonName(e.target.value)}
                    placeholder="Contoh: Budi, Kredivo, BCA, dll..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                    {debtIsInstallment ? "Total Pokok Pinjaman (Rp)" : "Nominal Pokok (Rp)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={debtAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDebtAmount(val);
                      if (debtIsInstallment && parseInt(debtTotalInstallments) > 0) {
                        const p = Number(val) || 0;
                        const m = parseInt(debtTotalInstallments) || 1;
                        let intr = 0;
                        if (debtInterestType === "percentage_monthly" && debtInterestRate) {
                          intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                        } else if (debtInterestType === "fixed_amount" && debtFixedInterest) {
                          intr = Math.round(Number(debtFixedInterest) || 0);
                        }
                        setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                      }
                    }}
                    placeholder="Nominal pinjaman..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                    {debtIsInstallment ? "Jatuh Tempo Cicilan Pertama" : "Jatuh Tempo (Opsional)"}
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">Catatan / Keperluan</label>
                  <input
                    type="text"
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bunga & Biaya Layanan */}
              <div className="p-3 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-[var(--foreground)] block">Bunga Pinjaman</span>
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      Atur persentase bunga flat per bulan (pinjol/kredit) atau nominal bunga tetap
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { type: "none", label: "Tanpa Bunga (0%)" },
                        { type: "percentage_monthly", label: "% per Bulan (Flat)" },
                        { type: "fixed_amount", label: "Nominal Tetap (Rp)" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setDebtInterestType(item.type);
                          const p = Number(debtAmount) || 0;
                          const m = debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1;
                          let intr = 0;
                          if (item.type === "percentage_monthly" && debtInterestRate) {
                            intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                          } else if (item.type === "fixed_amount" && debtFixedInterest) {
                            intr = Math.round(Number(debtFixedInterest) || 0);
                          }
                          if (debtIsInstallment && p > 0) {
                            setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                          }
                        }}
                        className={`h-6 px-2.5 text-[11px] rounded cursor-pointer transition-colors ${
                          debtInterestType === item.type
                            ? "bg-[var(--surface-card)] text-amber-500 font-semibold border border-amber-500/30 shadow-xs"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {debtInterestType === "percentage_monthly" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                        Suku Bunga per Bulan (% flat)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={debtInterestRate}
                          onChange={(e) => {
                            const r = e.target.value;
                            setDebtInterestRate(r);
                            const p = Number(debtAmount) || 0;
                            const m = debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1;
                            const intr = Math.round(p * ((Number(r) || 0) / 100) * m);
                            if (debtIsInstallment && p > 0) {
                              setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                            }
                          }}
                          placeholder="Contoh: 1.5, 2.5..."
                          className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                        />
                        <span className="text-xs font-mono text-[var(--foreground-muted)]">%</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--border)] flex flex-col justify-center text-[11px]">
                      <span className="text-[10px] text-[var(--foreground-muted)] font-mono">Simulasi Total Bunga:</span>
                      <span className="font-semibold text-amber-500 font-mono">
                        +{formatIDR(
                          Math.round(
                            (Number(debtAmount) || 0) *
                              ((Number(debtInterestRate) || 0) / 100) *
                              (debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1)
                          )
                        )}
                        <span className="text-[10px] text-[var(--foreground-muted)] font-normal ml-1">
                          ({debtInterestRate || 0}% x {debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1} bln)
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {debtInterestType === "fixed_amount" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                        Nominal Bunga / Biaya Layanan Tetap (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={debtFixedInterest}
                        onChange={(e) => {
                          const f = e.target.value;
                          setDebtFixedInterest(f);
                          const p = Number(debtAmount) || 0;
                          const m = debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1;
                          const intr = Number(f) || 0;
                          if (debtIsInstallment && p > 0) {
                            setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                          }
                        }}
                        placeholder="Contoh: 150000"
                        className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--border)] flex flex-col justify-center text-[11px]">
                      <span className="text-[10px] text-[var(--foreground-muted)] font-mono">Total Bunga Tetap:</span>
                      <span className="font-semibold text-amber-500 font-mono">
                        +{formatIDR(Number(debtFixedInterest) || 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Ringkasan Pokok + Bunga */}
                {Number(debtAmount) > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/50 text-[11px] font-mono">
                    <span className="text-[var(--foreground-muted)]">Total Pengembalian:</span>
                    <span className="font-semibold text-[var(--foreground)] tabular-nums">
                      {(() => {
                        const p = Number(debtAmount) || 0;
                        const m = debtIsInstallment ? Math.max(1, parseInt(debtTotalInstallments) || 1) : 1;
                        let intr = 0;
                        if (debtInterestType === "percentage_monthly" && debtInterestRate) {
                          intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                        } else if (debtInterestType === "fixed_amount" && debtFixedInterest) {
                          intr = Math.round(Number(debtFixedInterest) || 0);
                        }
                        return `${formatIDR(p + intr)} ${
                          intr > 0 ? `(Pokok ${formatIDR(p)} + Bunga ${formatIDR(intr)})` : ""
                        }`;
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Pengaturan Cicilan Bulanan */}
              {debtIsInstallment && (
                <div className="p-3 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                      Tenor Cicilan (Bulan)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={debtTotalInstallments}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDebtTotalInstallments(val);
                        const m = Math.max(1, parseInt(val) || 1);
                        const p = Number(debtAmount) || 0;
                        let intr = 0;
                        if (debtInterestType === "percentage_monthly" && debtInterestRate) {
                          intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                        } else if (debtInterestType === "fixed_amount" && debtFixedInterest) {
                          intr = Math.round(Number(debtFixedInterest) || 0);
                        }
                        if (p > 0) {
                          setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                        }
                      }}
                      placeholder="Contoh: 3, 6, 12..."
                      className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-[var(--foreground-muted)]">
                        Tagihan per Bulan (Rp)
                      </label>
                      {debtAmount && parseInt(debtTotalInstallments) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = Number(debtAmount) || 0;
                            const m = Math.max(1, parseInt(debtTotalInstallments) || 1);
                            let intr = 0;
                            if (debtInterestType === "percentage_monthly" && debtInterestRate) {
                              intr = Math.round(p * ((Number(debtInterestRate) || 0) / 100) * m);
                            } else if (debtInterestType === "fixed_amount" && debtFixedInterest) {
                              intr = Math.round(Number(debtFixedInterest) || 0);
                            }
                            setDebtInstallmentAmount(String(Math.round((p + intr) / m)));
                          }}
                          className="text-[9px] text-blue-500 hover:underline cursor-pointer"
                        >
                          Hitung Rata (Pokok+Bunga)
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={debtInstallmentAmount}
                      onChange={(e) => setDebtInstallmentAmount(e.target.value)}
                      placeholder="Nominal per bulan..."
                      className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                      Tanggal Penagihan Bulanan
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--foreground-muted)]">Tgl</span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={debtDueDay}
                        onChange={(e) => setDebtDueDay(e.target.value)}
                        placeholder="1-31"
                        className="w-16 h-8 px-2 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                      />
                      <span className="text-[10px] text-[var(--foreground-muted)] font-mono">tiap bulan</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingDebt(false)}
                  className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !debtPersonName.trim() || !debtAmount}
                  className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          )}

          {/* Form Pembayaran / Cicilan */}
          {activePayDebt && (
            <form
              onSubmit={handlePayDebt}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
            >
              {(() => {
                const payPrincipal = Number(activePayDebt.amount);
                const payInterest = Number(activePayDebt.interestAmount || 0);
                const payTotalPayable = payPrincipal + payInterest;
                const payRemaining = Math.max(0, payTotalPayable - Number(activePayDebt.paidAmount || 0));
                const payRemainingTenor = Math.max(1, (activePayDebt.totalInstallments || 1) - (activePayDebt.paidInstallments || 0));
                const payCycleBill = Number(activePayDebt.installmentAmount || Math.round(payRemaining / payRemainingTenor));

                return (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--foreground)]">
                          {activePayDebt.type === "debt" ? "Bayar Cicilan / Utang ke " : "Terima Pembayaran Piutang dari "}
                          <span className="text-blue-500">{activePayDebt.personName}</span>
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--foreground-muted)] mt-0.5 flex-wrap">
                          {activePayDebt.isInstallment && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-mono text-[10px] border border-blue-500/20">
                              Cicilan ke-{(activePayDebt.paidInstallments || 0) + 1} dari {activePayDebt.totalInstallments}
                            </span>
                          )}
                          {payInterest > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-mono text-[10px] border border-amber-500/20">
                              Bunga: {formatIDR(payInterest)}
                            </span>
                          )}
                          <span>
                            Sisa tagihan:{" "}
                            <span className="font-mono font-medium text-[var(--foreground)] tabular-nums">
                              {formatIDR(payRemaining)}
                            </span>
                            {payInterest > 0 && (
                              <span className="text-[10px] text-[var(--foreground-muted)] ml-1">
                                (Total {formatIDR(payTotalPayable)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePayDebt(null)}
                        className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>

                    {/* Tombol Isi Cepat */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[var(--foreground-muted)] font-mono">Pilihan Cepat:</span>
                      {activePayDebt.isInstallment && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayDebtAmount(String(Math.min(payRemaining, payCycleBill)));
                          }}
                          className="px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px] font-mono text-blue-500 hover:text-[var(--foreground)] cursor-pointer"
                        >
                          1x Cicilan Bulan Ini ({formatIDR(Math.min(payRemaining, payCycleBill))})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPayDebtAmount(String(payRemaining));
                        }}
                        className="px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px] font-mono text-emerald-500 hover:text-[var(--foreground)] cursor-pointer"
                      >
                        Pelunasan Penuh ({formatIDR(payRemaining)})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                          Nominal Pembayaran (Rp)
                        </label>
                        <input
                          type="number"
                          required
                          autoFocus
                          value={payDebtAmount}
                          onChange={(e) => setPayDebtAmount(e.target.value)}
                          placeholder="Masukkan nominal yang dibayar..."
                          className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[var(--foreground-muted)] block mb-1">
                          Sinkronkan dengan Rekening Kas (Opsional)
                        </label>
                        <select
                          value={payDebtAccountId}
                          onChange={(e) => setPayDebtAccountId(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                        >
                          <option value="">Jangan potong/tambah saldo kas</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({formatIDR(acc.currentBalance)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                        {payDebtAccountId
                          ? activePayDebt.type === "debt"
                            ? "Saldo rekening akan otomatis berkurang (pengeluaran)."
                            : "Saldo rekening akan otomatis bertambah (pemasukan)."
                          : "Hanya memperbarui status utang/piutang tanpa memengaruhi rekening kas."}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePayDebt(null)}
                          className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending || !payDebtAmount}
                          className="h-8 px-3.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Konfirmasi Pembayaran
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </form>
          )}

          {/* Sub Filters */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "debt", label: "Utang Saya" },
                  { key: "receivable", label: "Piutang Saya" },
                  { key: "unpaid", label: "Belum Lunas" },
                  { key: "paid", label: "Lunas" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setDebtFilter(f.key)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    debtFilter === f.key
                      ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] font-semibold"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-transparent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-[var(--foreground-muted)]">
              {filteredDebts.length} catatan
            </span>
          </div>

          {/* Debts List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredDebts.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada catatan utang atau piutang yang sesuai filter.
              </div>
            ) : (
              filteredDebts.map((item) => {
                const principal = Number(item.amount);
                const totalInterest = Number(item.interestAmount || 0);
                const totalPayable = principal + totalInterest;
                const paidAmt = Number(item.paidAmount || 0);
                const remaining = Math.max(0, totalPayable - paidAmt);
                const pct = totalPayable > 0 ? Math.min(100, Math.round((paidAmt / totalPayable) * 100)) : 0;
                const isDebt = item.type === "debt";
                const isPaid = item.status === "paid" || remaining === 0;

                const isInstallment = !!item.isInstallment;
                const totalTenor = item.totalInstallments || 1;
                const paidTenor = item.paidInstallments || 0;
                const remainingTenor = Math.max(0, totalTenor - paidTenor);
                const currentCycleBill = isInstallment
                  ? Number(item.installmentAmount || Math.round(remaining / Math.max(1, remainingTenor)))
                  : remaining;

                const isOverdue =
                  !isPaid &&
                  item.dueDate &&
                  new Date(item.dueDate) < startOfToday;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                            isDebt
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          }`}
                        >
                          {isDebt ? "Utang Saya" : "Piutang Saya"}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {item.interestType === "percentage_monthly" && Number(item.interestRate) > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Bunga {item.interestRate}%/bln
                            </span>
                          )}
                          {item.interestType === "fixed_amount" && totalInterest > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Bunga Tetap
                            </span>
                          )}
                          {isInstallment && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {paidTenor}/{totalTenor} Bln
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-mono border border-rose-500/20">
                              Lewat Tempo
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : pct > 0
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-[var(--surface-raised)] text-[var(--foreground-muted)] border-[var(--border)]"
                            }`}
                          >
                            {isPaid ? "Lunas" : pct > 0 ? `Dicicil ${pct}%` : "Belum Lunas"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)]">{item.personName}</h4>
                        {item.notes && (
                          <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-1 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Info Tagihan Siklus Bulan Ini jika Skema Cicilan */}
                      {isInstallment && !isPaid && (
                        <div className="p-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--foreground-muted)] font-mono">
                              Cicilan ke-{paidTenor + 1} dari {totalTenor}
                            </span>
                            <span className="font-mono font-medium text-blue-500">
                              {remainingTenor} bulan tersisa
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between pt-0.5">
                            <span className="text-[10px] text-[var(--foreground-muted)]">Tagihan Siklus Ini:</span>
                            <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
                              {formatIDR(currentCycleBill)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-[var(--foreground-muted)]">
                            {isInstallment ? "Sisa Total Tagihan" : "Sisa Tagihan"}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                            {pct}% terbayar
                          </span>
                        </div>
                        <div className="text-lg font-medium tracking-tight text-[var(--foreground)] tabular-nums">
                          {formatIDR(remaining)}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--foreground-muted)] mt-0.5">
                          {totalInterest > 0 ? (
                            <>
                              Pokok: {formatIDR(principal)} · Bunga: {formatIDR(totalInterest)} · Total: {formatIDR(totalPayable)} · Terbayar: {formatIDR(paidAmt)}
                            </>
                          ) : (
                            <>
                              Total Pinjaman: {formatIDR(principal)} · Terbayar: {formatIDR(paidAmt)}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isPaid
                              ? "bg-emerald-500"
                              : isDebt
                              ? "bg-rose-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {item.dueDate && (
                        <div className="text-[10px] font-mono flex items-center gap-1 text-[var(--foreground-muted)]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {isInstallment ? "Jatuh tempo siklus ini: " : "Jatuh tempo: "}
                            {new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(item.dueDate))}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--border)]/50 flex items-center justify-between gap-1.5">
                      {!isPaid ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePayDebt(item);
                              setPayDebtAmount(String(currentCycleBill));
                            }}
                            className="h-7 px-2.5 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--foreground)] text-[var(--foreground)] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-medium"
                          >
                            <HandCoins className="w-3 h-3 text-emerald-500" />
                            <span>
                              {isInstallment
                                ? `Bayar Cicilan (${formatIDR(currentCycleBill)})`
                                : isDebt
                                ? "Bayar Utang"
                                : "Terima Piutang"}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lunas</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDebt(item.id)}
                        disabled={isPending}
                        className="p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
