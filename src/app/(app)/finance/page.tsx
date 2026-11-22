import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import {
  getUserAccounts,
  getUserCategories,
  getUserTransactions,
  getUserSavingsGoals,
  getUserDebts,
  getFinanceSummary,
} from "@/modules/finance/queries/finance.queries";
import { getWhatsappConnection } from "@/modules/finance/actions/whatsapp.actions";
import { FinanceManager } from "@/modules/finance/components/finance-manager";

export default async function FinancePage() {
  const user = await requireUser();

  const [accounts, categories, transactions, savings, debts, summary, whatsappConnection] = await Promise.all([
    getUserAccounts(user.id),
    getUserCategories(user.id),
    getUserTransactions(user.id),
    getUserSavingsGoals(user.id),
    getUserDebts(user.id),
    getFinanceSummary(user.id),
    getWhatsappConnection(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Personal Finance
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Kelola saldo multi-akun, pencatatan transaksi cashflow, utang piutang, dan integrasi WhatsApp
          </p>
        </div>
      </div>

      <FinanceManager
        accounts={accounts}
        categories={categories}
        transactions={transactions}
        savings={savings}
        debts={debts}
        summary={summary}
        whatsappConnection={whatsappConnection}
      />
    </div>
  );
}
