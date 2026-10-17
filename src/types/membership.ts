export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
export type PlanUserType = 'STUDENT' | 'TEACHER' | 'ALL';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
export type EntitlementStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type EntitlementType = 'COURSE_ACCESS' | 'MEMBERSHIP_BENEFIT' | 'EXAM_ATTEMPT' | 'AI_TUTOR_UNLIMITED';

export interface MembershipPlanResponse {
  id: string;
  code?: string;
  planCode?: string;
  name: string;
  description?: string;
  userType: PlanUserType;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  activeEventName?: string;
  activeEventEndTime?: string;
  activeEventId?: string;
  salePrice?: number;
  currency: string;
  billingCycle: BillingCycle;
  active: boolean;
  features: string[];
  examLimitPerWeek?: number;
  aiQuestionLimitPerDay?: number;
  maxClassesLimit?: number;
  maxQuestionsLimit?: number;
  aiPromptLimitPerMonth?: number;
  examCreationLimit?: number;
  dailyCourseEnrollmentLimit?: number;
  monthlyCourseEnrollmentLimit?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMembershipPlanData {
  planCode: string;
  name: string;
  userType: PlanUserType;
  description?: string;
  price: number;
  currency?: string;
  billingCycle: BillingCycle;
  active?: boolean;
  examLimitPerWeek?: number;
  aiQuestionLimitPerDay?: number;
  maxClassesLimit?: number;
  maxQuestionsLimit?: number;
  aiPromptLimitPerMonth?: number;
  examCreationLimit?: number;
  dailyCourseEnrollmentLimit?: number;
  monthlyCourseEnrollmentLimit?: number;
  features?: string[];
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export type UpdateMembershipPlanData = Partial<CreateMembershipPlanData>;

export interface SubscriptionResponse {
  id: string;
  userId?: string;
  planId?: string;
  planCode?: string;
  planName?: string;
  userType?: PlanUserType;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  isCurrentlyActive?: boolean;
  plan?: MembershipPlanResponse;
}

export interface EntitlementResponse {
  id: string;
  entitlementType: EntitlementType;
  targetEntityId?: string;
  targetEntityName?: string;
  status: EntitlementStatus;
  validFrom: string;
  validUntil?: string;
}

export interface FeatureUsageResponse {
  featureKey: string;
  usedCount: number;
  limitCount: number;
  isUnlimited: boolean;
  remainingCount: number;
  resetAt?: string;
}