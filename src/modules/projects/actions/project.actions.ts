"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { projects, projectMilestones } from "@/lib/db/schema";
import {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  toggleMilestoneSchema,
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  ToggleMilestoneInput,
} from "../schemas/project.schema";
import { eq, and } from "drizzle-orm";

export async function createProjectAction(data: CreateProjectInput) {
  const user = await requireUser();
  const parsed = createProjectSchema.parse(data);

  const [newProject] = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: parsed.name,
      description: parsed.description || null,
      status: parsed.status,
      priority: parsed.priority,
      startDate: parsed.startDate || null,
      dueDate: parsed.dueDate || null,
      lifeAreaId: parsed.lifeAreaId || null,
    })
    .returning();

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, project: newProject };
}

export async function updateProjectAction(data: UpdateProjectInput) {
  const user = await requireUser();
  const parsed = updateProjectSchema.parse(data);

  const completedAt = parsed.status === "completed" ? new Date() : parsed.status ? null : undefined;

  const [updated] = await db
    .update(projects)
    .set({
      ...(parsed.name ? { name: parsed.name } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(parsed.status ? { status: parsed.status, completedAt } : {}),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
      ...(parsed.dueDate !== undefined ? { dueDate: parsed.dueDate } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, parsed.id), eq(projects.userId, user.id)))
    .returning();

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, project: updated };
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireUser();

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createMilestoneAction(data: CreateMilestoneInput) {
  const user = await requireUser();
  const parsed = createMilestoneSchema.parse(data);

  // Check project ownership
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, parsed.projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    throw new Error("Project tidak ditemukan atau akses ditolak");
  }

  const [milestone] = await db
    .insert(projectMilestones)
    .values({
      userId: user.id,
      projectId: parsed.projectId,
      title: parsed.title,
      description: parsed.description || null,
      dueDate: parsed.dueDate || null,
      status: "pending",
    })
    .returning();

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, milestone };
}

export async function toggleMilestoneAction(data: ToggleMilestoneInput) {
  const user = await requireUser();
  const parsed = toggleMilestoneSchema.parse(data);

  const completedAt = parsed.status === "completed" ? new Date() : null;

  const [updated] = await db
    .update(projectMilestones)
    .set({
      status: parsed.status,
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(projectMilestones.id, parsed.id), eq(projectMilestones.userId, user.id)))
    .returning();

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, milestone: updated };
}
