"use client";

import React, { useState, useTransition } from "react";
import {
  Save,
  Calendar,
  Sparkles,
  AlertCircle,
  Compass,
  Target,
  CheckCircle2,
  Flame,
  GraduationCap,
  BarChart3,
  ListTodo,
  TrendingUp,
} from "lucide-react";
import { saveReviewAction } from "../actions/reviews.actions";
import { LifeReviewOverallStats } from "../queries/reviews.queries";

interface ReviewItem {
  id: string;
  reviewType: string;
  periodStart: string;
  periodEnd: string;
  highlights: string | null;
  challenges: string | null;
  reflection: string | null;
  nextFocus: string | null;
  createdAt: Date;
}

export function ReviewManager({
  currentReview,
  pastReviews,
  currentPeriod,
  overallStats,
}: {
  currentReview: ReviewItem | null;
  pastReviews: ReviewItem[];
  currentPeriod: { start: string; end: string; label: string };
  overallStats: LifeReviewOverallStats;
}) {
  const [activeTab, setActiveTab] = useState<"form" | "stats" | "history">("form");
  const [highlights, setHighlights] = useState(currentReview?.highlights || "");
  const [challenges, setChallenges] = useState(currentReview?.challenges || "");
  const [reflection, setReflection] = useState(currentReview?.reflection || "");
  const [nextFocus, setNextFocus] = useState(currentReview?.nextFocus || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    startTransition(async () => {
      await saveReviewAction({
        reviewType: "weekly",
        periodStart: currentPeriod.start,
        periodEnd: currentPeriod.end,
        highlights: highlights.trim() || undefined,
        challenges: challenges.trim() || undefined,
        reflection: reflection.trim() || undefined,
        nextFocus: nextFocus.trim() || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Overall Ecosystem Statistics Rack (Executive Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Task Execution */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Tugas Selesai</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {overallStats.tasks.completed}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">
              / {overallStats.tasks.total}
            </span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--foreground)] transition-all rounded-full"
                style={{ width: `${overallStats.tasks.completionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] font-mono">
              <span>{overallStats.tasks.active} tugas aktif</span>
              <span>{overallStats.tasks.completionRate}% rasio</span>
            </div>
          </div>
        </div>

        {/* Card 2: Habit Consistency */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Streak Rutinitas</span>
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {overallStats.routines.streakDays}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">hari berturut</span>
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)]">
            {overallStats.routines.completedToday} dari {overallStats.routines.total} rutinitas tuntas hari ini
          </div>
        </div>

        {/* Card 3: Study Hours */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Waktu Belajar</span>
            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {overallStats.learning.totalHours}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">jam</span>
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)]">
            {overallStats.learning.totalSessions} sesi · {overallStats.learning.activeSkills} skill aktif
          </div>
        </div>

        {/* Card 4: Goals & Projects */}
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Target & Proyek</span>
            <Target className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
            {overallStats.goals.completed}
            <span className="text-xs text-[var(--foreground-muted)] font-normal ml-1">
              / {overallStats.goals.total} target
            </span>
          </div>
          <div className="text-[11px] text-[var(--foreground-muted)]">
            {overallStats.projects.active} proyek berjalan · {overallStats.totalReviews} review selesai
          </div>
        </div>
      </div>

      {/* 2. Level & Overall Progression Banner */}
      <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
            {overallStats.gamification.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--foreground)]">
                Level {overallStats.gamification.level} — {overallStats.gamification.levelTitle}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] font-mono">
                {overallStats.gamification.totalXp} XP Total
              </span>
            </div>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
              Refleksi berkala memberikan wawasan objektif untuk akselerasi pertumbuhan diri Anda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-[var(--foreground)]">
            {overallStats.gamification.progressPercentage}% ke level berikutnya
          </span>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab("form")}
          className={`h-8 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === "form"
              ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Evaluasi Minggu Ini</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`h-8 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === "stats"
              ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
          <span>Matriks & Statistik Hidup</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`h-8 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
            activeTab === "history"
              ? "bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
          <span>Arsip Evaluasi ({pastReviews.length})</span>
        </button>
      </div>

      {/* 4. Tab 1: Current Review Form */}
      {activeTab === "form" && (
        <form
          onSubmit={handleSave}
          className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--foreground)]" />
                <h2 className="text-xs font-medium text-[var(--foreground)]">
                  Evaluasi Mingguan Aktif
                </h2>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5 font-mono">
                Periode: {currentPeriod.label} ({currentPeriod.start} s/d {currentPeriod.end})
              </p>
            </div>

            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-[11px] text-[var(--success)] font-medium">
                  Refleksi tersimpan!
                </span>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="h-8 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isPending ? "Menyimpan..." : "Simpan Refleksi"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Highlights */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pencapaian & Kemenangan (Highlights)
              </label>
              <textarea
                rows={4}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Apa saja kemajuan, tugas selesai, atau hal positif minggu ini?..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors leading-relaxed"
              />
            </div>

            {/* Section 2: Challenges */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
                Hambatan & Distraksi (Challenges)
              </label>
              <textarea
                rows={4}
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="Apa hal yang menghambat produktivitas atau tidak sesuai rencana?..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors leading-relaxed"
              />
            </div>

            {/* Section 3: Reflection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
                Pembelajaran & Wawasan (Reflection)
              </label>
              <textarea
                rows={4}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Wawasan atau pelajaran hidup apa yang Anda petik minggu ini?..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors leading-relaxed"
              />
            </div>

            {/* Section 4: Next Focus */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[var(--success)]" />
                Fokus Utama Minggu Depan (Next Focus)
              </label>
              <textarea
                rows={4}
                value={nextFocus}
                onChange={(e) => setNextFocus(e.target.value)}
                placeholder="Apa 1-3 hal terpenting yang wajib diselesaikan minggu depan?..."
                className="w-full p-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--foreground)] transition-colors leading-relaxed"
              />
            </div>
          </div>
        </form>
      )}

      {/* 5. Tab 2: Detailed Life Metrics Breakdown */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Task & Routine Health */}
            <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  Produktivitas & Kedisiplinan
                </span>
                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Life & Routine</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Tugas Selesai</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">
                    {overallStats.tasks.completed} dari {overallStats.tasks.total} ({overallStats.tasks.completionRate}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Tugas Aktif (Pending)</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">{overallStats.tasks.active} tugas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Konsistensi Kebiasaan</span>
                  <span className="font-mono font-medium text-amber-500">{overallStats.routines.streakDays} hari streak</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Rutinitas Harian Tuntas</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">
                    {overallStats.routines.completedToday} / {overallStats.routines.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Growth & Long Term Trajectory */}
            <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  Pengembangan & Visi Jangka Panjang
                </span>
                <span className="text-[10px] font-mono text-[var(--foreground-muted)]">Growth & Vision</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Akumulasi Belajar</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">{overallStats.learning.totalHours} jam</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Sesi Belajar Tercatat</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">{overallStats.learning.totalSessions} sesi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Target Hidup Tercapai</span>
                  <span className="font-mono font-medium text-emerald-500">
                    {overallStats.goals.completed} dari {overallStats.goals.total} ({overallStats.goals.completionRate}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--foreground-muted)]">Proyek Aktif</span>
                  <span className="font-mono font-medium text-[var(--foreground)]">{overallStats.projects.active} proyek berjalan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Past Reviews History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-medium text-[var(--foreground-muted)]">
              Arsip Evaluasi Minggu Sebelumnya
            </h3>
            <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
              {pastReviews.length} refleksi tersimpan
            </span>
          </div>

          {pastReviews.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
              Belum ada riwayat evaluasi minggu sebelumnya. Isi form Evaluasi Minggu Ini untuk mencatat evaluasi pertama Anda.
            </div>
          ) : (
            pastReviews.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-xs">
                  <span className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                    {r.periodStart} s/d {r.periodEnd}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)]">
                    {r.reviewType}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {r.highlights && (
                    <div>
                      <span className="font-medium text-amber-500 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Pencapaian:
                      </span>
                      <p className="text-[var(--foreground-muted)] mt-0.5 leading-relaxed">{r.highlights}</p>
                    </div>
                  )}
                  {r.challenges && (
                    <div>
                      <span className="font-medium text-red-500 text-[11px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Tantangan:
                      </span>
                      <p className="text-[var(--foreground-muted)] mt-0.5 leading-relaxed">{r.challenges}</p>
                    </div>
                  )}
                  {r.reflection && (
                    <div>
                      <span className="font-medium text-blue-500 text-[11px] flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        Refleksi & Pelajaran:
                      </span>
                      <p className="text-[var(--foreground-muted)] mt-0.5 leading-relaxed">{r.reflection}</p>
                    </div>
                  )}
                  {r.nextFocus && (
                    <div>
                      <span className="font-medium text-emerald-500 text-[11px] flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Fokus Berikutnya:
                      </span>
                      <p className="text-[var(--foreground-muted)] mt-0.5 leading-relaxed">{r.nextFocus}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
