export type ResourceType = 'PDF' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'IMAGE' | 'OTHER';
export type LessonProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface LessonResourceResponse {
  id: string;
  lessonId: string;
  resourceType: ResourceType;
  title: string;
  url: string;
  metadata?: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateResourceRequest {
  resourceType: ResourceType;
  title: string;
  url: string;
  metadata?: string;
  displayOrder?: number;
}

export interface StudentLessonProgressResponse {
  progressId?: string;
  lessonId: string;
  status: LessonProgressStatus;
  progressPercent: number;
  startedAt?: string | null;
  completedAt?: string | null;
  lastAccessedAt?: string | null;
  videoWatched?: boolean;
}

export interface UpdateLessonProgressRequest {
  progressPercent?: number;
  completed?: boolean;
  videoWatched?: boolean;
}

export interface StudentCourseProgressResponse {
  courseId: string;
  overallProgressPercent: number;
  totalLessons: number;
  completedLessons: number;
  lessonProgresses: StudentLessonProgressResponse[];
}

export interface TeacherStudentLessonProgressResponse {
  progressId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  status: LessonProgressStatus;
  progressPercent: number;
  startedAt?: string | null;
  completedAt?: string | null;
  lastAccessedAt?: string | null;
  isUnlockedByAdmin?: boolean;
}
