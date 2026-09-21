'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Copy, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { billingService } from '@/services/billing.service';
import { OrderResponse } from '@/types/billing';
import { useAuth } from '@/context/AuthContext';
import { formatErrorMessage } from '@/utils/errorMessage';

type PaymentData = {
  qrCode?: string;
  checkoutUrl?: string;
  expiresAt?: string;
};

export default function PaymentPage() {
  const params = useParams<{ orderCode: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const orderCode = decodeURIComponent(params.orderCode);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [config, setConfig] = useState({ bankCode: 'MB', accountNumber: '', accountName: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    const current = await billingService.getOrderByCode(orderCode);
    setOrder(current);
    return current;
  }, [orderCode]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [current, cfg] = await Promise.all([
          loadOrder(),
          billingService.getPaymentConfig(),
        ]);
        if (!active) return;
        setConfig({ bankCode: cfg.bankCode, accountNumber: cfg.accountNumber, accountName: cfg.accountName });
        if (current.status === 'PAID') setSuccess(true);
        else {
          const created = await billingService.initiatePayment(current.id, 'VIETQR');
          if (active) setPayment(created);
        }
      } catch (err) {
        if (active) setError(formatErrorMessage(err, 'Không thể tải thông tin thanh toán'));
      }
    })();
    return () => { active = false; };
  }, [loadOrder]);

  useEffect(() => {
    if (success) return;
    const timer = setInterval(async () => {
      try {
        const current = await loadOrder();
        if (current.status === 'PAID') {
          setSuccess(true);
          await refreshUser();
        }
      } catch {
        // Keep polling while the payment page is open.
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [loadOrder, refreshUser, success]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => router.push('/'), 3000);
    return () => window.clearTimeout(timer);
  }, [router, success]);

  if (error) {
    return <div className="min-h-full flex items-center justify-center p-6"><div className="max-w-md w-full rounded-2xl bg-white border border-rose-200 p-6 text-center"><AlertCircle className="mx-auto text-rose-500" /><p className="mt-3 text-sm text-rose-700">{error}</p></div></div>;
  }

  if (!order) {
    return <div className="min-h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  const qrUrl = payment?.qrCode || `https://qr.sepay.vn/img?acc=${config.accountNumber}&bank=${config.bankCode}&amount=${order.finalAmount}&des=${encodeURIComponent(order.orderCode)}&template=compact2`;

  if (success) {
    return <div className="min-h-full flex items-center justify-center p-6"><div className="max-w-lg w-full rounded-3xl bg-white border border-emerald-200 shadow-xl p-10 text-center"><CheckCircle2 className="w-20 h-20 mx-auto text-emerald-500" /><h1 className="mt-5 text-2xl font-black text-slate-900">Thanh toán thành công!</h1><p className="mt-3 text-slate-600">Gói hội viên của bạn đã được kích hoạt. Bạn sẽ được chuyển về trang chủ sau 3 giây.</p><p className="mt-4 text-xs font-mono text-slate-400">#{order.orderCode}</p></div></div>;
  }

  return <div className="min-h-full bg-slate-50 p-6"><div className="max-w-4xl mx-auto"><h1 className="text-2xl font-black text-slate-900 text-center">Thanh toán đơn hàng</h1><p className="text-center text-sm text-slate-500 mt-2">Quét mã QR và giữ trang này mở để hệ thống tự xác nhận</p><div className="mt-8 grid md:grid-cols-2 gap-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col items-center"><div className="flex items-center gap-2 font-bold text-slate-800"><QrCode className="text-blue-600" /> SePay VietQR</div><img src={qrUrl} alt="Mã QR thanh toán" className="w-64 h-64 object-contain mt-5 rounded-xl border p-2" /></div><div className="space-y-4 text-sm"><h2 className="font-black text-lg">Thông tin chuyển khoản</h2><div className="space-y-3 rounded-2xl bg-slate-50 p-4"><p>Ngân hàng: <b>{config.bankCode}</b></p><p>Số tài khoản: <b>{config.accountNumber}</b></p><p>Chủ tài khoản: <b>{config.accountName}</b></p><p>Số tiền: <b className="text-blue-600">{order.finalAmount.toLocaleString('vi-VN')} {order.currency}</b></p><p className="flex items-center justify-between gap-2">Nội dung: <b className="text-rose-600 break-all">{order.orderCode}</b><button onClick={() => navigator.clipboard.writeText(order.orderCode)}><Copy className="w-4 h-4" /></button></p></div><div className="flex items-center gap-2 text-xs text-blue-600"><Loader2 className="w-4 h-4 animate-spin" /> Đang chờ xác nhận thanh toán tự động...</div></div></div></div></div>;
}
