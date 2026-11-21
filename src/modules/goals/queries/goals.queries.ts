import { db } from "@/lib/db";
import { goals, goalMilestones, lifeAreas } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserGoals(userId: string) {
  const userGoals = await db
    .select({
      id: goals.id,
      title: goals.title,
      description: goals.description,
      timeframe: goals.timeframe,
      status: goals.status,
      startDate: goals.startDate,
      targetDate: goals.targetDate,
      progressMode: goals.progressMode,
      manualProgress: goals.manualProgress,
      lifeAreaName: lifeAreas.name,
      createdAt: goals.createdAt,
    })
    .from(goals)
    .leftJoin(lifeAreas, eq(goals.lifeAreaId, lifeAreas.id))
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));

  const milestones = await db
    .select()
    .from(goalMilestones)
    .where(eq(goalMilestones.userId, userId))
    .orderBy(goalMilestones.position, goalMilestones.createdAt);

  const milestoneMap = new Map<string, typeof milestones>();
  milestones.forEach((m) => {
    if (!milestoneMap.has(m.goalId)) milestoneMap.set(m.goalId, []);
    milestoneMap.get(m.goalId)!.push(m);
  });

  return userGoals.map((g) => {
    const gMilestones = milestoneMap.get(g.id) || [];
    let progress = Number(g.manualProgress || 0);

    if (g.progressMode === "milestones" && gMilestones.length > 0) {
      const completed = gMilestones.filter((m) => m.status === "completed").length;
      progress = Math.round((completed / gMilestones.length) * 100);
    }

    return {
      ...g,
      milestones: gMilestones,
      progress,
    };
  });
}

export async function getGoalStats(userId: string) {
  const allGoals = await db
    .select({ status: goals.status })
    .from(goals)
    .where(eq(goals.userId, userId));

  return {
    total: allGoals.length,
    active: allGoals.filter((g) => g.status === "active").length,
    completed: allGoals.filter((g) => g.status === "completed").length,
  };
}
