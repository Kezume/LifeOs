import { pgTable, text, timestamp, numeric, uuid, unique, index, boolean, integer } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const financeAccounts = pgTable(
  "finance_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    accountType: text("account_type").notNull().default("bank"), // cash, bank, ewallet, other
    currency: text("currency").notNull().default("IDR"),
    openingBalance: numeric("opening_balance", { precision: 18, scale: 2 }).notNull().default("0"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("finance_accounts_user_id_idx").on(table.userId),
  ]
);

export const financeCategories = pgTable(
  "finance_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // income, expense
    color: text("color"),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("finance_categories_user_name_type_unique").on(table.userId, table.name, table.type),
    index("finance_categories_user_id_idx").on(table.userId),
  ]
);

export const financeTransactions = pgTable(
  "finance_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => financeAccounts.id, { onDelete: "cascade" }),
    transferToAccountId: uuid("transfer_to_account_id").references(() => financeAccounts.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => financeCategories.id, { onDelete: "set null" }),
    type: text("type").notNull(), // income, expense, transfer
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    description: text("description"),
    source: text("source").notNull().default("manual"), // manual, quick_capture, whatsapp_text, whatsapp_receipt
    receiptUrl: text("receipt_url"),
    rawMessage: text("raw_message"),
    transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    index("finance_transactions_user_id_idx").on(table.userId),
    index("finance_transactions_account_id_idx").on(table.accountId),
    index("finance_transactions_date_idx").on(table.transactionDate),
  ]
);

export const savingsGoals = pgTable(
  "savings_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    financeAccountId: uuid("finance_account_id").references(() => financeAccounts.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    targetAmount: numeric("target_amount", { precision: 18, scale: 2 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    targetDate: timestamp("target_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("savings_goals_user_id_idx").on(table.userId),
  ]
);

export const userWhatsappConnections = pgTable(
  "user_whatsapp_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull().unique(), // e.g. "628123456789"
    pairingCode: text("pairing_code").notNull().unique(), // e.g. "LIFE-4892"
    defaultAccountId: uuid("default_account_id").references(() => financeAccounts.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_wa_connections_user_id_idx").on(table.userId),
    index("user_wa_connections_phone_idx").on(table.phoneNumber),
  ]
);

export const debts = pgTable(
  "debts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "debt" (utang saya / saya meminjam) | "receivable" (piutang / orang meminjam ke saya)
    personName: text("person_name").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: text("status").notNull().default("unpaid"), // "unpaid" | "partial" | "paid"
    notes: text("notes"),
    isInstallment: boolean("is_installment").notNull().default(false),
    totalInstallments: integer("total_installments").notNull().default(1),
    paidInstallments: integer("paid_installments").notNull().default(0),
    installmentAmount: numeric("installment_amount", { precision: 18, scale: 2 }),
    dueDay: integer("due_day"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("debts_user_id_idx").on(table.userId),
    index("debts_type_idx").on(table.type),
    index("debts_status_idx").on(table.status),
  ]
);

export type FinanceAccount = typeof financeAccounts.$inferSelect;
export type NewFinanceAccount = typeof financeAccounts.$inferInsert;
export type FinanceCategory = typeof financeCategories.$inferSelect;
export type NewFinanceCategory = typeof financeCategories.$inferInsert;
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type NewFinanceTransaction = typeof financeTransactions.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type UserWhatsappConnection = typeof userWhatsappConnections.$inferSelect;
export type NewUserWhatsappConnection = typeof userWhatsappConnections.$inferInsert;
export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
