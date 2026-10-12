'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { billingService } from '@/services/billing.service';
import { CouponDto, DiscountType } from '@/types/billing';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  X,
  Ticket,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface CouponManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  courseName?: string;
}

export function CouponManagerModal({
  isOpen,
  onClose,
  courseId,
  courseName,
}: CouponManagerModalProps) {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('20');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [usageLimit, setUsageLimit] = useState<string>('50');
  const [validUntil, setValidUntil] = useState<string>('');

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const list = await billingService.getManagedCoupons(courseId);
      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách mã giảm giá'));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (isOpen) {
      loadCoupons();
    }
  }, [isOpen, loadCoupons]);

  if (!isOpen) return null;

  const generateRandomCode = () => {
    const prefix = courseName
      ? courseName
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 4) || 'NQD'
      : 'NQD';
    const rand = Math.floor(100 + Math.random() * 900);
    setCode(`${prefix}${rand}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !discountValue) return;
    setIsCreating(true);
    setErrorMsg(null);

    try {
      const created = await billingService.createCoupon({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        validUntil: validUntil ? `${validUntil}T23:59:59` : undefined,
        courseId,
        isActive: true,
      });
      setCoupons((prev) => [created, ...prev]);
      setCode('');
      setName('');
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Tạo mã giảm giá thất bại'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await billingService.toggleCoupon(id);
      setCoupons((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể đổi trạng thái mã giảm giá'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await billingService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xóa mã giảm giá'));
    }
  };

  const handleCopy = (couponCode: string, id: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Quản lý Mã giảm giá / Voucher
              </h3>
              <p className="text-xs text-slate-500">
                {courseName ? `Khóa học: ${courseName}` : 'Áp dụng toàn hệ thống NQD-LMS'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Create Coupon Form */}
          <form
            onSubmit={handleCreate}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Tạo mã giảm giá mới</span>
              </span>
              <button
                type="button"
                onClick={generateRandomCode}
                className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                + Sinh mã tự động
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mã Voucher *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: KHAIXUAN50"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 outline-none focus:border-purple-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Tên chương trình khuyến mãi *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Ưu đãi học sinh đăng ký sớm"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Loại giảm giá
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                >
                  <option value="PERCENTAGE">Theo %</option>
                  <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mức giảm ({discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}) *
                </label>
                <input
                  type="number"
                  required
                  min={discountType === 'PERCENTAGE' ? 1 : 1000}
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Giới hạn lượt dùng
                </label>
                <input
                  type="number"
                  min={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Hạn sử dụng
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Tạo mã giảm giá</span>
              </button>
            </div>
          </form>

          {/* Coupon List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Danh sách mã giảm giá ({coupons.length})
            </h4>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Đang tải danh sách mã giảm giá...</span>
              </div>
            ) : coupons.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Chưa có mã giảm giá nào. Hãy tạo mã đầu tiên ở khung bên trên!
              </div>
            ) : (
              <div className="space-y-2">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                      c.isActive
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleCopy(c.code, c.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-mono font-black text-xs flex items-center gap-1.5 hover:bg-purple-100 cursor-pointer"
                          title="Sao chép mã"
                        >
                          <span>{c.code}</span>
                          {copiedId === c.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {c.discountType === 'PERCENTAGE'
                            ? `Giảm ${c.discountValue}%`
                            : `Giảm ${Number(c.discountValue).toLocaleString('vi-VN')}đ`}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                        <span>
                          Đã dùng: <strong>{c.usedCount || 0}</strong>
                          {c.usageLimit ? ` / ${c.usageLimit}` : ' (Không giới hạn)'}
                        </span>
                        {c.validUntil && (
                          <span>
                            • HSD: {new Date(c.validUntil).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(c.id)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title={c.isActive ? 'Đang bật (Nhấn để tắt)' : 'Đang tắt (Nhấn để bật)'}
                      >
                        {c.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Xóa mã giảm giá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
