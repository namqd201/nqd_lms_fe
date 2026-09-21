export type EarningStatus = 'PENDING' | 'AVAILABLE' | 'PAID' | 'REVERSED';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface TeacherBalanceSummaryResponse {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnAmount: number;
  reversedAmount: number;
  currency: string;
}

export interface TeacherEarningResponse {
  id: string;
  orderId: string;
  orderCode: string;
  orderItemId: string;
  courseId: string;
  courseName: string;
  grossAmount: number;
  platformFeeRate: number;
  platformFee: number;
  teacherShareRate: number;
  teacherAmount: number;
  currency: string;
  status: EarningStatus;
  availableAt: string;
  reversedAt?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface TeacherBankAccountRequest {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault?: boolean;
}

export interface TeacherBankAccountResponse {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumberMasked: string;
  accountHolderName: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface CreateWithdrawalRequest {
  amount: number;
  bankAccountId?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  idempotencyKey?: string;
}

export interface TeacherWithdrawalResponse {
  id: string;
  withdrawalCode: string;
  amount: number;
  currency: string;
  bankName: string;
  bankCode: string;
  accountNumberMasked: string;
  accountHolderName: string;
  status: WithdrawalStatus;
  referenceCode?: string;
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface AdminPlatformRevenueResponse {
  grossRevenue: number;
  platformTotalFees: number;
  teacherTotalEarnings: number;
  completedWithdrawals: number;
  pendingWithdrawals: number;
  reversedAmount: number;
  currency: string;
}

export interface AdminProcessWithdrawalRequest {
  referenceCode?: string;
  rejectionReason?: string;
}

export interface ProcessRefundRequest {
  orderId: string;
  refundReason?: string;
}

export interface RefundResponse {
  orderId: string;
  orderCode: string;
  refundAmount: number;
  status: string;
  reason?: string;
  refundedAt: string;
  reversedEarningsCount: number;
  revokedEntitlementsCount: number;
}