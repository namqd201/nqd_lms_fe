export type ClassroomStatus = 'ACTIVE' | 'ARCHIVED';

export type ClassEnrollmentStatus =
  | 'ENROLLED'
  | 'PENDING_APPROVAL'
  | 'INVITED'
  | 'REJECTED'
  | 'DECLINED'
  | 'DROPPED';

export interface ClassroomResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel?: string;
  subjectId?: string;
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatarUrl?: string;
  studentCount: number;
  pendingRequestCount: number;
  status: ClassroomStatus;
  currentUserRole: 'TEACHER' | 'STUDENT' | 'NONE';
  currentUserEnrollmentStatus?: ClassEnrollmentStatus;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassroomRequest {
  name: string;
  code?: string;
  description?: string;
  gradeLevel?: string;
  subjectId?: string;
  coverImageUrl?: string;
}

export interface ClassroomStudentResponse {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomCode: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatarUrl?: string;
  status: ClassEnrollmentStatus;
  joinedAt?: string;
  requestMessage?: string;
  createdAt: string;
}

export interface JoinClassroomRequest {
  code: string;
  message?: string;
}

export interface InviteStudentRequest {
  email: string;
  message?: string;
}

export interface UserSuggestionResponse {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roles?: string;
}
