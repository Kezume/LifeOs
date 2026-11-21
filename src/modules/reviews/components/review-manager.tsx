"use client";

import React, { useState, useTransition } from "react";
import { Save, Calendar, Sparkles, AlertCircle, Compass, Target } from "lucide-react";
import { saveReviewAction } from "../actions/reviews.actions";

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
}: {
  currentReview: ReviewItem | null;
  pastReviews: ReviewItem[];
  currentPeriod: { start: string; end: string; label: string };
}) {
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
      {/* Current Weekly Review Card */}
      <form
        onSubmit={handleSave}
        className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
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
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
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
              rows={3}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Apa saja kemajuan, tugas selesai, atau hal positif minggu ini?..."
              className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            />
          </div>

          {/* Section 2: Challenges */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--danger)]" />
              Hambatan & Distraksi (Challenges)
            </label>
            <textarea
              rows={3}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Apa hal yang menghambat produktivitas atau tidak sesuai rencana?..."
              className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            />
          </div>

          {/* Section 3: Reflection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
              Pembelajaran & Wawasan (Reflection)
            </label>
            <textarea
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Wawasan atau pelajaran hidup apa yang Anda petik minggu ini?..."
              className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            />
          </div>

          {/* Section 4: Next Focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[var(--success)]" />
              Fokus Utama Minggu Depan (Next Focus)
            </label>
            <textarea
              rows={3}
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              placeholder="Apa 1-3 hal terpenting yang wajib diselesaikan minggu depan?..."
              className="w-full p-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            />
          </div>
        </div>
      </form>

      {/* Past Reviews History */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-[var(--foreground-muted)]">
          Arsip Refleksi Sebelumnya
        </h3>

        {pastReviews.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/30 text-xs text-[var(--foreground-muted)]">
            Belum ada riwayat evaluasi minggu sebelumnya. Isi form di atas untuk memulai evaluasi mingguan pertama Anda.
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
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--surface-raised)] text-[var(--foreground-muted)]">
                  {r.reviewType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {r.highlights && (
                  <div>
                    <span className="font-medium text-amber-500 text-[11px]">Highlights:</span>
                    <p className="text-[var(--foreground-muted)] mt-0.5">{r.highlights}</p>
                  </div>
                )}
                {r.challenges && (
                  <div>
                    <span className="font-medium text-red-500 text-[11px]">Tantangan:</span>
                    <p className="text-[var(--foreground-muted)] mt-0.5">{r.challenges}</p>
                  </div>
                )}
                {r.reflection && (
                  <div>
                    <span className="font-medium text-blue-500 text-[11px]">Refleksi:</span>
                    <p className="text-[var(--foreground-muted)] mt-0.5">{r.reflection}</p>
                  </div>
                )}
                {r.nextFocus && (
                  <div>
                    <span className="font-medium text-emerald-500 text-[11px]">Fokus:</span>
                    <p className="text-[var(--foreground-muted)] mt-0.5">{r.nextFocus}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
