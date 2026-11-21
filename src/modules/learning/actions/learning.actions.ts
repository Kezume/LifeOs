"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { skills, learningPaths, learningLogs } from "@/lib/db/schema";
import {
  createSkillSchema,
  updateSkillLevelSchema,
  createLearningPathSchema,
  logLearningSessionSchema,
  CreateSkillInput,
  UpdateSkillLevelInput,
  CreateLearningPathInput,
  LogLearningSessionInput,
} from "../schemas/learning.schema";
import { eq, and } from "drizzle-orm";
import { awardXpAction } from "@/modules/gamification/actions/gamification.actions";

export async function createSkillAction(data: CreateSkillInput) {
  const user = await requireUser();
  const parsed = createSkillSchema.parse(data);

  const [newSkill] = await db
    .insert(skills)
    .values({
      userId: user.id,
      name: parsed.name,
      description: parsed.description || null,
      category: parsed.category || "General",
      currentLevel: parsed.currentLevel,
      targetLevel: parsed.targetLevel,
    })
    .returning();

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true, skill: newSkill };
}

export async function updateSkillLevelAction(data: UpdateSkillLevelInput) {
  const user = await requireUser();
  const parsed = updateSkillLevelSchema.parse(data);

  const [updated] = await db
    .update(skills)
    .set({
      currentLevel: parsed.currentLevel,
      updatedAt: new Date(),
    })
    .where(and(eq(skills.id, parsed.id), eq(skills.userId, user.id)))
    .returning();

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true, skill: updated };
}

export async function deleteSkillAction(skillId: string) {
  const user = await requireUser();

  await db
    .delete(skills)
    .where(and(eq(skills.id, skillId), eq(skills.userId, user.id)));

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createLearningPathAction(data: CreateLearningPathInput) {
  const user = await requireUser();
  const parsed = createLearningPathSchema.parse(data);

  const [newPath] = await db
    .insert(learningPaths)
    .values({
      userId: user.id,
      title: parsed.title,
      description: parsed.description || null,
      status: parsed.status,
      targetDate: parsed.targetDate || null,
    })
    .returning();

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true, learningPath: newPath };
}

export async function deleteLearningPathAction(pathId: string) {
  const user = await requireUser();

  await db
    .delete(learningPaths)
    .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, user.id)));

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function logLearningSessionAction(data: LogLearningSessionInput) {
  const user = await requireUser();
  const parsed = logLearningSessionSchema.parse(data);

  const [newLog] = await db
    .insert(learningLogs)
    .values({
      userId: user.id,
      title: parsed.title,
      skillId: parsed.skillId || null,
      learningPathId: parsed.learningPathId || null,
      durationMinutes: parsed.durationMinutes,
      notes: parsed.notes || null,
      learnedAt: new Date(),
    })
    .returning();

  if (newLog) {
    await awardXpAction({
      sourceType: "learning",
      sourceId: newLog.id,
      eventKey: `learning_log_${newLog.id}`,
      xpAmount: 35,
      description: `Logged learning session: ${parsed.durationMinutes} minutes`,
    });
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return { success: true, log: newLog };
}
