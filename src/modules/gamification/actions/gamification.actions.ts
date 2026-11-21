"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { awardXpDirect, ensureDefaultAchievements } from "../services/gamification.service";

export { ensureDefaultAchievements };

export async function awardXpAction(params: {
  sourceType: string;
  sourceId?: string | null;
  eventKey: string;
  xpAmount: number;
  description: string;
}) {
  const user = await requireUser();
  const res = await awardXpDirect({
    ...params,
    userId: user.id,
  });

  revalidatePath("/dashboard");
  return { success: true, awarded: res.awarded, xp: params.xpAmount };
}

export async function logActivityAction(params: {
  entityType: string;
  entityId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const user = await requireUser();

  await db.insert(activityLogs).values({
    userId: user.id,
    entityType: params.entityType,
    entityId: params.entityId || null,
    action: params.action,
    description: params.description,
    metadata: params.metadata || null,
  });

  revalidatePath("/dashboard");
  return { success: true };
}
