import { db } from "@/lib/db";
import { xpLedger, achievements, userAchievements, activityLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const DEFAULT_ACHIEVEMENTS = [
  {
    code: "first_task",
    name: "First Step",
    description: "Completed your first task in LifeOS",
    icon: "CheckCircle",
    xpReward: 50,
  },
  {
    code: "routine_starter",
    name: "Habit Builder",
    description: "Logged your first daily routine check-in",
    icon: "CalendarCheck",
    xpReward: 50,
  },
  {
    code: "scholar",
    name: "Lifelong Learner",
    description: "Recorded a focused study or learning session",
    icon: "GraduationCap",
    xpReward: 50,
  },
  {
    code: "wealth_clarity",
    name: "Wealth Clarity",
    description: "Recorded your first financial transaction",
    icon: "Wallet",
    xpReward: 50,
  },
  {
    code: "visionary",
    name: "Visionary Mind",
    description: "Established a life goal with key milestones",
    icon: "Target",
    xpReward: 50,
  },
  {
    code: "reflective_soul",
    name: "Reflective Soul",
    description: "Completed a structured weekly or monthly review",
    icon: "LineChart",
    xpReward: 100,
  },
  {
    code: "quick_thinker",
    name: "Quick Thinker",
    description: "Captured an idea or note using Quick Capture",
    icon: "Zap",
    xpReward: 30,
  },
];

export async function ensureDefaultAchievements() {
  for (const ach of DEFAULT_ACHIEVEMENTS) {
    const existing = await db
      .select({ id: achievements.id })
      .from(achievements)
      .where(eq(achievements.code, ach.code))
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(achievements)
        .values({
          code: ach.code,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          xpReward: ach.xpReward,
        })
        .onConflictDoNothing();
    }
  }
}

export async function awardXpDirect(params: {
  userId: string;
  sourceType: string;
  sourceId?: string | null;
  eventKey: string;
  xpAmount: number;
  description: string;
}) {
  await ensureDefaultAchievements();

  // 1. Idempotently insert XP entry
  const [xpEntry] = await db
    .insert(xpLedger)
    .values({
      userId: params.userId,
      sourceType: params.sourceType,
      sourceId: params.sourceId || null,
      eventKey: params.eventKey,
      xpAmount: params.xpAmount,
      description: params.description,
    })
    .onConflictDoNothing()
    .returning();

  // If already awarded previously, skip
  if (!xpEntry) {
    return { success: true, awarded: false };
  }

  // 2. Log activity
  await db.insert(activityLogs).values({
    userId: params.userId,
    entityType: params.sourceType,
    entityId: params.sourceId || null,
    action: "completed",
    description: params.description,
    metadata: { xpEarned: params.xpAmount },
  });

  // 3. Check achievement unlocks
  const achievementTriggers: Record<string, string> = {
    task: "first_task",
    routine: "routine_starter",
    learning: "scholar",
    finance: "wealth_clarity",
    goal: "visionary",
    review: "reflective_soul",
    quick_capture: "quick_thinker",
  };

  const achievementCode = achievementTriggers[params.sourceType];
  if (achievementCode) {
    const [ach] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.code, achievementCode))
      .limit(1);

    if (ach) {
      const [existingUnlock] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, params.userId),
            eq(userAchievements.achievementId, ach.id)
          )
        )
        .limit(1);

      if (!existingUnlock) {
        await db.insert(userAchievements).values({
          userId: params.userId,
          achievementId: ach.id,
        });

        // Award achievement reward XP
        await db
          .insert(xpLedger)
          .values({
            userId: params.userId,
            sourceType: "achievement",
            sourceId: ach.id,
            eventKey: `ach_${ach.code}_${params.userId}`,
            xpAmount: ach.xpReward,
            description: `Achievement Unlocked: ${ach.name}`,
          })
          .onConflictDoNothing();

        await db.insert(activityLogs).values({
          userId: params.userId,
          entityType: "achievement",
          entityId: ach.id,
          action: "unlocked",
          description: `Achievement Unlocked: ${ach.name} (+${ach.xpReward} XP)`,
          metadata: { achievementCode: ach.code, xpEarned: ach.xpReward },
        });
      }
    }
  }

  return { success: true, awarded: true, xpEarned: params.xpAmount };
}
