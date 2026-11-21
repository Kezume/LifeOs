import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { getUserTasks, getTaskStats } from "@/modules/tasks/queries/task.queries";
import { getUserRoutines, getRoutineStats } from "@/modules/routines/queries/routine.queries";
import { getUserProjects } from "@/modules/projects/queries/project.queries";
import { TaskManager } from "@/modules/tasks/components/task-manager";
import { RoutineManager } from "@/modules/routines/components/routine-manager";

export default async function TasksPage() {
  const user = await requireUser();
  const todayDate = new Date().toISOString().split("T")[0];

  const [tasks, taskStats, routines, routineStats, projects] = await Promise.all([
    getUserTasks(user.id),
    getTaskStats(user.id),
    getUserRoutines(user.id, todayDate),
    getRoutineStats(user.id, todayDate),
    getUserProjects(user.id),
  ]);

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Life & Routine
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Kelola tugas harian, prioritas kerja, dan konsistensi rutinitas Anda
          </p>
        </div>

        {/* Quick metric pills */}
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Tugas Aktif:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {taskStats.active}
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Selesai:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--success)]">
              {taskStats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Task Manager */}
        <div className="lg:col-span-2">
          <TaskManager initialTasks={tasks} projects={projectOptions} />
        </div>

        {/* Right 1 Column: Daily Habits & Routines */}
        <div>
          <RoutineManager
            routines={routines}
            todayDate={todayDate}
            streakDays={routineStats.streakDays}
          />
        </div>
      </div>
    </div>
  );
}
