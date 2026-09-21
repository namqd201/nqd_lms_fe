export interface ProgressDistribution {
  range0To25: number;
  range25To50: number;
  range50To75: number;
  range75To100: number;
}

export interface ScoreDistribution {
  below5: number;
  range5To7: number;
  range7To85: number;
  range85To10: number;
}

export interface LessonDropOff {
  lessonId: string;
  title: string;
  chapterTitle?: string;
  displayOrder: number;
  inProgressStudentsCount: number;
  completedStudentsCount: number;
  dropOffRate: number;
}

export interface DailyActivity {
  date: string;
  completedLessons: number;
  examSubmissions: number;
}

export interface TopStudentSummary {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  progressPercent: number;
  averageScore?: number;
  completedLessonsCount: number;
  enrollmentStatus: string;
  enrolledAt: string;
}

export interface CourseAnalyticsResponse {
  courseId: string;
  courseName: string;
  totalEnrolledStudents: number;
  activeStudents: number;
  completedStudents: number;
  droppedStudents: number;
  completionRate: number;
  averageProgressPercent: number;
  progressDistribution: ProgressDistribution;
  totalExams: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  passedAttempts: number;
  failedAttempts: number;
  scoreDistribution: ScoreDistribution;
  dropOffLessons: LessonDropOff[];
  activityTimeline: DailyActivity[];
  topStudents: TopStudentSummary[];
}

export interface StudentExamAttemptDetail {
  attemptId: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface TeacherStudentCourseProgress {
  courseId: string;
  courseName: string;
  courseThumbnail?: string;
  enrollmentStatus: string;
  enrolledAt: string;
  completedAt?: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  averageExamScore?: number;
  examAttempts?: StudentExamAttemptDetail[];
}

export interface TeacherStudentDetailProgressResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  avatarUrl?: string;
  phone?: string;
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  totalCompletedLessons: number;
  overallAverageExamScore?: number;
  courses: TeacherStudentCourseProgress[];
}

export interface DailyHeatmapItem {
  date: string;
  count: number;
}

export interface StudentCourseProgressSummary {
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  enrollmentStatus: string;
}

export interface StudentOverallAnalyticsResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalStudyHours: number;
  totalCompletedLessons: number;
  totalEnrolledCourses: number;
  totalCompletedCourses: number;
  averageExamScore: number;
  totalExamsTaken: number;
  totalExamsPassed: number;
  currentStreakDays: number;
  longestStreakDays: number;
  activityHeatmap: DailyHeatmapItem[];
  recentCourses: StudentCourseProgressSummary[];
}
