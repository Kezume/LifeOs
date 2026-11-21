import { db } from "@/lib/db";
import { inboxItems, notes, tags, noteTags } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserInboxItems(userId: string) {
  return db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.userId, userId))
    .orderBy(desc(inboxItems.createdAt));
}

export async function getUserNotes(userId: string) {
  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.createdAt));

  // Fetch tags for these notes
  const userNoteTags = await db
    .select({
      noteId: noteTags.noteId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.userId, userId));

  const noteTagsMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  userNoteTags.forEach((nt) => {
    if (!noteTagsMap.has(nt.noteId)) {
      noteTagsMap.set(nt.noteId, []);
    }
    noteTagsMap.get(nt.noteId)!.push({ id: nt.tagId, name: nt.tagName, color: nt.tagColor });
  });

  return userNotes.map((n) => ({
    ...n,
    tags: noteTagsMap.get(n.id) || [],
  }));
}

export async function getKnowledgeStats(userId: string) {
  const allInbox = await db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.userId, userId));

  const allNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId));

  return {
    inboxCount: allInbox.filter((i) => i.status === "inbox").length,
    totalNotes: allNotes.length,
  };
}
