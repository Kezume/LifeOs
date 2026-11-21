import { db } from "@/lib/db";
import { projects, projectMilestones, tasks, lifeAreas } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getUserProjects(userId: string) {
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      priority: projects.priority,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      completedAt: projects.completedAt,
      lifeAreaId: projects.lifeAreaId,
      lifeAreaName: lifeAreas.name,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(lifeAreas, eq(projects.lifeAreaId, lifeAreas.id))
    .where(eq(projects.userId, userId))
    .orderBy(
      sql`CASE 
        WHEN ${projects.status} = 'active' THEN 1 
        WHEN ${projects.status} = 'planned' THEN 2 
        WHEN ${projects.status} = 'on_hold' THEN 3 
        WHEN ${projects.status} = 'completed' THEN 4 
        ELSE 5 END`,
      desc(projects.createdAt)
    );

  // Fetch all milestones for these projects
  const milestones = await db
    .select()
    .from(projectMilestones)
    .where(eq(projectMilestones.userId, userId))
    .orderBy(projectMilestones.position, projectMilestones.createdAt);

  // Fetch task counts per project
  const taskCounts = await db
    .select({
      projectId: tasks.projectId,
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
    })
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .groupBy(tasks.projectId);

  const taskCountMap = new Map(
    taskCounts.map((tc) => [tc.projectId, { total: Number(tc.total), completed: Number(tc.completed) }])
  );

  const milestoneMap = new Map<string, typeof milestones>();
  milestones.forEach((m) => {
    if (!milestoneMap.has(m.projectId)) {
      milestoneMap.set(m.projectId, []);
    }
    milestoneMap.get(m.projectId)!.push(m);
  });

  return userProjects.map((p) => {
    const pMilestones = milestoneMap.get(p.id) || [];
    const pTasks = taskCountMap.get(p.id) || { total: 0, completed: 0 };

    // Calculate progress
    let progress = 0;
    const totalItems = pMilestones.length + pTasks.total;
    const completedItems =
      pMilestones.filter((m) => m.status === "completed").length + pTasks.completed;

    if (totalItems > 0) {
      progress = Math.round((completedItems / totalItems) * 100);
    } else if (p.status === "completed") {
      progress = 100;
    }

    return {
      ...p,
      milestones: pMilestones,
      taskCount: pTasks.total,
      completedTaskCount: pTasks.completed,
      progress,
    };
  });
}

export async function getProjectStats(userId: string) {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${projects.status} = 'active')`,
      completed: sql<number>`count(*) filter (where ${projects.status} = 'completed')`,
    })
    .from(projects)
    .where(eq(projects.userId, userId));

  return {
    total: Number(result[0]?.total ?? 0),
    active: Number(result[0]?.active ?? 0),
    completed: Number(result[0]?.completed ?? 0),
  };
}
