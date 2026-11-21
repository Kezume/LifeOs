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
  CreateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  CreateSavingsGoalInput,
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
    })
    .returning();

  revalidatePath("/finance");
  return { success: true, savingsGoal: goal };
}
