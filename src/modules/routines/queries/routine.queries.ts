import { db } from "@/lib/db";
import { routines, routineLogs, lifeAreas } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getUserRoutines(userId: string, todayDate: string) {
  const userRoutines = await db
    .select({
      id: routines.id,
      name: routines.name,
      description: routines.description,
      frequency: routines.frequency,
      isActive: routines.isActive,
      lifeAreaId: routines.lifeAreaId,
      lifeAreaName: lifeAreas.name,
      createdAt: routines.createdAt,
    })
    .from(routines)
    .leftJoin(lifeAreas, eq(routines.lifeAreaId, lifeAreas.id))
    .where(and(eq(routines.userId, userId), eq(routines.isActive, true)))
    .orderBy(desc(routines.createdAt));

  // Fetch today's completed routine logs for this user
  const todayLogs = await db
    .select({
      routineId: routineLogs.routineId,
    })
    .from(routineLogs)
    .where(and(eq(routineLogs.userId, userId), eq(routineLogs.completedOn, todayDate)));

  const completedSet = new Set(todayLogs.map((l) => l.routineId));

  return userRoutines.map((routine) => ({
    ...routine,
    isCompletedToday: completedSet.has(routine.id),
  }));
}

export async function getRoutineStats(userId: string, todayDate: string) {
  // Count total active routines
  const totalRoutines = await db
    .select({ count: sql<number>`count(*)` })
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.isActive, true)));

  // Count logs today
  const completedToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(routineLogs)
    .where(and(eq(routineLogs.userId, userId), eq(routineLogs.completedOn, todayDate)));

  // Get distinct log dates in the past 30 days to calculate streak
  const pastDates = await db
    .select({ date: routineLogs.completedOn })
    .from(routineLogs)
    .where(eq(routineLogs.userId, userId))
    .groupBy(routineLogs.completedOn)
    .orderBy(desc(routineLogs.completedOn))
    .limit(30);

  // Simple streak calculation
  let streak = 0;
  if (pastDates.length > 0) {
    const dates = pastDates.map((d) => d.date);
    // Check if yesterday or today is logged
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const formatted = d.toISOString().split("T")[0];
      if (dates.includes(formatted)) {
        streak++;
      } else if (i === 0) {
        // Today might not be completed yet, check yesterday
        continue;
      } else {
        break;
      }
    }
  }

  return {
    total: Number(totalRoutines[0]?.count ?? 0),
    completedToday: Number(completedToday[0]?.count ?? 0),
    streakDays: streak,
  };
}
