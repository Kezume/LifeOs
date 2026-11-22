"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import {
  Plus,
  Check,
  Trash2,
  Lightbulb,
  FileText,
  Send,
  Tag as TagIcon,
  Search,
  X,
  ExternalLink,
  Sparkles,
  Copy,
  Link2,
  CheckSquare,
  BookOpen,
} from "lucide-react";
import {
  captureInboxItemAction,
  toggleInboxItemStatusAction,
  deleteInboxItemAction,
  createNoteAction,
  deleteNoteAction,
  convertInboxToNoteAction,
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
  const [searchQuery, setSearchQuery] = useState("");

  // Inbox Filters
  const [inboxStatusFilter, setInboxStatusFilter] = useState<"all" | "inbox" | "processed">("all");
  const [inboxTypeFilter, setInboxTypeFilter] = useState<string>("all");

  // Notes Filters
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");

  // Quick Capture State
  const [captureContent, setCaptureContent] = useState("");
  const [captureType, setCaptureType] = useState<"idea" | "note" | "link" | "task">("idea");

  // New Note State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTagsInput, setNoteTagsInput] = useState("");

  // Reading Note Modal State
  const [readingNote, setReadingNote] = useState<NoteItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Close reading modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && readingNote) {
        setReadingNote(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readingNote]);

  // Extract all distinct tag names across notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((t) => {
        if (t.name) tagSet.add(t.name);
      });
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Handle Quick Capture
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

  const handleConvertInboxToNote = (id: string) => {
    startTransition(async () => {
      await convertInboxToNoteAction(id);
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
      if (readingNote?.id === id) {
        setReadingNote(null);
      }
    });
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Filtered Inbox Items
  const filteredInbox = useMemo(() => {
    return inboxItems.filter((item) => {
      // Status filter
      if (inboxStatusFilter === "inbox" && item.status !== "inbox") return false;
      if (inboxStatusFilter === "processed" && item.status !== "processed") return false;

      // Type filter
      if (inboxTypeFilter !== "all" && item.itemType !== inboxTypeFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchContent = item.content.toLowerCase().includes(query);
        const matchTitle = item.title?.toLowerCase().includes(query);
        if (!matchContent && !matchTitle) return false;
      }

      return true;
    });
  }, [inboxItems, inboxStatusFilter, inboxTypeFilter, searchQuery]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Tag filter
      if (selectedTagFilter !== "all") {
        const hasTag = note.tags.some((t) => t.name.toLowerCase() === selectedTagFilter.toLowerCase());
        if (!hasTag) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(query);
        const matchContent = note.content.toLowerCase().includes(query);
        const matchTag = note.tags.some((t) => t.name.toLowerCase().includes(query));
        if (!matchTitle && !matchContent && !matchTag) return false;
      }

      return true;
    });
  }, [notes, selectedTagFilter, searchQuery]);

  const pendingInboxCount = inboxItems.filter((i) => i.status === "inbox").length;

  // Detect URL in string
  const extractUrl = (text: string): string | null => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    return urlMatch ? urlMatch[0] : null;
  };

  return (
    <div className="space-y-5">
      {/* 1. Quick Capture Input Box (Second Brain Fast Ingestion) */}
      <form
        onSubmit={handleCapture}
        className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
      >
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Quick Capture (Second Brain)
          </span>
          <span className="text-[10px] font-mono opacity-70 hidden sm:inline">
            Tulis ide spontan, link wawasan, atau pemikiran cepat
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            required
            value={captureContent}
            onChange={(e) => setCaptureContent(e.target.value)}
            placeholder="Tulis ide, konsep, kutipan, atau tautan menarik..."
            className="flex-1 h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />

          <div className="flex items-center gap-2">
            <select
              value={captureType}
              onChange={(e) => setCaptureType(e.target.value as "idea" | "note" | "link" | "task")}
              className="flex-1 sm:flex-none h-9 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="idea">Ide</option>
              <option value="note">Catatan</option>
              <option value="link">Tautan</option>
              <option value="task">Tugas</option>
            </select>

            <button
              type="submit"
              disabled={isPending || !captureContent.trim()}
              className="h-9 px-4 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </form>

      {/* 2. Main Tabs & Search Bar */}
      <div className="space-y-3 pb-2 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-0.5">
            <button
              onClick={() => {
                setActiveTab("inbox");
                setSearchQuery("");
              }}
              className={`h-8 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === "inbox"
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Inbox Capture</span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)]">
                {pendingInboxCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("notes");
                setSearchQuery("");
              }}
              className={`h-8 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === "notes"
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
              <span>Catatan Terstruktur</span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)]">
                {notes.length}
              </span>
            </button>
          </div>

          {/* Action on right (Desktop & Mobile) */}
          <div className="flex items-center gap-2">
            {activeTab === "notes" && (
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Buat Catatan</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "inbox"
                  ? "Cari ide di inbox..."
                  : "Cari judul, tag, atau isi catatan..."
              }
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tab-specific Filters */}
          {activeTab === "inbox" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-0.5">
              {/* Status filter pills */}
              {(["all", "inbox", "processed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInboxStatusFilter(st)}
                  className={`h-7 px-2.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                    inboxStatusFilter === st
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {st === "all" ? "Semua Status" : st === "inbox" ? "Belum Diproses" : "Selesai"}
                </button>
              ))}

              {/* Type filter */}
              <select
                value={inboxTypeFilter}
                onChange={(e) => setInboxTypeFilter(e.target.value)}
                className="h-7 px-2 text-[11px] rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer flex-shrink-0"
              >
                <option value="all">Semua Tipe</option>
                <option value="idea">Ide</option>
                <option value="note">Catatan</option>
                <option value="link">Tautan</option>
                <option value="task">Tugas</option>
              </select>
            </div>
          ) : (
            /* Notes Tag Filter Pills */
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedTagFilter("all")}
                className={`h-7 px-2.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                  selectedTagFilter === "all"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Semua Tag
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`h-7 px-2.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                    selectedTagFilter === tag
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--surface-raised)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. TAB 1: INBOX ITEMS */}
      {activeTab === "inbox" && (
        <div className="space-y-2">
          {filteredInbox.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)] space-y-2">
              <Lightbulb className="w-6 h-6 mx-auto text-[var(--foreground-muted)] opacity-60" />
              <p>
                {searchQuery || inboxStatusFilter !== "all" || inboxTypeFilter !== "all"
                  ? "Tidak ada item inbox yang sesuai dengan filter atau kata kunci."
                  : "Inbox kosong. Tangkap ide spontan atau tautan menarik dengan form Quick Capture di atas."}
              </p>
              {(searchQuery || inboxStatusFilter !== "all" || inboxTypeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setInboxStatusFilter("all");
                    setInboxTypeFilter("all");
                  }}
                  className="text-xs text-[var(--foreground)] underline underline-offset-2 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            filteredInbox.map((item) => {
              const isProcessed = item.status === "processed";
              const detectedUrl = extractUrl(item.content);

              return (
                <div
                  key={item.id}
                  className={`group flex items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isProcessed
                      ? "bg-[var(--surface-card)]/40 border-[var(--border)]/60 text-[var(--foreground-muted)]"
                      : "bg-[var(--surface-card)] border-[var(--border)] shadow-[var(--shadow-card)] text-[var(--foreground)] hover:border-[var(--border-active)]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => handleToggleInbox(item.id, item.status)}
                      disabled={isPending}
                      className={`w-5 h-5 mt-0.5 sm:mt-0 rounded flex items-center justify-center border transition-colors cursor-pointer flex-shrink-0 ${
                        isProcessed
                          ? "bg-[var(--success)] border-[var(--success)] text-white"
                          : "border-[var(--border-active)] hover:border-[var(--foreground)] bg-[var(--surface-raised)]"
                      }`}
                      title={isProcessed ? "Tandai Belum Diproses" : "Tandai Selesai Diproses"}
                    >
                      {isProcessed && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${
                          isProcessed ? "line-through opacity-70" : "font-normal"
                        }`}
                      >
                        {item.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-[var(--foreground-muted)]">
                        <span className="uppercase px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] flex items-center gap-1">
                          {item.itemType === "idea" && <Lightbulb className="w-2.5 h-2.5 text-amber-500" />}
                          {item.itemType === "link" && <Link2 className="w-2.5 h-2.5 text-blue-500" />}
                          {item.itemType === "task" && <CheckSquare className="w-2.5 h-2.5 text-emerald-500" />}
                          {item.itemType === "note" && <FileText className="w-2.5 h-2.5" />}
                          <span>{item.itemType}</span>
                        </span>

                        <span>
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(item.createdAt))}
                        </span>

                        {detectedUrl && (
                          <a
                            href={detectedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline truncate max-w-[200px]"
                          >
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{detectedUrl}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {!isProcessed && (
                      <button
                        onClick={() => handleConvertInboxToNote(item.id)}
                        title="Ubah menjadi Catatan Terstruktur"
                        className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] rounded transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteInbox(item.id)}
                      title="Hapus Item"
                      className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. TAB 2: STRUCTURED NOTES */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Create Note Form */}
          {isAddingNote && (
            <form
              onSubmit={handleCreateNote}
              className="p-4 sm:p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <h3 className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  Catatan Pengetahuan Baru
                </h3>
                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Second Brain</span>
              </div>

              <input
                type="text"
                required
                autoFocus
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Judul catatan (misal: Konsep Distributed Systems, Arsitektur Database)..."
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
              />

              <textarea
                required
                rows={5}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Tuliskan wawasan, ringkasan, atau konsep inti di sini..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors leading-relaxed"
              />

              <div className="flex items-center gap-2">
                <TagIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)] flex-shrink-0" />
                <input
                  type="text"
                  value={noteTagsInput}
                  onChange={(e) => setNoteTagsInput(e.target.value)}
                  placeholder="Tag dipisahkan koma (misal: Arsitektur, Backend, Riset)..."
                  className="flex-1 h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="h-8 px-3 text-xs rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !noteTitle.trim() || !noteContent.trim()}
                  className="h-8 px-4 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          )}

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)] space-y-2">
                <BookOpen className="w-6 h-6 mx-auto text-[var(--foreground-muted)] opacity-60" />
                <p>
                  {searchQuery || selectedTagFilter !== "all"
                    ? "Tidak ada catatan yang sesuai dengan filter pencarian."
                    : "Belum ada catatan terstruktur. Buat catatan pertama Anda untuk mengorganisir pengetahuan."}
                </p>
                {(searchQuery || selectedTagFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTagFilter("all");
                    }}
                    className="text-xs text-[var(--foreground)] underline underline-offset-2 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setReadingNote(note)}
                  className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3 flex flex-col justify-between hover:border-[var(--border-active)] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[var(--foreground-muted)] flex-shrink-0" />
                        <h4 className="text-xs font-medium text-[var(--foreground)] truncate group-hover:underline">
                          {note.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopy(`${note.title}\n\n${note.content}`, note.id)}
                          title="Salin Catatan"
                          className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded transition-colors cursor-pointer"
                        >
                          {copiedId === note.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          title="Hapus Catatan"
                          className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--foreground-muted)]">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.length > 0 ? (
                        note.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px]"
                          >
                            #{tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="opacity-50">Tanpa tag</span>
                      )}
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

      {/* 5. FULL NOTE READER MODAL / BOTTOM SHEET */}
      {readingNote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-[var(--surface-raised)] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Pull Handle */}
            <div className="sm:hidden pt-2 pb-1 flex justify-center bg-[var(--surface-deep)]">
              <div className="w-10 h-1 rounded-full bg-[var(--border-active)]" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-deep)] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileText className="w-4 h-4 text-[var(--foreground)] flex-shrink-0" />
                <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {readingNote.title}
                </h3>
              </div>
              <button
                onClick={() => setReadingNote(null)}
                className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[60vh] flex-1">
              {/* Tags & Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border)] text-xs text-[var(--foreground-muted)] font-mono">
                <div className="flex flex-wrap gap-1.5">
                  {readingNote.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border)] text-[11px]"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <span>
                  {new Intl.DateTimeFormat("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(readingNote.createdAt))}
                </span>
              </div>

              {/* Note Content (Full Reader) */}
              <div className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-sans select-text">
                {readingNote.content}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:pb-3 bg-[var(--surface-deep)] border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteNote(readingNote.id)}
                className="h-8 px-3 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(`${readingNote.title}\n\n${readingNote.content}`, readingNote.id)}
                  className="h-8 px-3.5 text-xs rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === readingNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Isi</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReadingNote(null)}
                  className="h-8 px-4 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
