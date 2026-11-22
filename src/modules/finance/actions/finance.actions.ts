"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { financeAccounts, financeCategories, financeTransactions, savingsGoals, debts } from "@/lib/db/schema";
import {
  createAccountSchema,
  createCategorySchema,
  createTransactionSchema,
  createSavingsGoalSchema,
  depositToSavingsGoalSchema,
  withdrawFromSavingsGoalSchema,
  createDebtSchema,
  payDebtSchema,
  CreateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  CreateSavingsGoalInput,
  DepositToSavingsGoalInput,
  WithdrawFromSavingsGoalInput,
  CreateDebtInput,
  PayDebtInput,
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

export async function createDebtAction(data: CreateDebtInput) {
  const user = await requireUser();
  const parsed = createDebtSchema.parse(data);

  const principal = Number(parsed.amount);
  const months = parsed.isInstallment ? (parsed.totalInstallments || 1) : 1;
  let computedInterest = 0;

  if (parsed.interestType === "percentage_monthly" && parsed.interestRate) {
    const rate = Number(parsed.interestRate);
    if (!isNaN(rate) && rate > 0) {
      computedInterest = Math.round(principal * (rate / 100) * months);
    }
  } else if (parsed.interestType === "fixed_amount" && parsed.interestAmount) {
    const fixed = Number(parsed.interestAmount);
    if (!isNaN(fixed) && fixed > 0) {
      computedInterest = Math.round(fixed);
    }
  }

  const totalPayable = principal + computedInterest;

  let installmentAmt = parsed.installmentAmount;
  if (parsed.isInstallment && (!installmentAmt || installmentAmt === "0")) {
    installmentAmt = String(Math.round(totalPayable / months));
  }

  // Jika dueDate tidak diisi tapi dueDay diisi, hitung tanggal jatuh tempo siklus pertama
  let finalDueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
  if (!finalDueDate && parsed.dueDay) {
    const now = new Date();
    finalDueDate = new Date(now.getFullYear(), now.getMonth(), parsed.dueDay, 12, 0, 0);
    if (finalDueDate < now) {
      finalDueDate.setMonth(finalDueDate.getMonth() + 1);
    }
  }

  const [newDebt] = await db
    .insert(debts)
    .values({
      userId: user.id,
      type: parsed.type,
      personName: parsed.personName.trim(),
      amount: parsed.amount,
      paidAmount: "0",
      dueDate: finalDueDate,
      status: "unpaid",
      notes: parsed.notes?.trim() || null,
      isInstallment: parsed.isInstallment || false,
      totalInstallments: parsed.isInstallment ? (parsed.totalInstallments || 1) : 1,
      paidInstallments: 0,
      installmentAmount: parsed.isInstallment ? installmentAmt : null,
      dueDay: parsed.dueDay || null,
      interestType: parsed.interestType || "none",
      interestRate: parsed.interestRate || null,
      interestAmount: String(computedInterest),
    })
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, debt: newDebt };
}

export async function payDebtAction(data: PayDebtInput) {
  const user = await requireUser();
  const parsed = payDebtSchema.parse(data);

  const [existingDebt] = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, parsed.debtId), eq(debts.userId, user.id)))
    .limit(1);

  if (!existingDebt) {
    throw new Error("Data utang/piutang tidak ditemukan");
  }

  const payAmt = Number(parsed.amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    throw new Error("Nominal pembayaran tidak valid");
  }

  const currentPaid = Number(existingDebt.paidAmount || 0);
  const totalPrincipal = Number(existingDebt.amount);
  const totalInterest = Number(existingDebt.interestAmount || 0);
  const totalPayable = totalPrincipal + totalInterest;

  const newPaidAmount = Math.min(totalPayable, currentPaid + payAmt);
  const isFullyPaid = newPaidAmount >= totalPayable;

  // Hitung siklus cicilan baru jika skema cicilan
  let newPaidInstallments = existingDebt.paidInstallments || 0;
  let newDueDate = existingDebt.dueDate ? new Date(existingDebt.dueDate) : null;

  if (existingDebt.isInstallment) {
    if (isFullyPaid) {
      newPaidInstallments = existingDebt.totalInstallments;
    } else {
      newPaidInstallments = Math.min(
        existingDebt.totalInstallments,
        newPaidInstallments + 1
      );
      // Majukan tanggal jatuh tempo siklus berikutnya jika ada tanggal jatuh tempo
      if (newDueDate) {
        newDueDate = new Date(newDueDate);
        newDueDate.setMonth(newDueDate.getMonth() + 1);
      }
    }
  }

  const newStatus = isFullyPaid || (existingDebt.isInstallment && newPaidInstallments >= existingDebt.totalInstallments)
    ? "paid"
    : "partial";

  // 1. Jika pengguna memilih akun kas, catat transaksi kas otomatis agar saldo dan cashflow terintegrasi
  if (parsed.accountId) {
    const isDebt = existingDebt.type === "debt";
    let desc = isDebt
      ? `Bayar Utang: ${existingDebt.personName}`
      : `Terima Piutang: ${existingDebt.personName}`;

    if (existingDebt.isInstallment) {
      desc = isDebt
        ? `Bayar Cicilan ke-${newPaidInstallments}/${existingDebt.totalInstallments}: ${existingDebt.personName}`
        : `Terima Cicilan ke-${newPaidInstallments}/${existingDebt.totalInstallments}: ${existingDebt.personName}`;
    }

    await db.insert(financeTransactions).values({
      userId: user.id,
      accountId: parsed.accountId,
      type: isDebt ? "expense" : "income",
      amount: parsed.amount,
      description: desc,
      transactionDate: new Date(),
    });
  }

  // 2. Perbarui record utang/piutang
  const [updatedDebt] = await db
    .update(debts)
    .set({
      paidAmount: String(newPaidAmount),
      paidInstallments: newPaidInstallments,
      dueDate: newDueDate,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(debts.id, existingDebt.id))
    .returning();

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, debt: updatedDebt };
}

export async function deleteDebtAction(debtId: string) {
  const user = await requireUser();

  await db
    .delete(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, user.id)));

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
