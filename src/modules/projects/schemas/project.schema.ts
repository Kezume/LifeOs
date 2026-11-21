import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nama proyek tidak boleh kosong").max(255),
  description: z.string().optional(),
  status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).default("active"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  lifeAreaId: z.string().uuid().optional().nullable(),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Nama milestone tidak boleh kosong").max(255),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export const toggleMilestoneSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "completed"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type ToggleMilestoneInput = z.infer<typeof toggleMilestoneSchema>;
