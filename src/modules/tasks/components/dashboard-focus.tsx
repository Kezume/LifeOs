"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { Check, ArrowUpRight, Plus, Calendar } from "lucide-react";
import { toggleTaskStatusAction } from "../actions/task.actions";

interface TaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  projectName: string | null;
}

export function DashboardFocus({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "todo" : "completed";
    startTransition(async () => {
      await toggleTaskStatusAction({ id, status: nextStatus });
    });
  };

  const activeTasks = initialTasks.filter((t) => t.status !== "completed");
  const displayTasks = activeTasks.slice(0, 5);

  return (
    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xs font-medium text-[var(--foreground)]">
            Fokus Hari Ini
          </h2>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
            Prioritas utama yang perlu Anda eksekusi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--foreground-muted)]">
            {activeTasks.length} tugas aktif
          </span>
          <Link
            href="/tasks"
            className="text-[11px] text-[var(--foreground)] hover:underline flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ArrowUpRight className="w-3 h-3 text-[var(--foreground-muted)]" />
          </Link>
        </div>
      </div>

      {displayTasks.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30">
          <p className="text-xs text-[var(--foreground-muted)]">
            Semua tugas hari ini telah selesai atau belum ada tugas aktif.
          </p>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 mt-2.5 h-7 px-3 text-xs font-medium rounded-md bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Buat Tugas Baru</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayTasks.map((task) => {
            const isCompleted = task.status === "completed";

            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]/60 border border-[var(--border)] hover:border-[var(--border-active)] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
                    disabled={isPending}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                      isCompleted
                        ? "bg-[var(--success)] border-[var(--success)] text-white"
                        : "border-[var(--border-active)] hover:border-[var(--foreground)] bg-[var(--surface-card)]"
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3" strokeWidth={2.5} />}
                  </button>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)] font-mono">
                      {task.projectName && (
                        <span className="px-1 py-0.2 rounded bg-[var(--surface-card)] border border-[var(--border)]">
                          {task.projectName}
                        </span>
                      )}
                      {task.priority !== "medium" && (
                        <span
                          className={
                            task.priority === "urgent" || task.priority === "high"
                              ? "text-[var(--danger)]"
                              : "text-[var(--foreground-muted)]"
                          }
                        >
                          {task.priority === "urgent"
                            ? "Mendesak"
                            : task.priority === "high"
                            ? "Tinggi"
                            : "Rendah"}
                        </span>
                      )}
                      {task.dueAt && (
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(task.dueAt))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
