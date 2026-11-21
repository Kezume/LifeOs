"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Menu,
  Plus,
} from "lucide-react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { QuickCaptureModal } from "./quick-capture-modal";

interface LevelInfo {
  level: number;
  levelTitle: string;
  totalXp: number;
  progressPercentage: number;
}

interface AppShellProps {
  children: React.ReactNode;
  levelInfo?: LevelInfo;
}

export function AppShell({ children, levelInfo }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  // Auto-close mobile drawer on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* 1. Desktop Sidebar (hidden on mobile, fixed width on md+) */}
      <Sidebar className="hidden md:flex w-60" />

      {/* 2. Mobile Drawer Sidebar (slide-over with backdrop) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 flex flex-col">
            <Sidebar
              className="w-full h-full shadow-2xl border-r border-[var(--border)]"
              showCloseButton={true}
              onClose={() => setIsMobileMenuOpen(false)}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          levelInfo={levelInfo}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCapture={() => setIsCaptureOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (thumb-friendly for phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[var(--surface-deep)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 flex items-center justify-around select-none">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === "/dashboard"
              ? "text-[var(--foreground)] font-semibold"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Home</span>
        </Link>

        <Link
          href="/tasks"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            pathname.startsWith("/tasks")
              ? "text-[var(--foreground)] font-semibold"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <CalendarCheck className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Tasks</span>
        </Link>

        {/* Center Prominent Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsCaptureOpen(true)}
          title="Quick Capture"
          className="w-10 h-10 -mt-3 rounded-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] flex items-center justify-center shadow-lg border border-[var(--border)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>

        <Link
          href="/finance"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            pathname.startsWith("/finance")
              ? "text-[var(--foreground)] font-semibold"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Finance</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
      />
    </div>
  );
}
