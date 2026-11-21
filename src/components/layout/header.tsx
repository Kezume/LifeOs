"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, Sun, Moon, Command, Menu } from "lucide-react";
import { QuickCaptureModal } from "./quick-capture-modal";

interface HeaderProps {
  levelInfo?: {
    level: number;
    levelTitle: string;
    totalXp: number;
    progressPercentage: number;
  };
  onOpenMobileMenu?: () => void;
  onOpenCapture?: () => void;
}

export function Header({ levelInfo, onOpenMobileMenu, onOpenCapture }: HeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  const openCapture = useCallback(() => {
    if (onOpenCapture) {
      onOpenCapture();
    } else {
      setIsCaptureOpen(true);
    }
  }, [onOpenCapture]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Global keyboard shortcuts (Cmd+K and C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        document.activeElement?.getAttribute("contenteditable") === "true";

      // Cmd+K or Ctrl+K opens quick capture / command
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCapture();
      }

      // 'c' or 'C' opens quick capture only when not inside an input
      if (!isInputActive && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        openCapture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openCapture]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/tasks")) return "Life & Routine";
    if (pathname.startsWith("/projects")) return "Work & Projects";
    if (pathname.startsWith("/learning")) return "Learning & Skills";
    if (pathname.startsWith("/finance")) return "Personal Finance";
    if (pathname.startsWith("/knowledge")) return "Knowledge & Ideas";
    if (pathname.startsWith("/goals")) return "Goals & Growth";
    if (pathname.startsWith("/reviews")) return "Life Review";
    if (pathname.startsWith("/settings")) return "Settings";
    return "LifeOS";
  };

  return (
    <>
      <header className="h-14 flex items-center justify-between px-3.5 sm:px-6 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-1.5 -ml-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors cursor-pointer"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
          <h1 className="text-sm font-medium text-[var(--foreground)] tracking-tight truncate max-w-[130px] sm:max-w-none">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Level & XP pill */}
          {levelInfo && (
            <div
              title={`Total ${levelInfo.totalXp} XP — ${levelInfo.progressPercentage}% to next level`}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--foreground)] tabular-nums"
            >
              <span className="font-semibold text-[11px] text-[var(--foreground)]">
                Lvl {levelInfo.level}
              </span>
              <span className="text-[var(--foreground-muted)] text-[10px]">
                {levelInfo.levelTitle}
              </span>
              <div className="w-12 h-1.5 bg-[var(--surface-card)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--foreground)] transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Search / Command trigger */}
          <button
            type="button"
            onClick={openCapture}
            className="h-8 flex items-center justify-center sm:justify-between gap-2 px-2 sm:px-2.5 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] w-8 sm:w-44 transition-colors cursor-pointer"
            title="Quick search (Cmd+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline text-xs">Quick search</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border)] text-[var(--foreground-muted)]">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Quick Capture trigger */}
          <button
            type="button"
            onClick={openCapture}
            title="Quick capture (C)"
            className="h-8 flex items-center justify-center gap-1.5 px-2.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-medium hover:bg-[var(--btn-primary-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Capture</span>
            <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/15 ml-0.5">
              C
            </kbd>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            title="Toggle color theme"
            className="w-8 h-8 flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Global Quick Capture Modal (rendered when standalone without shell handler) */}
      {!onOpenCapture && (
        <QuickCaptureModal
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
        />
      )}
    </>
  );
}
