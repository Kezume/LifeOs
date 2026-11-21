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

export async function getFinanceSummary(userId: string) {
  const accounts = await getUserAccounts(userId);
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const allTx = await db
    .select({
      type: financeTransactions.type,
      amount: financeTransactions.amount,
      transactionDate: financeTransactions.transactionDate,
    })
    .from(financeTransactions)
    .where(
      and(
        eq(financeTransactions.userId, userId),
        sql`${financeTransactions.voidedAt} is null`
      )
    );

  let todayIncome = 0;
  let todayExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let allTimeIncome = 0;
  let allTimeExpense = 0;

  allTx.forEach((tx) => {
    const amt = Number(tx.amount || 0);
    const date = new Date(tx.transactionDate);

    if (tx.type === "income") {
      allTimeIncome += amt;
      if (date >= startOfMonth) monthlyIncome += amt;
      if (date >= startOfToday) todayIncome += amt;
    } else if (tx.type === "expense") {
      allTimeExpense += amt;
      if (date >= startOfMonth) monthlyExpense += amt;
      if (date >= startOfToday) todayExpense += amt;
    }
  });

  return {
    totalBalance,
    todayIncome,
    todayExpense,
    monthlyIncome,
    monthlyExpense,
    allTimeIncome,
    allTimeExpense,
    accountCount: accounts.length,
  };
}
