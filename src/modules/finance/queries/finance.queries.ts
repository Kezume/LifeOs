import { db } from "@/lib/db";
import { financeAccounts, financeCategories, financeTransactions, savingsGoals, debts } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function getUserAccounts(userId: string) {
  const accounts = await db
    .select()
    .from(financeAccounts)
    .where(and(eq(financeAccounts.userId, userId), eq(financeAccounts.isArchived, false)))
    .orderBy(desc(financeAccounts.createdAt));

  // Compute balance for each account: opening_balance + income - expense - transfer_out + transfer_in
  const tx = await db
    .select({
      accountId: financeTransactions.accountId,
      type: financeTransactions.type,
      totalAmount: sql<number>`sum(${financeTransactions.amount})`,
    })
    .from(financeTransactions)
    .where(and(eq(financeTransactions.userId, userId), sql`${financeTransactions.voidedAt} is null`))
    .groupBy(financeTransactions.accountId, financeTransactions.type);

  const transferIn = await db
    .select({
      targetAccountId: financeTransactions.transferToAccountId,
      totalAmount: sql<number>`sum(${financeTransactions.amount})`,
    })
    .from(financeTransactions)
    .where(and(eq(financeTransactions.userId, userId), sql`${financeTransactions.voidedAt} is null`))
    .groupBy(financeTransactions.transferToAccountId);

  const balanceMap = new Map<string, number>();
  accounts.forEach((acc) => {
    balanceMap.set(acc.id, Number(acc.openingBalance || 0));
  });

  tx.forEach((t) => {
    const current = balanceMap.get(t.accountId) || 0;
    const amt = Number(t.totalAmount || 0);
    if (t.type === "income") balanceMap.set(t.accountId, current + amt);
    else if (t.type === "expense" || t.type === "transfer") balanceMap.set(t.accountId, current - amt);
  });

  transferIn.forEach((ti) => {
    if (ti.targetAccountId) {
      const current = balanceMap.get(ti.targetAccountId) || 0;
      balanceMap.set(ti.targetAccountId, current + Number(ti.totalAmount || 0));
    }
  });

  return accounts.map((acc) => ({
    ...acc,
    currentBalance: balanceMap.get(acc.id) || 0,
  }));
}

export async function getUserCategories(userId: string) {
  return db
    .select()
    .from(financeCategories)
    .where(eq(financeCategories.userId, userId))
    .orderBy(financeCategories.type, financeCategories.name);
}

export async function getUserTransactions(userId: string) {
  return db
    .select({
      id: financeTransactions.id,
      amount: financeTransactions.amount,
      type: financeTransactions.type,
      description: financeTransactions.description,
      transactionDate: financeTransactions.transactionDate,
      accountId: financeTransactions.accountId,
      accountName: financeAccounts.name,
      categoryId: financeTransactions.categoryId,
      categoryName: financeCategories.name,
      source: financeTransactions.source,
      receiptUrl: financeTransactions.receiptUrl,
      rawMessage: financeTransactions.rawMessage,
    })
    .from(financeTransactions)
    .leftJoin(financeAccounts, eq(financeTransactions.accountId, financeAccounts.id))
    .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
    .where(and(eq(financeTransactions.userId, userId), sql`${financeTransactions.voidedAt} is null`))
    .orderBy(desc(financeTransactions.transactionDate))
    .limit(100);
}

export async function getUserSavingsGoals(userId: string) {
  return db
    .select({
      id: savingsGoals.id,
      title: savingsGoals.title,
      targetAmount: savingsGoals.targetAmount,
      currentAmount: savingsGoals.currentAmount,
      targetDate: savingsGoals.targetDate,
      financeAccountId: savingsGoals.financeAccountId,
      accountName: financeAccounts.name,
      createdAt: savingsGoals.createdAt,
    })
    .from(savingsGoals)
    .leftJoin(financeAccounts, eq(savingsGoals.financeAccountId, financeAccounts.id))
    .where(eq(savingsGoals.userId, userId))
    .orderBy(desc(savingsGoals.createdAt));
}

export async function getUserDebts(userId: string) {
  return db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(
      sql`CASE WHEN ${debts.status} = 'paid' THEN 2 ELSE 1 END`,
      desc(debts.createdAt)
    );
}

export interface CategoryStatItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinancialAdvice {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  description: string;
  metric?: string;
}

export interface FinanceSummary {
  totalBalance: number;
  freeBalance: number;
  todayIncome: number;
  todayExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNetSavings: number;
  monthlySavingsRate: number;
  allTimeIncome: number;
  allTimeExpense: number;
  allTimeNetSavings: number;
  accountCount: number;
  totalTransactionsCount: number;
  incomeCount: number;
  expenseCount: number;
  dailyAvgExpense: number;
  avgExpensePerTx: number;
  safeDailySpend: number;
  expenseToIncomeRatio: number;
  largestExpense: {
    description: string;
    amount: number;
  } | null;
  topExpenseCategories: CategoryStatItem[];
  totalSavingsTarget: number;
  totalSavingsCurrent: number;
  savingsProgressRate: number;
  totalDebtRemaining: number;
  totalReceivableRemaining: number;
  monthlyInstallmentDue: number;
  financialAdvice: FinancialAdvice[];
}

export async function getFinanceSummary(userId: string): Promise<FinanceSummary> {
  const accounts = await getUserAccounts(userId);
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const [allTx, savings, userDebtsList] = await Promise.all([
    db
      .select({
        id: financeTransactions.id,
        type: financeTransactions.type,
        amount: financeTransactions.amount,
        description: financeTransactions.description,
        transactionDate: financeTransactions.transactionDate,
        categoryId: financeTransactions.categoryId,
        categoryName: financeCategories.name,
      })
      .from(financeTransactions)
      .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
      .where(
        and(
          eq(financeTransactions.userId, userId),
          sql`${financeTransactions.voidedAt} is null`
        )
      ),
    db
      .select({
        targetAmount: savingsGoals.targetAmount,
        currentAmount: savingsGoals.currentAmount,
      })
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId)),
    db
      .select({
        id: debts.id,
        type: debts.type,
        amount: debts.amount,
        paidAmount: debts.paidAmount,
        dueDate: debts.dueDate,
        status: debts.status,
        isInstallment: debts.isInstallment,
        totalInstallments: debts.totalInstallments,
        paidInstallments: debts.paidInstallments,
        installmentAmount: debts.installmentAmount,
        dueDay: debts.dueDay,
        interestType: debts.interestType,
        interestRate: debts.interestRate,
        interestAmount: debts.interestAmount,
      })
      .from(debts)
      .where(eq(debts.userId, userId)),
  ]);

  let todayIncome = 0;
  let todayExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let allTimeIncome = 0;
  let allTimeExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let largestExpenseItem: { description: string; amount: number } | null = null;

  const categoryMap = new Map<string, { total: number; count: number }>();

  allTx.forEach((tx) => {
    const amt = Number(tx.amount || 0);
    const date = new Date(tx.transactionDate);

    if (tx.type === "income") {
      allTimeIncome += amt;
      incomeCount++;
      if (date >= startOfMonth) monthlyIncome += amt;
      if (date >= startOfToday) todayIncome += amt;
    } else if (tx.type === "expense") {
      allTimeExpense += amt;
      expenseCount++;
      if (date >= startOfMonth) monthlyExpense += amt;
      if (date >= startOfToday) todayExpense += amt;

      if (!largestExpenseItem || amt > largestExpenseItem.amount) {
        largestExpenseItem = {
          description: tx.description || "Pengeluaran",
          amount: amt,
        };
      }

      const catName = tx.categoryName || "Lain-lain";
      const existing = categoryMap.get(catName) || { total: 0, count: 0 };
      categoryMap.set(catName, {
        total: existing.total + amt,
        count: existing.count + 1,
      });
    }
  });

  const topExpenseCategories: CategoryStatItem[] = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.total,
      count: data.count,
      percentage: allTimeExpense > 0 ? Math.round((data.total / allTimeExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  let totalSavingsTarget = 0;
  let totalSavingsCurrent = 0;
  savings.forEach((s) => {
    totalSavingsTarget += Number(s.targetAmount || 0);
    totalSavingsCurrent += Number(s.currentAmount || 0);
  });
  const savingsProgressRate =
    totalSavingsTarget > 0 ? Math.min(100, Math.round((totalSavingsCurrent / totalSavingsTarget) * 100)) : 0;

  const monthlyNetSavings = monthlyIncome - monthlyExpense;
  const monthlySavingsRate =
    monthlyIncome > 0 ? Math.max(0, Math.round((monthlyNetSavings / monthlyIncome) * 100)) : 0;
  const allTimeNetSavings = allTimeIncome - allTimeExpense;

  const currentDay = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);
  const dailyAvgExpense = Math.round(monthlyExpense / currentDay);
  const avgExpensePerTx = expenseCount > 0 ? Math.round(allTimeExpense / expenseCount) : 0;
  const expenseToIncomeRatio =
    allTimeIncome > 0 ? Math.round((allTimeExpense / allTimeIncome) * 100) : 0;

  const freeBalance = Math.max(0, totalBalance - totalSavingsCurrent);
  const safeRemainingBudget = Math.max(
    0,
    monthlyIncome > 0 ? Math.round(monthlyIncome * 0.75 - monthlyExpense) : 0
  );
  const safeDailySpend = Math.round(safeRemainingBudget / daysRemaining);

  const formatIDRText = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const financialAdvice: FinancialAdvice[] = [];

  // Advice 1: Cashflow Health & Surplus
  if (monthlyIncome > 0 && monthlyNetSavings < 0) {
    financialAdvice.push({
      type: "warning",
      title: "Peringatan Defisit Cashflow",
      description: `Pengeluaran bulan ini melebihi pemasukan sebesar ${formatIDRText(monthlyExpense - monthlyIncome)}. Anda berisiko memakan tabungan pokok jika tidak dikendalikan.`,
      metric: `Defisit ${formatIDRText(monthlyExpense - monthlyIncome)}`,
    });
  } else if (monthlyIncome > 0 && monthlySavingsRate >= 20) {
    financialAdvice.push({
      type: "success",
      title: "Arus Kas Sangat Sehat",
      description: `Anda berhasil menyisihkan ${monthlySavingsRate}% pemasukan bulan ini (${formatIDRText(monthlyNetSavings)}). Surplus ini siap dialokasikan ke target belanja masa depan.`,
      metric: `${monthlySavingsRate}% Tersimpan`,
    });
  } else if (monthlyIncome > 0) {
    financialAdvice.push({
      type: "tip",
      title: "Optimalkan Rasio Tabungan",
      description: `Saat ini Anda menyisihkan ${monthlySavingsRate}% pemasukan. Standar finansial sehat merekomendasikan minimal 20% langsung diamankan ke tabungan.`,
      metric: "Target Tabungan: 20%",
    });
  }

  // Advice 2: Batas Belanja Aman Harian
  if (monthlyIncome > 0) {
    financialAdvice.push({
      type: "info",
      title: "Batas Belanja Aman Harian",
      description: `Agar cashflow tetap surplus di akhir bulan, batasi pengeluaran maksimal ${formatIDRText(safeDailySpend)} / hari untuk ${daysRemaining} hari ke depan.`,
      metric: `${formatIDRText(safeDailySpend)} / hari`,
    });
  }

  // Advice 3: Kategori Pengeluaran Terbesar
  if (topExpenseCategories.length > 0 && topExpenseCategories[0].percentage >= 30) {
    const topCat = topExpenseCategories[0];
    financialAdvice.push({
      type: "warning",
      title: `Konsentrasi Belanja di ${topCat.name}`,
      description: `Kategori ${topCat.name} menyerap ${topCat.percentage}% (${formatIDRText(topCat.amount)}) dari seluruh pengeluaran Anda. Batasi belanja di pos ini untuk menambah tabungan.`,
      metric: `${topCat.percentage}% total belanja`,
    });
  }

  // Advice 4: Saldo Bebas vs Saldo Terkunci
  if (totalSavingsCurrent > 0) {
    financialAdvice.push({
      type: "tip",
      title: "Pemisahan Saldo Bebas (Safe to Spend)",
      description: `Dari total saldo ${formatIDRText(totalBalance)}, sebesar ${formatIDRText(totalSavingsCurrent)} sudah dialokasikan ke target tabungan. Saldo bebas belanja Anda adalah ${formatIDRText(freeBalance)}.`,
      metric: `${formatIDRText(freeBalance)} Bebas`,
    });
  }

  // Utang & Piutang Calculations
  let totalDebtRemaining = 0;
  let totalReceivableRemaining = 0;
  let monthlyInstallmentDue = 0;

  userDebtsList.forEach((d) => {
    const totalPrincipal = Number(d.amount);
    const totalInterest = Number(d.interestAmount || 0);
    const totalPayable = totalPrincipal + totalInterest;
    const remaining = Math.max(0, totalPayable - Number(d.paidAmount || 0));

    if (d.status !== "paid" && remaining > 0) {
      if (d.type === "debt") {
        totalDebtRemaining += remaining;
        if (d.isInstallment) {
          const installment = Number(
            d.installmentAmount ||
              Math.round(remaining / Math.max(1, (d.totalInstallments || 1) - (d.paidInstallments || 0)))
          );
          monthlyInstallmentDue += Math.min(remaining, installment);
        }
      } else if (d.type === "receivable") {
        totalReceivableRemaining += remaining;
      }
    }
  });

  if (monthlyInstallmentDue > 0) {
    financialAdvice.push({
      type: "info",
      title: "Tagihan Cicilan Bulan Ini",
      description: `Kewajiban angsuran pinjaman bulan ini adalah ${formatIDRText(monthlyInstallmentDue)}. Pastikan saldo kas Anda telah dialokasikan sebelum tanggal jatuh tempo.`,
      metric: `${formatIDRText(monthlyInstallmentDue)} / bln`,
    });
  }

  const overdueDebts = userDebtsList.filter(
    (d) => d.status !== "paid" && d.type === "debt" && d.dueDate && new Date(d.dueDate) < now
  );
  if (overdueDebts.length > 0) {
    financialAdvice.push({
      type: "warning",
      title: "Kewajiban Utang Lewat Tempo",
      description: `Terdapat ${overdueDebts.length} catatan utang yang telah melewati batas jatuh tempo. Prioritaskan pelunasan untuk menjaga skor finansial Anda.`,
      metric: `${overdueDebts.length} lewat tempo`,
    });
  }

  return {
    totalBalance,
    freeBalance,
    todayIncome,
    todayExpense,
    monthlyIncome,
    monthlyExpense,
    monthlyNetSavings,
    monthlySavingsRate,
    allTimeIncome,
    allTimeExpense,
    allTimeNetSavings,
    accountCount: accounts.length,
    totalTransactionsCount: allTx.length,
    incomeCount,
    expenseCount,
    dailyAvgExpense,
    avgExpensePerTx,
    safeDailySpend,
    expenseToIncomeRatio,
    largestExpense: largestExpenseItem,
    topExpenseCategories,
    totalSavingsTarget,
    totalSavingsCurrent,
    savingsProgressRate,
    totalDebtRemaining,
    totalReceivableRemaining,
    monthlyInstallmentDue,
    financialAdvice,
  };
}
