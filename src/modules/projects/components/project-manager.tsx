"use client";

import React, { useState, useTransition } from "react";
import { Plus, Check, Trash2, Calendar, Target, ChevronRight, ChevronDown } from "lucide-react";
import {
  createProjectAction,
  deleteProjectAction,
  createMilestoneAction,
  toggleMilestoneAction,
} from "../actions/project.actions";

interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  lifeAreaName: string | null;
  milestones: MilestoneItem[];
  taskCount: number;
  completedTaskCount: number;
  progress: number;
}

export function ProjectManager({ projects }: { projects: ProjectItem[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // New project state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  // New milestone state
  const [addingMilestoneFor, setAddingMilestoneFor] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");

  const [isPending, startTransition] = useTransition();

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      await createProjectAction({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || null,
        status: "active",
      });
      setName("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setIsAddingProject(false);
    });
  };

  const handleDeleteProject = (id: string) => {
    startTransition(async () => {
      await deleteProjectAction(id);
    });
  };

  const handleCreateMilestone = (projectId: string) => {
    if (!milestoneTitle.trim()) return;

    startTransition(async () => {
      await createMilestoneAction({
        projectId,
        title: milestoneTitle.trim(),
      });
      setMilestoneTitle("");
      setAddingMilestoneFor(null);
    });
  };

  const handleToggleMilestone = (milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    startTransition(async () => {
      await toggleMilestoneAction({
        id: milestoneId,
        status: nextStatus,
      });
    });
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "active") return p.status === "active" || p.status === "planned";
    if (filter === "completed") return p.status === "completed";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
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
                  ? projects.length
                  : tab === "active"
                  ? projects.filter((p) => p.status !== "completed").length
                  : projects.filter((p) => p.status === "completed").length}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddingProject(!isAddingProject)}
          className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Buat Proyek</span>
        </button>
      </div>

      {/* Add Project Form */}
      {isAddingProject && (
        <form
          onSubmit={handleCreateProject}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama proyek baru..."
            className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi atau tujuan proyek (opsional)..."
            className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="h-9 sm:h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="low">Prioritas Rendah</option>
              <option value="medium">Prioritas Sedang</option>
              <option value="high">Prioritas Tinggi</option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 sm:h-8 px-2 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingProject(false)}
              className="h-8 px-3 text-xs rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="h-8 px-4 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Simpan Proyek
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30">
            <p className="text-xs text-[var(--foreground-muted)]">
              {filter === "completed"
                ? "Belum ada proyek yang selesai."
                : "Belum ada proyek yang dibuat. Buat proyek pertama Anda untuk mulai mengatur milestone dan tugas."}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = !!expandedProjects[project.id];

            return (
              <div
                key={project.id}
                className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden transition-colors hover:border-[var(--border-active)]"
              >
                {/* Main Project Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleExpand(project.id)}
                        className="mt-0.5 p-1 rounded hover:bg-[var(--surface-raised)] text-[var(--foreground-muted)] transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
                            {project.name}
                          </h3>
                          <span className="px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                            {project.status}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      title="Hapus Proyek"
                      className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] rounded transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--foreground-muted)]">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-mono">
                        <span>
                          {project.completedTaskCount} / {project.taskCount} tugas selesai
                        </span>
                        <span>·</span>
                        <span>{project.milestones.length} milestone</span>
                        {project.dueDate && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {project.dueDate}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="font-mono font-medium text-[var(--foreground)] flex-shrink-0">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--foreground)] transition-all opacity-80"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Milestones Section */}
                {isExpanded && (
                  <div className="p-4 bg-[var(--surface-raised)]/40 border-t border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        Milestone Proyek
                      </span>

                      <button
                        onClick={() =>
                          setAddingMilestoneFor(
                            addingMilestoneFor === project.id ? null : project.id
                          )
                        }
                        className="text-[11px] text-[var(--foreground)] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Milestone</span>
                      </button>
                    </div>

                    {/* Add Milestone Form */}
                    {addingMilestoneFor === project.id && (
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
                          onClick={() => handleCreateMilestone(project.id)}
                          className="h-7 px-2.5 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    {/* Milestone List */}
                    <div className="space-y-1">
                      {project.milestones.length === 0 ? (
                        <p className="text-xs text-[var(--foreground-muted)] py-2 italic">
                          Belum ada milestone pada proyek ini.
                        </p>
                      ) : (
                        project.milestones.map((m) => {
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

                              {m.dueDate && (
                                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                                  {m.dueDate}
                                </span>
                              )}
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
