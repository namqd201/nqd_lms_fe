'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { financeService } from '@/services/finance.service';
import { billingService } from '@/services/billing.service';
import {
  AdminPlatformRevenueResponse,
  TeacherWithdrawalResponse,
  TeacherEarningResponse,
  RefundResponse,
} from '@/types/finance';
import { OrderResponse } from '@/types/billing';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  DollarSign,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  Search,
  Building2,
  ShoppingCart,
  RefreshCw,
  Copy,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<AdminPlatformRevenueResponse | null>(null);
  const [withdrawals, setWithdrawals] = useState<TeacherWithdrawalResponse[]>([]);
  const [earnings, setEarnings] = useState<TeacherEarningResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'orders' | 'withdrawals' | 'earnings' | 'refunds'>('orders');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Manual Confirm Paid Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [confirmNote, setConfirmNote] = useState<string>('');
  const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState<boolean>(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState<boolean>(false);

  // Complete Withdrawal Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<TeacherWithdrawalResponse | null>(null);
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);

  // Reject Withdrawal Modal
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);

  // Refund Order Form
  const [refundOrderId, setRefundOrderId] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  const fetchAdminFinance = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [oRes, wRes, eRes, ordRes] = await Promise.all([
        financeService.getAdminOverview(),
        financeService.getAdminWithdrawals(undefined, 0, 50),
        financeService.getAdminEarnings(undefined, 0, 50),
        billingService.getAdminOrders(
          0,
          50,
          orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
          orderSearch.trim() || undefined
        ),
      ]);
      setOverview(oRes);
      setWithdrawals(wRes.content);
      setEarnings(eRes.content);
      setOrders(ordRes.content);
      setOrdersTotal(ordRes.totalElements);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải dữ liệu tài chính hệ thống'));
    } finally {
      setIsLoading(false);
    }
  }, [orderStatusFilter, orderSearch]);

  useEffect(() => {
    fetchAdminFinance();
  }, [fetchAdminFinance]);

  const handleRefreshOrdersOnly = async () => {
    try {
      setIsRefreshingOrders(true);
      const ordRes = await billingService.getAdminOrders(
        0,
        50,
        orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
        orderSearch.trim() || undefined
      );
      setOrders(ordRes.content);
      setOrdersTotal(ordRes.totalElements);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách đơn hàng'));
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Confirm Paid Action
  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setIsConfirmingOrder(true);
      setErrorMsg(null);
      await financeService.adminConfirmOrderPaid(selectedOrder.id, confirmNote.trim() || undefined);
      setSuccessMsg(`Đã xác nhận thanh toán thành công cho đơn #${selectedOrder.orderCode}! Toàn bộ quyền lợi (khoá học / gói hội viên) đã được kích hoạt cho học viên.`);
      setIsConfirmOrderModalOpen(false);
      setSelectedOrder(null);
      setConfirmNote('');
      fetchAdminFinance();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xác nhận thanh toán đơn hàng'));
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setErrorMsg(null);
      await financeService.adminApproveWithdrawal(id);
      setSuccessMsg('Đã phê duyệt yêu cầu rút tiền (Chuyển sang Đang xử lý)');
      fetchAdminFinance();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể phê duyệt yêu cầu'));
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    try {
      setErrorMsg(null);
      await financeService.adminCompleteWithdrawal(selectedWithdrawal.id, {
        referenceCode: referenceCode.trim() || undefined,
      });
      setSuccessMsg('Đã xác nhận chuyển tiền thành công!');
      setIsCompleteModalOpen(false);
      setSelectedWithdrawal(null);
      setReferenceCode('');
      fetchAdminFinance();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể hoàn tất giao dịch'));
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    try {
      setErrorMsg(null);
      await financeService.adminRejectWithdrawal(selectedWithdrawal.id, {
        rejectionReason: rejectionReason.trim() || undefined,
      });
      setSuccessMsg('Đã từ chối yêu cầu rút tiền');
      setIsRejectModalOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchAdminFinance();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể từ chối yêu cầu'));
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderId.trim()) {
      setErrorMsg('Vui lòng nhập Order ID hợp lệ');
      return;
    }
    try {
      setIsRefunding(true);
      setErrorMsg(null);
      const res: RefundResponse = await financeService.adminProcessRefund({
        orderId: refundOrderId.trim(),
        refundReason: refundReason.trim() || undefined,
      });
      setSuccessMsg(`Hoàn tiền thành công cho đơn #${res.orderCode}. Đã đảo ngược ${res.reversedEarningsCount} bản ghi thu nhập!`);
      setRefundOrderId('');
      setRefundReason('');
      fetchAdminFinance();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xử lý hoàn tiền đơn hàng'));
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Quản trị Doanh thu & Tài chính Hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi dòng tiền nạp, doanh thu gói hội viên & khoá học, phê duyệt rút tiền giảng viên và xử lý đơn hàng.
          </p>
        </div>

        <button
          onClick={fetchAdminFinance}
          disabled={isLoading}
          className="self-start md:self-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl shadow-xs transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6 Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Tổng doanh thu gộp */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tổng Doanh thu Gộp</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white">
            {(overview?.grossRevenue || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-[11px] text-emerald-400 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-slate-300">
            {overview?.paidOrdersCount ?? 0} đơn hàng thành công
          </p>
        </div>

        {/* Card 2: Doanh thu Hội viên Pro / Ultra */}
        <div className="bg-white p-4 rounded-3xl border-2 border-purple-500/80 shadow-md shadow-purple-500/5 space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gói Hội Viên (PRO/ULTRA)</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-700">
            {(overview?.membershipRevenue || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs text-purple-500 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-purple-600 font-medium">
            100% doanh thu thuộc sàn
          </p>
        </div>

        {/* Card 3: Doanh thu Khóa học */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Doanh thu Khóa học</span>
            <CreditCard className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-black text-sky-600">
            {(overview?.courseRevenue || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs text-slate-400 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-slate-400">
            Bán khóa học & chương học
          </p>
        </div>

        {/* Card 4: Phí sàn thu được & Doanh thu thuần */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Phí Sàn & Thuần</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">
            {(overview?.platformTotalFees || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs text-slate-400 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-slate-400">
            Phí 20% + Gói hội viên
          </p>
        </div>

        {/* Card 5: Tiền Giảng viên */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tiền Giảng viên (80%)</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-600">
            {(overview?.teacherTotalEarnings || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs text-slate-400 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-slate-400">
            Đã chi trả: {(overview?.completedWithdrawals || 0).toLocaleString('vi-VN')} VND
          </p>
        </div>

        {/* Card 6: Chờ rút & Hoàn tiền */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Chờ Rút / Đã Hoàn</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600">
            {(overview?.pendingWithdrawals || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs text-slate-400 font-bold">VND</span>
          </p>
          <p className="text-[10px] text-rose-500 font-medium">
            Đã hoàn: {(overview?.reversedAmount || 0).toLocaleString('vi-VN')} VND
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Đơn hàng & Giao dịch nạp tiền ({ordersTotal})
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'withdrawals'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          Yêu cầu Rút tiền ({withdrawals.length})
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Sổ cái Thu nhập Giảng viên ({earnings.length})
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'refunds'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Xử lý Hoàn tiền (Refund)
        </button>
      </div>

      {/* Tab 1: Orders & Transactions */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { key: 'ALL', label: 'Tất cả trạng thái' },
                { key: 'PAID', label: 'Đã thanh toán (PAID)' },
                { key: 'PENDING', label: 'Chờ thanh toán (PENDING)' },
                { key: 'CANCELLED', label: 'Đã hủy' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setOrderStatusFilter(btn.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    orderStatusFilter === btn.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, email, họ tên..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:bg-white transition"
                />
              </div>

              <button
                onClick={handleRefreshOrdersOnly}
                disabled={isRefreshingOrders}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition shrink-0"
                title="Làm mới danh sách đơn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Mã đơn hàng</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Nội dung mua</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{ord.orderCode}</span>
                          <button
                            onClick={() => handleCopy(ord.orderCode)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                            title="Sao chép mã đơn"
                          >
                            {copiedCode === ord.orderCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {ord.couponCode && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">
                            Mã: {ord.couponCode}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{ord.userFullName || 'Chưa cập nhật'}</span>
                        <span className="text-slate-500 text-[11px] block">{ord.userEmail}</span>
                      </td>

                      <td className="p-4 max-w-xs">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span className="truncate">{it.productTitle}</span>
                              <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                                ({it.productType})
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Không có chi tiết</span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-black text-purple-700 text-sm">
                        {ord.finalAmount.toLocaleString('vi-VN')} {ord.currency || 'VND'}
                      </td>

                      <td className="p-4">
                        {ord.status === 'PAID' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã thanh toán
                          </span>
                        )}
                        {ord.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            Chờ thanh toán
                          </span>
                        )}
                        {ord.status === 'CANCELLED' && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Đã hủy
                          </span>
                        )}
                        {ord.status === 'REFUNDED' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                            <RotateCcw className="w-3 h-3" />
                            Đã hoàn tiền
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        <div>Đặt: {new Date(ord.placedAt).toLocaleString('vi-VN')}</div>
                        {ord.completedAt && (
                          <div className="text-emerald-600 font-semibold text-[10px]">
                            Thanh toán: {new Date(ord.completedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {ord.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setConfirmNote('');
                              setIsConfirmOrderModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 ml-auto"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Xác nhận đã nạp
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payout Requests Queue */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Danh sách yêu cầu rút tiền từ Giảng viên</h3>
            <span className="text-xs text-slate-400">Kiểm tra thông tin trước khi chuyển khoản</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Mã rút tiền</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Thông tin Ngân hàng</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày yêu cầu</th>
                  <th className="p-4 text-right">Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Hiện chưa có yêu cầu rút tiền nào từ giảng viên.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-900">{w.withdrawalCode}</td>
                      <td className="p-4 font-mono font-black text-blue-600">
                        {w.amount.toLocaleString('vi-VN')} {w.currency}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{w.bankName}</span>
                        <span className="font-mono text-slate-600 font-semibold">{w.accountNumberMasked}</span>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">{w.accountHolderName}</span>
                      </td>
                      <td className="p-4">
                        {w.status === 'COMPLETED' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            Hoàn tất
                          </span>
                        )}
                        {w.status === 'PROCESSING' && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                            Đang chuyển tiền
                          </span>
                        )}
                        {w.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            Chờ duyệt
                          </span>
                        )}
                        {w.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                            Từ chối
                          </span>
                        )}
                        {w.status === 'CANCELLED' && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(w.requestedAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        {w.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(w.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] transition"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setIsRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[11px] transition"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {w.status === 'PROCESSING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setIsCompleteModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Đã chuyển tiền
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setIsRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[11px] transition"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: All Earnings Ledger */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Toàn bộ sổ cái chia sẻ thu nhập Giảng viên</h3>
            <span className="text-xs text-slate-400">Tự động ghi nhận theo chính sách chia sẻ 80/20</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Khóa học / Đơn hàng</th>
                  <th className="p-4">Giảng viên thụ hưởng</th>
                  <th className="p-4">Doanh thu gộp</th>
                  <th className="p-4">Phí sàn (20%)</th>
                  <th className="p-4">Giảng viên (80%)</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Chưa có phát sinh chia sẻ thu nhập giảng viên nào.
                    </td>
                  </tr>
                ) : (
                  earnings.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{e.courseName || 'Khóa học'}</span>
                        <span className="font-mono text-[10px] text-slate-400">#{e.orderCode}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{e.teacherName || 'Giảng viên'}</span>
                        {e.teacherEmail && <span className="text-slate-400 text-[10px] block">{e.teacherEmail}</span>}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">
                        {e.grossAmount.toLocaleString('vi-VN')} {e.currency}
                      </td>
                      <td className="p-4 font-mono text-purple-600 font-bold">
                        +{e.platformFee.toLocaleString('vi-VN')} {e.currency}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-600">
                        {e.teacherAmount.toLocaleString('vi-VN')} {e.currency}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {e.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(e.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Process Refund */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 max-w-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Xử lý Hoàn tiền Đơn hàng</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thực hiện đảo ngược thu nhập của giảng viên, hủy quyền học và đánh dấu đơn hàng là REFUNDED.
            </p>
          </div>

          <form onSubmit={handleProcessRefund} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Order ID (UUID đơn hàng)</label>
              <input
                type="text"
                required
                placeholder="VD: a1b2c3d4-e5f6-7890-..."
                value={refundOrderId}
                onChange={(e) => setRefundOrderId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Lý do hoàn tiền</label>
              <textarea
                rows={3}
                placeholder="Ghi rõ lý do hoàn tiền cho học viên..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isRefunding}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              {isRefunding && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận Hoàn tiền & Đảo ngược Sổ cái
            </button>
          </form>
        </div>
      )}

      {/* Modal: Confirm Order Paid Manually */}
      {isConfirmOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                Xác nhận đã thanh toán đơn hàng
              </h3>
              <button
                onClick={() => setIsConfirmOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPaid} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-slate-900">#{selectedOrder.orderCode}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Người mua:</span>
                  <span className="font-bold text-slate-800">{selectedOrder.userFullName} ({selectedOrder.userEmail})</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Số tiền:</span>
                  <span className="font-mono font-black text-purple-700 text-sm">
                    {selectedOrder.finalAmount.toLocaleString('vi-VN')} {selectedOrder.currency || 'VND'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Nội dung mua:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {selectedOrder.items?.map((it) => it.productTitle).join(', ') || 'Đơn hàng'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Ghi chú xác nhận (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Học viên chuyển khoản trực tiếp qua ngân hàng Vietcombank..."
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  Sau khi xác nhận, trạng thái đơn sẽ chuyển sang PAID và hệ thống sẽ tự động kích hoạt quyền lợi học tập hoặc gói hội viên ngay lập tức.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isConfirmingOrder}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isConfirmingOrder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận nạp tiền & Kích hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isCompleteModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-base">Xác nhận chuyển tiền thành công</h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Mã đơn rút:</span>
                  <span className="font-mono font-bold text-slate-900">#{selectedWithdrawal.withdrawalCode}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Số tiền cần thanh toán:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {selectedWithdrawal.amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-slate-800">{selectedWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedWithdrawal.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedWithdrawal.accountHolderName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Mã giao dịch ngân hàng / Reference Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: FT2609068899 hoặc MB123456..."
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Mã giao dịch này sẽ được gửi trong thông báo tự động tới Giảng viên ngay sau khi hoàn tất.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Hoàn tất Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-base">Từ chối yêu cầu rút tiền</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleReject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Lý do từ chối (bắt buộc)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do từ chối yêu cầu rút tiền..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
