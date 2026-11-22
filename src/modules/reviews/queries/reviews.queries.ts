import { db } from "@/lib/db";
import { lifeReviews } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getTaskStats } from "@/modules/tasks/queries/task.queries";
import { getRoutineStats } from "@/modules/routines/queries/routine.queries";
import { getLearningStats } from "@/modules/learning/queries/learning.queries";
import { getGoalStats } from "@/modules/goals/queries/goals.queries";
import { getProjectStats } from "@/modules/projects/queries/project.queries";
import { getGamificationProfile } from "@/modules/gamification/queries/gamification.queries";

export interface LifeReviewOverallStats {
  totalReviews: number;
  tasks: {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
  };
  routines: {
    total: number;
    completedToday: number;
    streakDays: number;
  };
  learning: {
    totalHours: number;
    totalSessions: number;
    activeSkills: number;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  gamification: {
    level: number;
    levelTitle: string;
    totalXp: number;
    progressPercentage: number;
  };
}

export async function getUserReviews(userId: string) {
  return db
    .select()
    .from(lifeReviews)
    .where(eq(lifeReviews.userId, userId))
    .orderBy(desc(lifeReviews.periodStart));
}

export async function getCurrentReview(
  userId: string,
  reviewType: string,
  periodStart: string,
  periodEnd: string
) {
  const [review] = await db
    .select()
    .from(lifeReviews)
    .where(
      and(
        eq(lifeReviews.userId, userId),
        eq(lifeReviews.reviewType, reviewType),
        eq(lifeReviews.periodStart, periodStart),
        eq(lifeReviews.periodEnd, periodEnd)
      )
    )
    .limit(1);

  return review || null;
}

export async function getLifeReviewStats(userId: string): Promise<LifeReviewOverallStats> {
  const todayDate = new Date().toISOString().split("T")[0];

  const [
    allReviews,
    taskStats,
    routineStats,
    learningStats,
    goalStats,
    projectStats,
    gamification,
  ] = await Promise.all([
    db.select().from(lifeReviews).where(eq(lifeReviews.userId, userId)),
    getTaskStats(userId),
    getRoutineStats(userId, todayDate),
    getLearningStats(userId),
    getGoalStats(userId),
    getProjectStats(userId),
    getGamificationProfile(userId),
  ]);

  const taskCompletionRate =
    taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
  const goalCompletionRate =
    goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0;

  return {
    totalReviews: allReviews.length,
    tasks: {
      ...taskStats,
      completionRate: taskCompletionRate,
    },
    routines: routineStats,
    learning: learningStats,
    goals: {
      ...goalStats,
      completionRate: goalCompletionRate,
    },
    projects: projectStats,
    gamification: {
      level: gamification.level,
      levelTitle: gamification.levelTitle,
      totalXp: gamification.totalXp,
      progressPercentage: gamification.progressPercentage,
    },
  };
}
