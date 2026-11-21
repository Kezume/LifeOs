import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Judul tugas tidak boleh kosong").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueAt: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  lifeAreaId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueAt: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  lifeAreaId: z.string().uuid().optional().nullable(),
});

export const toggleTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
