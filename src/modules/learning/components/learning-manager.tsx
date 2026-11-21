"use client";

import React, { useState, useTransition } from "react";
import { Plus, BookOpen, Clock, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  createSkillAction,
  updateSkillLevelAction,
  deleteSkillAction,
  createLearningPathAction,
  deleteLearningPathAction,
  logLearningSessionAction,
} from "../actions/learning.actions";

interface SkillItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  currentLevel: number;
  targetLevel: number | null;
  totalHours: number;
}

interface PathItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: string | null;
}

interface LogItem {
  id: string;
  title: string;
  notes: string | null;
  durationMinutes: number;
  learnedAt: Date;
  skillName: string | null;
}

export function LearningManager({
  skills,
  learningPaths,
  recentLogs,
}: {
  skills: SkillItem[];
  learningPaths: PathItem[];
  recentLogs: LogItem[];
}) {
  const [activeTab, setActiveTab] = useState<"skills" | "paths" | "logs">("skills");
  const [isLogging, setIsLogging] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingPath, setIsAddingPath] = useState(false);

  // Log session state
  const [logTitle, setLogTitle] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");

  // New skill state
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("Technology");
  const [skillTargetLevel, setSkillTargetLevel] = useState("5");

  // New path state
  const [pathTitle, setPathTitle] = useState("");
  const [pathTargetDate, setPathTargetDate] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    startTransition(async () => {
      await logLearningSessionAction({
        title: logTitle.trim(),
        skillId: selectedSkillId || null,
        durationMinutes: parseInt(duration, 10) || 30,
        notes: notes.trim() || undefined,
      });
      setLogTitle("");
      setNotes("");
      setIsLogging(false);
    });
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    startTransition(async () => {
      await createSkillAction({
        name: skillName.trim(),
        category: skillCategory.trim(),
        currentLevel: 1,
        targetLevel: parseInt(skillTargetLevel, 10) || 5,
      });
      setSkillName("");
      setIsAddingSkill(false);
    });
  };

  const handleUpdateLevel = (id: string, currentLevel: number, delta: number) => {
    const nextLevel = Math.max(1, Math.min(10, currentLevel + delta));
    startTransition(async () => {
      await updateSkillLevelAction({ id, currentLevel: nextLevel });
    });
  };

  const handleDeleteSkill = (id: string) => {
    startTransition(async () => {
      await deleteSkillAction(id);
    });
  };

  const handleCreatePath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathTitle.trim()) return;

    startTransition(async () => {
      await createLearningPathAction({
        title: pathTitle.trim(),
        targetDate: pathTargetDate || null,
      });
      setPathTitle("");
      setPathTargetDate("");
      setIsAddingPath(false);
    });
  };

  const handleDeletePath = (id: string) => {
    startTransition(async () => {
      await deleteLearningPathAction(id);
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          {(["skills", "paths", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "skills"
                ? "Skill Inventory"
                : tab === "paths"
                ? "Learning Paths"
                : "Riwayat Sesi"}
              <span className="ml-1.5 text-[10px] font-mono opacity-60">
                {tab === "skills" ? skills.length : tab === "paths" ? learningPaths.length : recentLogs.length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogging(!isLogging)}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Catat Waktu Belajar</span>
          </button>
        </div>
      </div>

      {/* Log Session Form Modal/Card */}
      {isLogging && (
        <form
          onSubmit={handleLogSession}
          className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h3 className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
              Catat Sesi Pembelajaran Baru
            </h3>
            <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Otomatis Masuk Metrik</span>
          </div>

          <input
            type="text"
            required
            autoFocus
            value={logTitle}
            onChange={(e) => setLogTitle(e.target.value)}
            placeholder="Topik materi (misal: Membaca Bab 3 Database Indexing)..."
            className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.length > 0 && (
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Skill Terkait (Opsional)</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category || "General"})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--foreground-muted)]">Durasi:</span>
              <input
                type="number"
                min={5}
                max={600}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-8 w-20 px-2 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none font-mono"
              />
              <span className="text-xs text-[var(--foreground-muted)]">menit</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="h-8 px-3 text-xs rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !logTitle.trim()}
              className="h-8 px-3.5 text-xs font-medium rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Simpan Sesi
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Skills Inventory */}
      {activeTab === "skills" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--foreground-muted)]">
              Daftar keahlian & target kemahiran (Level 1–10)
            </span>
            <button
              onClick={() => setIsAddingSkill(!isAddingSkill)}
              className="text-xs text-[var(--foreground)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Skill</span>
            </button>
          </div>

          {isAddingSkill && (
            <form
              onSubmit={handleCreateSkill}
              className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] space-y-2.5"
            >
              <input
                type="text"
                required
                autoFocus
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="Nama keahlian (misal: TypeScript, System Architecture)..."
                className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  placeholder="Kategori"
                  className="h-7 px-2 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
                  <span>Target: Level</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={skillTargetLevel}
                    onChange={(e) => setSkillTargetLevel(e.target.value)}
                    className="h-7 w-12 px-1 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] font-mono"
                  />
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingSkill(false)}
                    className="h-7 px-2.5 text-xs text-[var(--foreground-muted)] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !skillName.trim()}
                    className="h-7 px-3 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                  >
                    Simpan Skill
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada skill yang ditambahkan. Rencanakan keahlian yang ingin Anda pelajari.
              </div>
            ) : (
              skills.map((skill) => {
                const target = skill.targetLevel || 5;
                const progressPct = Math.min(100, Math.round((skill.currentLevel / target) * 100));

                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-[var(--foreground)] truncate">
                          {skill.name}
                        </h4>
                        <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                          {skill.category || "General"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[11px] text-[var(--foreground-muted)]">
                          Level {skill.currentLevel} / {target}
                        </span>
                        <span className="text-[11px] text-[var(--foreground)]">
                          {skill.totalHours} jam
                        </span>
                      </div>
                      <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--foreground)] opacity-80 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10px] text-[var(--foreground-muted)]">Kemahiran</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateLevel(skill.id, skill.currentLevel, -1)}
                          disabled={skill.currentLevel <= 1}
                          className="p-1 rounded bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] disabled:opacity-40 cursor-pointer"
                          title="Turunkan Level"
                        >
                          <ArrowDown className="w-3 h-3 text-[var(--foreground-muted)]" />
                        </button>
                        <button
                          onClick={() => handleUpdateLevel(skill.id, skill.currentLevel, 1)}
                          disabled={skill.currentLevel >= 10}
                          className="p-1 rounded bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] disabled:opacity-40 cursor-pointer"
                          title="Tingkatkan Level"
                        >
                          <ArrowUp className="w-3 h-3 text-[var(--foreground)]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Learning Paths */}
      {activeTab === "paths" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--foreground-muted)]">
              Alur belajar terstruktur & kurikulum pribadi
            </span>
            <button
              onClick={() => setIsAddingPath(!isAddingPath)}
              className="text-xs text-[var(--foreground)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Path</span>
            </button>
          </div>

          {isAddingPath && (
            <form
              onSubmit={handleCreatePath}
              className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] space-y-2.5"
            >
              <input
                type="text"
                required
                autoFocus
                value={pathTitle}
                onChange={(e) => setPathTitle(e.target.value)}
                placeholder="Judul learning path (misal: Frontend Architecture 2026)..."
                className="w-full h-8 px-2.5 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <input
                  type="date"
                  value={pathTargetDate}
                  onChange={(e) => setPathTargetDate(e.target.value)}
                  className="h-7 px-2 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingPath(false)}
                    className="h-7 px-2.5 text-xs text-[var(--foreground-muted)] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !pathTitle.trim()}
                    className="h-7 px-3 text-xs font-medium rounded bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] cursor-pointer"
                  >
                    Simpan Path
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {learningPaths.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
                Belum ada learning path. Buat roadmap belajar pertama Anda.
              </div>
            ) : (
              learningPaths.map((path) => (
                <div
                  key={path.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <div>
                      <h4 className="text-xs font-medium text-[var(--foreground)]">
                        {path.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--foreground-muted)] mt-0.5">
                        <span className="uppercase">{path.status}</span>
                        {path.targetDate && <span>· Target: {path.targetDate}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePath(path.id)}
                    className="p-1 text-[var(--foreground-muted)] hover:text-[var(--danger)] rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Recent Study Logs */}
      {activeTab === "logs" && (
        <div className="space-y-2">
          {recentLogs.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
              Belum ada riwayat sesi belajar. Tekan tombol &quot;Catat Waktu Belajar&quot; di atas untuk mencatat sesi pertama Anda.
            </div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]"
              >
                <div>
                  <h4 className="text-xs font-medium text-[var(--foreground)]">
                    {log.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--foreground-muted)] mt-0.5">
                    {log.skillName && (
                      <span className="px-1 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)]">
                        {log.skillName}
                      </span>
                    )}
                    <span>
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(log.learnedAt))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--foreground)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  <span>{log.durationMinutes}m</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
