import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong").max(100),
  accountType: z.enum(["cash", "bank", "ewallet", "other"]).default("bank"),
  openingBalance: z.string().default("0"),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong").max(100),
  type: z.enum(["income", "expense"]),
});

export const createTransactionSchema = z.object({
  accountId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(["income", "expense", "transfer"]).default("expense"),
  amount: z.string().min(1, "Nominal tidak boleh kosong"),
  description: z.string().optional(),
  transferToAccountId: z.string().uuid().optional().nullable(),
});

export const createSavingsGoalSchema = z.object({
  title: z.string().min(1, "Nama target tabungan tidak boleh kosong").max(100),
  targetAmount: z.string().min(1, "Target nominal tidak boleh kosong"),
  currentAmount: z.string().optional().default("0"),
  targetDate: z.string().optional().nullable(),
  financeAccountId: z.string().uuid().optional().nullable(),
});

export const depositToSavingsGoalSchema = z.object({
  goalId: z.string().uuid("ID target tidak valid"),
  accountId: z.string().uuid("ID akun tidak valid"),
  amount: z.string().min(1, "Nominal tidak boleh kosong"),
});

export const withdrawFromSavingsGoalSchema = z.object({
  goalId: z.string().uuid("ID target tidak valid"),
  accountId: z.string().uuid("ID akun tidak valid"),
  amount: z.string().min(1, "Nominal tidak boleh kosong"),
});

export type CreateAccountInput = z.input<typeof createAccountSchema>;
export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type CreateSavingsGoalInput = z.input<typeof createSavingsGoalSchema>;
export type DepositToSavingsGoalInput = z.input<typeof depositToSavingsGoalSchema>;
export type WithdrawFromSavingsGoalInput = z.input<typeof withdrawFromSavingsGoalSchema>;
