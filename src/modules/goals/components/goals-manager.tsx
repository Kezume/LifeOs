"use client";

import React, { useState, useTransition } from "react";
import { Plus, Check, Target, Trash2, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import {
  createGoalAction,
  updateGoalProgressAction,
  deleteGoalAction,
  createGoalMilestoneAction,
  toggleGoalMilestoneAction,
} from "../actions/goals.actions";

interface MilestoneItem {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
}

interface GoalItem {
  id: string;
  title: string;
  description: string | null;
  timeframe: string;
  status: string;
  targetDate: string | null;
  progress: number;
  milestones: MilestoneItem[];
}

export function GoalsManager({ goals }: { goals: GoalItem[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

  // New goal state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState<"short_term" | "mid_term" | "long_term">("mid_term");
  const [targetDate, setTargetDate] = useState("");

  // Milestone input state
  const [addingMilestoneFor, setAddingMilestoneFor] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");

  const [isPending, startTransition] = useTransition();

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      await createGoalAction({
        title: title.trim(),
        description: description.trim() || undefined,
        timeframe,
        targetDate: targetDate || null,
      });
      setTitle("");
      setDescription("");
      setTargetDate("");
      setIsAddingGoal(false);
    });
  };

  const handleDeleteGoal = (id: string) => {
    startTransition(async () => {
      await deleteGoalAction(id);
    });
  };

  const handleCreateMilestone = (goalId: string) => {
    if (!milestoneTitle.trim()) return;

    startTransition(async () => {
      await createGoalMilestoneAction({
        goalId,
        title: milestoneTitle.trim(),
      });
      setMilestoneTitle("");
      setAddingMilestoneFor(null);
    });
  };

  const handleToggleMilestone = (milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    startTransition(async () => {
      await toggleGoalMilestoneAction({
        id: milestoneId,
        status: nextStatus,
      });
    });
  };

  const handleUpdateManualProgress = (id: string, currentProgress: number, delta: number) => {
    const nextProgress = Math.max(0, Math.min(100, currentProgress + delta));
    const nextStatus = nextProgress >= 100 ? "completed" : "active";
    startTransition(async () => {
      await updateGoalProgressAction({
        id,
        manualProgress: String(nextProgress),
        status: nextStatus,
      });
    });
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return g.status === "active";
    if (filter === "completed") return g.status === "completed";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`h-7 px-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "all" ? "Semua Target" : tab === "active" ? "Aktif" : "Selesai"}
              <span className="ml-1.5 text-[10px] font-mono opacity-60">
                {tab === "all"
                  ? goals.length
                  : tab === "active"
                  ? goals.filter((g) => g.status === "active").length
                  : goals.filter((g) => g.status === "completed").length}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddingGoal(!isAddingGoal)}
          className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Buat Target Hidup</span>
        </button>
      </div>

      {/* Add Goal Form */}
      {isAddingGoal && (
        <form
          onSubmit={handleCreateGoal}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul target hidup (misal: Raih Sertifikasi Cloud Architect, Beli Rumah)..."
            className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
          />

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mengapa target ini penting bagi hidup Anda?..."
            className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as "short_term" | "mid_term" | "long_term")}
              className="h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="short_term">Jangka Pendek (&lt; 6 Bulan)</option>
              <option value="mid_term">Jangka Menengah (1–2 Tahun)</option>
              <option value="long_term">Jangka Panjang (3–5 Tahun)</option>
            </select>

            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            />

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingGoal(false)}
                className="h-8 px-3 text-xs rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Simpan Target
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
            Belum ada target hidup yang dicatat. Buat target pertama Anda untuk menentukan arah jangka panjang.
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isExpanded = !!expandedGoals[goal.id];

            return (
              <div
                key={goal.id}
                className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden transition-colors"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleExpand(goal.id)}
                        className="mt-0.5 p-1 rounded hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
                            {goal.title}
                          </h3>
                          <span className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                            {goal.timeframe === "short_term"
                              ? "Jangka Pendek"
                              : goal.timeframe === "mid_term"
                              ? "Jangka Menengah"
                              : "Jangka Panjang"}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Hapus Target"
                      className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress & Milestone summary */}
                  <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span>{goal.milestones.length} milestone</span>
                        {goal.targetDate && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {goal.targetDate}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateManualProgress(goal.id, goal.progress, -10)}
                          className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] text-[10px] hover:bg-[var(--surface-hover)] cursor-pointer"
                        >
                          -10%
                        </button>
                        <span className="font-mono font-medium text-[var(--foreground)]">
                          {goal.progress}%
                        </span>
                        <button
                          onClick={() => handleUpdateManualProgress(goal.id, goal.progress, 10)}
                          className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] text-[10px] hover:bg-[var(--surface-hover)] cursor-pointer"
                        >
                          +10%
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--foreground)] opacity-80 transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones inside Goal */}
                {isExpanded && (
                  <div className="p-4 bg-[var(--surface-raised)]/40 border-t border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        Milestone Pencapaian
                      </span>
                      <button
                        onClick={() =>
                          setAddingMilestoneFor(addingMilestoneFor === goal.id ? null : goal.id)
                        }
                        className="text-[11px] text-[var(--foreground)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Milestone</span>
                      </button>
                    </div>

                    {addingMilestoneFor === goal.id && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border)]">
                        <input
                          type="text"
                          required
                          autoFocus
                          value={milestoneTitle}
                          onChange={(e) => setMilestoneTitle(e.target.value)}
                          placeholder="Nama target milestone..."
                          className="flex-1 h-7 px-2 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setAddingMilestoneFor(null)}
                          className="h-7 px-2 text-xs text-[var(--foreground-muted)] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateMilestone(goal.id)}
                          className="h-7 px-2.5 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      {goal.milestones.length === 0 ? (
                        <p className="text-xs text-[var(--foreground-muted)] py-2 italic">
                          Belum ada milestone pada target ini.
                        </p>
                      ) : (
                        goal.milestones.map((m) => {
                          const isDone = m.status === "completed";
                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-2 rounded bg-[var(--surface-card)] border border-[var(--border)] text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => handleToggleMilestone(m.id, m.status)}
                                  disabled={isPending}
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                                    isDone
                                      ? "bg-[var(--success)] border-[var(--success)] text-white"
                                      : "border-[var(--border-active)] hover:border-[var(--foreground)]"
                                  }`}
                                >
                                  {isDone && <Check className="w-3 h-3" strokeWidth={2.5} />}
                                </button>
                                <span className={isDone ? "line-through opacity-70" : ""}>
                                  {m.title}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
