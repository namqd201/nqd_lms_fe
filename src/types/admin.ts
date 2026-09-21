import { UserStatus } from './auth';

export type SubjectStatus = 'ACTIVE' | 'INACTIVE';

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: SubjectStatus;
  courseCount: number;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface SubjectRequest {
  name: string;
  code: string;
  description?: string;
  status?: SubjectStatus;
}

export interface RoleDetailResponse {
  id: string;
  name: string;
  description?: string;
  userCount: number;
}

export interface AdminCourseResponse {
  id: string;
  subjectId?: string;
  subjectName?: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel?: string;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isPrivate: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  creatorId?: string;
  creatorName?: string;
  creatorEmail?: string;
  enrolledStudentsCount: number;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

