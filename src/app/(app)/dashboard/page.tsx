import React from "react";
import Link from "next/link";
import {
  Plus,
  CheckCircle2,
  History,
  Zap,
  ShieldCheck,
  PieChart,
  FolderGit2,
  GraduationCap,
  Trophy,
  Flame,
  ArrowUpRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
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

  const taskCompletionRate =
    taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  const statCards = [
    {
      label: "Tugas & Rutinitas",
      value: `${taskStats.completed}/${taskStats.total}`,
      context: `${taskStats.active} aktif · ${taskCompletionRate}% tuntas`,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
    },
    {
      label: "Proyek Kerja",
      value: `${projectStats.active} Berjalan`,
      context: `${projectStats.completed} selesai dari ${projectStats.total} proyek`,
      icon: FolderGit2,
      iconColor: "text-blue-500",
    },
    {
      label: "Waktu Belajar",
      value: `${learningStats.totalHours} Jam`,
      context: `${learningStats.totalSessions} sesi · ${learningStats.activeSkills} skill aktif`,
      icon: GraduationCap,
      iconColor: "text-amber-500",
    },
    {
      label: "Personal XP",
      value: `${gamification.totalXp} XP`,
      context: `Level ${gamification.level} · ${gamification.levelTitle}`,
      icon: Trophy,
      iconColor: "text-purple-500",
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
      width:
        taskStats.total > 0
          ? `${Math.min(100, Math.round((taskStats.completed / taskStats.total) * 100))}%`
          : "20%",
    },
    {
      name: "Work & Projects",
      href: "/projects",
      status: `${projectStats.active} proyek aktif · ${projectStats.completed} tuntas`,
      width:
        projectStats.total > 0
          ? `${Math.min(100, Math.round((projectStats.completed / projectStats.total) * 100))}%`
          : "20%",
    },
    {
      name: "Learning & Skills",
      href: "/learning",
      status: `${learningStats.totalHours} jam · ${learningStats.activeSkills} skill`,
      width:
        learningStats.totalHours > 0
          ? `${Math.min(100, Math.round((learningStats.totalHours / 10) * 100))}%`
          : "15%",
    },
    {
      name: "Knowledge & Ideas",
      href: "/knowledge",
      status: `${knowledgeStats.inboxCount} inbox · ${knowledgeStats.totalNotes} catatan`,
      width:
        knowledgeStats.totalNotes > 0
          ? `${Math.min(100, Math.round((knowledgeStats.totalNotes / 5) * 100))}%`
          : "15%",
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
      width:
        goalStats.total > 0
          ? `${Math.min(100, Math.round((goalStats.completed / goalStats.total) * 100))}%`
          : "15%",
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
      formattedValue: `${taskStats.completed}/${taskStats.total} tuntas`,
    },
    {
      name: "Proyek Kerja",
      value: Math.max(1, projectStats.total),
      color: "var(--domain-work)",
      formattedValue: `${projectStats.active} aktif · ${projectStats.completed} selesai`,
    },
    {
      name: "Belajar & Skill",
      value: Math.max(1, Math.round(learningStats.totalHours * 2) || 1),
      color: "var(--domain-learning)",
      formattedValue: `${learningStats.totalHours} jam belajar`,
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
      formattedValue: `${goalStats.completed}/${goalStats.total} tercapai`,
    },
  ];

  const totalEcosystemItems =
    taskStats.total +
    projectStats.total +
    goalStats.total +
    knowledgeStats.totalNotes;

  const unlockedAchievements = gamification.achievements.filter((a) => a.unlocked);

  return (
    <div className="space-y-6 select-none">
      {/* 1. Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="text-xs text-[var(--foreground-muted)] mb-1 font-mono">
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
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer flex-shrink-0 shadow-sm"
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
          <Link
            href="/knowledge"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Second Brain</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive KPI Metrics Rack */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>{stat.label}</span>
                <Icon className={`w-3.5 h-3.5 ${stat.iconColor}`} strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-medium tracking-tight text-[var(--foreground)] tabular-nums">
                {stat.value}
              </div>
              <div className="text-[11px] text-[var(--foreground-muted)] truncate">
                {stat.context}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Executive Analytics & Gamification Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Ecosystem Balance Donut Chart */}
        <div className="lg:col-span-7 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
              <div>
                <h2 className="text-xs font-medium text-[var(--foreground)]">
                  Keseimbangan Ekosistem
                </h2>
                <p className="text-[11px] text-[var(--foreground-muted)]">
                  LifeOS Index: distribusi porsi beban & aktivitas lintas domain
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)]">
              {totalEcosystemItems} entri
            </span>
          </div>

          <div className="flex justify-center py-1">
            <DonutChart
              segments={ecosystemSegments}
              centerLabel={`Lvl ${gamification.level}`}
              centerSublabel={`${gamification.totalXp} XP`}
              size={155}
              strokeWidth={16}
              showLegend={true}
              legendPosition="right"
            />
          </div>

          <div className="pt-2 border-t border-[var(--border)]/50 flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
            <span>Sinkronisasi otomatis dengan modul Life Review</span>
            <Link
              href="/reviews"
              className="text-[var(--foreground)] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Buka Review</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right (5 cols): Level Progression & Milestone Showcase */}
        <div className="lg:col-span-5 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-500" strokeWidth={1.5} />
                <h2 className="text-xs font-medium text-[var(--foreground)]">
                  Level & Gamifikasi
                </h2>
              </div>
              <span className="w-6 h-6 rounded-md bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
                {gamification.level}
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--foreground)]">
                  {gamification.levelTitle}
                </span>
                <span className="font-mono text-[11px] text-[var(--foreground-muted)]">
                  {gamification.totalXp} XP total
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[var(--surface-raised)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--foreground)] transition-all duration-500 rounded-full"
                  style={{ width: `${gamification.progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)]">
                <span>{gamification.currentLevelXp} / {gamification.nextLevelXp} XP</span>
                <span className="text-[var(--foreground)] font-medium">
                  {gamification.progressPercentage}% ke Level {gamification.level + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Milestone Badges Mini Rack */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Pencapaian Terbuka
              </span>
              <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                {unlockedAchievements.length} / {gamification.achievements.length} Terbuka
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gamification.achievements.slice(0, 6).map((ach) => (
                <div
                  key={ach.code}
                  title={`${ach.name}: ${ach.description} (+${ach.xpReward} XP)`}
                  className={`p-2 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                    ach.unlocked
                      ? "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--foreground)]"
                      : "bg-[var(--surface-deep)]/40 border-[var(--border)] border-dashed text-[var(--foreground-muted)] opacity-50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {ach.unlocked ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[var(--foreground-muted)]" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium leading-tight truncate">
                      {ach.name}
                    </div>
                    <div className="text-[9px] font-mono text-[var(--foreground-muted)]">
                      +{ach.xpReward} XP
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Operational Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Today's Focus & Live Activity Timeline */}
        <div className="lg:col-span-7 space-y-5">
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
              <div className="space-y-2">
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

        {/* Right (5 cols): Life Domains & Routine Consistency */}
        <div className="lg:col-span-5 space-y-5">
          {/* Life Domains Card */}
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--foreground)]" strokeWidth={1.5} />
                <h2 className="text-xs font-medium text-[var(--foreground)]">
                  Area Kehidupan
                </h2>
              </div>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                6 domain aktif
              </span>
            </div>

            <div className="space-y-3">
              {domains.map((domain) => (
                <Link
                  key={domain.name}
                  href={domain.href}
                  className="block space-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[12px] text-[var(--foreground)] group-hover:underline font-medium">
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
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-card)] p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-medium text-[var(--foreground)]">
                  Konsistensi Rutinitas
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-medium">
                {routineStats.streakDays} hari streak
              </span>
            </div>

            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              Tercatat <span className="font-mono text-[var(--foreground)] font-medium">{routineStats.completedToday}</span> dari <span className="font-mono text-[var(--foreground)] font-medium">{routineStats.total}</span> rutinitas tuntas hari ini. Lanjutkan konsistensi di{" "}
              <Link href="/tasks" className="text-[var(--foreground)] underline underline-offset-2 font-medium">
                Life & Routine
              </Link>{" "}
              untuk klaim bonus +25 XP per kebiasaan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}