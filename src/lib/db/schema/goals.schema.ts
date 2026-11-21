import { pgTable, text, timestamp, uuid, numeric, integer, date, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lifeAreas } from "./foundation.schema";

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lifeAreaId: uuid("life_area_id").references(() => lifeAreas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    timeframe: text("timeframe").notNull().default("mid_term"), // short_term, mid_term, long_term
    status: text("status").notNull().default("active"), // active, completed, paused, cancelled
    startDate: date("start_date"),
    targetDate: date("target_date"),
    progressMode: text("progress_mode").notNull().default("manual"), // milestones, manual
    manualProgress: numeric("manual_progress", { precision: 5, scale: 2 }).default("0"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("goals_user_id_idx").on(table.userId),
    index("goals_status_idx").on(table.status),
  ]
);

export const goalMilestones = pgTable(
  "goal_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("pending"), // pending, completed
    weight: numeric("weight", { precision: 8, scale: 2 }).notNull().default("1.0"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("goal_milestones_goal_id_idx").on(table.goalId),
    index("goal_milestones_user_id_idx").on(table.userId),
  ]
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type NewGoalMilestone = typeof goalMilestones.$inferInsert;
