import { pgTable, text, timestamp, uuid, date, index, unique } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const lifeReviews = pgTable(
  "life_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reviewType: text("review_type").notNull().default("weekly"), // daily, weekly, monthly, yearly
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    highlights: text("highlights"),
    challenges: text("challenges"),
    reflection: text("reflection"),
    nextFocus: text("next_focus"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("life_reviews_user_type_period_unique").on(
      table.userId,
      table.reviewType,
      table.periodStart,
      table.periodEnd
    ),
    index("life_reviews_user_id_idx").on(table.userId),
    index("life_reviews_type_idx").on(table.reviewType),
  ]
);

export type LifeReview = typeof lifeReviews.$inferSelect;
export type NewLifeReview = typeof lifeReviews.$inferInsert;
