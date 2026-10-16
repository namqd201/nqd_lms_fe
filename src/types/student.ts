export interface ResumeCourseDto {
  courseId: string;
  courseTitle: string;
  courseDescription?: string | null;
  courseThumbnail?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  gradeLevel?: string | null;

  chapterId?: string | null;
  chapterTitle?: string | null;
  chapterDisplayOrder?: number | null;

  lessonId?: string | null;
  lessonTitle?: string | null;
  lessonDisplayOrder?: number | null;
  totalLessonsInChapter?: number | null;

  courseProgressPercent: number;
  completedLessons: number;
  totalLessons: number;

  lastAccessedAt?: string | null;
  isEnrolled: boolean;
}

export interface ResumeExamDto {
  examId: string;
  examTitle: string;
  examDescription?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  gradeLevel?: string | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  questionCount: number;

  attemptId?: string | null;
  attemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'NOT_STARTED';
  attemptNumber?: number | null;
  answeredQuestionsCount: number;
  currentQuestionIndex: number;
  scorePercentage: number;
  totalScore?: number | null;
  passed?: boolean | null;

  lastAttemptedAt?: string | null;
}

export interface WeeklyScheduleEventDto {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  dayOfWeekText: string;
  dayOfMonth: number;
  timeRange: string;
  badgeType: string;
  badgeColor: string;
  targetUrl: string;
  eventTime?: string | null;
  isLiveNow?: boolean;
}

export interface StudentResumeLearningResponse {
  inProgressCourse?: ResumeCourseDto | null;
  otherCourses?: ResumeCourseDto[];
  inProgressExam?: ResumeExamDto | null;
  otherExams?: ResumeExamDto[];
  weeklyEvents?: WeeklyScheduleEventDto[];
}
