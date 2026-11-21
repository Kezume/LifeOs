import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { getUserGoals, getGoalStats } from "@/modules/goals/queries/goals.queries";
import { GoalsManager } from "@/modules/goals/components/goals-manager";

export default async function GoalsPage() {
  const user = await requireUser();

  const [goals, stats] = await Promise.all([
    getUserGoals(user.id),
    getGoalStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Goals & Growth
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Tetapkan target hidup jangka pendek hingga panjang dan pantau pencapaian milestone Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Target Aktif:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {stats.active}
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Tercapai:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--success)]">
              {stats.completed}
            </span>
          </div>
        </div>
      </div>

      <GoalsManager goals={goals} />
    </div>
  );
}
