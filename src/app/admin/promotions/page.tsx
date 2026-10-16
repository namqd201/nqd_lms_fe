'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { promotionService } from '@/services/promotion.service';
import { membershipService } from '@/services/membership.service';
import { PromotionEventDto, UpsertPromotionEventRequest } from '@/types/promotion';
import { MembershipPlanResponse } from '@/types/membership';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Flame,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Percent,
  Tag,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionEventDto[]>([]);
  const [plans, setPlans] = useState<MembershipPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<PromotionEventDto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number>(20);
  const [badgeText, setBadgeText] = useState<string>('HOT SALE');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Plan Discount Config: Map of planId -> { selected: boolean, discountPercent: number }
  const [planConfigs, setPlanConfigs] = useState<Record<string, { selected: boolean; discountPercent: number }>>({});

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [promoList, planList] = await Promise.all([
        promotionService.getAllPromotionsAdmin(),
        membershipService.getPlans(),
      ]);
      setPromotions(Array.isArray(promoList) ? promoList : []);
      setPlans(Array.isArray(planList) ? planList : []);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải dữ liệu sự kiện giảm giá'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format date helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Convert ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const matchSearch =
        (promo.name && promo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (promo.code && promo.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = promo.status === 'ACTIVE' && promo.isActive;
      } else if (statusFilter === 'UPCOMING') {
        matchStatus = promo.status === 'UPCOMING' && promo.isActive;
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = promo.status === 'EXPIRED';
      } else if (statusFilter === 'DISABLED') {
        matchStatus = !promo.isActive || promo.status === 'CANCELLED';
      }

      return matchSearch && matchStatus;
    });
  }, [promotions, searchTerm, statusFilter]);

  // Active Promo (if any)
  const activePromo = useMemo(() => {
    return promotions.find((p) => p.isCurrentlyActive && p.status === 'ACTIVE');
  }, [promotions]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setName('');
    const randCode = 'SALE-' + Math.floor(1000 + Math.random() * 9000);
    setCode(randCode);
    setDescription('');

    // Default start now, end after 7 days
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartTime(toDateTimeLocal(now.toISOString()));
    setEndTime(toDateTimeLocal(inSevenDays.toISOString()));

    setDefaultDiscountPercent(30);
    setBadgeText('GIẢM SỐC 30%');
    setBannerUrl('');
    setIsActive(true);

    // Initial plan configs: select all with default discount
    const initialConfigs: Record<string, { selected: boolean; discountPercent: number }> = {};
    plans.forEach((p) => {
      initialConfigs[p.id] = { selected: true, discountPercent: 30 };
    });
    setPlanConfigs(initialConfigs);

    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (promo: PromotionEventDto) => {
    setEditingPromo(promo);
    setName(promo.name);
    setCode(promo.code || '');
    setDescription(promo.description || '');
    setStartTime(toDateTimeLocal(promo.startTime));
    setEndTime(toDateTimeLocal(promo.endTime));
    setDefaultDiscountPercent(promo.defaultDiscountPercent || 20);
    setBadgeText(promo.badgeText || 'HOT SALE');
    setBannerUrl(promo.bannerUrl || '');
    setIsActive(promo.isActive);

    const configs: Record<string, { selected: boolean; discountPercent: number }> = {};
    plans.forEach((p) => {
      const match = promo.planDiscounts?.find((pd) => pd.planId === p.id);
      if (match) {
        configs[p.id] = { selected: true, discountPercent: match.discountPercent };
      } else {
        configs[p.id] = { selected: false, discountPercent: promo.defaultDiscountPercent || 20 };
      }
    });
    setPlanConfigs(configs);

    setModalError(null);
    setIsModalOpen(true);
  };

  // Apply default discount percent to all selected plans
  const handleApplyDefaultDiscountToAll = (percent: number) => {
    setDefaultDiscountPercent(percent);
    setPlanConfigs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].selected) {
          next[key] = { ...next[key], discountPercent: percent };
        }
      });
      return next;
    });
  };

  // Save Modal
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Vui lòng nhập tên sự kiện giảm giá.');
      return;
    }
    if (!startTime || !endTime) {
      setModalError('Vui lòng chọn thời gian bắt đầu và kết thúc sự kiện.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setModalError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    // Build plan discounts array
    const planDiscounts = Object.entries(planConfigs)
      .filter(([_, cfg]) => cfg.selected && cfg.discountPercent > 0)
      .map(([planId, cfg]) => ({
        planId,
        discountPercent: Number(cfg.discountPercent),
      }));

    if (planDiscounts.length === 0) {
      setModalError('Vui lòng chọn ít nhất một gói thành viên áp dụng giảm giá.');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const payload: UpsertPromotionEventRequest = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      defaultDiscountPercent: Number(defaultDiscountPercent),
      badgeText: badgeText.trim(),
      bannerUrl: bannerUrl.trim() || undefined,
      isActive,
      planDiscounts,
    };

    try {
      if (editingPromo) {
        await promotionService.updatePromotion(editingPromo.id, payload);
        setSuccessMsg(`Đã cập nhật sự kiện "${name}" thành công.`);
      } else {
        await promotionService.createPromotion(payload);
        setSuccessMsg(`Đã tạo sự kiện giảm giá "${name}" thành công.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(formatErrorMessage(err, 'Lưu sự kiện giảm giá thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Promo Active
  const handleTogglePromo = async (promo: PromotionEventDto) => {
    try {
      await promotionService.togglePromotion(promo.id);
      setSuccessMsg(
        promo.isActive
          ? `Đã tạm ngưng sự kiện "${promo.name}". Giá các gói đã tự động hoàn về giá gốc.`
          : `Đã kích hoạt sự kiện "${promo.name}". Giá ưu đãi đang được áp dụng.`
      );
      await loadData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể cập nhật trạng thái sự kiện'));
    }
  };

  // Delete Promo
  const handleDeletePromo = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await promotionService.deletePromotion(deletingId);
      setSuccessMsg('Đã xóa sự kiện giảm giá thành công.');
      setDeletingId(null);
      await loadData();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xóa sự kiện giảm giá'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Quản Lý Sự Kiện Giảm Giá
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Cấu hình chương trình khuyến mãi, % giảm giá cho các gói hội viên. Khi hết hạn, giá tự động quay về giá gốc 100%.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-xs disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sự kiện giảm giá</span>
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

      {/* Active Promotion Highlight Card */}
      {activePromo ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-600 shadow-sm uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                  Đang diễn ra Live
                </span>
                {activePromo.badgeText && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-900 shadow-sm">
                    {activePromo.badgeText}
                  </span>
                )}
                {activePromo.code && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-black/20 border border-white/20">
                    Mã: {activePromo.code}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black">{activePromo.name}</h2>
              <p className="text-sm text-white/90 leading-relaxed">
                {activePromo.description || 'Ưu đãi giảm giá đặc biệt áp dụng trực tiếp cho các gói đăng ký hội viên.'}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-white/80 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Bắt đầu: {formatDateTime(activePromo.startTime)}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1.5 font-bold text-amber-200">
                  <Clock className="w-4 h-4" />
                  <span>Kết thúc: {formatDateTime(activePromo.endTime)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[240px]">
              <span className="text-xs font-medium text-white/80">Số gói đang áp dụng giảm giá:</span>
              <span className="text-3xl font-black text-amber-300">
                {activePromo.planDiscounts?.length || 0} Gói
              </span>
              <p className="text-[11px] text-white/70 italic">
                * Khi hết thời gian trên, hệ thống sẽ tự động hoàn tất cả các gói về giá gốc ban đầu.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(activePromo)}
                  className="w-full py-2 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition shadow-sm"
                >
                  Chỉnh sửa sự kiện
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-slate-400 border border-slate-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Hiện không có sự kiện giảm giá nào đang chạy</h3>
              <p className="text-xs text-slate-500">
                Tất cả các gói thành viên hiện đang được hiển thị và bán theo đúng <span className="font-bold text-slate-700">Giá Gốc</span>.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-xs"
          >
            Tạo sự kiện ngay
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sự kiện, mã sự kiện..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ACTIVE', label: 'Đang diễn ra' },
            { id: 'UPCOMING', label: 'Sắp diễn ra' },
            { id: 'EXPIRED', label: 'Đã kết thúc' },
            { id: 'DISABLED', label: 'Đã tạm tắt' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <span className="text-xs text-slate-500 font-medium">Đang tải danh sách sự kiện giảm giá...</span>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <Flame className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy sự kiện giảm giá nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Không có sự kiện nào khớp với bộ lọc tìm kiếm hiện tại.'
              : 'Hãy bắt đầu tạo sự kiện giảm giá để tăng doanh số đăng ký hội viên ngay hôm nay!'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo sự kiện mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => {
            const isLive = promo.isCurrentlyActive && promo.status === 'ACTIVE';
            const isUpcoming = promo.status === 'UPCOMING' && promo.isActive;
            const isExpired = promo.status === 'EXPIRED';
            const isDisabled = !promo.isActive || promo.status === 'CANCELLED';

            return (
              <div
                key={promo.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isLive
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : isUpcoming
                    ? 'border-amber-200'
                    : isExpired
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                          </span>
                          Đang diễn ra
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Sắp diễn ra
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã kết thúc (Về giá gốc)
                        </span>
                      )}
                      {isDisabled && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Đã tắt
                        </span>
                      )}
                      {promo.badgeText && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                          {promo.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(promo)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(promo.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Code */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{promo.name}</h3>
                    {promo.code && (
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">Mã: {promo.code}</span>
                    )}
                    {promo.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {promo.description}
                      </p>
                    )}
                  </div>

                  {/* Duration Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Bắt đầu:
                      </span>
                      <span className="font-semibold text-slate-700">{formatDateTime(promo.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Kết thúc:
                      </span>
                      <span className="font-bold text-rose-600">{formatDateTime(promo.endTime)}</span>
                    </div>
                  </div>

                  {/* Configured Packages */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Các gói áp dụng giảm giá ({promo.planDiscounts?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {promo.planDiscounts && promo.planDiscounts.length > 0 ? (
                        promo.planDiscounts.map((pd) => (
                          <span
                            key={pd.id || pd.planId}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            <span>{pd.planName || pd.planCode}</span>
                            <span className="font-black text-rose-600">-{pd.discountPercent}%</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Áp dụng giảm chung {promo.defaultDiscountPercent}% cho mọi gói</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Switch */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Trạng thái kích hoạt:</span>
                  <button
                    onClick={() => handleTogglePromo(promo)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      promo.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        promo.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: THÊM / CHỈNH SỬA SỰ KIỆN GIẢM GIÁ
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 my-8">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingPromo ? 'Chỉnh Sửa Sự Kiện Giảm Giá' : 'Thêm Sự Kiện Giảm Giá Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấu hình tên sự kiện, thời gian chạy và tỷ lệ % giảm cho các gói hội viên.
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

            <form onSubmit={handleSavePromo} className="p-6 space-y-6">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Tên sự kiện giảm giá *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Flash Sale Mùa Thi 2026 - Giảm 40% Gói VIP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã sự kiện (Code)</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: SALE-OCT-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nhãn nổi bật (Badge)</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="VD: GIẢM SỐC 30%, SIÊU SALE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                {/* Date Times */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Thời gian bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" /> Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Nội dung chi tiết chương trình</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả quyền lợi và thông điệp gửi tới học viên trong đợt giảm giá này..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Cấu hình % Giảm giá các gói */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-rose-600" /> Cấu hình giá các gói theo % giảm
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tùy chỉnh tỷ lệ % giảm giá cho từng gói hội viên. Giá sau giảm sẽ được áp dụng trong thời gian diễn ra sự kiện.
                    </p>
                  </div>

                  {/* Bulk apply percent */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Áp dụng nhanh:</span>
                    {[20, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyDefaultDiscountToAll(pct)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200"
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table of plans */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-10">Áp dụng</th>
                        <th className="py-2.5 px-3">Tên gói hội viên</th>
                        <th className="py-2.5 px-3">Chu kỳ</th>
                        <th className="py-2.5 px-3">Giá gốc</th>
                        <th className="py-2.5 px-3 w-32">% Giảm</th>
                        <th className="py-2.5 px-3 text-right">Giá sau giảm (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plans.map((p) => {
                        const cfg = planConfigs[p.id] || { selected: false, discountPercent: defaultDiscountPercent };
                        const origPrice = Number(p.originalPrice || p.price || 0);
                        const discountPct = cfg.discountPercent || 0;
                        const discountedPrice = cfg.selected && discountPct > 0
                          ? Math.round(origPrice * ((100 - discountPct) / 100))
                          : origPrice;

                        return (
                          <tr key={p.id} className={cfg.selected ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}>
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={cfg.selected}
                                onChange={(e) => {
                                  setPlanConfigs((prev) => ({
                                    ...prev,
                                    [p.id]: { ...cfg, selected: e.target.checked },
                                  }));
                                }}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.planCode}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {p.billingCycle}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-600">
                              {origPrice.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  disabled={!cfg.selected}
                                  value={cfg.discountPercent}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(100, Number(e.target.value) || 0));
                                    setPlanConfigs((prev) => ({
                                      ...prev,
                                      [p.id]: { ...cfg, discountPercent: val },
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 disabled:opacity-40"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {cfg.selected && discountPct > 0 ? (
                                <div>
                                  <span className="font-extrabold text-sm text-rose-600 block">
                                    {discountedPrice.toLocaleString('vi-VN')}đ
                                  </span>
                                  <span className="text-[10px] line-through text-slate-400">
                                    {origPrice.toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Giá gốc</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Switch in Modal */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Kích hoạt sự kiện ngay</span>
                  <span className="text-[11px] text-slate-500">
                    Nếu bật và nằm trong khung giờ bắt đầu - kết thúc, giá ưu đãi sẽ tự động kích hoạt tức thì.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-rose-600' : 'bg-slate-300'
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPromo ? 'Cập nhật sự kiện' : 'Lưu sự kiện giảm giá'}</span>
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
              <h3 className="font-extrabold text-base text-slate-900">Xác nhận xóa sự kiện giảm giá?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hành động này sẽ xóa sự kiện và tự động hoàn trả giá các gói hội viên về giá gốc ban đầu ngay lập tức.
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
                onClick={handleDeletePromo}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa sự kiện</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
