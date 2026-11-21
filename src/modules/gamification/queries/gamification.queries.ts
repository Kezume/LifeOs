import { db } from "@/lib/db";
import { xpLedger, achievements, userAchievements, activityLogs } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { GamificationProfile } from "../types";

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: "Novice" },
  { level: 2, minXp: 100, title: "Apprentice" },
  { level: 3, minXp: 250, title: "Practitioner" },
  { level: 4, minXp: 500, title: "Specialist" },
  { level: 5, minXp: 1000, title: "Expert" },
  { level: 6, minXp: 2000, title: "Master" },
  { level: 7, minXp: 3500, title: "Grandmaster" },
  { level: 8, minXp: 5500, title: "Legend" },
  { level: 9, minXp: 8000, title: "Architect" },
  { level: 10, minXp: 11000, title: "Transcendence" },
];

export function calculateLevelFromXp(totalXp: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i].minXp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || {
        level: currentLevel.level + 1,
        minXp: currentLevel.minXp + 3000,
        title: "Transcendent",
      };
    } else {
      break;
    }
  }

  const xpIntoCurrent = Math.max(0, totalXp - currentLevel.minXp);
  const xpNeeded = Math.max(1, nextLevel.minXp - currentLevel.minXp);
  const progressPercentage = Math.min(100, Math.round((xpIntoCurrent / xpNeeded) * 100));

  return {
    level: currentLevel.level,
    levelTitle: currentLevel.title,
    currentLevelXp: xpIntoCurrent,
    nextLevelXp: xpNeeded,
    progressPercentage,
  };
}

export async function getGamificationProfile(userId: string): Promise<GamificationProfile> {
  // 1. Calculate total XP
  const xpSumResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${xpLedger.xpAmount}), 0)`,
    })
    .from(xpLedger)
    .where(eq(xpLedger.userId, userId));

  const totalXp = Number(xpSumResult[0]?.total || 0);
  const levelInfo = calculateLevelFromXp(totalXp);

  // 2. Fetch recent XP history
  const recentXp = await db
    .select()
    .from(xpLedger)
    .where(eq(xpLedger.userId, userId))
    .orderBy(desc(xpLedger.createdAt))
    .limit(10);

  // 3. Fetch achievements
  const allAchievements = await db.select().from(achievements);
  const userUnlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const unlockedMap = new Map<string, Date>();
  for (const ua of userUnlocked) {
    unlockedMap.set(ua.achievementId, ua.unlockedAt);
  }

  const formattedAchievements = allAchievements.map((ach) => ({
    id: ach.id,
    code: ach.code,
    name: ach.name,
    description: ach.description,
    icon: ach.icon,
    xpReward: ach.xpReward,
    unlocked: unlockedMap.has(ach.id),
    unlockedAt: unlockedMap.get(ach.id) || null,
  }));

  // 4. Fetch recent activity logs
  const activities = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(15);

  return {
    totalXp,
    ...levelInfo,
    recentXpHistory: recentXp,
    achievements: formattedAchievements,
    recentActivities: activities,
  };
}
