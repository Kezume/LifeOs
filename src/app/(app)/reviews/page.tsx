import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import {
  getUserReviews,
  getCurrentReview,
  getLifeReviewStats,
} from "@/modules/reviews/queries/reviews.queries";
import { ReviewManager } from "@/modules/reviews/components/review-manager";

export default async function ReviewsPage() {
  const user = await requireUser();

  // Compute current week start (Monday) and end (Sunday)
  const now = new Date();
  const day = now.getDay();
  const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(now.setDate(diffToMon));
  const sun = new Date(now.setDate(diffToMon + 6));

  const periodStart = mon.toISOString().split("T")[0];
  const periodEnd = sun.toISOString().split("T")[0];

  const currentPeriod = {
    start: periodStart,
    end: periodEnd,
    label: `Minggu ${Math.ceil(mon.getDate() / 7)}`,
  };

  const [currentReview, pastReviews, overallStats] = await Promise.all([
    getCurrentReview(user.id, "weekly", periodStart, periodEnd),
    getUserReviews(user.id),
    getLifeReviewStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Life Review
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Refleksi mingguan dan evaluasi terstruktur untuk menjaga keselarasan hidup Anda
          </p>
        </div>

        {/* Quick Header Stats */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-0.5 sm:pb-0">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs flex-shrink-0">
            <span className="text-[var(--foreground-muted)]">Total Review:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {overallStats.totalReviews} sesi
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs flex-shrink-0">
            <span className="text-[var(--foreground-muted)]">Tingkat Tugas:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {overallStats.tasks.completionRate}%
            </span>
          </div>
        </div>
      </div>

      <ReviewManager
        currentReview={currentReview}
        pastReviews={pastReviews}
        currentPeriod={currentPeriod}
        overallStats={overallStats}
      />
    </div>
  );
}
