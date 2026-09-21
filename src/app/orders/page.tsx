'use client';
import React, { useState, useEffect } from 'react';
import { billingService } from '@/services/billing.service';
import { OrderResponse } from '@/types/billing';
import { useAuth } from '@/context/AuthContext';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Layers,
  ArrowRight,
  Trash2,
  Sparkles,
  Check,
  Search,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

type FilterTab = 'PAID' | 'PENDING' | 'ALL';

export default function OrdersPage() {
  const { user, isAuthenticated, isVip, isTeacherPro } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [activeTab, setActiveTab] = useState<FilterTab>('PAID');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);

  const fetchOrders = async (pageNum: number = 0, tab: FilterTab = activeTab, search: string = searchQuery) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const statusParam = tab === 'ALL' ? undefined : tab;
      
      let res;
      if (isAdmin) {
        res = await billingService.getAdminOrders(pageNum, 10, statusParam, search);
      } else {
        res = await billingService.getMyOrders(pageNum, 10, statusParam);
      }

      setOrders(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      setPage(pageNum);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải lịch sử đơn hàng'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(0, activeTab, searchQuery);
    }
  }, [isAuthenticated, activeTab, isAdmin]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(0);
    fetchOrders(0, tab, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchOrders(0, activeTab, searchQuery);
  };

  const handleCancelOrder = async (orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderCode}?`)) {
      return;
    }
    try {
      setCancellingCode(orderCode);
      await billingService.cancelOrder(orderCode, isAdmin ? 'Admin hủy đơn hàng' : 'Người dùng chủ động hủy');
      await fetchOrders(page, activeTab, searchQuery);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể hủy đơn hàng'));
    } finally {
      setCancellingCode(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Thanh toán Thành công
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ thanh toán
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-bold flex items-center gap-1.5 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5" />
            Đã hoàn tiền
          </span>
        );
      case 'CANCELLED':
      case 'EXPIRED':
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Đã hủy
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <CreditCard className="w-6 h-6 text-blue-600" />
                {isAdmin ? 'Lịch sử Mua hàng & Giao dịch Hệ thống' : 'Lịch sử Mua hàng & Giao dịch'}
              </h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[11px] border border-purple-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Admin View
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Toàn bộ đơn mua khóa học, gói VIP của tất cả học viên và người dùng trên hệ thống LMS.'
                : 'Quản lý các khóa học đã mua, gói hội viên VIP và hóa đơn thanh toán thành công.'}
            </p>
          </div>

          {/* Action on Header */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(page, activeTab, searchQuery)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
              <Link
                href="/admin/finance"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition"
              >
                <span>Quản trị Tài chính</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : !isVip && !isTeacherPro ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Nâng cấp Gói VIP
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs transition hover:bg-emerald-100 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Gói VIP đang kích hoạt
            </Link>
          )}
        </div>

        {/* Tab Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('PAID')}
              className={`pb-2 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'PAID'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã mua thành công</span>
              {activeTab === 'PAID' && totalElements > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {totalElements}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('PENDING')}
              className={`pb-2 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chờ thanh toán</span>
              {activeTab === 'PENDING' && totalElements > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  {totalElements}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('ALL')}
              className={`pb-2 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tất cả đơn</span>
              {activeTab === 'ALL' && totalElements > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                  {totalElements}
                </span>
              )}
            </button>
          </div>

          {isAdmin && (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đơn, email, họ tên..."
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Tìm
              </button>
            </form>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              {activeTab === 'PAID' ? <CheckCircle2 className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              {searchQuery
                ? `Không tìm thấy đơn hàng nào khớp với "${searchQuery}"`
                : activeTab === 'PAID'
                ? 'Chưa có đơn hàng thanh toán thành công nào'
                : activeTab === 'PENDING'
                ? 'Không có đơn hàng nào đang chờ thanh toán'
                : 'Chưa có đơn hàng nào'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isAdmin
                ? searchQuery
                  ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm (mã đơn, email hoặc tên khách hàng).'
                  : 'Toàn bộ đơn hàng mua khóa học và nâng cấp gói VIP của mọi người dùng sẽ hiển thị tại đây.'
                : activeTab === 'PAID'
                ? 'Sau khi bạn quét mã QR và hoàn tất chuyển khoản thành công, các gói hội viên và khóa học sẽ được hiển thị đầy đủ tại đây.'
                : 'Khám phá kho khóa học hoặc nâng cấp gói hội viên để mở khóa toàn bộ quyền lợi.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchOrders(0, activeTab, '');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              ) : isAdmin ? (
                <Link
                  href="/admin/finance"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition"
                >
                  <span>Xem Báo cáo Doanh thu Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition"
                  >
                    <span>Xem các Gói Hội Viên VIP</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                  >
                    Khám phá Khóa học
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-sm text-slate-900">
                      #{ord.orderCode}
                    </span>
                    {getStatusBadge(ord.status)}
                    {isAdmin && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold">{ord.userFullName || 'Khách hàng'}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({ord.userEmail})</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {ord.completedAt
                      ? `Thanh toán lúc: ${new Date(ord.completedAt).toLocaleString('vi-VN')}`
                      : `Ngày tạo: ${new Date(ord.placedAt).toLocaleString('vi-VN')}`}
                  </span>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  {ord.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800">{item.productTitle}</span>
                          <span className="text-slate-400 text-[11px] font-semibold ml-2">
                            ({item.productType})
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-slate-800">
                        {item.subtotal.toLocaleString('vi-VN')} {item.currency}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:px-6 rounded-b-3xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-500">Tổng thanh toán:</span>
                    <span className="text-base font-black text-blue-600">
                      {ord.finalAmount.toLocaleString('vi-VN')} {ord.currency}
                    </span>
                    {ord.couponCode && (
                      <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md ml-2">
                        Mã: {ord.couponCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleCancelOrder(ord.orderCode)}
                          disabled={cancellingCode === ord.orderCode}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {cancellingCode === ord.orderCode ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Hủy đơn
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/payment/${encodeURIComponent(ord.orderCode)}`;
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Thanh toán ngay</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {ord.status === 'PAID' && (
                      <Link
                        href={isAdmin ? "/admin/finance" : "/courses"}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <span>{isAdmin ? 'Quản lý thu chi' : 'Vào học ngay'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => fetchOrders(page - 1, activeTab, searchQuery)}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-white transition"
                >
                  Trang trước
                </button>
                <span className="text-xs font-bold text-slate-600">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => fetchOrders(page + 1, activeTab, searchQuery)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40 hover:bg-white transition"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}