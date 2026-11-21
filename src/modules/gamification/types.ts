export interface XpLedgerItem {
  id: string;
  sourceType: string;
  sourceId: string | null;
  eventKey: string;
  xpAmount: number;
  description: string | null;
  createdAt: Date;
}

export interface AchievementItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

export interface ActivityLogItem {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  description: string;
  createdAt: Date;
}

export interface GamificationProfile {
  totalXp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
  recentXpHistory: XpLedgerItem[];
  achievements: AchievementItem[];
  recentActivities: ActivityLogItem[];
}
