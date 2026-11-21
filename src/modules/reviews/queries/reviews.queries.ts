import { db } from "@/lib/db";
import { lifeReviews } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getUserReviews(userId: string) {
  return db
    .select()
    .from(lifeReviews)
    .where(eq(lifeReviews.userId, userId))
    .orderBy(desc(lifeReviews.periodStart));
}

export async function getCurrentReview(
  userId: string,
  reviewType: string,
  periodStart: string,
  periodEnd: string
) {
  const [review] = await db
    .select()
    .from(lifeReviews)
    .where(
      and(
        eq(lifeReviews.userId, userId),
        eq(lifeReviews.reviewType, reviewType),
        eq(lifeReviews.periodStart, periodStart),
        eq(lifeReviews.periodEnd, periodEnd)
      )
    )
    .limit(1);

  return review || null;
}
