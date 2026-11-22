import React from "react";
import Link from "next/link";
import { Plus, Award, CheckCircle2, History, Zap, ShieldCheck, PieChart } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { getTaskStats, getUserTasks } from "@/modules/tasks/queries/task.queries";
import { getProjectStats } from "@/modules/projects/queries/project.queries";
import { getRoutineStats } from "@/modules/routines/queries/routine.queries";
import { getLearningStats } from "@/modules/learning/queries/learning.queries";
import { getKnowledgeStats } from "@/modules/knowledge/queries/knowledge.queries";
import { getFinanceSummary } from "@/modules/finance/queries/finance.queries";
import { getGoalStats } from "@/modules/goals/queries/goals.queries";
import { getGamificationProfile } from "@/modules/gamification/queries/gamification.queries";
import { DashboardFocus } from "@/modules/tasks/components/dashboard-focus";
import { DonutChart, DonutSegment } from "@/components/ui/donut-chart";

export default async function DashboardPage() {
  const user = await requireUser();
  const todayDate = new Date().toISOString().split("T")[0];

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [
    taskStats,
    projectStats,
    routineStats,
    learningStats,
    knowledgeStats,
    financeSummary,
    goalStats,
    tasks,
    gamification,
  ] = await Promise.all([
    getTaskStats(user.id),
    getProjectStats(user.id),
    getRoutineStats(user.id, todayDate),
    getLearningStats(user.id),
    getKnowledgeStats(user.id),
    getFinanceSummary(user.id),
    getGoalStats(user.id),
    getUserTasks(user.id),
    getGamificationProfile(user.id),
  ]);

  const statCards = [
    {
      label: "Tugas Aktif",
      value: String(taskStats.active),
      context: `${taskStats.completed} tugas selesai`,
    },
    {
      label: "Proyek Berjalan",
      value: String(projectStats.active),
      context: `${projectStats.total} total proyek`,
    },
    {
      label: "Waktu Belajar",
      value: `${learningStats.totalHours} jam`,
      context: `${learningStats.totalSessions} sesi tercatat`,
    },
    {
      label: "Personal XP",
      value: `${gamification.totalXp} XP`,
      context: `Level ${gamification.level} · ${gamification.levelTitle}`,
    },
  ];

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const domains = [
    {
      name: "Life & Routine",
      href: "/tasks",
      status: `${taskStats.active} tugas · ${routineStats.completedToday} rutinitas`,
      width: taskStats.total > 0 ? `${Math.min(100, Math.round((taskStats.completed / taskStats.total) * 100))}%` : "20%",
    },
    {
      name: "Work & Projects",
      href: "/projects",
      status: `${projectStats.active} proyek berjalan`,
      width: projectStats.total > 0 ? `${Math.min(100, Math.round((projectStats.completed / projectStats.total) * 100))}%` : "20%",
    },
    {
      name: "Learning & Skills",
      href: "/learning",
      status: `${learningStats.totalHours} jam · ${learningStats.activeSkills} skill`,
      width: learningStats.totalHours > 0 ? `${Math.min(100, Math.round((learningStats.totalHours / 10) * 100))}%` : "15%",
    },
    {
      name: "Knowledge & Ideas",
      href: "/knowledge",
      status: `${knowledgeStats.inboxCount} inbox · ${knowledgeStats.totalNotes} catatan`,
      width: knowledgeStats.totalNotes > 0 ? `${Math.min(100, Math.round((knowledgeStats.totalNotes / 5) * 100))}%` : "15%",
    },
    {
      name: "Personal Finance",
      href: "/finance",
      status: `Saldo ${formatIDR(financeSummary.totalBalance)}`,
      width: financeSummary.accountCount > 0 ? "35%" : "10%",
    },
    {
      name: "Goals & Growth",
      href: "/goals",
      status: `${goalStats.active} target aktif · ${goalStats.completed} tercapai`,
      width: goalStats.total > 0 ? `${Math.min(100, Math.round((goalStats.completed / goalStats.total) * 100))}%` : "15%",
    },
  ];

  const formatActivityTime = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(new Date(date));
  };

  const ecosystemSegments: DonutSegment[] = [
    {
      name: "Tugas & Rutinitas",
      value: Math.max(1, taskStats.total + routineStats.total),
      color: "var(--domain-life)",
      formattedValue: `${taskStats.completed} selesai`,
    },
    {
      name: "Proyek Kerja",
      value: Math.max(1, projectStats.total),
      color: "var(--domain-work)",
      formattedValue: `${projectStats.active} aktif`,
    },
    {
      name: "Belajar & Skill",
      value: Math.max(1, Math.round(learningStats.totalHours * 2) || 1),
      color: "var(--domain-learning)",
      formattedValue: `${learningStats.totalHours} jam`,
    },
    {
      name: "Second Brain",
      value: Math.max(1, knowledgeStats.totalNotes + knowledgeStats.inboxCount),
      color: "var(--domain-knowledge)",
      formattedValue: `${knowledgeStats.totalNotes} catatan`,
    },
    {
      name: "Target Hidup",
      value: Math.max(1, goalStats.total),
      color: "var(--domain-goals)",
      formattedValue: `${goalStats.active} target`,
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="text-xs text-[var(--foreground-muted)] mb-1">
            {currentDate}
          </div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Pusat kendali ekosistem dan visualisasi perkembangan diri LifeOS
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1 sm:pb-0 sm:flex-wrap">
          <Link
            href="/tasks"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Tugas Baru</span>
          </Link>
          <Link
            href="/finance"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Keuangan</span>
          </Link>
          <Link
            href="/goals"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Target Hidup</span>
          </Link>
          <Link
            href="/reviews"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Life Review</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)]"
          >
            <div className="text-xs text-[var(--foreground-muted)] font-normal">
              {stat.label}
            </div>
            <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] mt-2 tabular-nums">
              {stat.value}
            </div>
            <div className="text-[11px] text-[var(--foreground-muted)] mt-1">
              {stat.context}
            </div>
          </div>
        ))}
      </div>

      {/* Gamification Level Progress Card */}
      <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
              {gamification.level}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  Level {gamification.level} — {gamification.levelTitle}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] font-mono">
                  {gamification.totalXp} XP total
                </span>
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">
                {gamification.currentLevelXp} / {gamification.nextLevelXp} XP menuju Level {gamification.level + 1}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-medium text-[var(--foreground)]">
              {gamification.progressPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
          <div
            className="h-full bg-[var(--foreground)] transition-all duration-500 rounded-full"
            style={{ width: `${gamification.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Achievements Showcase Rack */}
      <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
            <h2 className="text-xs font-medium text-[var(--foreground)]">
              Pencapaian & Milestone
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--foreground-muted)]">
            {gamification.achievements.filter((a) => a.unlocked).length} / {gamification.achievements.length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {gamification.achievements.map((ach) => (
            <div
              key={ach.code}
              title={`${ach.name}: ${ach.description} (+${ach.xpReward} XP)`}
              className={`p-3 rounded-lg border text-center transition-colors flex flex-col items-center justify-between min-h-[90px] ${
                ach.unlocked
                  ? "bg-[var(--surface-raised)] border-[var(--foreground)] text-[var(--foreground)]"
                  : "bg-[var(--surface-deep)]/40 border-[var(--border)] border-dashed text-[var(--foreground-muted)] opacity-60"
              }`}
            >
              <div className="mt-1">
                {ach.unlocked ? (
                  <ShieldCheck className="w-5 h-5 mx-auto text-[var(--foreground)]" strokeWidth={1.5} />
                ) : (
                  <Zap className="w-5 h-5 mx-auto text-[var(--foreground-muted)]" strokeWidth={1.5} />
                )}
              </div>
              <div className="space-y-0.5 mt-2">
                <div className="text-[11px] font-medium leading-tight truncate max-w-[100px]">
                  {ach.name}
                </div>
                <div className="text-[10px] font-mono text-[var(--foreground-muted)]">
                  +{ach.xpReward} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Today's focus & Live Activity Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Interactive Today's Focus Card */}
          <DashboardFocus initialTasks={tasks} />

          {/* Activity History Timeline */}
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
                <h3 className="text-xs font-medium text-[var(--foreground)]">
                  Riwayat Aktivitas Terbaru
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                {gamification.recentActivities.length} entri
              </span>
            </div>

            {gamification.recentActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--foreground-muted)]">
                Belum ada aktivitas yang dicatat. Lakukan aksi atau gunakan Quick Capture (<kbd className="font-mono px-1 py-0.5 bg-[var(--surface-raised)] rounded">C</kbd>) untuk mulai mengumpulkan XP.
              </div>
            ) : (
              <div className="space-y-2.5">
                {gamification.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]/50 border border-[var(--border)] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)] flex-shrink-0" />
                      <span className="text-[var(--foreground)] truncate font-normal">
                        {act.description}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--foreground-muted)] flex-shrink-0 ml-3">
                      {formatActivityTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Life Domains & Quick Navigation */}
        <div className="space-y-5">
          {/* Ecosystem Balance Donut Chart Card */}
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
                <h2 className="text-xs font-medium text-[var(--foreground)]">
                  Keseimbangan Ekosistem
                </h2>
              </div>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                LifeOS Index
              </span>
            </div>

            <DonutChart
              segments={ecosystemSegments}
              centerLabel={`Lvl ${gamification.level}`}
              centerSublabel={`${gamification.totalXp} XP`}
              size={140}
              strokeWidth={14}
              showLegend={true}
              legendPosition="right"
            />
          </div>

          {/* Life Domains Card */}
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
              <h2 className="text-xs font-medium text-[var(--foreground)]">
                Area Kehidupan
              </h2>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                6 domain aktif
              </span>
            </div>

            <div className="space-y-3">
              {domains.map((domain) => (
                <Link
                  key={domain.name}
                  href={domain.href}
                  className="block space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[12px] text-[var(--foreground)] group-hover:underline">
                      {domain.name}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--foreground-muted)]">
                      {domain.status}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-raised)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--foreground)] transition-all opacity-70 group-hover:opacity-100"
                      style={{ width: domain.width }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Routine consistency card */}
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <h3 className="text-xs font-medium text-[var(--foreground)]">
                Konsistensi Rutinitas
              </h3>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                {routineStats.streakDays} hari streak
              </span>
            </div>

            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Centang kebiasaan harian Anda di halaman{" "}
              <Link href="/tasks" className="text-[var(--foreground)] underline underline-offset-2">
                Life & Routine
              </Link>{" "}
              untuk membangun kebiasaan yang berkesinambungan dan mendapatkan +25 XP per rutinitas.
            </p>
          </div>

          {/* System status check */}
          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] flex items-start gap-3">
            <div className="p-1 rounded bg-[var(--surface-raised)] text-[var(--foreground)] flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-medium text-[var(--foreground)]">
                LifeOS Engine Online
              </h4>
              <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                PostgreSQL IPv4 Pooler aktif dengan 30 tabel tersinkronisasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
