export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EnrollmentStatus = 'ENROLLED' | 'PENDING' | 'REJECTED' | 'COMPLETED' | 'DROPPED';

export interface TeacherCourseResponse {
  id: string;
  subjectId?: string | null;
  subjectName?: string | null;
  name: string;
  code: string;
  description?: string | null;
  gradeLevel?: string | null;
  thumbnailUrl?: string | null;
  status: CourseStatus;
  isPrivate?: boolean;
  creatorId?: string | null;
  creatorName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface TeacherEnrollmentResponse {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface TeacherCourseRequest {
  subjectId: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel?: string;
  thumbnailUrl?: string;
  status?: CourseStatus;
  isPrivate?: boolean;
}

export interface TeacherChapterRequest {
  title: string;
  description?: string;
  displayOrder?: number;
  price?: number;
  isSellable?: boolean;
}

export interface TeacherChapterResponse {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  lessons: TeacherLessonResponse[];
  price?: number | null;
  isSellable?: boolean | null;
}

export interface TeacherLessonRequest {
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  displayOrder?: number;
  estimatedMinutes?: number;
  status?: LessonStatus;
  isPreview?: boolean;
  videoUrl?: string;
  price?: number;
  isSellable?: boolean;
}

export interface TeacherLessonResponse {
  id: string;
  chapterId: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  displayOrder: number;
  estimatedMinutes?: number | null;
  status: LessonStatus;
  isPreview?: boolean;
  videoUrl?: string | null;
  price?: number | null;
  isSellable?: boolean | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TeacherCourseDetailResponse {
  id: string;
  subjectId?: string | null;
  subjectName?: string | null;
  name: string;
  code: string;
  description?: string | null;
  gradeLevel?: string | null;
  thumbnailUrl?: string | null;
  status: CourseStatus;
  isPrivate?: boolean;
  creatorId?: string | null;
  creatorName?: string | null;
  chapters: TeacherChapterResponse[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface StudentCourseResponse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  gradeLevel?: string | null;
  thumbnailUrl?: string | null;
  subjectName?: string | null;
  status: CourseStatus;
  isPrivate?: boolean;
  creatorId?: string | null;
  creatorName?: string | null;
  isOwner?: boolean;
  isEnrolled: boolean;
  enrollmentStatus?: EnrollmentStatus | null;
}

export interface StudentLessonSummaryResponse {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  displayOrder: number;
  estimatedMinutes?: number | null;
  status: LessonStatus;
  isPreview?: boolean;
  isLocked?: boolean;
  lockReason?: string | null;
  isCompleted?: boolean;
  isExercisesPassed?: boolean;
}

export interface StudentChapterResponse {
  id: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  lessons: StudentLessonSummaryResponse[];
}

export interface StudentCourseDetailResponse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  gradeLevel?: string | null;
  thumbnailUrl?: string | null;
  subjectName?: string | null;
  status: CourseStatus;
  isPrivate?: boolean;
  creatorId?: string | null;
  creatorName?: string | null;
  isOwner?: boolean;
  isEnrolled: boolean;
  chapters: StudentChapterResponse[];
}

export interface StudentLessonDetailResponse {
  id: string;
  chapterId: string;
  chapterTitle: string;
  courseId: string;
  courseName: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  displayOrder: number;
  estimatedMinutes?: number | null;
  isPreview?: boolean;
  videoUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
}

export interface ReorderItemsRequest {
  orderedIds: string[];
}
