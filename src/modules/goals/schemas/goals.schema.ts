import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(1, "Judul target tidak boleh kosong").max(255),
  description: z.string().optional(),
  timeframe: z.enum(["short_term", "mid_term", "long_term"]).optional().default("mid_term"),
  status: z.enum(["active", "completed", "paused", "cancelled"]).optional().default("active"),
  targetDate: z.string().optional().nullable(),
  manualProgress: z.string().optional().default("0"),
});

export const updateGoalProgressSchema = z.object({
  id: z.string().uuid(),
  manualProgress: z.string(),
  status: z.enum(["active", "completed", "paused", "cancelled"]).optional(),
});

export const createGoalMilestoneSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().min(1, "Nama milestone tidak boleh kosong").max(255),
  dueDate: z.string().optional().nullable(),
});

export const toggleGoalMilestoneSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "completed"]),
});

export type CreateGoalInput = z.input<typeof createGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
export type CreateGoalMilestoneInput = z.infer<typeof createGoalMilestoneSchema>;
export type ToggleGoalMilestoneInput = z.infer<typeof toggleGoalMilestoneSchema>;
