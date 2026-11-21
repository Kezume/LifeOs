"use client";

import { useSession } from "@/lib/auth/auth-client";
import { User, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
          Manage profile details, regional preferences, and security settings
        </p>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* Profile Card */}
        <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <User className="w-4 h-4 text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <h2 className="text-xs font-medium text-[var(--foreground)]">
              User profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">
                Full name
              </label>
              <input
                type="text"
                readOnly
                value={session?.user?.name || ""}
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">
                Email address
              </label>
              <input
                type="email"
                readOnly
                value={session?.user?.email || ""}
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Regional & Timezone Card */}
        <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Globe className="w-4 h-4 text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <h2 className="text-xs font-medium text-[var(--foreground)]">
              Regional and time zone
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">
                Default time zone
              </label>
              <input
                type="text"
                readOnly
                value="Asia/Jakarta (WIB)"
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">
                Date & number locale
              </label>
              <input
                type="text"
                readOnly
                value="Indonesia (id-ID)"
                className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border)] p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Shield className="w-4 h-4 text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <h2 className="text-xs font-medium text-[var(--foreground)]">
              Authentication security
            </h2>
          </div>

          <div className="p-3 rounded-lg bg-[var(--surface-raised)] text-xs text-[var(--foreground-muted)] leading-relaxed">
            Authentication is powered by <strong>Better Auth</strong> with server-side signed session tokens. Multi-tenant data segregation is strictly enforced via User ID on every database query.
          </div>
        </div>
      </div>
    </div>
  );
}
