import { z } from "zod";

export const captureInboxItemSchema = z.object({
  content: z.string().min(1, "Konten tidak boleh kosong"),
  title: z.string().optional(),
  itemType: z.enum(["idea", "note", "task", "link", "other"]).default("idea"),
});

export const createNoteSchema = z.object({
  title: z.string().min(1, "Judul catatan tidak boleh kosong").max(255),
  content: z.string().min(1, "Isi catatan tidak boleh kosong"),
  tagNames: z.array(z.string()).default([]),
});

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
});

export type CaptureInboxItemInput = z.infer<typeof captureInboxItemSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
