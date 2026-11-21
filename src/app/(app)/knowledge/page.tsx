import React from "react";
import { requireUser } from "@/lib/auth/require-user";
import {
  getUserInboxItems,
  getUserNotes,
  getKnowledgeStats,
} from "@/modules/knowledge/queries/knowledge.queries";
import { KnowledgeManager } from "@/modules/knowledge/components/knowledge-manager";

export default async function KnowledgePage() {
  const user = await requireUser();

  const [inboxItems, notes, stats] = await Promise.all([
    getUserInboxItems(user.id),
    getUserNotes(user.id),
    getKnowledgeStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
            Knowledge & Ideas
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            Second Brain untuk mencatat ide spontan, artikel wawasan, dan catatan terstruktur
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Inbox:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {stats.inboxCount} item
            </span>
          </div>
          <div className="h-8 px-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border)] flex items-center gap-2 text-xs">
            <span className="text-[var(--foreground-muted)]">Catatan:</span>
            <span className="font-medium font-mono tabular-nums text-[var(--foreground)]">
              {stats.totalNotes} catatan
            </span>
          </div>
        </div>
      </div>

      {/* Main Knowledge Management UI */}
      <KnowledgeManager inboxItems={inboxItems} notes={notes} />
    </div>
  );
}
