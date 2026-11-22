import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const domains = [
    { title: "Life & Routine", desc: "Daily checklists, habits, and time blocks" },
    { title: "Work & Projects", desc: "Deep work, task management, and milestones" },
    { title: "Learning & Skills", desc: "Skill roadmaps, study hours, and resources" },
    { title: "Personal Finance", desc: "Cashflow tracking, budgets, and savings" },
    { title: "Knowledge & Ideas", desc: "Second brain, structured notes, and concepts" },
    { title: "Goals & Growth", desc: "Life vision, annual OKRs, and reflections" },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[var(--background)]">
      {/* Left Column: Brand Showcase with Obsidian Black Theme (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#09090b] border-r border-white/10 p-8 xl:p-12 2xl:p-16 flex-col justify-between select-none h-full">
        <div>
          {/* Brand Logo & Name */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-semibold text-xs tracking-tight">
              L
            </span>
            <span className="text-base font-medium tracking-tight text-white">
              LifeOS
            </span>
          </Link>

          {/* Core Brand Manifesto */}
          <div className="mt-8 xl:mt-10 max-w-lg space-y-2.5">
            <h1 className="text-2xl xl:text-3xl font-medium tracking-tight text-white leading-snug">
              An operating system for intentional living and deep work
            </h1>
            <p className="text-xs xl:text-sm text-zinc-400 leading-relaxed">
              Bring your daily routines, active projects, learning progress, and long-term trajectory into one calm, private workspace.
            </p>
          </div>

          {/* Connected Life Domains Matrix (Clean, authentic replacement for trajectory card) */}
          <div className="mt-6 xl:mt-8 max-w-lg space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Connected Life Domains
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {domains.map((domain) => (
                <div
                  key={domain.title}
                  className="p-3 rounded-lg bg-[#121215] border border-white/5 space-y-0.5"
                >
                  <div className="text-xs font-medium text-zinc-200">
                    {domain.title}
                  </div>
                  <div className="text-[11px] text-zinc-500 leading-tight">
                    {domain.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Trust & Architecture Pillars */}
        <div className="pt-6 border-t border-white/10 max-w-lg">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>100% Private</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your data lives exclusively in your private database.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <Database className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>Postgres & Drizzle</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Reliable schema migrations without vendor lock-in.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <Zap className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>Zero Slop</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Quiet interface focused entirely on execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 h-full flex flex-col justify-center items-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-semibold text-xs tracking-tight">
                L
              </span>
              <span className="text-base font-medium tracking-tight text-[var(--foreground)]">
                LifeOS
              </span>
            </Link>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Personal life management workspace
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-xl p-6 sm:p-7 shadow-[var(--shadow-card)]">
            {children}
          </div>

          <div className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
            Private and secure personal workspace
          </div>
        </div>
      </div>
    </div>
  );
}
