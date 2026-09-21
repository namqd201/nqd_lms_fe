'use client';

import React, { useState, useEffect } from 'react';
import { membershipService } from '@/services/membership.service';
import { billingService } from '@/services/billing.service';
import { MembershipPlanResponse, SubscriptionResponse } from '@/types/membership';
import { useAuth } from '@/context/AuthContext';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  Bot,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const FEATURE_MAP: Record<string, string> = {
  PREMIUM_EXAMS: 'Đề thi thử & Thi thử THPT Quốc gia',
  ADVANCED_ANALYTICS: 'Phân tích năng lực & Báo cáo tiến bộ học tập chi tiết',
  AI_TUTOR: 'Trợ lý AI Tutor hướng dẫn phương pháp 24/7',
  VIDEO_HIGH_QUALITY: 'Xem video bài giảng Full HD sắc nét',
  PDF_DOWNLOAD: 'Tải tài liệu, giáo trình & lời giải PDF',
  PREMIUM_COURSES: 'Truy cập toàn bộ khóa học Premium',
  COURSE_CREATION: 'Tạo và xuất bản khóa học trực tuyến',
  AI_GRADING: 'Chấm điểm tự động & gợi ý đáp án bằng AI',
  UNLIMITED_STORAGE: 'Lưu trữ tài liệu và đề thi không giới hạn',
  STUDENT_MANAGEMENT: 'Hệ thống quản lý và theo dõi học sinh',
  PRIORITY_SUPPORT: 'Hỗ trợ kỹ thuật & giải đáp ưu tiên 24/7',
  DISCOUNT_ON_PURCHASES: 'Giảm 20% khi mua khóa học, chương & bài học lẻ',
  ULTRA_UNLIMITED_COURSES: 'Học FREE toàn bộ khóa học trên sàn (Coursera Plus style)',
  ULTRA_COURSE_ENROLLMENT: 'Chính sách công bằng: tối đa 10 khóa/ngày & 100 khóa/tháng',
};

function formatFeatureName(feat: string): string {
  if (FEATURE_MAP[feat]) return FEATURE_MAP[feat];
  if (feat.includes(' ')) return feat;
  return feat.replace(/_/g, ' ');
}

function formatLimit(val: number | undefined | null, unit: string): string {
  if (val === undefined || val === null) return '';
  if (val < 0) return 'Không giới hạn';
  return `${val} ${unit}`;
}

export default function PricingPage() {
  const { user, isAuthenticated, refreshUser, subscription: authSub, isUltra, isPro, isTeacherPro } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([]);
  const [currentSub, setCurrentSub] = useState<SubscriptionResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isCreatingOrder, setIsCreatingOrder] = useState<string | null>(null);

  const effectiveSub = currentSub || authSub;

  const fetchPlansAndSub = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [fetchedPlans, fetchedSub] = await Promise.all([
        membershipService.getPlans(),
        isAuthenticated ? membershipService.getCurrentSubscription().catch(() => null) : Promise.resolve(null),
      ]);
      setPlans(fetchedPlans);
      if (fetchedSub) {
        setCurrentSub(fetchedSub);
      }
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách gói hội viên'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndSub();
  }, [isAuthenticated]);

  const handleSubscribe = async (plan: MembershipPlanResponse) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      setIsCreatingOrder(plan.id);
      setErrorMsg(null);
      const order = await billingService.createMembershipOrder(plan.id);
      window.location.href = `/payment/${encodeURIComponent(order.orderCode)}`;
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể khởi tạo đơn hàng đăng ký'));
    } finally {
      setIsCreatingOrder(null);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (p.userType !== activeTab) return false;
    // Always include Ultra in student tab if present, even when yearly is toggled
    if (p.planCode?.toUpperCase().includes('ULTRA')) return true;
    if (isYearly) {
      return p.billingCycle === 'YEARLY' || p.price === 0;
    }
    return p.billingCycle === 'MONTHLY' || p.price === 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-800">
          {/* Header Banner */}
          <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Nâng cấp trải nghiệm học tập & giảng dạy (Coursera Model)
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Chọn gói Hội viên phù hợp với bạn
            </h1>
            <p className="text-sm text-slate-600">
              Mở khóa đặc quyền Coursera-style: Gói PRO nhận giảm giá 20%, gói ULTRA mở khóa miễn phí toàn bộ khóa học trên hệ thống.
            </p>

            {/* User Type Tab Toggle (Học sinh vs Giảng viên) */}
            <div className="flex items-center justify-center pt-2">
              <div className="p-1 bg-slate-200/80 rounded-2xl flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => setActiveTab('STUDENT')}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'STUDENT'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎓 Dành cho Học sinh (PRO & ULTRA)
                </button>
                <button
                  onClick={() => setActiveTab('TEACHER')}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'TEACHER'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👨‍🏫 Dành cho Giảng viên (TEACHER PRO)
                </button>
              </div>
            </div>

            {/* Monthly vs Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className={`text-xs font-bold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                Thanh toán Hàng tháng
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isYearly ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${isYearly ? 'text-blue-600' : 'text-slate-500'} flex items-center gap-1.5`}>
                Gói 1 Năm
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                  Tiết kiệm 33%
                </span>
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold max-w-2xl mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pricing Cards */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Đang tải bảng giá dịch vụ...</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-6 items-stretch ${filteredPlans.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'}`}>
              {filteredPlans.map((plan) => {
                const activePlanId = effectiveSub?.planId || effectiveSub?.plan?.id;
                const activePlanCode = (effectiveSub?.planCode || effectiveSub?.plan?.planCode || (effectiveSub as any)?.plan?.code || '').toUpperCase();
                const targetPlanCode = (plan.planCode || plan.code || '').toUpperCase();

                const isUltraCard = targetPlanCode.includes('ULTRA');
                const isProCard = targetPlanCode.includes('PRO') || (plan.price > 0 && !isUltraCard);

                const isCurrent = Boolean(
                  effectiveSub &&
                  (effectiveSub.status === 'ACTIVE' || effectiveSub.isCurrentlyActive) &&
                  (
                    (activePlanId && activePlanId === plan.id) ||
                    (activePlanCode && targetPlanCode && activePlanCode === targetPlanCode) ||
                    (
                      isUltraCard && isUltra
                    ) ||
                    (
                      isProCard && !isUltra &&
                      ((plan.userType === 'STUDENT' && isPro) || (plan.userType === 'TEACHER' && isTeacherPro)) &&
                      ((effectiveSub.plan?.billingCycle && effectiveSub.plan.billingCycle === plan.billingCycle) ||
                       (!effectiveSub.plan?.billingCycle && ((isYearly && plan.billingCycle === 'YEARLY') || (!isYearly && plan.billingCycle === 'MONTHLY'))))
                    )
                  )
                );

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                      isUltraCard
                        ? 'bg-gradient-to-b from-purple-50/50 via-white to-white border-2 border-purple-600 shadow-2xl shadow-purple-500/15 scale-105 z-20 ring-2 ring-purple-400/30'
                        : isProCard
                        ? 'bg-white border-2 border-blue-600 shadow-xl shadow-blue-500/10 scale-102 z-10'
                        : 'bg-white/80 border border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isUltraCard ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        Đặc quyền cao nhất (Coursera Plus)
                      </div>
                    ) : isProCard ? (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Phổ biến nhất
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                          {isUltraCard && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold">
                              ULTRA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                          {plan.description || (isUltraCard ? 'Truy cập không giới hạn mọi khóa học và AI Tutor' : isProCard ? 'Ưu đãi giảm 20% khi mua lẻ khóa học & giáo trình' : 'Trải nghiệm học tập nền tảng')}
                        </p>
                      </div>

                      {/* Price Display */}
                      <div className="py-2 border-y border-slate-100">
                        {plan.price === 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">Miễn phí</span>
                            <span className="text-xs text-slate-500 font-semibold">vĩnh viễn</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-black ${isUltraCard ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-blue-600'}`}>
                                {plan.price.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                VND / {plan.billingCycle === 'YEARLY' ? 'năm' : 'tháng'}
                              </span>
                            </div>
                            {plan.billingCycle === 'YEARLY' && (
                              <span className="text-[11px] text-emerald-600 font-bold mt-0.5">
                                ~ {Math.round(plan.price / 12).toLocaleString('vi-VN')} VND / tháng
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Features list */}
                      <div className="space-y-2.5 pt-2">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                          Quyền lợi bao gồm:
                        </span>
                        <ul className="space-y-2 text-xs text-slate-600">
                          {plan.features?.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isUltraCard ? 'text-purple-600' : 'text-emerald-600'}`} />
                              <span>{formatFeatureName(feat)}</span>
                            </li>
                          ))}

                          {plan.dailyCourseEnrollmentLimit !== undefined && plan.dailyCourseEnrollmentLimit !== null && plan.dailyCourseEnrollmentLimit > 0 && (
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                              <span>Vào học miễn phí mọi khóa: <strong className="text-purple-700 font-bold">tối đa {plan.dailyCourseEnrollmentLimit} khóa/ngày, {plan.monthlyCourseEnrollmentLimit} khóa/tháng</strong></span>
                            </li>
                          )}

                          {plan.examLimitPerWeek !== undefined && plan.examLimitPerWeek !== null && (
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Thi thử: <strong className={plan.examLimitPerWeek < 0 ? 'text-blue-600 font-bold' : 'text-slate-800 font-bold'}>{formatLimit(plan.examLimitPerWeek, 'đề / tuần')}</strong></span>
                            </li>
                          )}

                          {plan.aiQuestionLimitPerDay !== undefined && plan.aiQuestionLimitPerDay !== null && (
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Hỏi đáp AI Tutor: <strong className={plan.aiQuestionLimitPerDay < 0 ? 'text-blue-600 font-bold' : 'text-slate-800 font-bold'}>{formatLimit(plan.aiQuestionLimitPerDay, 'câu / ngày')}</strong></span>
                            </li>
                          )}

                          {plan.maxClassesLimit !== undefined && plan.maxClassesLimit !== null && plan.userType === 'TEACHER' && (
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Tạo lớp học: <strong className={plan.maxClassesLimit < 0 ? 'text-blue-600 font-bold' : 'text-slate-800 font-bold'}>{formatLimit(plan.maxClassesLimit, 'lớp')}</strong></span>
                            </li>
                          )}

                          {plan.maxQuestionsLimit !== undefined && plan.maxQuestionsLimit !== null && plan.userType === 'TEACHER' && (
                            <li className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Ngân hàng câu hỏi: <strong className={plan.maxQuestionsLimit < 0 ? 'text-blue-600 font-bold' : 'text-slate-800 font-bold'}>{formatLimit(plan.maxQuestionsLimit, 'câu hỏi')}</strong></span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      {isAdmin ? (
                        <div className="w-full py-3 rounded-2xl bg-purple-50 text-purple-700 font-extrabold text-xs text-center border border-purple-200 flex items-center justify-center gap-1.5 shadow-xs">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Tài khoản Quản trị viên (Toàn quyền)</span>
                        </div>
                      ) : isCurrent ? (
                        <div className={`w-full py-3 rounded-2xl font-extrabold text-xs text-center border flex items-center justify-center gap-1.5 shadow-xs ${
                          isUltraCard
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <Check className="w-4 h-4" />
                          <span>Gói hiện tại của bạn (Đang kích hoạt)</span>
                        </div>
                      ) : plan.price === 0 ? (
                        <div className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-extrabold text-xs text-center border border-slate-200">
                          {isUltra || isPro || isTeacherPro ? 'Đã nâng cấp lên gói cao cấp' : 'Gói mặc định'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={isCreatingOrder === plan.id}
                          className={`w-full py-3 rounded-2xl text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 ${
                            isUltraCard
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/20'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          }`}
                        >
                          {isCreatingOrder === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang khởi tạo...</span>
                            </>
                          ) : (
                            <>
                              <span>{isUltraCard ? 'Đăng ký Ultra ngay' : 'Đăng ký ngay'}</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guarantee Section */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Chính sách Hoàn tiền & Bảo đảm</h4>
                <p className="text-xs text-slate-500">
                  Hỗ trợ hoàn tiền 100% trong vòng 7 ngày nếu bạn không hài lòng về chất lượng dịch vụ.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-700">Hỗ trợ 24/7 qua VietQR / PayOS</span>
            </div>
          </div>

      </div>
    </div>
  );
}