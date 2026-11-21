import { z } from "zod";

export const saveReviewSchema = z.object({
  reviewType: z.enum(["daily", "weekly", "monthly", "yearly"]).default("weekly"),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),   // YYYY-MM-DD
  highlights: z.string().optional(),
  challenges: z.string().optional(),
  reflection: z.string().optional(),
  nextFocus: z.string().optional(),
});

export type SaveReviewInput = z.infer<typeof saveReviewSchema>;
