import { db } from "@/lib/db";
import { financeAccounts, financeCategories, financeTransactions, savingsGoals } from "@/lib/db/schema";
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
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId))
    .orderBy(desc(savingsGoals.createdAt));
}

export interface CategoryStatItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinanceSummary {
  totalBalance: number;
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
  expenseToIncomeRatio: number;
  largestExpense: {
    description: string;
    amount: number;
  } | null;
  topExpenseCategories: CategoryStatItem[];
  totalSavingsTarget: number;
  totalSavingsCurrent: number;
  savingsProgressRate: number;
}

export async function getFinanceSummary(userId: string): Promise<FinanceSummary> {
  const accounts = await getUserAccounts(userId);
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const [allTx, savings] = await Promise.all([
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
  const dailyAvgExpense = Math.round(monthlyExpense / currentDay);
  const avgExpensePerTx = expenseCount > 0 ? Math.round(allTimeExpense / expenseCount) : 0;
  const expenseToIncomeRatio =
    allTimeIncome > 0 ? Math.round((allTimeExpense / allTimeIncome) * 100) : 0;

  return {
    totalBalance,
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
    expenseToIncomeRatio,
    largestExpense: largestExpenseItem,
    topExpenseCategories,
    totalSavingsTarget,
    totalSavingsCurrent,
    savingsProgressRate,
  };
}
