export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type ProductType = 'COURSE' | 'MEMBERSHIP' | 'EXAM_BUNDLE' | 'OTHER';
export type PaymentMethod = 'SEPAY' | 'PAYOS' | 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'BANK_TRANSFER' | 'SIMULATION';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface OrderItemResponse {
  id: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  currency: string;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  couponCode?: string;
  placedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OrderItemResponse[];
  checkoutUrl?: string;
  qrCodeUrl?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferContent: string;
    amount: number;
  };
}

export interface CreateOrderRequest {
  items: {
    productId?: string;
    targetEntityId?: string;
    productType: ProductType;
    quantity?: number;
  }[];
  couponCode?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PaymentSimulationRequest {
  orderCode: string;
  amount: number;
}