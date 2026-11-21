"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { inboxItems, notes, tags, noteTags } from "@/lib/db/schema";
import {
  captureInboxItemSchema,
  createNoteSchema,
  CaptureInboxItemInput,
  CreateNoteInput,
} from "../schemas/knowledge.schema";
import { eq, and } from "drizzle-orm";

export async function captureInboxItemAction(data: CaptureInboxItemInput) {
  const user = await requireUser();
  const parsed = captureInboxItemSchema.parse(data);

  const [newItem] = await db
    .insert(inboxItems)
    .values({
      userId: user.id,
      title: parsed.title || null,
      content: parsed.content,
      itemType: parsed.itemType,
      status: "inbox",
    })
    .returning();

  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  return { success: true, item: newItem };
}

export async function toggleInboxItemStatusAction(id: string, currentStatus: string) {
  const user = await requireUser();
  const nextStatus = currentStatus === "processed" ? "inbox" : "processed";
  const processedAt = nextStatus === "processed" ? new Date() : null;

  const [updated] = await db
    .update(inboxItems)
    .set({
      status: nextStatus,
      processedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(inboxItems.id, id), eq(inboxItems.userId, user.id)))
    .returning();

  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  return { success: true, item: updated };
}

export async function deleteInboxItemAction(id: string) {
  const user = await requireUser();

  await db
    .delete(inboxItems)
    .where(and(eq(inboxItems.id, id), eq(inboxItems.userId, user.id)));

  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createNoteAction(data: CreateNoteInput) {
  const user = await requireUser();
  const parsed = createNoteSchema.parse(data);

  const [newNote] = await db
    .insert(notes)
    .values({
      userId: user.id,
      title: parsed.title,
      content: parsed.content,
    })
    .returning();

  // Create or link tags if provided
  if (parsed.tagNames && parsed.tagNames.length > 0) {
    for (const rawName of parsed.tagNames) {
      const tagName = rawName.trim();
      if (!tagName) continue;

      let [tag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, user.id), eq(tags.name, tagName)))
        .limit(1);

      if (!tag) {
        [tag] = await db
          .insert(tags)
          .values({
            userId: user.id,
            name: tagName,
          })
          .returning();
      }

      await db
        .insert(noteTags)
        .values({
          noteId: newNote.id,
          tagId: tag.id,
          userId: user.id,
        })
        .onConflictDoNothing();
    }
  }

  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  return { success: true, note: newNote };
}

export async function deleteNoteAction(id: string) {
  const user = await requireUser();

  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  return { success: true };
}
