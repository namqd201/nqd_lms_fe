'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/services/course.service';
import { marketplaceService } from '@/services/marketplace.service';
import { billingService } from '@/services/billing.service';
import { StudentCourseResponse } from '@/types/course';
import { MarketplaceCourseResponse } from '@/types/marketplace';
import { OrderResponse } from '@/types/billing';
import { CheckoutModal } from '@/components/CheckoutModal';
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Lock,
  Globe,
  Clock,
  Settings,
  UserPlus,
  Search,
  Filter,
  X,
  RotateCcw,
  Star,
  ShoppingBag,
  Tag,
  Loader2,
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS, getGradeGroup } from '@/constants/gradeLevels';

export default function CoursesCatalogPage() {
  const { user, isAuthenticated, loginWithGoogle } = useAuth();
  const [courses, setCourses] = useState<StudentCourseResponse[]>([]);
  const [marketplaceData, setMarketplaceData] = useState<Record<string, MarketplaceCourseResponse>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('ALL');
  const [selectedPricing, setSelectedPricing] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  // Checkout Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutOrder, setCheckoutOrder] = useState<OrderResponse | null>(null);
  const [isBuyingCourseId, setIsBuyingCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [studentData, marketRes] = await Promise.all([
        courseService.getPublishedCourses().catch(() => null),
        marketplaceService.searchCourses({ page: 0, size: 100 }).catch(() => null),
      ]);

      if (marketRes && marketRes.content) {
        const map: Record<string, MarketplaceCourseResponse> = {};
        marketRes.content.forEach((mc) => {
          map[mc.id] = mc;
        });
        setMarketplaceData(map);
      }

      if (studentData && studentData.length > 0) {
        setCourses(studentData);
      } else if (marketRes && marketRes.content && marketRes.content.length > 0) {
        // Fallback to public marketplace courses if student API is unauthenticated
        const fallbackCourses: StudentCourseResponse[] = marketRes.content.map((mc) => ({
          id: mc.id,
          name: mc.name,
          code: mc.code,
          description: mc.description || '',
          thumbnailUrl: mc.thumbnailUrl || '',
          gradeLevel: mc.gradeLevel || '',
          subjectName: mc.subjectName,
          creatorName: mc.creatorName || 'Giảng viên',
          status: 'ACTIVE',
          isEnrolled: Boolean(mc.isPurchased),
        }));
        setCourses(fallbackCourses);
      } else if (!studentData && !marketRes) {
        setErrorMessage('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
      } else {
        setCourses([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách khóa học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const subjectList = useMemo(() => {
    const subs = new Set<string>();
    courses.forEach((c) => {
      if (c.subjectName) subs.add(c.subjectName);
    });
    return Array.from(subs);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const mItem = marketplaceData[course.id];
      const isPaid = mItem ? mItem.pricingType === 'PAID' : false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        course.name.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        (course.description && course.description.toLowerCase().includes(q)) ||
        (course.creatorName && course.creatorName.toLowerCase().includes(q)) ||
        (course.subjectName && course.subjectName.toLowerCase().includes(q));

      const matchesSubject =
        selectedSubject === 'ALL' || course.subjectName === selectedSubject;

      const matchesGrade =
        selectedGrade === 'ALL' ||
        course.gradeLevel === selectedGrade ||
        getGradeGroup(course.gradeLevel) === selectedGrade;

      const matchesPrivacy =
        selectedPrivacy === 'ALL' ||
        (selectedPrivacy === 'PRIVATE' && course.isPrivate) ||
        (selectedPrivacy === 'PUBLIC' && !course.isPrivate);

      const matchesPricing =
        selectedPricing === 'ALL' ||
        (selectedPricing === 'FREE' && !isPaid) ||
        (selectedPricing === 'PAID' && isPaid);

      return matchesSearch && matchesSubject && matchesGrade && matchesPrivacy && matchesPricing;
    });
  }, [courses, marketplaceData, searchQuery, selectedSubject, selectedGrade, selectedPrivacy, selectedPricing]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubject !== 'ALL' ||
    selectedGrade !== 'ALL' ||
    selectedPrivacy !== 'ALL' ||
    selectedPricing !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedGrade('ALL');
    setSelectedPrivacy('ALL');
    setSelectedPricing('ALL');
  };

  const handleEnrollOrBuy = async (course: StudentCourseResponse) => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }

    const mItem = marketplaceData[course.id];
    const isPaid = mItem ? mItem.pricingType === 'PAID' : false;

    if (isPaid) {
      try {
        setIsBuyingCourseId(course.id);
        const order = await billingService.createCourseOrder(course.id);
        setCheckoutOrder(order);
        setCheckoutModalOpen(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể khởi tạo đơn mua khóa học';
        setErrorMessage(msg);
      } finally {
        setIsBuyingCourseId(null);
      }
      return;
    }

    setEnrollingId(course.id);
    try {
      await courseService.enrollCourse(course.id);
      if (course.isPrivate) {
        setSuccessMessage('Đã gửi yêu cầu xin vào lớp học! Vui lòng chờ giáo viên duyệt.');
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id
              ? { ...c, isEnrolled: false, enrolled: false, enrollmentStatus: 'PENDING' }
              : c
          )
        );
      } else {
        setSuccessMessage('Đăng ký khóa học miễn phí thành công!');
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id
              ? { ...c, isEnrolled: true, enrolled: true, enrollmentStatus: 'ENROLLED' }
              : c
          )
        );
      }
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setErrorMessage(msg);
    } finally {
      setEnrollingId(null);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || val === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold rounded-full border border-[#83C75D]/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NQD-LMS Marketplace</span>
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full inline-flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Khóa học chất lượng cao</span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Khám phá Khóa học</h1>
            <p className="text-sm text-slate-500 mt-1">
              Khám phá hàng trăm khóa học Toán, Tin học, Ngoại ngữ từ các giáo viên xuất sắc nhất.
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto flex items-center gap-2">
            <span>Hiển thị:</span>
            <strong className="text-slate-900 font-bold text-sm">
              {filteredCourses.length} / {courses.length}
            </strong>
            <span>khóa học</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khóa học, mã, giáo viên..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-700 outline-none transition-all font-medium"
              >
                <option value="ALL">📚 Tất cả Môn học</option>
                {subjectList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-700 outline-none transition-all font-medium"
              >
                <option value="ALL">🎓 Tất cả Cấp độ / Khối</option>
                {GRADE_LEVEL_GROUPS.map((group) => (
                  <optgroup key={group.level} label={group.label}>
                    {group.grades.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedPricing}
                onChange={(e) => setSelectedPricing(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-700 outline-none transition-all font-medium"
              >
                <option value="ALL">🏷️ Mọi loại giá</option>
                <option value="FREE">🎁 Miễn phí</option>
                <option value="PAID">💎 Trả phí (Marketplace)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Môn phổ biến:</span>
              </span>
              <button
                onClick={() => setSelectedSubject('ALL')}
                className={'px-3 py-1 rounded-xl text-xs font-bold transition-all ' + (selectedSubject === 'ALL' ? 'bg-[#83C75D] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                Tất cả
              </button>
              {subjectList.slice(0, 6).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={'px-3 py-1 rounded-xl text-xs font-bold transition-all ' + (selectedSubject === sub ? 'bg-[#83C75D] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                >
                  {sub}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-sm shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-sm shadow-sm">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách khóa học...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-16 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Không tìm thấy khóa học nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không có khóa học nào khớp với từ khóa tìm kiếm hoặc các tiêu chí lọc hiện tại.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isOwner = Boolean(course.isOwner || (course as any).owner || (user?.id && course.creatorId === user.id));
              const isPending = course.enrollmentStatus === 'PENDING';
              const isEnrolled =
                !isOwner &&
                !isPending &&
                (course.enrollmentStatus === 'ENROLLED' ||
                  course.enrollmentStatus === 'COMPLETED' ||
                  Boolean(course.isEnrolled) ||
                  Boolean((course as any).enrolled));

              const mItem = marketplaceData[course.id];
              const isPaid = mItem ? mItem.pricingType === 'PAID' : false;
              const price = mItem?.salePrice || mItem?.price || 0;
              const originalPrice = mItem?.price;
              const hasDiscount = isPaid && mItem?.salePrice && mItem?.price && mItem.salePrice < mItem.price;
              const rating = mItem?.averageRating || 5.0;
              const reviewCount = mItem?.reviewCount || 0;

              return (
                <div
                  key={course.id}
                  className={'bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ' + (isOwner ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200 hover:border-[#83C75D]')}
                >
                  <div className="relative h-48 w-full bg-gradient-to-br from-emerald-100/60 via-[#83C75D]/20 to-teal-50 overflow-hidden flex items-center justify-center">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#4e8231]">
                        <GraduationCap className="w-12 h-12 stroke-[1.5]" />
                        <span className="text-xs font-bold font-mono uppercase tracking-widest opacity-75">
                          {course.code}
                        </span>
                      </div>
                    )}

                    {course.subjectName && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 shadow-xs border border-white/80">
                        {course.subjectName}
                      </div>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {isPaid ? (
                        <div className="bg-amber-500/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-white shadow-xs flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{formatCurrency(price)}</span>
                        </div>
                      ) : (
                        <div className="bg-emerald-600/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-white shadow-xs">
                          Miễn phí
                        </div>
                      )}
                    </div>

                    {isOwner && (
                      <div className="absolute bottom-3 left-3 bg-purple-600/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-200" />
                        <span>Khóa học của bạn</span>
                      </div>
                    )}

                    {reviewCount > 0 && (
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rating.toFixed(1)} ({reviewCount})</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 mb-1">
                        <span>MÃ: {course.code}</span>
                        {course.creatorName && (
                          <span className="text-slate-500 font-sans font-medium text-[11px]">
                            GV: {isOwner ? 'Bạn' : course.creatorName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#4e8231] transition-colors line-clamp-2">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {course.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
                      </p>

                      {isPaid && (
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-amber-600 font-mono">
                            {formatCurrency(price)}
                          </span>
                          {hasDiscount && originalPrice && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        href={'/courses/' + course.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#4e8231] transition-colors"
                      >
                        <span>Chi tiết & Giáo trình</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {isOwner ? (
                        <Link
                          href={'/teacher/courses/' + course.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Quản trị</span>
                        </Link>
                      ) : isPending ? (
                        <div className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Đang chờ duyệt</span>
                        </div>
                      ) : isEnrolled ? (
                        <Link
                          href={'/courses/' + course.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Vào học ngay</span>
                        </Link>
                      ) : isPaid ? (
                        <button
                          onClick={() => handleEnrollOrBuy(course)}
                          disabled={isBuyingCourseId === course.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md bg-amber-500 hover:bg-amber-600 text-white transition-all transform active:scale-95 shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                        >
                          {isBuyingCourseId === course.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang tạo đơn...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Mua ngay</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnrollOrBuy(course)}
                          disabled={enrollingId === course.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 text-white bg-[#83C75D] hover:bg-[#72b44e] shadow-[#83C75D]/20 cursor-pointer"
                        >
                          {enrollingId === course.id ? (
                            <span>Đang xử lý...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đăng ký học</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setCheckoutOrder(null);
          }}
          onPaymentSuccess={() => {
            setCheckoutModalOpen(false);
            setCheckoutOrder(null);
            loadCourses();
          }}
          order={checkoutOrder}
        />
      </div>
    </div>
  );
}
