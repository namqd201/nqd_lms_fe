export type TeacherApplicantType = 'CERTIFIED_TEACHER' | 'STUDENT_TUTOR' | 'INDUSTRY_EXPERT';

export type TeacherApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface TeacherApplicationRequest {
  applicantType: TeacherApplicantType;
  fullName: string;
  phoneNumber: string;
  email: string;
  institutionName: string;
  majorOrSubject: string;
  bio?: string;
  documentUrls?: string[];
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  sampleVideoUrl?: string;
}

export interface TeacherApplicationResponse {
  id: string;
  userId: string;
  applicantType: TeacherApplicantType;
  fullName: string;
  phoneNumber: string;
  email: string;
  institutionName: string;
  majorOrSubject: string;
  bio?: string;
  documentUrls: string[];
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  sampleVideoUrl?: string;
  status: TeacherApplicationStatus;
  rejectReason?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RejectTeacherApplicationRequest {
  reason: string;
}
