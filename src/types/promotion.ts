export type PromotionEventStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface PromotionEventPlanDto {
  id?: string;
  planId: string;
  planCode?: string;
  planName?: string;
  billingCycle?: string;
  originalPrice?: number;
  discountPercent: number;
  discountedPrice?: number;
}

export interface PromotionEventDto {
  id: string;
  name: string;
  code?: string;
  description?: string;
  startTime: string;
  endTime: string;
  defaultDiscountPercent?: number;
  badgeText?: string;
  bannerUrl?: string;
  status: PromotionEventStatus;
  isActive: boolean;
  isCurrentlyActive: boolean;
  planDiscounts: PromotionEventPlanDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertPromotionEventRequest {
  name: string;
  code?: string;
  description?: string;
  startTime: string;
  endTime: string;
  defaultDiscountPercent?: number;
  badgeText?: string;
  bannerUrl?: string;
  isActive?: boolean;
  planDiscounts?: {
    planId: string;
    discountPercent: number;
  }[];
}
