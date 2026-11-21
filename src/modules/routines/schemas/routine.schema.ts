import { z } from "zod";

export const createRoutineSchema = z.object({
  name: z.string().min(1, "Nama rutinitas tidak boleh kosong").max(255),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  lifeAreaId: z.string().uuid().optional().nullable(),
});

export const toggleRoutineLogSchema = z.object({
  routineId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  completed: z.boolean(),
  note: z.string().optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type ToggleRoutineLogInput = z.infer<typeof toggleRoutineLogSchema>;
