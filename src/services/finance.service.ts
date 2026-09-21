import {
  TeacherBalanceSummaryResponse,
  TeacherEarningResponse,
  TeacherBankAccountResponse,
  TeacherBankAccountRequest,
  CreateWithdrawalRequest,
  TeacherWithdrawalResponse,
  AdminPlatformRevenueResponse,
  AdminProcessWithdrawalRequest,
  ProcessRefundRequest,
  RefundResponse,
  EarningStatus,
  WithdrawalStatus,
} from '@/types/finance';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const financeService = {
  // ================= TEACHER FINANCE =================
  getBalanceSummary: async (): Promise<TeacherBalanceSummaryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/balance`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải tổng quan số dư');
    return res.data ?? res;
  },

  getTeacherEarnings: async (
    status?: EarningStatus,
    page: number = 0,
    size: number = 10
  ): Promise<{ content: TeacherEarningResponse[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('size', String(size));

    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/earnings?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải lịch sử thu nhập');
    const data = res.data ?? res;
    return {
      content: data.content ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  getBankAccounts: async (): Promise<TeacherBankAccountResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/bank-accounts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách tài khoản ngân hàng');
    return res.data ?? res;
  },

  addBankAccount: async (request: TeacherBankAccountRequest): Promise<TeacherBankAccountResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể thêm tài khoản ngân hàng');
    return res.data ?? res;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/bank-accounts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    await handleApiResponse<any>(response, 'Không thể xóa tài khoản ngân hàng');
  },

  setDefaultBankAccount: async (id: string): Promise<TeacherBankAccountResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/bank-accounts/${id}/default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể đặt tài khoản mặc định');
    return res.data ?? res;
  },

  getTeacherWithdrawals: async (
    page: number = 0,
    size: number = 10
  ): Promise<{ content: TeacherWithdrawalResponse[]; totalElements: number; totalPages: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/withdrawals?page=${page}&size=${size}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải lịch sử rút tiền');
    const data = res.data ?? res;
    return {
      content: data.content ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  requestWithdrawal: async (request: CreateWithdrawalRequest): Promise<TeacherWithdrawalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể gửi yêu cầu rút tiền');
    return res.data ?? res;
  },

  cancelWithdrawal: async (id: string): Promise<TeacherWithdrawalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/teacher/finance/withdrawals/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể hủy yêu cầu rút tiền');
    return res.data ?? res;
  },

  // ================= ADMIN FINANCE =================
  getAdminOverview: async (): Promise<AdminPlatformRevenueResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/overview`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải tổng quan tài chính hệ thống');
    return res.data ?? res;
  },

  getAdminWithdrawals: async (
    status?: WithdrawalStatus,
    page: number = 0,
    size: number = 10
  ): Promise<{ content: TeacherWithdrawalResponse[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('size', String(size));

    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/withdrawals?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể tải danh sách yêu cầu rút tiền');
    const data = res.data ?? res;
    return {
      content: data.content ?? (Array.isArray(data) ? data : []),
      totalElements: data.totalElements ?? (Array.isArray(data) ? data.length : 0),
      totalPages: data.totalPages ?? 1,
    };
  },

  adminApproveWithdrawal: async (id: string): Promise<TeacherWithdrawalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/withdrawals/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const res = await handleApiResponse<any>(response, 'Không thể duyệt yêu cầu rút tiền');
    return res.data ?? res;
  },

  adminRejectWithdrawal: async (id: string, request: AdminProcessWithdrawalRequest): Promise<TeacherWithdrawalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/withdrawals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể từ chối yêu cầu rút tiền');
    return res.data ?? res;
  },

  adminCompleteWithdrawal: async (id: string, request: AdminProcessWithdrawalRequest): Promise<TeacherWithdrawalResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/withdrawals/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể xác nhận hoàn tất rút tiền');
    return res.data ?? res;
  },

  adminProcessRefund: async (request: ProcessRefundRequest): Promise<RefundResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/finance/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    const res = await handleApiResponse<any>(response, 'Không thể xử lý hoàn tiền đơn hàng');
    return res.data ?? res;
  },
};