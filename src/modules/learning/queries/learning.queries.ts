import { db } from "@/lib/db";
import { skills, learningPaths, learningLogs } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getUserSkills(userId: string) {
  const userSkills = await db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      category: skills.category,
      currentLevel: skills.currentLevel,
      targetLevel: skills.targetLevel,
      createdAt: skills.createdAt,
    })
    .from(skills)
    .where(eq(skills.userId, userId))
    .orderBy(desc(skills.createdAt));

  // Compute total study minutes per skill
  const skillMinutes = await db
    .select({
      skillId: learningLogs.skillId,
      totalMinutes: sql<number>`sum(${learningLogs.durationMinutes})`,
    })
    .from(learningLogs)
    .where(eq(learningLogs.userId, userId))
    .groupBy(learningLogs.skillId);

  const minutesMap = new Map(skillMinutes.map((sm) => [sm.skillId, Number(sm.totalMinutes ?? 0)]));

  return userSkills.map((s) => ({
    ...s,
    totalMinutes: minutesMap.get(s.id) || 0,
    totalHours: Number(((minutesMap.get(s.id) || 0) / 60).toFixed(1)),
  }));
}

export async function getUserLearningPaths(userId: string) {
  return db
    .select({
      id: learningPaths.id,
      title: learningPaths.title,
      description: learningPaths.description,
      status: learningPaths.status,
      startDate: learningPaths.startDate,
      targetDate: learningPaths.targetDate,
      createdAt: learningPaths.createdAt,
    })
    .from(learningPaths)
    .where(eq(learningPaths.userId, userId))
    .orderBy(desc(learningPaths.createdAt));
}

export async function getRecentLearningLogs(userId: string) {
  return db
    .select({
      id: learningLogs.id,
      title: learningLogs.title,
      notes: learningLogs.notes,
      durationMinutes: learningLogs.durationMinutes,
      learnedAt: learningLogs.learnedAt,
      skillId: learningLogs.skillId,
      skillName: skills.name,
    })
    .from(learningLogs)
    .leftJoin(skills, eq(learningLogs.skillId, skills.id))
    .where(eq(learningLogs.userId, userId))
    .orderBy(desc(learningLogs.learnedAt))
    .limit(10);
}

export async function getLearningStats(userId: string) {
  const logsResult = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(${learningLogs.durationMinutes}), 0)`,
      totalSessions: sql<number>`count(*)`,
    })
    .from(learningLogs)
    .where(eq(learningLogs.userId, userId));

  const skillsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(skills)
    .where(eq(skills.userId, userId));

  const totalMinutes = Number(logsResult[0]?.totalMinutes ?? 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  return {
    totalHours,
    totalSessions: Number(logsResult[0]?.totalSessions ?? 0),
    activeSkills: Number(skillsCount[0]?.count ?? 0),
  };
}
