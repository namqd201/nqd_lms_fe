'use client';

import React, { useState, useEffect } from 'react';
import { financeService } from '@/services/finance.service';
import {
  AdminPlatformRevenueResponse,
  TeacherWithdrawalResponse,
  TeacherEarningResponse,
  RefundResponse,
} from '@/types/finance';
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
} from 'lucide-react';

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<AdminPlatformRevenueResponse | null>(null);
  const [withdrawals, setWithdrawals] = useState<TeacherWithdrawalResponse[]>([]);
  const [earnings, setEarnings] = useState<TeacherEarningResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'earnings' | 'refunds'>('withdrawals');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const fetchAdminFinance = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [oRes, wRes, eRes] = await Promise.all([
        financeService.getAdminOverview(),
        financeService.getAdminWithdrawals(undefined, 0, 30),
        financeService.getTeacherEarnings(undefined, 0, 30),
      ]);
      setOverview(oRes);
      setWithdrawals(wRes.content);
      setEarnings(eRes.content);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải dữ liệu tài chính hệ thống'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminFinance();
  }, []);

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
          <div className="border-b border-slate-200/80 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Tổng quan Tài chính & Quản lý Payout
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Báo cáo doanh thu toàn hệ thống, phê duyệt chi trả cho giảng viên và xử lý hoàn tiền.
            </p>
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

          {/* 5 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh thu Gộp</span>
              <p className="text-xl font-black text-slate-900">
                {(overview?.grossRevenue || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-500 font-bold">VND</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border-2 border-purple-500/80 shadow-md shadow-purple-500/5 space-y-1.5">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Phí Sàn thu được (20%)</span>
              <p className="text-xl font-black text-purple-600">
                {(overview?.platformTotalFees || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-500 font-bold">VND</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiền Giảng viên (80%)</span>
              <p className="text-xl font-black text-blue-600">
                {(overview?.teacherTotalEarnings || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-500 font-bold">VND</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ Rút (Pending)</span>
              <p className="text-xl font-black text-amber-600">
                {(overview?.pendingWithdrawals || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-500 font-bold">VND</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn tiền</span>
              <p className="text-xl font-black text-rose-600">
                {(overview?.reversedAmount || 0).toLocaleString('vi-VN')}{' '}
                <span className="text-xs text-slate-500 font-bold">VND</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              💸 Yêu cầu Rút tiền ({withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'earnings'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📜 Toàn bộ Sổ cái Thu nhập ({earnings.length})
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'refunds'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🔄 Xử lý Hoàn tiền (Refund)
            </button>
          </div>

          {/* Tab 1: Payout Requests Queue */}
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
                    {withdrawals.map((w) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: All Earnings Ledger */}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">Toàn bộ giao dịch thu nhập</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Khóa học / Đơn hàng</th>
                      <th className="p-4">Doanh thu gộp</th>
                      <th className="p-4">Phí sàn (20%)</th>
                      <th className="p-4">Giảng viên (80%)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {earnings.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{e.courseName}</span>
                          <span className="font-mono text-[10px] text-slate-400">#{e.orderCode}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Process Refund */}
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

      {/* Complete Modal */}
      {isCompleteModalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-base">Xác nhận chuyển tiền thành công</h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Nhập mã tham chiếu / mã giao dịch ủy nhiệm chi của ngân hàng (nếu có) cho lệnh rút <strong>#{selectedWithdrawal.withdrawalCode}</strong>.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mã tham chiếu ngân hàng (Reference Code)</label>
                <input
                  type="text"
                  placeholder="VD: FT2609068899..."
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl font-mono"
                />
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
