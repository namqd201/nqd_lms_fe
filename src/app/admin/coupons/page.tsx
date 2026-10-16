'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { billingService } from '@/services/billing.service';
import { membershipService } from '@/services/membership.service';
import { CouponDto, UpsertCouponRequest, DiscountType, CouponStats } from '@/types/billing';
import { MembershipPlanResponse } from '@/types/membership';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [stats, setStats] = useState<CouponStats>({ totalCoupons: 0, activeCoupons: 0, totalUsed: 0, totalLimit: 0 });
  const [plans, setPlans] = useState<MembershipPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('20');
  const [usageLimit, setUsageLimit] = useState<string>('100');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [scopeOption, setScopeOption] = useState<string>('ALL');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [list, statsData, plansData] = await Promise.all([
        billingService.getManagedCoupons(),
        billingService.getCouponStats(),
        membershipService.getPlans().catch(() => []),
      ]);
      setCoupons(Array.isArray(list) ? list : []);
      if (statsData) setStats(statsData);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách mã giảm giá'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Vô thời hạn';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const toDateInput = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Copy code helper
  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Generate random code
  const handleGenerateRandomCode = () => {
    const prefixes = ['NQD', 'VIP', 'SALE', 'PROMO', 'LMS'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const rand = Math.floor(100 + Math.random() * 900);
    setCode(`${prefix}${rand}`);
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    handleGenerateRandomCode();
    setName('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('20');
    setUsageLimit('100');
    setMinOrderAmount('0');
    setMaxDiscountAmount('100000');
    setValidFrom(new Date().toISOString().split('T')[0]);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setValidUntil(in30Days);
    setScopeOption('ALL');
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon: CouponDto) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setName(coupon.name);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(String(coupon.discountValue));
    setUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '');
    setMinOrderAmount(coupon.minOrderAmount ? String(coupon.minOrderAmount) : '0');
    setMaxDiscountAmount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '');
    setValidFrom(toDateInput(coupon.validFrom));
    setValidUntil(toDateInput(coupon.validUntil));
    if (coupon.planId) {
      setScopeOption(`PLAN_${coupon.planId}`);
    } else if (coupon.targetPlanGroup === 'PRO') {
      setScopeOption('GROUP_PRO');
    } else if (coupon.targetPlanGroup === 'ULTRA') {
      setScopeOption('GROUP_ULTRA');
    } else {
      setScopeOption('ALL');
    }
    setIsActive(coupon.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !discountValue) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const numDiscount = Number(discountValue);
    if (discountType === 'PERCENTAGE' && (numDiscount < 1 || numDiscount > 100)) {
      setModalError('Mức giảm theo % phải từ 1% đến 100%.');
      return;
    }
    if (discountType === 'FIXED_AMOUNT' && numDiscount < 1000) {
      setModalError('Số tiền giảm cố định tối thiểu là 1.000đ.');
      return;
    }

    let targetPlanGroup: 'ALL' | 'PRO' | 'ULTRA' = 'ALL';
    let planId: string | null = null;
    if (scopeOption === 'GROUP_PRO') {
      targetPlanGroup = 'PRO';
    } else if (scopeOption === 'GROUP_ULTRA') {
      targetPlanGroup = 'ULTRA';
    } else if (scopeOption.startsWith('PLAN_')) {
      planId = scopeOption.replace('PLAN_', '');
      targetPlanGroup = 'ALL';
    }

    setIsSaving(true);
    setModalError(null);

    const payload: UpsertCouponRequest = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      discountType,
      discountValue: numDiscount,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      validFrom: validFrom ? `${validFrom}T00:00:00` : undefined,
      validUntil: validUntil ? `${validUntil}T23:59:59` : undefined,
      targetPlanGroup,
      planId,
      isActive,
    };

    try {
      if (editingCoupon) {
        await billingService.updateCoupon(editingCoupon.id, payload);
        setSuccessMsg(`Đã cập nhật mã giảm giá "${code}" thành công.`);
      } else {
        await billingService.createCoupon(payload);
        setSuccessMsg(`Đã tạo mã giảm giá "${code}" với số lượng ${usageLimit || 'không giới hạn'} lượt.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(formatErrorMessage(err, 'Lưu mã giảm giá thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active
  const handleToggleCoupon = async (coupon: CouponDto) => {
    try {
      await billingService.toggleCoupon(coupon.id);
      setSuccessMsg(
        coupon.isActive
          ? `Đã tạm ngưng mã giảm giá "${coupon.code}".`
          : `Đã kích hoạt mã giảm giá "${coupon.code}".`
      );
      await loadData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể cập nhật trạng thái mã'));
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await billingService.deleteCoupon(deletingId);
      setSuccessMsg('Đã xóa mã giảm giá thành công.');
      setDeletingId(null);
      await loadData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xóa mã giảm giá'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchSearch =
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchType = true;
      if (discountTypeFilter !== 'ALL') {
        matchType = coupon.discountType === discountTypeFilter;
      }

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = coupon.isActive;
      } else if (statusFilter === 'INACTIVE') {
        matchStatus = !coupon.isActive;
      } else if (statusFilter === 'AVAILABLE') {
        matchStatus = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
      } else if (statusFilter === 'DEPLETED') {
        matchStatus = Boolean(coupon.usageLimit && coupon.usedCount >= coupon.usageLimit);
      }

      return matchSearch && matchType && matchStatus;
    });
  }, [coupons, searchTerm, discountTypeFilter, statusFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Quản Lý Mã Giảm Giá (Coupons)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Tạo mã ưu đãi, thiết lập số lượng phát hành, giới hạn lượt dùng và theo dõi tiến độ sử dụng thời gian thực.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-xs disabled:opacity-50"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã giảm giá mới</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coupons */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng số mã</span>
            <Ticket className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalCoupons}</span>
            <span className="text-xs text-slate-400">mã phát hành</span>
          </div>
          <p className="text-[11px] text-slate-500">Mã giảm giá đã tạo trên hệ thống</p>
        </div>

        {/* Active Coupons */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Đang hoạt động</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.activeCoupons}</span>
            <span className="text-xs text-slate-400">/ {stats.totalCoupons} mã</span>
          </div>
          <p className="text-[11px] text-slate-500">Sẵn sàng để học viên áp dụng khi thanh toán</p>
        </div>

        {/* Total Quantity / Usage Limit */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng số lượng phát hành</span>
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-600">{stats.totalLimit.toLocaleString()}</span>
            <span className="text-xs text-slate-400">lượt</span>
          </div>
          <p className="text-[11px] text-slate-500">Tổng giới hạn số lượng các mã cộng lại</p>
        </div>

        {/* Total Used */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt đã sử dụng</span>
            <TrendingUp className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{stats.totalUsed.toLocaleString()}</span>
            <span className="text-xs text-slate-400">
              ({stats.totalLimit > 0 ? Math.round((stats.totalUsed / stats.totalLimit) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${stats.totalLimit > 0 ? Math.min(100, Math.round((stats.totalUsed / stats.totalLimit) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã giảm giá, tên chương trình..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={discountTypeFilter}
            onChange={(e) => setDiscountTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi loại giảm</option>
            <option value="PERCENTAGE">Theo phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Đã tạm ngưng</option>
            <option value="AVAILABLE">Còn lượt dùng</option>
            <option value="DEPLETED">Đã hết lượt</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs text-slate-500 font-medium">Đang tải danh sách mã giảm giá...</span>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <Ticket className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Chưa có mã giảm giá nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || discountTypeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Không tìm thấy mã giảm giá nào khớp với tiêu chí tìm kiếm.'
              : 'Hãy tạo mã giảm giá cùng với số lượng phát hành để bắt đầu chiến dịch ưu đãi!'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã ngay</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Mã Code</th>
                  <th className="py-3.5 px-4">Tên chương trình</th>
                  <th className="py-3.5 px-4">Mức giảm</th>
                  <th className="py-3.5 px-4">Số lượng & Sử dụng</th>
                  <th className="py-3.5 px-4">Thời hạn</th>
                  <th className="py-3.5 px-4">Phạm vi</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const isDepleted = coupon.usageLimit ? coupon.usedCount >= coupon.usageLimit : false;
                  const percentUsed = coupon.usageLimit
                    ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
                    : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-4 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Sao chép mã"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900 block">{coupon.name}</span>
                        {coupon.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{coupon.description}</span>
                        )}
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-4">
                        {coupon.discountType === 'PERCENTAGE' ? (
                          <span className="inline-flex items-center gap-1 font-extrabold text-rose-600 text-sm">
                            <Percent className="w-3.5 h-3.5" /> -{coupon.discountValue}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 text-sm">
                            <Coins className="w-3.5 h-3.5" /> -{Number(coupon.discountValue).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {coupon.maxDiscountAmount && coupon.discountType === 'PERCENTAGE' && (
                          <span className="text-[10px] text-slate-400 block">
                            Tối đa: {Number(coupon.maxDiscountAmount).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </td>

                      {/* Quantity & Usage Limit */}
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-800">{coupon.usedCount}</span>
                            <span className="text-slate-400">
                              / {coupon.usageLimit ? `${coupon.usageLimit} lượt` : '∞ Không giới hạn'}
                            </span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isDepleted ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px]">
                            {isDepleted ? (
                              <span className="font-bold text-red-500">Đã hết số lượng</span>
                            ) : coupon.usageLimit ? (
                              <span className="text-slate-400">Còn lại {coupon.usageLimit - coupon.usedCount} lượt</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">Không giới hạn</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <div className="space-y-0.5">
                          <span className="block text-slate-700">Từ: {formatDate(coupon.validFrom)}</span>
                          <span className="block text-slate-400 font-medium">Đến: {formatDate(coupon.validUntil)}</span>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-4 px-4">
                        {coupon.planName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span>Gói: {coupon.planName}</span>
                          </span>
                        ) : coupon.targetPlanGroup === 'ULTRA' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xs">
                            <Sparkles className="w-3 h-3 fill-white" />
                            <span>Chỉ gói ULTRA</span>
                          </span>
                        ) : coupon.targetPlanGroup === 'PRO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <span>Chỉ các gói PRO</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Tất cả gói Pro & Ultra
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleCoupon(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            coupon.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              coupon.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(coupon.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Xóa mã"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TẠO / CHỈNH SỬA MÃ GIẢM GIÁ
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingCoupon ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình mã code, loại ưu đãi và số lượng phát hành tối đa.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Mã code & Random button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Mã Code giảm giá *</label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Tạo ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: NQD50K, SALE20"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tên chương trình */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tên chương trình ưu đãi *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Tri ân học viên mới 50.000đ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Số lượng phát hành & Loại giảm giá */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Số lượng phát hành */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Số lượng mã (Lượt dùng) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Để trống = Không giới hạn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/20 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">VD: 50, 100, 500 lượt</span>
                </div>

                {/* Loại giảm giá */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Loại giảm giá</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (đ)</option>
                  </select>
                </div>

                {/* Mức giảm */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Mức giảm ({discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? 'VD: 20' : 'VD: 50000'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ràng buộc: Giảm tối đa & Đơn tối thiểu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Giảm tối đa (đ) - Cho loại %</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="VD: 100000 (Để trống = Không trần)"
                    disabled={discountType === 'FIXED_AMOUNT'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Đơn hàng tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="VD: 0 hoặc 200000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày bắt đầu hiệu lực
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phạm vi áp dụng */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phạm vi áp dụng gói hội viên *</label>
                <select
                  value={scopeOption}
                  onChange={(e) => setScopeOption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">Toàn bộ gói hội viên (Cả gói PRO & ULTRA)</option>
                  <option value="GROUP_PRO">⭐ Chỉ áp dụng cho các Gói PRO (Học sinh & Giáo viên)</option>
                  <option value="GROUP_ULTRA">👑 Chỉ áp dụng cho Gói ULTRA (Học sinh Ultra)</option>
                  {plans.length > 0 && (
                    <optgroup label="Áp dụng riêng cho từng gói cụ thể:">
                      {plans.map((p) => (
                        <option key={p.id} value={`PLAN_${p.id}`}>
                          Chỉ riêng: {p.name} ({p.billingCycle === 'YEARLY' ? 'Gói Năm' : 'Gói Tháng'} - {Number(p.price).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[11px] text-slate-400">
                  Chọn nhóm gói PRO, gói ULTRA hoặc gói cụ thể để mã giảm giá chỉ có hiệu lực khi học viên thanh toán gói tương ứng.
                </p>
              </div>

              {/* Mô tả */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mô tả / Ghi chú</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú điều kiện hoặc mục đích của mã giảm giá..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Toggle switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Kích hoạt mã ngay</span>
                  <span className="text-[11px] text-slate-500">Mã sẽ có thể được áp dụng tức thì tại bước thanh toán.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCoupon ? 'Cập nhật mã' : 'Lưu mã giảm giá'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM DELETE DIALOG
          ======================================================== */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 w-12 h-12 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Xác nhận xóa mã giảm giá?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sau khi xóa, học viên sẽ không thể áp dụng mã này vào đơn hàng mới. Lịch sử các đơn hàng cũ đã dùng mã sẽ được giữ nguyên.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCoupon}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa mã</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
