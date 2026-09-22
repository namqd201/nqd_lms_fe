export type CoursePricingType = 'FREE' | 'PAID';

export interface CourseReviewResponse {
  id: string;
  courseId?: string;
  userId: string;
  userName?: string;
  userFullName?: string;
  userEmail?: string;
  userAvatar?: string;
  userAvatarUrl?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseReviewRequest {
  rating: number;
  comment?: string;
}

export interface MarketplaceLessonSummary {
  id: string;
  title: string;
  orderIndex: number;
  isPreview: boolean;
  videoDurationSeconds?: number;
  price?: number;
  isSellable?: boolean;
  isPurchased?: boolean;
}

export interface MarketplaceChapterSummary {
  id: string;
  title: string;
  orderIndex: number;
  lessons: MarketplaceLessonSummary[];
  price?: number;
  isSellable?: boolean;
  isPurchased?: boolean;
}

export interface MarketplaceCourseResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel?: string;
  thumbnailUrl?: string;
  subjectId: string;
  subjectName: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  pricingType: CoursePricingType;
  price: number;
  salePrice?: number;
  currency: string;
  publishedAt?: string;
  averageRating: number;
  reviewCount: number;
  enrollmentCount: number;
  isPurchased?: boolean;
}

export interface MarketplaceCourseDetailResponse extends MarketplaceCourseResponse {
  chapters: MarketplaceChapterSummary[];
  reviews: CourseReviewResponse[];
  userReview?: CourseReviewResponse;
  hasAccess: boolean;
  isEnrolled?: boolean;
  hasPurchased?: boolean;
  isOwner?: boolean;
  enrollmentStatus?: 'ENROLLED' | 'PENDING' | 'REJECTED' | 'COMPLETED' | 'DROPPED' | null;
  totalLessons: number;
  totalDurationSeconds?: number;
  proDiscountPrice?: number;
  isUltraMember?: boolean;
}