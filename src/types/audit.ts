export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  userAvatarUrl: string | null;
  userRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditStats {
  totalLogsToday: number;
  activeUsersToday: number;
  topActions: Record<string, number>;
}

export interface AuditLogFilterParams {
  page?: number;
  size?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  searchTerm?: string;
  date?: string; // yyyy-MM-dd
  year?: number;
  month?: number; // 1-12
}

export interface AuditLogPageResponse {
  content: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
