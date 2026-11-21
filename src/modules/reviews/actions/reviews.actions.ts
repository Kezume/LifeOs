"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { lifeReviews } from "@/lib/db/schema";
import { saveReviewSchema, SaveReviewInput } from "../schemas/reviews.schema";

export async function saveReviewAction(data: SaveReviewInput) {
  const user = await requireUser();
  const parsed = saveReviewSchema.parse(data);

  const [saved] = await db
    .insert(lifeReviews)
    .values({
      userId: user.id,
      reviewType: parsed.reviewType,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      highlights: parsed.highlights || null,
      challenges: parsed.challenges || null,
      reflection: parsed.reflection || null,
      nextFocus: parsed.nextFocus || null,
    })
    .onConflictDoUpdate({
      target: [
        lifeReviews.userId,
        lifeReviews.reviewType,
        lifeReviews.periodStart,
        lifeReviews.periodEnd,
      ],
      set: {
        highlights: parsed.highlights || null,
        challenges: parsed.challenges || null,
        reflection: parsed.reflection || null,
        nextFocus: parsed.nextFocus || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  revalidatePath("/reviews");
  revalidatePath("/dashboard");
  return { success: true, review: saved };
}
