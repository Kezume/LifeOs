import { z } from "zod";

export const createSkillSchema = z.object({
  name: z.string().min(1, "Nama skill tidak boleh kosong").max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  currentLevel: z.number().int().min(1).max(10).default(1),
  targetLevel: z.number().int().min(1).max(10).default(5),
});

export const updateSkillLevelSchema = z.object({
  id: z.string().uuid(),
  currentLevel: z.number().int().min(1).max(10),
});

export const createLearningPathSchema = z.object({
  title: z.string().min(1, "Judul learning path tidak boleh kosong").max(255),
  description: z.string().optional(),
  status: z.enum(["planned", "active", "completed", "paused"]).optional().default("active"),
  targetDate: z.string().optional().nullable(),
});

export const logLearningSessionSchema = z.object({
  title: z.string().min(1, "Judul sesi tidak boleh kosong").max(255),
  skillId: z.string().uuid().optional().nullable(),
  learningPathId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().min(1, "Durasi minimal 1 menit").max(1440),
  notes: z.string().optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillLevelInput = z.infer<typeof updateSkillLevelSchema>;
export type CreateLearningPathInput = z.input<typeof createLearningPathSchema>;
export type LogLearningSessionInput = z.infer<typeof logLearningSessionSchema>;
