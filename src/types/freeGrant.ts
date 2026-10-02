export type FreeQuotaRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TeacherFreeGrantResponse {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  grantedAt: string;
  courseId: string;
  courseName: string;
}

export interface CourseFreeQuotaRequestResponse {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  requestedQuota: number;
  reason: string;
  status: FreeQuotaRequestStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CourseFreeGrantSummaryResponse {
  courseId: string;
  courseName: string;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  grants: TeacherFreeGrantResponse[];
  quotaRequests: CourseFreeQuotaRequestResponse[];
}

export interface AddFreeGrantRequest {
  email: string;
}

export interface CreateQuotaRequest {
  requestedQuota: number;
  reason: string;
}

export interface ReviewQuotaRequest {
  status: FreeQuotaRequestStatus;
  adminNote?: string;
}
