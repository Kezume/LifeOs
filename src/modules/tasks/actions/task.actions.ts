"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { createTaskSchema, updateTaskSchema, toggleTaskSchema, CreateTaskInput, UpdateTaskInput, ToggleTaskInput } from "../schemas/task.schema";
import { eq, and } from "drizzle-orm";
import { awardXpAction } from "@/modules/gamification/actions/gamification.actions";

export async function createTaskAction(data: CreateTaskInput) {
  const user = await requireUser();
  const parsed = createTaskSchema.parse(data);

  const dueAtDate = parsed.dueAt ? new Date(parsed.dueAt) : null;

  const [newTask] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      title: parsed.title,
      description: parsed.description || null,
      priority: parsed.priority,
      dueAt: dueAtDate,
      projectId: parsed.projectId || null,
      lifeAreaId: parsed.lifeAreaId || null,
      status: "todo",
    })
    .returning();

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, task: newTask };
}

export async function toggleTaskStatusAction(data: ToggleTaskInput) {
  const user = await requireUser();
  const parsed = toggleTaskSchema.parse(data);

  const completedAt = parsed.status === "completed" ? new Date() : null;

  const [updated] = await db
    .update(tasks)
    .set({
      status: parsed.status,
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, parsed.id), eq(tasks.userId, user.id)))
    .returning();

  if (updated && parsed.status === "completed") {
    await awardXpAction({
      sourceType: "task",
      sourceId: updated.id,
      eventKey: `task_completed_${updated.id}`,
      xpAmount: 30,
      description: `Completed task: ${updated.title}`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, task: updated };
}

export async function updateTaskAction(data: UpdateTaskInput) {
  const user = await requireUser();
  const parsed = updateTaskSchema.parse(data);

  const dueAtDate = parsed.dueAt !== undefined ? (parsed.dueAt ? new Date(parsed.dueAt) : null) : undefined;
  const completedAt = parsed.status === "completed" ? new Date() : parsed.status ? null : undefined;

  const [updated] = await db
    .update(tasks)
    .set({
      ...(parsed.title ? { title: parsed.title } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(parsed.status ? { status: parsed.status, completedAt } : {}),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(dueAtDate !== undefined ? { dueAt: dueAtDate } : {}),
      ...(parsed.projectId !== undefined ? { projectId: parsed.projectId } : {}),
      ...(parsed.lifeAreaId !== undefined ? { lifeAreaId: parsed.lifeAreaId } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, parsed.id), eq(tasks.userId, user.id)))
    .returning();

  if (updated && parsed.status === "completed") {
    await awardXpAction({
      sourceType: "task",
      sourceId: updated.id,
      eventKey: `task_completed_${updated.id}`,
      xpAmount: 30,
      description: `Completed task: ${updated.title}`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, task: updated };
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireUser();

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}
