"use client";

import React, { useState, useTransition } from "react";
import { Plus, Check, Trash2, Lightbulb, FileText, Send, Tag as TagIcon } from "lucide-react";
import {
  captureInboxItemAction,
  toggleInboxItemStatusAction,
  deleteInboxItemAction,
  createNoteAction,
  deleteNoteAction,
} from "../actions/knowledge.actions";

interface InboxItem {
  id: string;
  title: string | null;
  content: string;
  itemType: string;
  status: string;
  createdAt: Date;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  tags: { id: string; name: string; color: string | null }[];
}

export function KnowledgeManager({
  inboxItems,
  notes,
}: {
  inboxItems: InboxItem[];
  notes: NoteItem[];
}) {
  const [activeTab, setActiveTab] = useState<"inbox" | "notes">("inbox");
  const [captureContent, setCaptureContent] = useState("");
  const [captureType, setCaptureType] = useState<"idea" | "note" | "link" | "task">("idea");

  // New Note State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTagsInput, setNoteTagsInput] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureContent.trim()) return;

    startTransition(async () => {
      await captureInboxItemAction({
        content: captureContent.trim(),
        itemType: captureType,
      });
      setCaptureContent("");
    });
  };

  const handleToggleInbox = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleInboxItemStatusAction(id, currentStatus);
    });
  };

  const handleDeleteInbox = (id: string) => {
    startTransition(async () => {
      await deleteInboxItemAction(id);
    });
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const parsedTags = noteTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    startTransition(async () => {
      await createNoteAction({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tagNames: parsedTags,
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteTagsInput("");
      setIsAddingNote(false);
    });
  };

  const handleDeleteNote = (id: string) => {
    startTransition(async () => {
      await deleteNoteAction(id);
    });
  };

  const pendingInboxCount = inboxItems.filter((i) => i.status === "inbox").length;

  return (
    <div className="space-y-5">
      {/* Quick Capture Input Box (Always Visible) */}
      <form
        onSubmit={handleCapture}
        className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Quick Capture (Second Brain)
          </span>
          <span className="text-[10px] font-mono">Tulis ide atau catatan cepat</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            value={captureContent}
            onChange={(e) => setCaptureContent(e.target.value)}
            placeholder="Ketik ide, konsep, tautan, atau pemikiran spontan di sini..."
            className="flex-1 h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />

          <select
            value={captureType}
            onChange={(e) => setCaptureType(e.target.value as "idea" | "note" | "link" | "task")}
            className="h-9 px-2 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="idea">Ide</option>
            <option value="note">Catatan</option>
            <option value="link">Tautan</option>
            <option value="task">Tugas</option>
          </select>

          <button
            type="submit"
            disabled={isPending || !captureContent.trim()}
            className="h-9 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "inbox"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Inbox Capture
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{pendingInboxCount}</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === "notes"
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Catatan Terstruktur
            <span className="ml-1.5 text-[10px] font-mono opacity-60">{notes.length}</span>
          </button>
        </div>

        {activeTab === "notes" && (
          <button
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Buat Catatan Baru</span>
          </button>
        )}
      </div>

      {/* Tab 1: Inbox Items */}
      {activeTab === "inbox" && (
        <div className="space-y-2">
          {inboxItems.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
              Inbox kosong. Gunakan form Quick Capture di atas untuk menyimpan pemikiran spontan.
            </div>
          ) : (
            inboxItems.map((item) => {
              const isProcessed = item.status === "processed";

              return (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isProcessed
                      ? "bg-[var(--surface-card)]/40 border-[var(--border)]/60 text-[var(--foreground-muted)]"
                      : "bg-[var(--surface-card)] border-[var(--border)] shadow-[var(--shadow-card)] text-[var(--foreground)] hover:border-[var(--border-active)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleInbox(item.id, item.status)}
                      disabled={isPending}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                        isProcessed
                          ? "bg-[var(--success)] border-[var(--success)] text-white"
                          : "border-[var(--border-active)] hover:border-[var(--foreground)] bg-[var(--surface-raised)]"
                      }`}
                      title={isProcessed ? "Tandai Belum Diproses" : "Tandai Selesai Diproses"}
                    >
                      {isProcessed && <Check className="w-3 h-3" strokeWidth={2.5} />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs ${
                          isProcessed ? "line-through opacity-70" : "font-medium"
                        }`}
                      >
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[var(--foreground-muted)]">
                        <span className="uppercase px-1 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)]">
                          {item.itemType}
                        </span>
                        <span>
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(item.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteInbox(item.id)}
                    className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Structured Notes */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Create Note Form */}
          {isAddingNote && (
            <form
              onSubmit={handleCreateNote}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
            >
              <input
                type="text"
                required
                autoFocus
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Judul catatan..."
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />

              <textarea
                required
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Isi catatan atau konsep pengetahuan..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <TagIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={noteTagsInput}
                  onChange={(e) => setNoteTagsInput(e.target.value)}
                  placeholder="Tag dipisahkan koma (misal: Arsitektur, Database, Riset)..."
                  className="flex-1 h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !noteTitle.trim() || !noteContent.trim()}
                  className="h-8 px-3.5 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          )}

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {notes.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada catatan terstruktur. Buat catatan pertama Anda untuk mengorganisir wawasan.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        <h4 className="text-xs font-medium text-[var(--foreground)]">
                          {note.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--foreground-muted)]">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px]"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <span>
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(note.createdAt))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
