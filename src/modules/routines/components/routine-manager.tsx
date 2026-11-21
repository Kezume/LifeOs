"use client";

import React, { useState, useTransition } from "react";
import { Plus, Check, Flame, Trash2 } from "lucide-react";
import { createRoutineAction, toggleRoutineLogAction, deleteRoutineAction } from "../actions/routine.actions";

interface RoutineItem {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  isCompletedToday: boolean;
}

export function RoutineManager({
  routines,
  todayDate,
  streakDays,
}: {
  routines: RoutineItem[];
  todayDate: string;
  streakDays: number;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (routineId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleRoutineLogAction({
        routineId,
        date: todayDate,
        completed: !currentStatus,
      });
    });
  };

  const handleDelete = (routineId: string) => {
    startTransition(async () => {
      await deleteRoutineAction(routineId);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      await createRoutineAction({
        name: name.trim(),
        frequency,
      });
      setName("");
      setIsAdding(false);
    });
  };

  const completedCount = routines.filter((r) => r.isCompletedToday).length;

  return (
    <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h2 className="text-xs font-medium text-[var(--foreground)]">
            Rutinitas & Kebiasaan Harian
          </h2>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
            {completedCount} dari {routines.length} selesai hari ini
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)]">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium tabular-nums">{streakDays}</span>
            <span className="text-[10px] text-[var(--foreground-muted)]">hari</span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Tambah Rutinitas"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Add Routine Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] space-y-2.5">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama rutinitas (misal: Olahraga pagi 20m)..."
            className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
              className="h-7 px-2 text-xs rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="daily">Setiap Hari</option>
              <option value="weekly">Mingguan</option>
            </select>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-7 px-2.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="h-7 px-3 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Routine items */}
      <div className="space-y-1.5">
        {routines.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--foreground-muted)]">
            Belum ada rutinitas harian. Tambahkan rutinitas pertama Anda.
          </div>
        ) : (
          routines.map((routine) => (
            <div
              key={routine.id}
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                routine.isCompletedToday
                  ? "bg-[var(--surface-card)]/50 border-[var(--border)]/60 text-[var(--foreground-muted)]"
                  : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--border-active)]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => handleToggle(routine.id, routine.isCompletedToday)}
                  disabled={isPending}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                    routine.isCompletedToday
                      ? "bg-[var(--success)] border-[var(--success)] text-white"
                      : "border-[var(--border-active)] hover:border-[var(--foreground)] bg-[var(--surface-card)]"
                  }`}
                >
                  {routine.isCompletedToday && <Check className="w-3 h-3" strokeWidth={2.5} />}
                </button>
                <span
                  className={`text-xs truncate ${
                    routine.isCompletedToday ? "line-through opacity-70" : "font-medium"
                  }`}
                >
                  {routine.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                  {routine.frequency === "daily" ? "Harian" : "Mingguan"}
                </span>
                <button
                  onClick={() => handleDelete(routine.id)}
                  title="Hapus Rutinitas"
                  className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
