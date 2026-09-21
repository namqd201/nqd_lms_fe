import { MembershipPlanResponse, PlanUserType, SubscriptionResponse, FeatureUsageResponse } from '@/types/membership';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const membershipService = {
  getPlans: async (userType?: PlanUserType): Promise<MembershipPlanResponse[]> => {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/plans${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MembershipPlanResponse[]>(response, 'Không thể tải danh sách gói hội viên');
  },

  getPlanById: async (id: string): Promise<MembershipPlanResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/plans/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<MembershipPlanResponse>(response, 'Không thể tải thông tin gói hội viên');
  },

  getCurrentSubscription: async (): Promise<SubscriptionResponse | null> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/subscription/current`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (response.status === 404 || response.status === 204) return null;
    try {
      return await handleApiResponse<SubscriptionResponse>(response, 'Không thể tải gói hội viên hiện tại');
    } catch {
      return null;
    }
  },

  getSubscriptionHistory: async (): Promise<SubscriptionResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/subscription/history`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<SubscriptionResponse[]>(response, 'Không thể tải lịch sử đăng ký');
  },

  getUsageStatus: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/usage`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<any>(response, 'Không thể tải thông tin hạn mức sử dụng');
  },

  cancelSubscription: async (subscriptionId: string): Promise<SubscriptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/membership/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleApiResponse<SubscriptionResponse>(response, 'Không thể hủy gia hạn gói');
  },
};