import { db } from "@/lib/db";
import { tasks, projects, lifeAreas } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getUserTasks(userId: string) {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      completedAt: tasks.completedAt,
      projectId: tasks.projectId,
      projectName: projects.name,
      lifeAreaId: tasks.lifeAreaId,
      lifeAreaName: lifeAreas.name,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(lifeAreas, eq(tasks.lifeAreaId, lifeAreas.id))
    .where(eq(tasks.userId, userId))
    .orderBy(
      sql`CASE 
        WHEN ${tasks.status} = 'todo' THEN 1 
        WHEN ${tasks.status} = 'in_progress' THEN 2 
        WHEN ${tasks.status} = 'completed' THEN 3 
        ELSE 4 END`,
      desc(tasks.createdAt)
    );
}

export async function getTaskStats(userId: string) {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${tasks.status} in ('todo', 'in_progress'))`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
    })
    .from(tasks)
    .where(eq(tasks.userId, userId));

  return {
    total: Number(result[0]?.total ?? 0),
    active: Number(result[0]?.active ?? 0),
    completed: Number(result[0]?.completed ?? 0),
  };
}
