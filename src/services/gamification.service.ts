import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface DailyMissionItem {
  id: string;
  missionKey: string;
  title: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
  rewardXp: number;
}

export interface GamificationDashboardData {
  studentId: string;
  studentName: string;
  avatarUrl?: string;

  // Metric 1: Thời gian học tuần này
  studyHoursThisWeek: number;
  studyTargetHours: number;
  studyGrowthPercent: number;
  dailyStudyHoursOfWeek: number[]; // 7 ngày (T2..CN)

  // Metric 2: Nhiệm vụ hôm nay
  dailyMissionsCompleted: number;
  dailyMissionsTotal: number;
  dailyCompletionPercent: number;
  dailyMissions: DailyMissionItem[];
  dailyRewardClaimed: boolean;
  nextMissionTitle: string;

  // Metric 3: Streak
  currentStreak: number;
  longestStreak: number;
  hasStudiedToday: boolean;
  weeklyStreakStatus: boolean[]; // 7 ngày (T2..CN)

  // Metric 4: XP & Rank
  totalXp: number;
  monthlyXp: number;
  todayXp: number;
  monthlyRank: number;
  rankTier: string;
  rankTierName: string;
}

export interface LeaderboardStudentItem {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  monthlyXp: number;
  totalXp: number;
  currentStreak: number;
  rankTier: string;
  rankTierName: string;
  isCurrentUser: boolean;
  rewardBadge?: string;
}

export interface MonthlyRewardRule {
  rankRange: string;
  rewardTitle: string;
  icon: string;
  highlightColor: string;
}

export interface LeaderboardResponseData {
  monthYear: string;
  daysRemainingInMonth: number;
  topStudents: LeaderboardStudentItem[];
  currentUserRank?: LeaderboardStudentItem;
  rewardRules: MonthlyRewardRule[];
}

export interface ClaimMissionResult {
  success: boolean;
  message: string;
  xpClaimed: number;
  newTotalXp: number;
  newMonthlyXp: number;
  newTodayXp: number;
}

export const gamificationService = {
  getDashboard: async (): Promise<GamificationDashboardData> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/gamification/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<GamificationDashboardData>(
      response,
      'Không thể tải dữ liệu chỉ số học tập'
    );
  },

  claimMission: async (missionId: string): Promise<ClaimMissionResult> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/student/gamification/missions/${missionId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<ClaimMissionResult>(
      response,
      'Không thể nhận điểm thưởng nhiệm vụ'
    );
  },

  getMonthlyLeaderboard: async (month?: string): Promise<LeaderboardResponseData> => {
    const url = month
      ? `${API_BASE_URL}/api/v1/gamification/leaderboard?month=${encodeURIComponent(month)}`
      : `${API_BASE_URL}/api/v1/gamification/leaderboard`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<LeaderboardResponseData>(
      response,
      'Không thể tải bảng xếp hạng'
    );
  },

  getAllTimeLeaderboard: async (): Promise<LeaderboardResponseData> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/gamification/leaderboard/all-time`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleApiResponse<LeaderboardResponseData>(
      response,
      'Không thể tải bảng xếp hạng all-time'
    );
  },
};
