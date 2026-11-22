"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  X,
  CalendarCheck,
  Lightbulb,
  FileText,
  Wallet,
  GraduationCap,
  Sparkles,
  Loader2,
} from "lucide-react";
import { createTaskAction } from "@/modules/tasks/actions/task.actions";
import { captureInboxItemAction, createNoteAction } from "@/modules/knowledge/actions/knowledge.actions";
import { createTransactionAction } from "@/modules/finance/actions/finance.actions";
import { logLearningSessionAction } from "@/modules/learning/actions/learning.actions";
import { awardXpAction } from "@/modules/gamification/actions/gamification.actions";

type CaptureType = "task" | "inbox" | "note" | "finance" | "study";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const [activeType, setActiveType] = useState<CaptureType>("task");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [inboxTitle, setInboxTitle] = useState("");
  const [inboxContent, setInboxContent] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [finAmount, setFinAmount] = useState("");
  const [finType, setFinType] = useState<"expense" | "income">("expense");
  const [finDescription, setFinDescription] = useState("");

  const [studyTopic, setStudyTopic] = useState("");
  const [studyMinutes, setStudyMinutes] = useState("45");
  const [studyNotes, setStudyNotes] = useState("");

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1200);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        if (activeType === "task") {
          if (!taskTitle.trim()) return;
          const res = await createTaskAction({
            title: taskTitle.trim(),
            priority: taskPriority,
            dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
          });
          if (res.success && res.task) {
            await awardXpAction({
              sourceType: "task",
              sourceId: res.task.id,
              eventKey: `task_created_${res.task.id}`,
              xpAmount: 20,
              description: `Captured task: ${taskTitle.trim()}`,
            });
            setTaskTitle("");
            showToast("Task captured (+20 XP)");
          }
        } else if (activeType === "inbox") {
          if (!inboxTitle.trim() && !inboxContent.trim()) return;
          const res = await captureInboxItemAction({
            title: inboxTitle.trim() || undefined,
            content: inboxContent.trim() || inboxTitle.trim(),
            itemType: "idea",
          });
          if (res.success && res.item) {
            await awardXpAction({
              sourceType: "quick_capture",
              sourceId: res.item.id,
              eventKey: `inbox_created_${res.item.id}`,
              xpAmount: 15,
              description: `Captured inbox idea: ${inboxTitle.trim() || "Idea"}`,
            });
            setInboxTitle("");
            setInboxContent("");
            showToast("Idea captured into Inbox (+15 XP)");
          }
        } else if (activeType === "note") {
          if (!noteTitle.trim()) return;
          const res = await createNoteAction({
            title: noteTitle.trim(),
            content: noteContent.trim() || noteTitle.trim(),
            tagNames: [],
          });
          if (res.success && res.note) {
            await awardXpAction({
              sourceType: "knowledge",
              sourceId: res.note.id,
              eventKey: `note_created_${res.note.id}`,
              xpAmount: 20,
              description: `Created note: ${noteTitle.trim()}`,
            });
            setNoteTitle("");
            setNoteContent("");
            showToast("Note recorded (+20 XP)");
          }
        } else if (activeType === "finance") {
          const amt = parseFloat(finAmount);
          if (isNaN(amt) || amt <= 0) return;
          const res = await createTransactionAction({
            type: finType,
            amount: String(amt),
            description: finDescription.trim() || `${finType === "income" ? "Income" : "Expense"} entry`,
          });
          if (res.success && res.transaction) {
            await awardXpAction({
              sourceType: "finance",
              sourceId: res.transaction.id,
              eventKey: `fin_tx_${res.transaction.id}`,
              xpAmount: 25,
              description: `Recorded transaction: ${finDescription || "Cashflow"}`,
            });
            setFinAmount("");
            setFinDescription("");
            showToast("Transaction recorded (+25 XP)");
          }
        } else if (activeType === "study") {
          const mins = parseInt(studyMinutes, 10);
          if (!studyTopic.trim() || isNaN(mins) || mins <= 0) return;
          const res = await logLearningSessionAction({
            title: studyTopic.trim(),
            durationMinutes: mins,
            notes: studyNotes.trim() || undefined,
          });
          if (res.success && res.log) {
            await awardXpAction({
              sourceType: "learning",
              sourceId: res.log.id,
              eventKey: `learning_log_${res.log.id}`,
              xpAmount: 35,
              description: `Logged study session: ${studyTopic.trim()} (${mins}m)`,
            });
            setStudyTopic("");
            setStudyNotes("");
            showToast("Study session logged (+35 XP)");
          }
        }
      } catch (err) {
        console.error("Quick capture error:", err);
      }
    });
  }, [
    activeType,
    taskTitle,
    taskPriority,
    taskDueDate,
    inboxTitle,
    inboxContent,
    noteTitle,
    noteContent,
    finAmount,
    finType,
    finDescription,
    studyTopic,
    studyMinutes,
    studyNotes,
    showToast,
  ]);

  // Keyboard shortcut listener for Esc and Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isOpen) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  if (!isOpen) return null;

  const tabs: { id: CaptureType; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: "task", label: "Task", icon: CalendarCheck },
    { id: "inbox", label: "Inbox", icon: Lightbulb },
    { id: "note", label: "Note", icon: FileText },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "study", label: "Study Log", icon: GraduationCap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-[var(--surface-raised)] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center bg-[var(--surface-deep)]">
          <div className="w-10 h-1 rounded-full bg-[var(--border-active)]" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-deep)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--foreground)]" />
            <h2 className="text-xs font-semibold tracking-tight text-[var(--foreground)] uppercase">
              Quick Capture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-deep)] px-2 pt-1 gap-1 overflow-x-auto no-scrollbar flex-nowrap flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 ${
                  isCurrent
                    ? "bg-[var(--surface-raised)] text-[var(--foreground)] border-t border-x border-[var(--border)] -mb-px"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Form */}
        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-none flex-1">
          {activeType === "task" && (
            <>
              <div>
                <input
                  type="text"
                  autoFocus
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === "inbox" && (
            <>
              <div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Idea, thought, or reference topic..."
                  value={inboxTitle}
                  onChange={(e) => setInboxTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
                />
              </div>
              <div>
                <textarea
                  rows={2}
                  placeholder="Raw notes, links, or context (optional)..."
                  value={inboxContent}
                  onChange={(e) => setInboxContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] resize-none"
                />
              </div>
            </>
          )}

          {activeType === "note" && (
            <>
              <div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors"
                />
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="Note markdown content or insights..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] resize-none"
                />
              </div>
            </>
          )}

          {activeType === "finance" && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFinType("expense")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    finType === "expense"
                      ? "bg-[var(--surface-card)] border-[var(--foreground)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)]"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFinType("income")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    finType === "income"
                      ? "bg-[var(--surface-card)] border-[var(--foreground)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--foreground-muted)]"
                  }`}
                >
                  Income
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Amount (IDR)
                  </label>
                  <input
                    type="number"
                    autoFocus
                    placeholder="50000"
                    value={finAmount}
                    onChange={(e) => setFinAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Lunch, subscription, salary..."
                    value={finDescription}
                    onChange={(e) => setFinDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === "study" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Skill or Topic
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Next.js 15, Drizzle ORM, System Design..."
                    value={studyTopic}
                    onChange={(e) => setStudyTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--foreground-muted)] font-medium mb-1 block">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={studyMinutes}
                    onChange={(e) => setStudyMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Key takeaways or summary..."
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:pb-3 bg-[var(--surface-deep)] border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
            {toastMessage ? (
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                {toastMessage}
              </span>
            ) : (
              <span className="hidden sm:inline">Press <kbd className="font-mono px-1 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border)]">⌘Enter</kbd> to save</span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="h-8 px-4 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
