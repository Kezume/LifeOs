"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  FolderKanban,
  GraduationCap,
  Wallet,
  Lightbulb,
  Target,
  LineChart,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth/auth-client";

interface SidebarProps {
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onItemClick?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const navigationGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Life domains",
    items: [
      {
        label: "Life & Routine",
        href: "/tasks",
        icon: CalendarCheck,
      },
      {
        label: "Work & Projects",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        label: "Learning & Skills",
        href: "/learning",
        icon: GraduationCap,
      },
      {
        label: "Personal Finance",
        href: "/finance",
        icon: Wallet,
      },
      {
        label: "Knowledge & Ideas",
        href: "/knowledge",
        icon: Lightbulb,
      },
      {
        label: "Goals & Growth",
        href: "/goals",
        icon: Target,
      },
    ],
  },
  {
    title: "Review",
    items: [
      {
        label: "Life Review",
        href: "/reviews",
        icon: LineChart,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({
  className = "",
  showCloseButton = false,
  onClose,
  onItemClick,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col justify-between border-r border-[var(--border)] bg-[var(--surface-deep)] min-h-screen select-none ${className}`}
    >
      <div>
        {/* Brand header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <Link
            href="/dashboard"
            onClick={onItemClick}
            className="flex items-center gap-2.5"
          >
            <span className="w-6 h-6 rounded-md bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-semibold text-xs tracking-tight">
              L
            </span>
            <span className="text-sm font-medium tracking-tight text-[var(--foreground)]">
              LifeOS
            </span>
          </Link>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <div className="px-2 py-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navigationGroups.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? "mt-5" : ""}>
              <div className="px-2.5 mb-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                {group.title}
              </div>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={`h-[34px] flex items-center gap-2.5 px-2.5 text-xs rounded-lg transition-colors ${
                        isActive
                          ? "bg-[var(--surface-raised)] text-[var(--foreground)] font-medium border border-[var(--border)] shadow-[var(--top-highlight)]"
                          : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]/60"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"
                        }`}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-deep)]">
        <div className="flex items-center justify-between p-1 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-xs font-medium text-[var(--foreground)] flex-shrink-0">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--foreground)] truncate leading-tight">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[11px] text-[var(--foreground-muted)] truncate">
                {session?.user?.email || "Personal account"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-raised)] rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
