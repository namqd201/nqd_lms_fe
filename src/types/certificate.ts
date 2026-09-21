export interface CertificateResponse {
  id: string;
  certificateCode: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  courseThumbnailUrl?: string;
  subjectName?: string;
  gradeLevel?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentAvatarUrl?: string;
  issuedAt: string;
  expiryDate?: string | null;
  isRevoked?: boolean;
  revocationReason?: string | null;
  finalGrade?: number | null;
  verificationUrl?: string;
  downloadUrl?: string;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  certificateCode?: string;
  studentName?: string;
  courseName?: string;
  courseCode?: string;
  subjectName?: string;
  issuedAt?: string;
  expiryDate?: string | null;
  revoked?: boolean;
  revocationReason?: string | null;
  issuerName?: string;
  verificationUrl?: string;
}

export interface CertificateEligibilityResponse {
  eligible: boolean;
  alreadyIssued: boolean;
  certificateCode?: string | null;
  certificateId?: string | null;

  lessonsCompleted: boolean;
  completedLessons: number;
  totalLessons: number;

  videosCompleted: boolean;
  watchedVideos: number;
  totalVideos: number;

  exercisesCompleted: boolean;
  passedExercises: number;
  totalExercises: number;

  examsCompleted: boolean;
  passedExams: number;
  totalExams: number;

  missingRequirements: string[];
  message: string;
}
