"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { goals, goalMilestones } from "@/lib/db/schema";
import {
  createGoalSchema,
  updateGoalProgressSchema,
  createGoalMilestoneSchema,
  toggleGoalMilestoneSchema,
  CreateGoalInput,
  UpdateGoalProgressInput,
  CreateGoalMilestoneInput,
  ToggleGoalMilestoneInput,
} from "../schemas/goals.schema";
import { eq, and } from "drizzle-orm";

export async function createGoalAction(data: CreateGoalInput) {
  const user = await requireUser();
  const parsed = createGoalSchema.parse(data);

  const [newGoal] = await db
    .insert(goals)
    .values({
      userId: user.id,
      title: parsed.title,
      description: parsed.description || null,
      timeframe: parsed.timeframe,
      status: parsed.status,
      targetDate: parsed.targetDate || null,
      manualProgress: parsed.manualProgress || "0",
    })
    .returning();

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, goal: newGoal };
}

export async function updateGoalProgressAction(data: UpdateGoalProgressInput) {
  const user = await requireUser();
  const parsed = updateGoalProgressSchema.parse(data);

  const completedAt = parsed.status === "completed" ? new Date() : null;

  const [updated] = await db
    .update(goals)
    .set({
      manualProgress: parsed.manualProgress,
      ...(parsed.status ? { status: parsed.status, completedAt } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, parsed.id), eq(goals.userId, user.id)))
    .returning();

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, goal: updated };
}

export async function deleteGoalAction(id: string) {
  const user = await requireUser();

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)));

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createGoalMilestoneAction(data: CreateGoalMilestoneInput) {
  const user = await requireUser();
  const parsed = createGoalMilestoneSchema.parse(data);

  const [m] = await db
    .insert(goalMilestones)
    .values({
      userId: user.id,
      goalId: parsed.goalId,
      title: parsed.title,
      dueDate: parsed.dueDate || null,
      status: "pending",
    })
    .returning();

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, milestone: m };
}

export async function toggleGoalMilestoneAction(data: ToggleGoalMilestoneInput) {
  const user = await requireUser();
  const parsed = toggleGoalMilestoneSchema.parse(data);

  const completedAt = parsed.status === "completed" ? new Date() : null;

  const [updated] = await db
    .update(goalMilestones)
    .set({
      status: parsed.status,
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(goalMilestones.id, parsed.id), eq(goalMilestones.userId, user.id)))
    .returning();

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, milestone: updated };
}
