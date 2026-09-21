import { UserStatus } from './auth';

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  status: UserStatus;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string | null;
  currentPlanCode?: string | null;
  currentPlanName?: string | null;
  isVip?: boolean;
  subscriptionEndDate?: string | null;
}

export interface AdminGrantVipRequest {
  planId?: string;
  planCode?: string;
  durationMonths?: number;
  reason?: string;
}

export interface UserSubscriptionResponse {
  id?: string;
  userId: string;
  userEmail?: string | null;
  userFullName?: string | null;
  planId?: string;
  planCode?: string;
  planName?: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  autoRenew?: boolean;
  isCurrentlyActive?: boolean;
  isVip?: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateUserRoleRequest {
  roles: string[];
}

export interface AssignRoleRequest {
  roleName: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}
