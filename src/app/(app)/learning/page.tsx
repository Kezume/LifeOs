import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import {
  getUserSkills,
  getUserLearningPaths,
  getRecentLearningLogs,
  getLearningStats,
} from "@/modules/learning/queries/learning.queries";
import { LearningManager } from "@/modules/learning/components/learning-manager";

export default async function LearningPage() {
  const user = await requireUser();

  const [skills, paths, logs, stats] = await Promise.all([
    getUserSkills(user.id),
    getUserLearningPaths(user.id),
    getRecentLearningLogs(user.id),
    getLearningStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Learning & Skills
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Kelola peta keahlian, kurikulum belajar mandiri, dan riwayat jam belajar Anda
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Total Waktu:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {stats.totalHours} jam
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Keahlian:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {stats.activeSkills} skill
            </span>
          </div>
        </div>
      </div>

      {/* Main Learning Management UI */}
      <LearningManager skills={skills} learningPaths={paths} recentLogs={logs} />
    </div>
  );
}
