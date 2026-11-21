import { pgTable, text, timestamp, uuid, integer, date, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"), // Programming, Design, Language, etc.
    currentLevel: integer("current_level").notNull().default(1),
    targetLevel: integer("target_level").default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("skills_user_id_idx").on(table.userId),
  ]
);

export const learningPaths = pgTable(
  "learning_paths",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"), // planned, active, completed, paused
    startDate: date("start_date"),
    targetDate: date("target_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("learning_paths_user_id_idx").on(table.userId),
  ]
);

export const learningResources = pgTable(
  "learning_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    learningPathId: uuid("learning_path_id").references(() => learningPaths.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    resourceUrl: text("resource_url"),
    resourceType: text("resource_type").notNull().default("article"), // article, video, course, book, other
    status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("learning_resources_path_id_idx").on(table.learningPathId),
    index("learning_resources_user_id_idx").on(table.userId),
  ]
);

export const learningLogs = pgTable(
  "learning_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    learningPathId: uuid("learning_path_id").references(() => learningPaths.id, { onDelete: "set null" }),
    skillId: uuid("skill_id").references(() => skills.id, { onDelete: "set null" }),
    resourceId: uuid("resource_id").references(() => learningResources.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    notes: text("notes"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    learnedAt: timestamp("learned_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("learning_logs_user_id_idx").on(table.userId),
    index("learning_logs_learned_at_idx").on(table.learnedAt),
    index("learning_logs_skill_id_idx").on(table.skillId),
  ]
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type LearningPath = typeof learningPaths.$inferSelect;
export type NewLearningPath = typeof learningPaths.$inferInsert;
export type LearningResource = typeof learningResources.$inferSelect;
export type NewLearningResource = typeof learningResources.$inferInsert;
export type LearningLog = typeof learningLogs.$inferSelect;
export type NewLearningLog = typeof learningLogs.$inferInsert;
