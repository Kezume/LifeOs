import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(), // 'task', 'routine', 'project', 'learning', 'finance', 'knowledge', 'goal', 'review'
    entityId: text("entity_id"),
    action: text("action").notNull(), // 'created', 'updated', 'completed', 'archived', 'deleted'
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_logs_user_idx").on(table.userId, table.createdAt),
  ]
);
