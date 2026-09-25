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
  larkMeetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  meetingNote?: string;
  isLiveNow?: boolean;
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
}

// ==========================================
// CLASSROOM FEATURES TYPES
// ==========================================

export interface ClassroomMaterial {
  id: string;
  classroomId: string;
  title: string;
  chapterTitle?: string;
  lessonOrder?: number;
  description?: string;
  content?: string;
  videoUrl?: string;
  materialType: 'LESSON' | 'THEORY' | 'PDF' | 'SLIDE' | 'VIDEO' | 'OTHER' | string;
  fileUrl?: string;
  attachmentName?: string;
  uploadedById: string;
  uploadedByName: string;
  downloadCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaterialRequest {
  title: string;
  chapterTitle?: string;
  lessonOrder?: number;
  description?: string;
  content?: string;
  videoUrl?: string;
  materialType?: string;
  fileUrl?: string;
  attachmentName?: string;
}

export interface ClassroomAssignment {
  id: string;
  classroomId: string;
  title: string;
  description?: string;
  deadline?: string;
  maxScore: number;
  attachmentUrl?: string;
  status: string;
  assignedById: string;
  assignedByName: string;
  createdAt: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  deadline?: string;
  maxScore?: number;
  attachmentUrl?: string;
}

export interface ClassroomMeeting {
  classroomId: string;
  larkMeetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  meetingNote?: string;
  isLiveNow?: boolean;
}

export interface UpdateMeetingRequest {
  larkMeetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  meetingNote?: string;
  isLiveNow?: boolean;
}

export interface ClassroomRecordedVideo {
  id: string;
  classroomId: string;
  title: string;
  videoUrl: string;
  sessionDate?: string;
  durationMinutes?: number;
  description?: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface CreateRecordedVideoRequest {
  title: string;
  videoUrl: string;
  sessionDate?: string;
  durationMinutes?: number;
  description?: string;
}

export interface ClassroomSchedule {
  id: string;
  classroomId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | string;
  startTime: string; // e.g. "19:30"
  endTime: string; // e.g. "21:00"
  title: string;
  roomNote?: string;
}

export interface CreateScheduleRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  title: string;
  roomNote?: string;
}

export interface ClassroomFile {
  id: string;
  classroomId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
}

export interface CreateFileRequest {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}
