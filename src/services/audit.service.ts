import { AuditLogFilterParams, AuditLogItem, AuditLogPageResponse, AuditStats } from '@/types/audit';
import { handleApiResponse } from '@/utils/errorMessage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const auditService = {
  getAuditLogs: async (params?: AuditLogFilterParams): Promise<AuditLogPageResponse> => {
    const query = new URLSearchParams();

    if (params) {
      if (params.page !== undefined) query.append('page', params.page.toString());
      if (params.size !== undefined) query.append('size', params.size.toString());
      if (params.userId) query.append('userId', params.userId);
      if (params.action && params.action !== 'ALL') query.append('action', params.action);
      if (params.entityType) query.append('entityType', params.entityType);
      if (params.searchTerm && params.searchTerm.trim()) query.append('searchTerm', params.searchTerm.trim());
      if (params.date) query.append('date', params.date);
      if (params.year) query.append('year', params.year.toString());
      if (params.month) query.append('month', params.month.toString());
    }

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<AuditLogPageResponse>(response, 'Không thể tải nhật ký hoạt động');
  },

  getAuditStats: async (): Promise<AuditStats> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<AuditStats>(response, 'Không thể tải thống kê hoạt động');
  },

  getUserAuditLogs: async (
    userId: string,
    date?: string,
    year?: number,
    month?: number
  ): Promise<AuditLogItem[]> => {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    if (year) query.append('year', year.toString());
    if (month) query.append('month', month.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/audit-logs/user/${userId}${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return handleApiResponse<AuditLogItem[]>(response, 'Không thể tải lịch sử hoạt động của người dùng');
  },
};
