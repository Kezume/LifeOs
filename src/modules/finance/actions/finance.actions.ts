"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { financeAccounts, financeCategories, financeTransactions, savingsGoals } from "@/lib/db/schema";
import {
  createAccountSchema,
  createCategorySchema,
  createTransactionSchema,
  createSavingsGoalSchema,
  depositToSavingsGoalSchema,
  withdrawFromSavingsGoalSchema,
  CreateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  CreateSavingsGoalInput,
  DepositToSavingsGoalInput,
  WithdrawFromSavingsGoalInput,
} from "../schemas/finance.schema";
import { eq, and } from "drizzle-orm";

export async function createAccountAction(data: CreateAccountInput) {
  const user = await requireUser();
  const parsed = createAccountSchema.parse(data);

  const [account] = await db
    .insert(financeAccounts)
    .values({
      userId: user.id,
      name: parsed.name,
      accountType: parsed.accountType,
      openingBalance: parsed.openingBalance || "0",
    })
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, account };
}

export async function createCategoryAction(data: CreateCategoryInput) {
  const user = await requireUser();
  const parsed = createCategorySchema.parse(data);

  const [category] = await db
    .insert(financeCategories)
    .values({
      userId: user.id,
      name: parsed.name,
      type: parsed.type,
    })
    .returning();

  revalidatePath("/finance");
  return { success: true, category };
}

export async function createTransactionAction(data: CreateTransactionInput) {
  const user = await requireUser();
  const parsed = createTransactionSchema.parse(data);

  let targetAccountId = parsed.accountId;
  if (!targetAccountId) {
    const existing = await db
      .select({ id: financeAccounts.id })
      .from(financeAccounts)
      .where(eq(financeAccounts.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      targetAccountId = existing[0].id;
    } else {
      const [defaultAcc] = await db
        .insert(financeAccounts)
        .values({
          userId: user.id,
          name: "Dompet Utama",
          accountType: "cash",
          openingBalance: "0",
        })
        .returning();
      targetAccountId = defaultAcc.id;
    }
  }

  const [tx] = await db
    .insert(financeTransactions)
    .values({
      userId: user.id,
      accountId: targetAccountId,
      categoryId: parsed.categoryId || null,
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description || null,
      transferToAccountId: parsed.transferToAccountId || null,
      transactionDate: new Date(),
    })
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, transaction: tx };
}

export async function deleteTransactionAction(txId: string) {
  const user = await requireUser();

  await db
    .delete(financeTransactions)
    .where(and(eq(financeTransactions.id, txId), eq(financeTransactions.userId, user.id)));

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAllTransactionsAction() {
  const user = await requireUser();

  await db
    .delete(financeTransactions)
    .where(eq(financeTransactions.userId, user.id));

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createSavingsGoalAction(data: CreateSavingsGoalInput) {
  const user = await requireUser();
  const parsed = createSavingsGoalSchema.parse(data);

  const [goal] = await db
    .insert(savingsGoals)
    .values({
      userId: user.id,
      title: parsed.title,
      targetAmount: parsed.targetAmount,
      currentAmount: parsed.currentAmount || "0",
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
      financeAccountId: parsed.financeAccountId || null,
    })
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, savingsGoal: goal };
}

export async function depositToSavingsGoalAction(data: DepositToSavingsGoalInput) {
  const user = await requireUser();
  const parsed = depositToSavingsGoalSchema.parse(data);

  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.id, parsed.goalId), eq(savingsGoals.userId, user.id)))
    .limit(1);

  if (!goal) {
    throw new Error("Target tabungan tidak ditemukan");
  }

  const depositAmt = Number(parsed.amount);
  if (isNaN(depositAmt) || depositAmt <= 0) {
    throw new Error("Nominal setoran tidak valid");
  }

  // 1. Catat transaksi alokasi/pengeluaran dari akun terpilih
  await db.insert(financeTransactions).values({
    userId: user.id,
    accountId: parsed.accountId,
    type: "expense",
    amount: parsed.amount,
    description: `Setoran Target: ${goal.title}`,
    transactionDate: new Date(),
  });

  // 2. Tambah saldo terkumpul pada target
  const newAmount = Number(goal.currentAmount || 0) + depositAmt;
  const [updatedGoal] = await db
    .update(savingsGoals)
    .set({
      currentAmount: String(newAmount),
      updatedAt: new Date(),
    })
    .where(eq(savingsGoals.id, goal.id))
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, savingsGoal: updatedGoal };
}

export async function withdrawFromSavingsGoalAction(data: WithdrawFromSavingsGoalInput) {
  const user = await requireUser();
  const parsed = withdrawFromSavingsGoalSchema.parse(data);

  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.id, parsed.goalId), eq(savingsGoals.userId, user.id)))
    .limit(1);

  if (!goal) {
    throw new Error("Target tabungan tidak ditemukan");
  }

  const withdrawAmt = Number(parsed.amount);
  if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
    throw new Error("Nominal penarikan tidak valid");
  }

  const currentAmt = Number(goal.currentAmount || 0);
  const actualWithdraw = Math.min(currentAmt, withdrawAmt);

  // 1. Catat transaksi pemasukan kembali ke akun
  await db.insert(financeTransactions).values({
    userId: user.id,
    accountId: parsed.accountId,
    type: "income",
    amount: String(actualWithdraw),
    description: `Penarikan Target: ${goal.title}`,
    transactionDate: new Date(),
  });

  // 2. Kurangi saldo terkumpul pada target
  const newAmount = Math.max(0, currentAmt - actualWithdraw);
  const [updatedGoal] = await db
    .update(savingsGoals)
    .set({
      currentAmount: String(newAmount),
      updatedAt: new Date(),
    })
    .where(eq(savingsGoals.id, goal.id))
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, savingsGoal: updatedGoal };
}

export async function deleteSavingsGoalAction(goalId: string) {
  const user = await requireUser();

  await db
    .delete(savingsGoals)
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, user.id)));

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
