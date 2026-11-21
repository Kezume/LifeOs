"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { routines, routineLogs } from "@/lib/db/schema";
import { createRoutineSchema, toggleRoutineLogSchema, CreateRoutineInput, ToggleRoutineLogInput } from "../schemas/routine.schema";
import { eq, and } from "drizzle-orm";
import { awardXpAction } from "@/modules/gamification/actions/gamification.actions";

export async function createRoutineAction(data: CreateRoutineInput) {
  const user = await requireUser();
  const parsed = createRoutineSchema.parse(data);

  const [newRoutine] = await db
    .insert(routines)
    .values({
      userId: user.id,
      name: parsed.name,
      description: parsed.description || null,
      frequency: parsed.frequency,
      lifeAreaId: parsed.lifeAreaId || null,
      isActive: true,
    })
    .returning();

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, routine: newRoutine };
}

export async function toggleRoutineLogAction(data: ToggleRoutineLogInput) {
  const user = await requireUser();
  const parsed = toggleRoutineLogSchema.parse(data);

  if (parsed.completed) {
    // Insert log if not exists (upsert)
    await db
      .insert(routineLogs)
      .values({
        userId: user.id,
        routineId: parsed.routineId,
        completedOn: parsed.date,
        note: parsed.note || null,
      })
      .onConflictDoNothing();

    await awardXpAction({
      sourceType: "routine",
      sourceId: parsed.routineId,
      eventKey: `routine_done_${parsed.routineId}_${parsed.date}`,
      xpAmount: 25,
      description: `Completed routine check-in for ${parsed.date}`,
    });
  } else {
    // Delete log
    await db
      .delete(routineLogs)
      .where(
        and(
          eq(routineLogs.userId, user.id),
          eq(routineLogs.routineId, parsed.routineId),
          eq(routineLogs.completedOn, parsed.date)
        )
      );
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteRoutineAction(routineId: string) {
  const user = await requireUser();

  await db
    .delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, user.id)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}
