import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { getUserReviews, getCurrentReview } from "@/modules/reviews/queries/reviews.queries";
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

  const [currentReview, pastReviews] = await Promise.all([
    getCurrentReview(user.id, "weekly", periodStart, periodEnd),
    getUserReviews(user.id),
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
      </div>

      <ReviewManager
        currentReview={currentReview}
        pastReviews={pastReviews}
        currentPeriod={currentPeriod}
      />
    </div>
  );
}
