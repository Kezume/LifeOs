import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import { getUserProjects, getProjectStats } from "@/modules/projects/queries/project.queries";
import { ProjectManager } from "@/modules/projects/components/project-manager";

export default async function ProjectsPage() {
  const user = await requireUser();

  const [projects, projectStats] = await Promise.all([
    getUserProjects(user.id),
    getProjectStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Work & Projects
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Kelola proyek kerja, target milestone, dan keterhubungan tugas dalam satu tempat
          </p>
        </div>

        {/* Quick metric pills */}
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Proyek Aktif:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {projectStats.active}
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Selesai:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--success)]">
              {projectStats.completed}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ProjectManager projects={projects} />
    </div>
  );
}
