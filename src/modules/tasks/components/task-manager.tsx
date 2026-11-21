"use client";

import React, { useState, useTransition } from "react";
import { Plus, Check, Trash2, Calendar } from "lucide-react";
import { createTaskAction, toggleTaskStatusAction, deleteTaskAction } from "../actions/task.actions";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  completedAt: Date | null;
  projectId: string | null;
  projectName: string | null;
  lifeAreaName: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

export function TaskManager({
  initialTasks,
  projects,
}: {
  initialTasks: TaskItem[];
  projects: ProjectOption[];
}) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [projectId, setProjectId] = useState<string>("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "todo" : "completed";
    startTransition(async () => {
      await toggleTaskStatusAction({ id, status: nextStatus });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTaskAction(id);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createTaskAction({
        title: title.trim(),
        priority,
        projectId: projectId || null,
        dueAt: dueAt ? dueAt : null,
      });
      setTitle("");
      setPriority("medium");
      setProjectId("");
      setDueAt("");
      setIsAdding(false);
    });
  };

  const filteredTasks = initialTasks.filter((t) => {
    if (filter === "active") return t.status === "todo" || t.status === "in_progress";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                filter === tab
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "all" ? "Semua" : tab === "active" ? "Aktif" : "Selesai"}
              <span className="ml-1.5 text-[10px] font-mono opacity-60">
                {tab === "all"
                  ? initialTasks.length
                  : tab === "active"
                  ? initialTasks.filter((t) => t.status !== "completed").length
                  : initialTasks.filter((t) => t.status === "completed").length}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tuliskan nama tugas baru..."
            className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Selector */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
              className="h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="low">Prioritas Rendah</option>
              <option value="medium">Prioritas Sedang</option>
              <option value="high">Prioritas Tinggi</option>
              <option value="urgent">Prioritas Mendesak</option>
            </select>

            {/* Project Selector */}
            {projects.length > 0 && (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Tanpa Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Due Date */}
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            />

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-8 px-3 text-xs rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-1.5">
        {filteredTasks.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30">
            <p className="text-xs text-[var(--foreground-muted)]">
              {filter === "completed"
                ? "Belum ada tugas yang selesai."
                : "Tidak ada tugas yang perlu dikerjakan. Rencanakan tugas baru di atas."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === "completed";

            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCompleted
                    ? "bg-[var(--surface-card)]/40 border-[var(--border)]/60 text-[var(--foreground-muted)]"
                    : "bg-[var(--surface-card)] border-[var(--border)] shadow-[var(--shadow-card)] text-[var(--foreground)] hover:border-[var(--border-active)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    disabled={isPending}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                      isCompleted
                        ? "bg-[var(--success)] border-[var(--success)] text-white"
                        : "border-[var(--border-active)] hover:border-[var(--foreground)] bg-[var(--surface-raised)]"
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        isCompleted ? "line-through opacity-70" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--foreground-muted)] font-mono">
                      {task.projectName && (
                        <span className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px]">
                          {task.projectName}
                        </span>
                      )}
                      {task.priority !== "medium" && (
                        <span
                          className={`text-[10px] font-medium ${
                            task.priority === "urgent" || task.priority === "high"
                              ? "text-[var(--danger)]"
                              : "text-[var(--foreground-muted)]"
                          }`}
                        >
                          {task.priority === "urgent"
                            ? "Mendesak"
                            : task.priority === "high"
                            ? "Tinggi"
                            : "Rendah"}
                        </span>
                      )}
                      {task.dueAt && (
                        <span className="inline-flex items-center gap-1 text-[10px]">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(task.dueAt))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  title="Hapus Tugas"
                  className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
