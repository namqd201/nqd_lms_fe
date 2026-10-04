export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  status: UserStatus;
  roles: string[];
  isVip?: boolean;
  isTeacherPro?: boolean;
  activePlanCode?: string;
  activePlanName?: string;
  isOnboarded?: boolean;
  lockReason?: string | null;
  lockedAt?: string | null;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}
