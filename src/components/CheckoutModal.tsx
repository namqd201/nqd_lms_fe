'use client';

import React, { useState, useEffect } from 'react';
import { billingService } from '@/services/billing.service';
import { OrderResponse } from '@/types/billing';
import { useAuth } from '@/context/AuthContext';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
  onPaymentSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  order: initialOrder,
  onPaymentSuccess,
}) => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [order, setOrder] = useState<OrderResponse | null>(initialOrder);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number>(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<{
    bankCode: string;
    accountNumber: string;
    accountName: string;
    provider: string;
  }>({
    bankCode: 'MB',
    accountNumber: '0385792671',
    accountName: 'QUACH DUY NAM',
    provider: 'SEPAY',
  });

  useEffect(() => {
    setOrder(initialOrder);
    setPaymentSuccess(initialOrder?.status === 'PAID');
    setErrorMsg(null);
    setCountdown(4);
  }, [initialOrder]);

  // Load public payment config
  useEffect(() => {
    if (!isOpen) return;
    billingService.getPaymentConfig()
      .then((cfg) => {
        if (cfg && cfg.bankCode && cfg.accountNumber) {
          setPaymentConfig(cfg);
        }
      })
      .catch(() => {
        // Fallback default config already set
      });
  }, [isOpen]);

  // Polling order status while modal is open and not yet paid
  useEffect(() => {
    if (!isOpen || !order || paymentSuccess || order.status === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const updated = await billingService.getOrderByCode(order.orderCode);
        if (updated.status === 'PAID') {
          setOrder(updated);
          setPaymentSuccess(true);
          await refreshUser();
          onPaymentSuccess?.();
          clearInterval(interval);
        }
      } catch (err) {
        // silent polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, order, paymentSuccess, onPaymentSuccess, refreshUser]);

  // Auto redirect countdown on successful payment
  useEffect(() => {
    if (!paymentSuccess || !isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSuccess, isOpen, onClose, router]);

  if (!isOpen || !order) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      setErrorMsg(null);
      await billingService.simulatePaymentSuccess(order.orderCode, order.finalAmount);
      const updated = await billingService.getOrderByCode(order.orderCode);
      setOrder(updated);
      setPaymentSuccess(true);
      await refreshUser();
      onPaymentSuccess?.();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể giả lập thanh toán'));
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDirectRedirect = () => {
    onClose();
    router.push('/');
  };

  const bankCode = paymentConfig.bankCode || 'MB';
  const accountNumber = paymentConfig.accountNumber || '0385792671';
  const accountHolder = paymentConfig.accountName || 'QUACH DUY NAM';
  const transferContent = order.orderCode;

  // SePay VietQR dynamic URL (pre-fills exact amount, account number, bank, and orderCode)
  const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${order.finalAmount}&des=${encodeURIComponent(transferContent)}&template=compact2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {paymentSuccess ? <PartyPopper className="w-5 h-5 text-emerald-600" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                  {paymentSuccess ? 'Thanh toán Thành công 🎉' : 'Thanh toán Đơn hàng (SePay VietQR)'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${paymentSuccess ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {paymentSuccess ? 'ĐÃ KÍCH HOẠT' : 'Tự động 24/7'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Mã đơn hàng: #{order.orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {paymentSuccess ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="relative w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                <CheckCircle2 className="w-12 h-12" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-amber-500 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900">
                  Giao dịch đã được xác nhận & Kích hoạt thành công!
                </h4>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  Hệ thống SePay đã ghi nhận số tiền thanh toán <strong>{order.finalAmount.toLocaleString('vi-VN')} VND</strong>. Toàn bộ đặc quyền của gói (AI Tutor 24/7, Thi thử không giới hạn, Khóa học) đã được cấp cho tài khoản của bạn.
                </p>
              </div>

              {/* Items Activated Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl max-w-md mx-auto text-left space-y-2">
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider block">
                  Quyền lợi đã mở khóa:
                </span>
                <ul className="space-y-1.5 text-xs text-emerald-800 font-medium">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{it.productTitle}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hỏi đáp Trợ lý AI Tutor & Thi thử không giới hạn</span>
                  </li>
                </ul>
              </div>

              {/* Auto Redirect Countdown */}
              <div className="text-xs font-semibold text-slate-500">
                Tự động chuyển về trang chủ sau <span className="font-black text-blue-600 text-sm">{countdown}s</span>...
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleDirectRedirect}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Về trang chủ ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                >
                  Xem lịch sử đơn hàng
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Dynamic SePay VietQR Code */}
              <div className="flex flex-col items-center bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>Quét mã SePay VietQR</span>
                </div>
                
                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 relative group">
                  <img
                    src={qrUrl}
                    alt="SePay VietQR Code"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-blue-600/5 rounded-2xl pointer-events-none" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Khớp lệnh tự động siêu tốc</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mở ứng dụng Ngân hàng và quét mã để tự điền đúng số tiền & nội dung.
                  </p>
                </div>
              </div>

              {/* Right: Manual Transfer Details & Summary */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Thông tin chuyển khoản
                  </h4>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{bankCode} (Ngân hàng Quân Đội MB)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <button
                      onClick={() => handleCopy(accountNumber, 'acc')}
                      className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                    >
                      {accountNumber}
                      {copiedField === 'acc' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{accountHolder}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-extrabold text-blue-600 text-sm">
                      {order.finalAmount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Nội dung CK:</span>
                    <button
                      onClick={() => handleCopy(transferContent, 'content')}
                      className="font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 hover:bg-rose-100 transition cursor-pointer"
                      title="Nhấn để sao chép nội dung chuyển khoản"
                    >
                      {transferContent}
                      {copiedField === 'content' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Sản phẩm ({order.items.length})
                  </span>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-semibold truncate max-w-[200px]">
                          {item.productTitle}
                        </span>
                        <span className="font-mono text-slate-600 font-bold">
                          {item.subtotal.toLocaleString('vi-VN')} {item.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Sandbox Simulation Action */}
                <div className="pt-1">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xác thực thanh toán SePay...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Giả lập Webhook SePay (Test Sandbox)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
