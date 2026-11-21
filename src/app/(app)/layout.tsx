import React from "react";
import { AppShell } from "@/components/layout/app-shell";
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

  return <AppShell levelInfo={levelInfo}>{children}</AppShell>;
}
