import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { requireUser } from "@/lib/auth/require-user";
import { getGamificationProfile } from "@/modules/gamification/queries/gamification.queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const gamification = await getGamificationProfile(user.id);

  const levelInfo = {
    level: gamification.level,
    levelTitle: gamification.levelTitle,
    totalXp: gamification.totalXp,
    progressPercentage: gamification.progressPercentage,
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header levelInfo={levelInfo} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
