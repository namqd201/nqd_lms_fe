'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { financeService } from '@/services/finance.service';
import {
  TeacherBalanceSummaryResponse,
  TeacherEarningResponse,
  TeacherBankAccountResponse,
  TeacherWithdrawalResponse,
  TeacherBankAccountRequest,
} from '@/types/finance';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Edit3,
} from 'lucide-react';

export default function TeacherFinancePage() {
  const [balance, setBalance] = useState<TeacherBalanceSummaryResponse | null>(null);
  const [earnings, setEarnings] = useState<TeacherEarningResponse[]>([]);
  const [withdrawals, setWithdrawals] = useState<TeacherWithdrawalResponse[]>([]);
  const [bankAccounts, setBankAccounts] = useState<TeacherBankAccountResponse[]>([]);

  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals' | 'banks'>('earnings');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bank Info Modal (View / Add / Edit)
  const [isBankInfoModalOpen, setIsBankInfoModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankFormData, setBankFormData] = useState<TeacherBankAccountRequest>({
    bankName: 'Vietcombank',
    bankCode: 'VCB',
    accountNumber: '',
    accountHolderName: '',
    isDefault: true,
  });

  // Withdrawal Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50000);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [bRes, eRes, wRes, bankRes] = await Promise.all([
        financeService.getBalanceSummary(),
        financeService.getTeacherEarnings(undefined, 0, 20),
        financeService.getTeacherWithdrawals(0, 20),
        financeService.getBankAccounts(),
      ]);
      setBalance(bRes);
      setEarnings(eRes.content);
      setWithdrawals(wRes.content);
      setBankAccounts(bankRes);
      if (bankRes.length > 0) {
        const defaultBank = bankRes.find((b) => b.isDefault) || bankRes[0];
        setSelectedBankId(defaultBank.id);
      }
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải dữ liệu tài chính'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setBankFormData({
      bankName: 'Vietcombank',
      bankCode: 'VCB',
      accountNumber: '',
      accountHolderName: '',
      isDefault: bankAccounts.length === 0,
    });
    setIsBankInfoModalOpen(true);
  };

  const handleOpenEditBank = (bank: TeacherBankAccountResponse) => {
    setEditingBankId(bank.id);
    setBankFormData({
      bankName: bank.bankName,
      bankCode: bank.bankCode,
      accountNumber: '',
      accountHolderName: bank.accountHolderName,
      isDefault: bank.isDefault,
    });
    setIsBankInfoModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      if (editingBankId) {
        await financeService.updateBankAccount(editingBankId, bankFormData);
        setSuccessMsg('Đã cập nhật thông tin tài khoản ngân hàng thành công!');
      } else {
        await financeService.addBankAccount(bankFormData);
        setSuccessMsg('Đã thêm tài khoản ngân hàng thành công!');
      }
      setIsBankInfoModalOpen(false);
      setEditingBankId(null);
      await fetchFinanceData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể lưu thông tin tài khoản ngân hàng'));
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) return;
    try {
      await financeService.deleteBankAccount(id);
      setSuccessMsg('Đã xóa tài khoản ngân hàng');
      fetchFinanceData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xóa tài khoản ngân hàng'));
    }
  };

  const handleSetDefaultBank = async (id: string) => {
    try {
      await financeService.setDefaultBankAccount(id);
      setSuccessMsg('Đã đặt tài khoản ngân hàng mặc định');
      fetchFinanceData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể đặt mặc định'));
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance || withdrawAmount > balance.availableBalance) {
      setErrorMsg('Số tiền rút không được vượt quá số dư khả dụng');
      return;
    }
    if (withdrawAmount < 50000) {
      setErrorMsg('Số tiền rút tối thiểu là 50,000 VND');
      return;
    }
    try {
      setIsSubmittingWithdraw(true);
      setErrorMsg(null);
      await financeService.requestWithdrawal({
        amount: withdrawAmount,
        bankAccountId: selectedBankId || undefined,
        idempotencyKey: 'WTD_' + Date.now(),
      });
      setSuccessMsg('Đã gửi yêu cầu rút tiền thành công! Vui lòng chờ admin xét duyệt.');
      setIsWithdrawModalOpen(false);
      fetchFinanceData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể gửi yêu cầu rút tiền'));
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu rút tiền này?')) return;
    try {
      await financeService.cancelWithdrawal(id);
      setSuccessMsg('Đã hủy yêu cầu rút tiền');
      fetchFinanceData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể hủy yêu cầu'));
    }
  };

  return (
    <RoleGuard allowedRoles={['TEACHER', 'ADMIN']}>
      <div className="min-h-screen bg-slate-50 py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Wallet className="w-6 h-6 text-amber-600" />
                Quản lý Tài chính & Thu nhập Giảng viên
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi doanh thu bán khóa học, khấu trừ phí sàn 20%, số dư khả dụng và tạo yêu cầu rút tiền.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (bankAccounts.length > 0) {
                    handleOpenEditBank(bankAccounts.find((b) => b.isDefault) || bankAccounts[0]);
                  } else {
                    handleOpenAddBank();
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                title="Xem và chỉnh sửa thông tin tài khoản ngân hàng nhận tiền"
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Thông tin rút tiền</span>
              </button>

              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!balance || balance.availableBalance < 50000}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
                title="Tạo yêu cầu rút tiền về tài khoản ngân hàng"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Yêu cầu Rút tiền</span>
              </button>
            </div>
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

          {/* 5 Financial KPI Stat Cards */}
          {(() => {
            const grossSales = balance?.totalGrossSales != null
              ? balance.totalGrossSales
              : (balance?.totalEarned ? Math.round(balance.totalEarned / 0.8) : 0);
            const platformFee = balance?.totalPlatformFee != null
              ? balance.totalPlatformFee
              : (grossSales ? Math.round(grossSales * 0.2) : 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Tổng tiền bán được</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {grossSales.toLocaleString('vi-VN')}{' '}
                    <span className="text-xs text-slate-500 font-bold">VND</span>
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">100% doanh số từ học viên</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chuyển lại hệ thống (20%)</span>
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xl font-black text-amber-700">
                    {platformFee.toLocaleString('vi-VN')}{' '}
                    <span className="text-xs text-slate-500 font-bold">VND</span>
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">Phí sàn & hạ tầng LMS (20%)</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Thu nhập thực nhận</span>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {(balance?.totalEarned || 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs text-slate-500 font-bold">VND</span>
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">80% sau trừ phí nền tảng</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Số dư Khả dụng
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-emerald-600">
                    {(balance?.availableBalance || 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs text-slate-500 font-bold">VND</span>
                  </p>
                  <span className="text-[11px] text-emerald-600 font-semibold">Sẵn sàng để rút về tài khoản</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Đã rút hoàn tất</span>
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {(balance?.withdrawnAmount || 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs text-slate-500 font-bold">VND</span>
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">Admin đã giải ngân về bank</span>
                </div>
              </div>
            );
          })()}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'earnings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📜 Sổ cái Thu nhập ({earnings.length})
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'withdrawals'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              💸 Lịch sử Rút tiền ({withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab('banks')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                activeTab === 'banks'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🏦 Tài khoản Ngân hàng ({bankAccounts.length})
            </button>
          </div>

          {/* Tab 1: Earnings Ledger */}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">Lịch sử doanh thu khóa học</h3>
                <span className="text-xs text-slate-400">Hoa hồng ghi nhận theo thời gian thực</span>
              </div>

              {earnings.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">Chưa có giao dịch thu nhập nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-4">Khóa học / Đơn hàng</th>
                        <th className="p-4">Giá bán (Gross)</th>
                        <th className="p-4">Phí sàn (20%)</th>
                        <th className="p-4">Thực nhận (80%)</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">{e.courseName}</span>
                            <span className="font-mono text-[10px] text-slate-400">#{e.orderCode}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-700">
                            {e.grossAmount.toLocaleString('vi-VN')} {e.currency}
                          </td>
                          <td className="p-4 font-mono text-slate-500">
                            -{e.platformFee.toLocaleString('vi-VN')} {e.currency}
                          </td>
                          <td className="p-4 font-mono font-black text-emerald-600">
                            +{e.teacherAmount.toLocaleString('vi-VN')} {e.currency}
                          </td>
                          <td className="p-4">
                            {e.status === 'AVAILABLE' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                Khả dụng
                              </span>
                            )}
                            {e.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                Tạm khóa (7d)
                              </span>
                            )}
                            {e.status === 'REVERSED' && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                                Đã đảo ngược
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 text-[11px]">
                            {new Date(e.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Withdrawals */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">Lịch sử rút tiền</h3>
                <span className="text-xs text-slate-400">Thời gian xử lý: 24h làm việc</span>
              </div>

              {withdrawals.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">Chưa có yêu cầu rút tiền nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-4">Mã rút tiền</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Tài khoản nhận</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Mã tham chiếu / Lý do</th>
                        <th className="p-4">Ngày yêu cầu</th>
                        <th className="p-4 text-right">Thao tác</th>
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
                            <span className="font-mono text-slate-500 text-[11px]">{w.accountNumberMasked}</span>
                          </td>
                          <td className="p-4">
                            {w.status === 'COMPLETED' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                Thành công
                              </span>
                            )}
                            {w.status === 'PROCESSING' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                Đang xử lý
                              </span>
                            )}
                            {w.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                Chờ duyệt
                              </span>
                            )}
                            {w.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                Từ chối
                              </span>
                            )}
                            {w.status === 'CANCELLED' && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                Đã hủy
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 text-[11px]">
                            {w.referenceCode && <span className="font-mono text-emerald-700 font-bold">Ref: {w.referenceCode}</span>}
                            {w.rejectionReason && <span className="text-rose-600">{w.rejectionReason}</span>}
                          </td>
                          <td className="p-4 text-slate-400 text-[11px]">
                            {new Date(w.requestedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-4 text-right">
                            {w.status === 'PENDING' && (
                              <button
                                onClick={() => handleCancelWithdrawal(w.id)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] font-bold transition"
                              >
                                Hủy yêu cầu
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Bank Accounts */}
          {activeTab === 'banks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Tài khoản ngân hàng nhận tiền</h3>
                  <p className="text-xs text-slate-500">Chỉ dùng số tài khoản chính chủ của giảng viên</p>
                </div>
                <button
                  onClick={handleOpenAddBank}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Thêm tài khoản
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    className={`bg-white rounded-3xl p-5 border transition-all space-y-3 relative ${
                      b.isDefault
                        ? 'border-blue-500 shadow-md shadow-blue-500/5'
                        : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{b.bankName}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{b.bankCode}</span>
                        </div>
                      </div>
                      {b.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                          Mặc định
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Số tài khoản</span>
                      <p className="font-mono font-black text-slate-900 text-sm">{b.accountNumberMasked}</p>
                      <p className="text-xs font-bold text-slate-600 uppercase">{b.accountHolderName}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {!b.isDefault ? (
                        <button
                          onClick={() => handleSetDefaultBank(b.id)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          Đặt làm mặc định
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Đang kích hoạt
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBank(b)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          title="Sửa thông tin tài khoản"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBank(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* Bank Account Info Modal (View / Add / Edit) */}
      {isBankInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {editingBankId ? 'Chỉnh sửa thông tin rút tiền' : 'Thông tin rút tiền (Ngân hàng)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tài khoản ngân hàng dùng để nhận tiền khi Admin thanh toán đơn rút
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBankInfoModalOpen(false);
                  setEditingBankId(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              {/* Existing accounts if in list mode */}
              {!editingBankId && bankAccounts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Tài khoản đã lưu:
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {bankAccounts.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          b.isDefault
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{b.bankName}</span>
                            {b.isDefault && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono font-bold text-blue-600">{b.accountNumberMasked}</p>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase">{b.accountHolderName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBank(b)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBank(b.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-2 font-bold text-xs text-slate-700">
                    {editingBankId ? 'Cập nhật tài khoản:' : 'Thêm tài khoản mới:'}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tên ngân hàng *</label>
                <select
                  value={bankFormData.bankName}
                  onChange={(e) => {
                    const name = e.target.value;
                    let code = 'VCB';
                    if (name.includes('MB')) code = 'MB';
                    if (name.includes('Techcombank')) code = 'TCB';
                    if (name.includes('ACB')) code = 'ACB';
                    if (name.includes('VietinBank')) code = 'CTG';
                    if (name.includes('BIDV')) code = 'BIDV';
                    if (name.includes('VPBank')) code = 'VPB';
                    if (name.includes('TPBank')) code = 'TPB';
                    if (name.includes('Agribank')) code = 'VBA';
                    if (name.includes('Sacombank')) code = 'STB';
                    setBankFormData({ ...bankFormData, bankName: name, bankCode: code });
                  }}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Vietcombank">Vietcombank (Ngân hàng Ngoại thương Việt Nam)</option>
                  <option value="MBBank">MBBank (Ngân hàng Quân đội)</option>
                  <option value="Techcombank">Techcombank (Ngân hàng Kỹ thương)</option>
                  <option value="ACB">ACB (Ngân hàng Á Châu)</option>
                  <option value="VietinBank">VietinBank (Ngân hàng Công thương)</option>
                  <option value="BIDV">BIDV (Đầu tư và Phát triển Việt Nam)</option>
                  <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="TPBank">TPBank (Tiên Phong)</option>
                  <option value="Agribank">Agribank (Nông nghiệp & Phát triển Nông thôn)</option>
                  <option value="Sacombank">Sacombank (Sài Gòn Thương Tín)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập số tài khoản..."
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value.trim() })}
                  className="w-full p-2.5 text-xs font-mono font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Tên chủ tài khoản (In hoa không dấu) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: NGUYEN VAN A"
                  value={bankFormData.accountHolderName}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountHolderName: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl uppercase font-bold outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(bankFormData.isDefault)}
                  onChange={(e) => setBankFormData({ ...bankFormData, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  Đặt làm tài khoản nhận thanh toán mặc định
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBankInfoModalOpen(false);
                    setEditingBankId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingBankId ? 'Lưu thay đổi' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Request Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Yêu cầu Rút tiền</h3>
                  <p className="text-[11px] text-slate-500">Chuyển thu nhập về tài khoản ngân hàng cá nhân</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-4">
              {/* Destination Bank Account Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Thông tin tài khoản nhận tiền
                  </label>
                  {bankAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
                        handleOpenEditBank(current);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Sửa thông tin
                    </button>
                  )}
                </div>

                {bankAccounts.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-amber-800">Bạn chưa thêm tài khoản ngân hàng nhận tiền!</p>
                    <button
                      type="button"
                      onClick={handleOpenAddBank}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                    >
                      + Thêm thông tin rút tiền ngay
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full p-2 bg-white text-xs font-bold border border-slate-200 rounded-xl outline-none"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumberMasked} ({b.accountHolderName})
                        </option>
                      ))}
                    </select>

                    {(() => {
                      const cur = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
                      if (!cur) return null;
                      return (
                        <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/60">
                          <p>
                            <span className="font-semibold text-slate-500">Ngân hàng:</span>{' '}
                            <span className="font-bold text-slate-800">{cur.bankName}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-500">Số tài khoản:</span>{' '}
                            <span className="font-mono font-bold text-blue-600">{cur.accountNumberMasked}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-slate-500">Chủ tài khoản:</span>{' '}
                            <span className="font-bold text-slate-800 uppercase">{cur.accountHolderName}</span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Balance & Amount */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-800">Số dư khả dụng hiện tại:</span>
                  <p className="text-[10px] text-emerald-600 font-medium">Sẵn sàng để rút ngay</p>
                </div>
                <span className="font-black text-emerald-700 text-sm font-mono">
                  {(balance?.availableBalance || 0).toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Số tiền cần rút (VND) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Tối thiểu: 50,000 VND</span>
                </div>
                <input
                  type="number"
                  min={50000}
                  max={balance?.availableBalance || 0}
                  step={10000}
                  required
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full p-3 text-base font-black border border-slate-300 rounded-2xl font-mono text-blue-600 outline-none focus:border-amber-500 shadow-xs"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[50000, 100000, 200000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWithdrawAmount(preset)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        withdrawAmount === preset
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {preset.toLocaleString('vi-VN')} đ
                    </button>
                  ))}
                  {balance && balance.availableBalance >= 50000 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balance.availableBalance)}
                      className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                    >
                      Rút tất cả
                    </button>
                  )}
                </div>

                {/* Remaining preview */}
                {balance && (
                  <div className="text-[11px] text-slate-500 pt-1 flex justify-between font-medium">
                    <span>Số dư còn lại sau khi rút:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {Math.max(0, (balance.availableBalance || 0) - (withdrawAmount || 0)).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
                🔔 <strong>Quy trình xử lý:</strong> Sau khi bạn gửi yêu cầu, hệ thống sẽ tự động gửi thông báo đến Ban Quản trị. Quản trị viên sẽ kiểm tra và chuyển khoản tới tài khoản ngân hàng của bạn, sau đó cập nhật đơn kèm Mã giao dịch ngân hàng.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || bankAccounts.length === 0 || !withdrawAmount || withdrawAmount < 50000 || (balance != null && withdrawAmount > balance.availableBalance)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isSubmittingWithdraw && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </RoleGuard>
  );
}
