import { pgTable, text, timestamp, uuid, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const xpLedger = pgTable(
  "xp_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(), // 'task', 'routine', 'learning', 'project', 'finance', 'goal', 'review', 'achievement'
    sourceId: text("source_id"),
    eventKey: text("event_key").notNull(),
    xpAmount: integer("xp_amount").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("xp_ledger_user_event_idx").on(table.userId, table.eventKey),
  ]
);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  xpReward: integer("xp_reward").notNull().default(50),
  criteriaConfig: jsonb("criteria_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_achievements_user_achv_idx").on(table.userId, table.achievementId),
  ]
);
