'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { courseService } from '@/services/course.service';
import { marketplaceService } from '@/services/marketplace.service';
import { billingService } from '@/services/billing.service';
import { resourceService } from '@/services/resource.service';
import { examService } from '@/services/exam.service';
import { StudentCourseDetailResponse } from '@/types/course';
import { MarketplaceCourseDetailResponse, CourseReviewResponse } from '@/types/marketplace';
import { OrderResponse } from '@/types/billing';
import { StudentCourseProgressResponse } from '@/types/resource';
import {
  StudentAssignedExamResponse,
  StudentExamAttemptReviewResponse,
  StudentAttemptResultResponse,
} from '@/types/exam';
import StudentAttemptReviewModal from '@/components/StudentAttemptReviewModal';
import { CourseReviewModal } from '@/components/CourseReviewModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { CourseDiscussionTab } from '@/components/discussion/CourseDiscussionTab';
import { CourseAnnouncementsTab } from '@/components/discussion/CourseAnnouncementsTab';
import { certificateService } from '@/services/certificate.service';
import { CertificateEligibilityResponse } from '@/types/certificate';
import {
  BookOpen,
  Clock,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  FileText,
  Award,
  ListChecks,
  Star,
  ShoppingBag,
  Eye,
  ShieldCheck,
  MessageSquare,
  Share2,
  Check,
  Lock,
  Tag,
  Loader2,
  Megaphone,
  Zap,
} from 'lucide-react';

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isUltra, isPro, loginWithGoogle } = useAuth();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<StudentCourseDetailResponse | null>(null);
  const [marketplaceDetail, setMarketplaceDetail] = useState<MarketplaceCourseDetailResponse | null>(null);
  const [courseProgress, setCourseProgress] = useState<StudentCourseProgressResponse | null>(null);
  const [assignedExams, setAssignedExams] = useState<StudentAssignedExamResponse[]>([]);
  const [reviews, setReviews] = useState<CourseReviewResponse[]>([]);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'ALL'>('ALL');

  const ratingStats = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (r.rating && r.rating >= 1 && r.rating <= 5) {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
      }
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === 'ALL') return reviews;
    return reviews.filter((r) => r.rating === selectedStarFilter);
  }, [reviews, selectedStarFilter]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [checkoutOrder, setCheckoutOrder] = useState<OrderResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);

  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);

  const [reviewModalData, setReviewModalData] = useState<StudentExamAttemptReviewResponse | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);
  const [examAttemptsList, setExamAttemptsList] = useState<StudentAttemptResultResponse[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | undefined>(undefined);
  const [eligibility, setEligibility] = useState<CertificateEligibilityResponse | null>(null);
  const [isClaimingCert, setIsClaimingCert] = useState<boolean>(false);

  // Tab state
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'syllabus' | 'discussions' | 'announcements'>(
    tabParam === 'discussions' || tabParam === 'announcements' ? tabParam : 'syllabus'
  );

  useEffect(() => {
    if (tabParam === 'discussions' || tabParam === 'announcements' || tabParam === 'syllabus') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [structData, marketData, prog, exs, revs, elig] = await Promise.all([
        courseService.getStudentCourseStructure(courseId).catch(() => null),
        marketplaceService.getCourseDetail(courseId).catch(() => null),
        resourceService.getStudentCourseProgress(courseId).catch(() => null),
        examService.getMyAssignedExams().catch(() => []),
        marketplaceService.getReviews(courseId, 0, 20).catch(() => ({ content: [] })),
        certificateService.checkEligibility(courseId).catch(() => null),
      ]);

      if (!structData && !marketData) {
        throw new Error('Khóa học không tồn tại hoặc chưa được xuất bản.');
      }

      setCourse(structData);
      setMarketplaceDetail(marketData);
      setCourseProgress(prog);
      setReviews(revs?.content || []);
      setEligibility(elig);

      if (exs && exs.length > 0) {
        const filteredExams = exs.filter((e: StudentAssignedExamResponse) => e.courseId === courseId);
        setAssignedExams(filteredExams);
      }

      const initialOpen: Record<string, boolean> = {};
      const chs = (structData?.chapters || marketData?.chapters || []) as any[];
      chs.forEach((ch: any, idx: number) => {
        initialOpen[ch.id] = idx === 0;
      });
      setOpenChapters(initialOpen);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin khóa học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimCertificate = async () => {
    setIsClaimingCert(true);
    try {
      await certificateService.claimCertificate(courseId);
      alert('Chúc mừng! Bạn đã hoàn thành tất cả điều kiện và nhận chứng chỉ thành công.');
      const updated = await certificateService.checkEligibility(courseId).catch(() => null);
      setEligibility(updated);
    } catch (err: any) {
      alert(err.message || 'Không thể nhận chứng chỉ.');
    } finally {
      setIsClaimingCert(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleStartLearning = async () => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }

    // If user is Ultra and course is paid & not enrolled, auto-enroll through Ultra fair-use entitlement
    const userIsUltra = Boolean(isUltra || marketplaceDetail?.isUltraMember);
    if (isPaid && !isEnrolled && userIsUltra) {
      setIsCreatingOrder(true);
      try {
        await courseService.enrollCourse(courseId);
        await loadCourseData();
      } catch (err: any) {
        alert(err.message || 'Không thể kích hoạt khóa học qua gói Ultra');
        setIsCreatingOrder(false);
        return;
      } finally {
        setIsCreatingOrder(false);
      }
    }

    const chapters = course?.chapters || marketplaceDetail?.chapters || [];
    for (const ch of chapters) {
      if (ch.lessons && ch.lessons.length > 0) {
        router.push('/courses/' + courseId + '/lessons/' + ch.lessons[0].id);
        return;
      }
    }
  };

  const handleBuyCourse = async () => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    setIsCreatingOrder(true);
    try {
      const order = await billingService.createCourseOrder(courseId);
      setCheckoutOrder(order);
      setCheckoutModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Không thể tạo đơn hàng mua khóa học.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleBuyChapter = async (chapterId: string) => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    setIsCreatingOrder(true);
    try {
      const order = await billingService.createChapterOrder(chapterId);
      setCheckoutOrder(order);
      setCheckoutModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Không thể tạo đơn hàng mua chương học.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleBuyLesson = async (lessonId: string) => {
    if (!isAuthenticated) {
      loginWithGoogle();
      return;
    }
    setIsCreatingOrder(true);
    try {
      const order = await billingService.createLessonOrder(lessonId);
      setCheckoutOrder(order);
      setCheckoutModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Không thể tạo đơn hàng mua bài học.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleOpenExamReview = async (examId: string) => {
    setIsLoadingReview(true);
    try {
      const attempts = await examService.getMyExamAttempts(examId);
      setExamAttemptsList(attempts);
      const targetAttempt = attempts[0];
      if (targetAttempt) {
        setSelectedAttemptId(targetAttempt.attemptId);
        const review = await examService.getStudentAttemptReview(targetAttempt.attemptId);
        setReviewModalData(review);
        setReviewModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tải lịch sử làm bài kiểm tra');
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleSelectSpecificAttempt = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsLoadingReview(true);
    try {
      const review = await examService.getStudentAttemptReview(attemptId);
      setReviewModalData(review);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết bài làm');
    } finally {
      setIsLoadingReview(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || val === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !course && !marketplaceDetail) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            ✕
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Không thể truy cập khóa học</h3>
          <p className="text-xs text-slate-600 mb-6">{errorMessage}</p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  const title = marketplaceDetail?.name || course?.name || 'Khóa học';
  const code = marketplaceDetail?.code || course?.code || '';
  const description = marketplaceDetail?.description || course?.description || '';
  const subjectName = marketplaceDetail?.subjectName || course?.subjectName;
  const gradeLevel = marketplaceDetail?.gradeLevel || course?.gradeLevel;
  const creatorName = marketplaceDetail?.creatorName || course?.creatorName;
  const chapters = (course?.chapters || marketplaceDetail?.chapters || []) as any[];
  const totalLessons = chapters.reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0);

  const isPaid = marketplaceDetail ? marketplaceDetail.pricingType === 'PAID' : false;
  const price = marketplaceDetail?.salePrice || marketplaceDetail?.price || 0;
  const originalPrice = marketplaceDetail?.price;
  const hasDiscount = !!(isPaid && marketplaceDetail?.salePrice && marketplaceDetail?.price && marketplaceDetail.salePrice < marketplaceDetail.price);

  const isEnrolled = !isPaid || !!courseProgress || (marketplaceDetail && marketplaceDetail.hasAccess);
  const isUltraMember = Boolean(isUltra || marketplaceDetail?.isUltraMember);
  const isProMember = Boolean(isPro && !isUltraMember);
  const proDiscountPrice = marketplaceDetail?.proDiscountPrice ?? (isPaid && price > 0 ? Math.round(price * 0.8) : undefined);
  const isOwner = !!(user?.id && (marketplaceDetail?.creatorId === user.id || course?.creatorId === user.id));
  const isTeacherOrAdmin = isOwner || !!(user?.roles?.some(r => r === 'TEACHER' || r === 'ADMIN' || r === 'ROLE_TEACHER' || r === 'ROLE_ADMIN'));
  const isCourseCompleted = (courseProgress?.overallProgressPercent ?? 0) >= 100 || isOwner;
  const myReview = reviews.find((r) => user?.id && r.userId === user.id);
  const rating = marketplaceDetail?.averageRating || 5.0;
  const reviewCount = marketplaceDetail?.reviewCount || reviews.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#4e8231] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khóa học</span>
        </Link>

        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="space-y-4 max-w-2xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                  {code}
                </span>
                {subjectName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                    {subjectName}
                  </span>
                )}
                {gradeLevel && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                    {gradeLevel}
                  </span>
                )}
                {isPaid ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Thương mại (Paid)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Miễn phí (Free)
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
                {creatorName && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#83C75D]/20 text-[#4e8231] flex items-center justify-center font-bold text-xs">
                      {creatorName.charAt(0)}
                    </div>
                    <span>Giảng viên: <strong className="text-slate-800">{creatorName}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{chapters.length} chương • {totalLessons} bài học</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-slate-800">{rating.toFixed(1)}</span>
                  <span className="text-slate-400">({reviewCount} đánh giá)</span>
                </div>
              </div>
            </div>

            {/* Price & Action Card */}
            <div className={`w-full lg:w-80 rounded-2xl p-5 space-y-4 shrink-0 border ${
              isPaid && !isEnrolled && isUltraMember
                ? 'bg-gradient-to-b from-purple-50 via-white to-purple-50/30 border-purple-300 shadow-md shadow-purple-500/10'
                : 'bg-slate-50 border-slate-200/80'
            }`}>
              {isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Tiến độ khóa học</span>
                    <span className="text-xs font-bold text-[#4e8231]">
                      {courseProgress?.overallProgressPercent ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#83C75D] h-2 rounded-full transition-all duration-500"
                      style={{ width: (courseProgress?.overallProgressPercent ?? 0) + '%' }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Đã hoàn thành {courseProgress?.completedLessons || 0}/{totalLessons} bài</span>
                    {isCourseCompleted && (
                      <span className="text-[#4e8231] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hoàn thành</span>
                      </span>
                    )}
                  </div>
                </div>
              ) : isPaid ? (
                <div>
                  {isUltraMember ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                        Đặc quyền ULTRA
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-purple-700">
                          Miễn phí
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-600 font-medium">
                        Bạn là Hội viên ULTRA: Học thả ga không mất phí khóa học này!
                      </p>
                    </div>
                  ) : isProMember && proDiscountPrice ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 font-bold">Học phí (Ưu đãi PRO -20%)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Giảm 20%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600">
                          {formatCurrency(proDiscountPrice)}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(price)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Đã áp dụng quyền lợi hội viên PRO</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block mb-1">Học phí khóa học</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          {formatCurrency(price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(originalPrice)}
                          </span>
                        )}
                      </div>
                      {proDiscountPrice && (
                        <div className="mt-2 p-2 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] text-blue-700 flex items-center justify-between">
                          <span>Chỉ {formatCurrency(proDiscountPrice)} nếu là Pro</span>
                          <Link href="/pricing" className="font-bold underline">Nâng cấp</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Khóa học</span>
                  <span className="text-2xl font-black text-emerald-600">Miễn phí 100%</span>
                </div>
              )}

              {isEnrolled ? (
                <button
                  onClick={handleStartLearning}
                  className="w-full py-3.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md shadow-[#83C75D]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{courseProgress ? 'Tiếp tục bài học' : 'Bắt đầu học'}</span>
                </button>
              ) : isPaid ? (
                isUltraMember ? (
                  <button
                    onClick={handleStartLearning}
                    disabled={isCreatingOrder}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kích hoạt gói Ultra...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                        <span>Vào học ngay (Gói Ultra Miễn phí)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleBuyCourse}
                    disabled={isCreatingOrder}
                    className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      isProMember
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                    }`}
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo đơn hàng...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isProMember ? `Mua khóa học (${formatCurrency(proDiscountPrice)})` : 'Mua khóa học ngay'}</span>
                      </>
                    )}
                  </button>
                )
              ) : (
                <button
                  onClick={handleStartLearning}
                  className="w-full py-3.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md shadow-[#83C75D]/25 transition-all transform active:scale-95 cursor-pointer"
                >
                  Đăng ký học miễn phí
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Progress & Eligibility Card */}
        {isEnrolled && eligibility && (
          <div className="bg-gradient-to-br from-white to-amber-50/40 border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">Chứng chỉ hoàn thành khóa học</h3>
                    {eligibility.alreadyIssued ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã cấp chứng chỉ
                      </span>
                    ) : eligibility.eligible ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#83C75D]/20 text-[#4e8231] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Đủ điều kiện nhận
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        Đang hoàn thành 4 tiêu chí
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {eligibility.alreadyIssued
                      ? `Mã chứng chỉ: ${eligibility.certificateCode || 'Đã lưu trong hồ sơ cá nhân'}`
                      : 'Để nhận chứng chỉ, học viên cần hoàn thành cả 4 điều kiện dưới đây.'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {eligibility.alreadyIssued ? (
                  <Link
                    href="/profile/certificates"
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Xem chứng chỉ của tôi</span>
                  </Link>
                ) : eligibility.eligible ? (
                  <button
                    onClick={handleClaimCertificate}
                    disabled={isClaimingCert}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-md shadow-amber-500/25 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isClaimingCert ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang cấp chứng chỉ...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Nhận chứng chỉ ngay</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chưa đủ 4 điều kiện</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4 Tiêu chí hoàn thành */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-amber-100">
              {/* 1. Bài học */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                eligibility.lessonsCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    1. Bài học lý thuyết
                  </span>
                  {eligibility.lessonsCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      {eligibility.completedLessons}/{eligibility.totalLessons}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {eligibility.lessonsCompleted
                    ? `Đã hoàn thành ${eligibility.completedLessons}/${eligibility.totalLessons} bài học`
                    : `Còn thiếu ${eligibility.totalLessons - eligibility.completedLessons} bài học`}
                </p>
              </div>

              {/* 2. Video bài giảng */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                eligibility.videosCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
                    2. Video bài giảng
                  </span>
                  {eligibility.videosCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      {eligibility.watchedVideos}/{eligibility.totalVideos}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {eligibility.totalVideos === 0
                    ? 'Khóa học không có video'
                    : eligibility.videosCompleted
                      ? `Đã xem toàn bộ ${eligibility.watchedVideos}/${eligibility.totalVideos} video`
                      : `Còn thiếu ${eligibility.totalVideos - eligibility.watchedVideos} video (xem hết không tua)`}
                </p>
              </div>

              {/* 3. Bài tập luyện tập */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                eligibility.exercisesCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-amber-600" />
                    3. Bài tập luyện tập
                  </span>
                  {eligibility.exercisesCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      {eligibility.passedExercises}/{eligibility.totalExercises}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {eligibility.totalExercises === 0
                    ? 'Khóa học không có bài tập'
                    : eligibility.exercisesCompleted
                      ? `Đã đạt ${eligibility.passedExercises}/${eligibility.totalExercises} bài tập`
                      : `Còn thiếu ${eligibility.totalExercises - eligibility.passedExercises} bài tập chưa đạt`}
                </p>
              </div>

              {/* 4. Bài kiểm tra / Thi */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                eligibility.examsCompleted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
                    4. Bài kiểm tra / Thi
                  </span>
                  {eligibility.examsCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">
                      {eligibility.passedExams}/{eligibility.totalExams}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {eligibility.totalExams === 0
                    ? 'Khóa học không có bài thi'
                    : eligibility.examsCompleted
                      ? `Đã vượt qua ${eligibility.passedExams}/${eligibility.totalExams} bài thi`
                      : `Còn thiếu ${eligibility.totalExams - eligibility.passedExams} bài thi chưa đạt`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
              activeTab === 'syllabus'
                ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>Giáo trình & Đánh giá</span>
          </button>

          <button
            onClick={() => setActiveTab('discussions')}
            className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
              activeTab === 'discussions'
                ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Thảo luận & Hỏi đáp</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
              activeTab === 'announcements'
                ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            <Megaphone className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
        </div>

        {/* Tab 1: Syllabus, Exams & Reviews */}
        {activeTab === 'syllabus' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Giáo trình chi tiết</h2>
                <span className="text-xs font-semibold text-slate-500">
                  {chapters.length} chương • {totalLessons} bài học
                </span>
              </div>

              {chapters.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
                  Khóa học này hiện chưa cập nhật chương mục nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {chapters.map((chapter: any) => {
                    const isOpen = !!openChapters[chapter.id];

                    return (
                      <div
                        key={chapter.id}
                        className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="w-full p-4 sm:px-6 flex items-center justify-between gap-4 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900">
                                Chương {chapter.displayOrder}: {chapter.title}
                              </h3>
                              {chapter.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isEnrolled && !chapter.isPurchased && chapter.isSellable && chapter.price && chapter.price > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyChapter(chapter.id);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                                <span>Mua chương: {formatCurrency(isProMember ? Math.round(chapter.price * 0.8) : chapter.price)}</span>
                              </button>
                            )}
                            <span className="text-xs font-semibold text-slate-400 shrink-0 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                              {chapter.lessons ? chapter.lessons.length : 0} bài
                            </span>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="divide-y divide-slate-100 border-t border-slate-100">
                            {!chapter.lessons || chapter.lessons.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                Chương này chưa có bài học nào.
                              </div>
                            ) : (
                              chapter.lessons.map((lesson: any) => {
                                const isCompleted = !!lesson.isCompleted;
                                const isLocked = !!lesson.isLocked && !isCompleted;
                                const canAccess = isCompleted || (!isLocked && (!isPaid || isEnrolled || isOwner || lesson.isPreview));

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors group ${
                                      isLocked ? 'bg-slate-50/70 opacity-80' : 'hover:bg-[#83C75D]/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                        isCompleted
                                          ? 'bg-emerald-100 text-emerald-600'
                                          : isLocked
                                            ? 'bg-slate-200 text-slate-400'
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-[#83C75D]/20 group-hover:text-[#4e8231]'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-4 h-4" />
                                        ) : isLocked ? (
                                          <Lock className="w-4 h-4" />
                                        ) : (
                                          <PlayCircle className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-2">
                                          <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                                            isLocked ? 'text-slate-500' : 'text-slate-800 group-hover:text-[#4e8231]'
                                          }`}>
                                            {lesson.displayOrder}. {lesson.title}
                                          </p>
                                          {lesson.isPreview && !isEnrolled && isPaid && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                              <Eye className="w-3 h-3" />
                                              <span>Học thử</span>
                                            </span>
                                          )}
                                          {isCompleted && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-0.5">
                                              <CheckCircle2 className="w-3 h-3" />
                                              <span>Đã hoàn thành</span>
                                            </span>
                                          )}
                                        </div>
                                        {isLocked && lesson.lockReason ? (
                                          <p className="text-[11px] text-amber-600 truncate mt-0.5 flex items-center gap-1">
                                            <span>🔒 {lesson.lockReason}</span>
                                          </p>
                                        ) : lesson.summary ? (
                                          <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {lesson.summary}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      {lesson.estimatedMinutes && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                          <Clock className="w-3 h-3" />
                                          <span>{lesson.estimatedMinutes} phút</span>
                                        </span>
                                      )}

                                      {canAccess ? (
                                        <Link
                                          href={'/courses/' + courseId + '/lessons/' + lesson.id}
                                          className="px-3 py-1.5 rounded-xl bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold hover:bg-[#83C75D] hover:text-white transition-all inline-flex items-center gap-1"
                                        >
                                          <span>{isCompleted ? 'Học lại' : (lesson.isPreview && !isEnrolled && isPaid ? 'Xem thử' : 'Học bài')}</span>
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                      ) : !lesson.isPurchased && lesson.isSellable && lesson.price && lesson.price > 0 ? (
                                        <button
                                          onClick={() => handleBuyLesson(lesson.id)}
                                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                          <ShoppingBag className="w-3.5 h-3.5" />
                                          <span>Mua bài: {formatCurrency(isProMember ? Math.round(lesson.price * 0.8) : lesson.price)}</span>
                                        </button>
                                      ) : (
                                        <span
                                          title={lesson.lockReason || 'Bài học bị khóa'}
                                          className="text-slate-400 text-xs flex items-center gap-1 font-semibold px-3 py-1.5 bg-slate-100 rounded-xl"
                                        >
                                          <Lock className="w-3.5 h-3.5" />
                                          <span>Đang khóa</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assigned Exams */}
            {assignedExams.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Bài kiểm tra & Đánh giá</h2>
                      <p className="text-xs text-slate-500">
                        Các bài kiểm tra do giáo viên giao cho khóa học này
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    {assignedExams.length} bài kiểm tra
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedExams.map((exam) => {
                    const maxAttempts = exam.maxAttempts || 1;
                    const isMaxReached = exam.attemptsTaken >= maxAttempts;
                    const remainingAttempts = Math.max(0, maxAttempts - exam.attemptsTaken);

                    return (
                      <div
                        key={exam.examId}
                        className="p-5 bg-white border border-slate-200 hover:border-purple-300 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {exam.code}
                            </span>
                            {exam.passed ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã đạt</span>
                              </span>
                            ) : isMaxReached ? (
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                Đã hết lượt ({exam.attemptsTaken}/{maxAttempts})
                              </span>
                            ) : exam.attemptsTaken > 0 ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Đã làm {exam.attemptsTaken}/{maxAttempts} lần
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                Chưa làm (Tối đa {maxAttempts} lần)
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-base text-slate-900 line-clamp-1">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-xs text-slate-500">
                            {exam.bestScore !== undefined && exam.bestScore !== null ? (
                              <span>
                                Điểm cao nhất: <strong className="text-purple-700 font-bold">{exam.bestScore}đ</strong>
                              </span>
                            ) : (
                              <span>Chưa có điểm</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {exam.attemptsTaken > 0 && (
                              <button
                                onClick={() => handleOpenExamReview(exam.examId)}
                                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <ListChecks className="w-3.5 h-3.5 text-purple-600" />
                                <span>Xem lại</span>
                              </button>
                            )}

                            {isMaxReached ? (
                              <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs inline-flex items-center gap-1.5 cursor-not-allowed">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hết lượt</span>
                              </span>
                            ) : (
                              <Link
                                href={'/courses/' + courseId + '/exams/' + exam.examId}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all inline-flex items-center gap-1.5"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>{exam.attemptsTaken > 0 ? 'Làm lại (Còn ' + remainingAttempts + ')' : 'Làm bài'}</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Course Reviews */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>Đánh giá từ học viên</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhận xét thực tế từ các học viên đã trải nghiệm khóa học
                  </p>
                </div>

                {isEnrolled && (
                  <div>
                    {isCourseCompleted ? (
                      <button
                        onClick={() => setReviewModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{myReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}</span>
                      </button>
                    ) : (
                      <div
                        title={'Bạn cần hoàn thành 100% khóa học để gửi đánh giá (Tiến độ hiện tại: ' + (courseProgress?.overallProgressPercent || 0) + '%)'}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hoàn thành 100% để đánh giá ({courseProgress?.overallProgressPercent || 0}%)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rating Overview & Star Filter Bar */}
              {reviews.length > 0 && (
                <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
                    {/* Overall Score & Distribution */}
                    <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
                      <div className="text-center px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-2xl shrink-0 min-w-[110px]">
                        <div className="text-3xl font-black text-slate-900 leading-tight">{rating.toFixed(1)}</div>
                        <div className="flex items-center justify-center gap-0.5 mt-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">({reviews.length} đánh giá)</p>
                      </div>

                      {/* Distribution Bars */}
                      <div className="space-y-1.5 flex-1 min-w-[200px] max-w-xs text-xs">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingStats[star] || 0;
                          const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                          const isActive = selectedStarFilter === star;
                          return (
                            <div
                              key={star}
                              onClick={() => {
                                setSelectedStarFilter(isActive ? 'ALL' : star);
                                setShowAllReviews(false);
                              }}
                              className={`flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer group rounded-lg px-1.5 py-0.5 transition-colors ${
                                isActive ? 'bg-amber-50 text-amber-900 font-bold' : ''
                              }`}
                            >
                              <span className="w-10 font-medium text-[11px] flex items-center gap-0.5 shrink-0">
                                {star} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                              </span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-300 group-hover:bg-amber-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-[10px] text-slate-400 font-mono shrink-0">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Filter Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 mr-1">Lọc theo:</span>
                      <button
                        onClick={() => {
                          setSelectedStarFilter('ALL');
                          setShowAllReviews(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedStarFilter === 'ALL'
                            ? 'bg-[#83C75D] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tất cả ({reviews.length})
                      </button>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingStats[star] || 0;
                        const active = selectedStarFilter === star;
                        return (
                          <button
                            key={star}
                            onClick={() => {
                              setSelectedStarFilter(active ? 'ALL' : star);
                              setShowAllReviews(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-amber-400 text-slate-900 shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>{star}</span>
                            <Star className={`w-3 h-3 ${active ? 'fill-slate-900 text-slate-900' : 'fill-amber-400 text-amber-400'}`} />
                            <span className="text-[10px] opacity-75">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {filteredReviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs space-y-2">
                  <p>
                    {selectedStarFilter === 'ALL'
                      ? 'Chưa có đánh giá nào cho khóa học này. Hãy là học viên đầu tiên để lại nhận xét!'
                      : `Không tìm thấy nhận xét nào cho mức ${selectedStarFilter} sao.`}
                  </p>
                  {selectedStarFilter !== 'ALL' && (
                    <button
                      onClick={() => setSelectedStarFilter('ALL')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Xem tất cả đánh giá
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xs divide-y divide-slate-100 overflow-hidden">
                  {(showAllReviews ? filteredReviews : filteredReviews.slice(0, 3)).map((rev) => (
                    <div key={rev.id} className="p-5 space-y-3 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {rev.userAvatar || rev.userAvatarUrl ? (
                            <img
                              src={rev.userAvatar || rev.userAvatarUrl}
                              alt={rev.userName || rev.userFullName || 'User'}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {(rev.userName || rev.userFullName || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900">{rev.userName || rev.userFullName || 'Học viên'}</p>
                            <p className="text-[10px] text-slate-400">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={'w-3.5 h-3.5 ' + (s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}

                  {filteredReviews.length > 3 && (
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => setShowAllReviews((prev) => !prev)}
                        className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#83C75D] hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                      >
                        {showAllReviews ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                            <span>Thu gọn đánh giá</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                            <span>Xem thêm ({filteredReviews.length - 3} đánh giá khác)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Discussions */}
        {activeTab === 'discussions' && (
          <CourseDiscussionTab
            courseId={courseId}
            isEnrolled={!!isEnrolled}
            isTeacherOrAdmin={!!isTeacherOrAdmin}
            chapters={chapters}
          />
        )}

        {/* Tab 3: Announcements */}
        {activeTab === 'announcements' && (
          <CourseAnnouncementsTab
            courseId={courseId}
            isTeacherOrAdmin={!!isTeacherOrAdmin}
          />
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
            loadCourseData();
          }}
          order={checkoutOrder}
        />

        <CourseReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            setReviewModalOpen(false);
            loadCourseData();
          }}
          courseId={courseId}
          courseName={title}
          existingReview={myReview}
        />

        <StudentAttemptReviewModal
          reviewData={reviewModalData}
          isLoading={isLoadingReview}
          attemptsList={examAttemptsList}
          selectedAttemptId={selectedAttemptId}
          onSelectAttempt={handleSelectSpecificAttempt}
          onClose={() => {
            setReviewModalData(null);
            setExamAttemptsList([]);
            setSelectedAttemptId(undefined);
          }}
        />
      </div>
    </div>
  );
}
