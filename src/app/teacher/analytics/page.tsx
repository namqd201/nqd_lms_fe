'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { courseService } from '@/services/course.service';
import { analyticsService } from '@/services/analytics.service';
import { financeService } from '@/services/finance.service';
import { TeacherCourseResponse } from '@/types/course';
import {
  CourseAnalyticsResponse,
  TeacherStudentDetailProgressResponse,
} from '@/types/analytics';
import {
  TeacherBalanceSummaryResponse,
  TeacherEarningResponse,
} from '@/types/finance';
import { formatErrorMessage } from '@/utils/errorMessage';
import { reportService } from '@/services/report.service';
import { ExportCustomizationParams } from '@/types/report';
import ExportCustomizationModal from '@/components/ExportCustomizationModal';
import {
  Users,
  GraduationCap,
  Award,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  BookOpen,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  UserMinus,
  Sparkles,
  Check,
  X,
  ChevronRight,
  FolderKanban,
  Tag,
  ArrowRight,
  DollarSign,
  Wallet,
  Clock,
  ArrowUpRight,
  Layers,
  Lightbulb,
  CreditCard,
  Receipt,
  FileCheck,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

type AnalyticsTab = 'LEARNING' | 'LESSON_PROGRESS' | 'REVENUE';

export default function TeacherAnalyticsPage() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('LEARNING');

  // Courses & Selected Course state
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalyticsResponse | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Finance & Revenue state
  const [balanceSummary, setBalanceSummary] = useState<TeacherBalanceSummaryResponse | null>(null);
  const [earnings, setEarnings] = useState<TeacherEarningResponse[]>([]);
  const [isLoadingFinance, setIsLoadingFinance] = useState<boolean>(false);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [revenueCourseFilter, setRevenueCourseFilter] = useState<'CURRENT' | 'ALL'>('CURRENT');

  // Search & Filter State for Course Selector Modal
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState<boolean>(false);
  const [searchCourseQuery, setSearchCourseQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Student Detail Modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<TeacherStudentDetailProgressResponse | null>(null);
  const [isLoadingStudentDetail, setIsLoadingStudentDetail] = useState<boolean>(false);
  const [studentDetailError, setStudentDetailError] = useState<string | null>(null);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleExportCourseExcel = async (params: ExportCustomizationParams) => {
    if (!selectedCourseId) return;
    await reportService.exportCourseGradebookExcel(selectedCourseId, params);
  };

  // Filter for top students table
  const [searchStudent, setSearchStudent] = useState<string>('');

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const fetchTeacherCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setErrorMsg(null);
      const data = await courseService.getTeacherCourses();
      setCourses(data);
      if (data && data.length > 0) {
        const initialCourseId = String(data[0].id);
        setSelectedCourseId(initialCourseId);
        loadAnalytics(initialCourseId);
      }
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách khóa học của bạn'));
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadAnalytics = async (courseId: string) => {
    try {
      setIsLoadingAnalytics(true);
      setErrorMsg(null);
      const data = await analyticsService.getCourseAnalytics(courseId as any);
      setAnalytics(data);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải dữ liệu thống kê cho khóa học này'));
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Load Finance Data when user opens Revenue Tab
  const loadFinanceData = async () => {
    try {
      setIsLoadingFinance(true);
      setFinanceError(null);
      const [bal, earnRes] = await Promise.all([
        financeService.getBalanceSummary().catch(() => null),
        financeService.getTeacherEarnings(undefined, 0, 100).catch(() => ({ content: [] })),
      ]);
      if (bal) setBalanceSummary(bal);
      if (earnRes && earnRes.content) setEarnings(earnRes.content);
    } catch (err: any) {
      setFinanceError(formatErrorMessage(err, 'Không thể tải dữ liệu doanh thu'));
    } finally {
      setIsLoadingFinance(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REVENUE' && !balanceSummary && !isLoadingFinance) {
      loadFinanceData();
    }
  }, [activeTab]);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsCoursePickerOpen(false);
    loadAnalytics(courseId);
  };

  const handleOpenStudentDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setStudentDetail(null);
    setStudentDetailError(null);
    setIsLoadingStudentDetail(true);
    try {
      const data = await analyticsService.getTeacherStudentProgressDetail(studentId as any);
      setStudentDetail(data);
    } catch (err: any) {
      setStudentDetailError(formatErrorMessage(err, 'Không thể tải chi tiết tiến độ học viên'));
    } finally {
      setIsLoadingStudentDetail(false);
    }
  };

  // Extract unique subjects and grade levels from courses list
  const availableSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { name: string; count: number }>();
    courses.forEach((c) => {
      const sName = c.subjectName?.trim() || 'Môn khác';
      if (!subjectsMap.has(sName)) {
        subjectsMap.set(sName, { name: sName, count: 1 });
      } else {
        subjectsMap.get(sName)!.count += 1;
      }
    });
    return Array.from(subjectsMap.values());
  }, [courses]);

  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    courses.forEach((c) => {
      if (c.gradeLevel && c.gradeLevel.trim()) {
        gradesSet.add(c.gradeLevel.trim());
      }
    });
    return Array.from(gradesSet).sort();
  }, [courses]);

  // Filter courses based on modal search and filter controls
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedSubjectFilter !== 'ALL') {
        const sName = c.subjectName?.trim() || 'Môn khác';
        if (sName !== selectedSubjectFilter) return false;
      }
      if (selectedGradeFilter !== 'ALL') {
        if ((c.gradeLevel || '').trim() !== selectedGradeFilter) return false;
      }
      if (selectedStatusFilter !== 'ALL') {
        if (c.status !== selectedStatusFilter) return false;
      }
      if (searchCourseQuery.trim()) {
        const q = searchCourseQuery.toLowerCase().trim();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchCode = (c.code || '').toLowerCase().includes(q);
        const matchSubject = (c.subjectName || '').toLowerCase().includes(q);
        const matchGrade = (c.gradeLevel || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSubject && !matchGrade) {
          return false;
        }
      }
      return true;
    });
  }, [courses, selectedSubjectFilter, selectedGradeFilter, selectedStatusFilter, searchCourseQuery]);

  // Current selected course object
  const currentCourse = useMemo(() => {
    return courses.find((c) => String(c.id) === String(selectedCourseId)) || null;
  }, [courses, selectedCourseId]);

  // Reset all filters in modal
  const handleResetFilters = () => {
    setSearchCourseQuery('');
    setSelectedSubjectFilter('ALL');
    setSelectedGradeFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  const hasActiveFilters =
    searchCourseQuery.trim() !== '' ||
    selectedSubjectFilter !== 'ALL' ||
    selectedGradeFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL';

  // Prepare chart data for Score Distribution
  const scoreDistributionData = analytics
    ? [
        { name: '< 5.0 (Yếu)', count: analytics.scoreDistribution?.below5 || 0, fill: '#ef4444' },
        { name: '5.0 - 6.9 (TB)', count: analytics.scoreDistribution?.range5To7 || 0, fill: '#f59e0b' },
        { name: '7.0 - 8.4 (Khá)', count: analytics.scoreDistribution?.range7To85 || 0, fill: '#3b82f6' },
        { name: '8.5 - 10 (Giỏi)', count: analytics.scoreDistribution?.range85To10 || 0, fill: '#10b981' },
      ]
    : [];

  // Prepare chart data for Progress Distribution
  const progressDistributionData = analytics
    ? [
        { name: '0 - 24% (Mới bắt đầu)', count: analytics.progressDistribution?.range0To25 || 0, fill: '#94a3b8' },
        { name: '25 - 49% (Đang học)', count: analytics.progressDistribution?.range25To50 || 0, fill: '#38bdf8' },
        { name: '50 - 74% (Tiến bộ)', count: analytics.progressDistribution?.range50To75 || 0, fill: '#818cf8' },
        { name: '75 - 100% (Gần hoàn thành)', count: analytics.progressDistribution?.range75To100 || 0, fill: '#10b981' },
      ]
    : [];

  // Filter top students
  const filteredStudents = (analytics?.topStudents || []).filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchStudent.toLowerCase())
  );

  // Filtered earnings for current course vs all courses
  const filteredEarnings = useMemo(() => {
    if (revenueCourseFilter === 'CURRENT' && selectedCourseId) {
      return earnings.filter((e) => String(e.courseId) === String(selectedCourseId));
    }
    return earnings;
  }, [earnings, revenueCourseFilter, selectedCourseId]);

  // Aggregate revenue stats
  const courseTotalRevenue = useMemo(() => {
    return filteredEarnings.reduce((acc, curr) => acc + (curr.teacherAmount || 0), 0);
  }, [filteredEarnings]);

  const courseGrossRevenue = useMemo(() => {
    return filteredEarnings.reduce((acc, curr) => acc + (curr.grossAmount || 0), 0);
  }, [filteredEarnings]);

  // Format VND currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <RoleGuard allowedRoles={['ROLE_TEACHER', 'ROLE_ADMIN', 'TEACHER', 'ADMIN']}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header Title & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Trung Tâm Thống Kê & Báo Cáo Giáo Viên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Phân Tích Khóa Học, Tiến Độ & Doanh Thu
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Tổng hợp toàn diện về mức độ tương tác học viên, phân bố điểm số, tỷ lệ hoàn thành bài học và doanh thu bán khóa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedCourseId) loadAnalytics(selectedCourseId);
                if (activeTab === 'REVENUE') loadFinanceData();
              }}
              disabled={isLoadingAnalytics || isLoadingFinance || !selectedCourseId}
              className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
              title="Làm mới dữ liệu thống kê"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics || isLoadingFinance ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Prominent Course Selection Banner */}
        {courses.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="absolute right-1/4 -top-12 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Current Course Info */}
              <div className="flex items-start sm:items-center gap-4">
                {currentCourse?.thumbnailUrl ? (
                  <img
                    src={currentCourse.thumbnailUrl}
                    alt={currentCourse.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0 bg-slate-800"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 border-2 border-white/20">
                    <BookOpen className="w-8 h-8 opacity-90" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {currentCourse?.subjectName || 'Chung'}
                    </span>
                    {currentCourse?.gradeLevel && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                        {currentCourse.gradeLevel}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 text-xs font-mono font-semibold">
                      #{currentCourse?.code || 'NO-CODE'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        currentCourse?.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {currentCourse?.status === 'ACTIVE' ? 'Đang mở' : currentCourse?.status || 'Nháp'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-1">
                    {currentCourse?.name || 'Chưa chọn khóa học'}
                  </h2>
                  <p className="text-xs text-slate-300/80 flex items-center gap-1">
                    <span>Đang xem báo cáo phân tích theo thời gian thực</span>
                    <span>•</span>
                    <span>Tổng {courses.length} khóa học của bạn</span>
                  </p>
                </div>
              </div>

              {/* Action: Open Course Picker Dialog & Export Excel */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={!selectedCourseId || !analytics}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Xuất bảng điểm lớp học sang file Excel có tùy biến tiêu đề"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Xuất Bảng Điểm (Excel)</span>
                </button>

                <button
                  onClick={() => setIsCoursePickerOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Tìm & Đổi Khóa Học</span>
                  <ChevronRight className="w-4 h-4 text-slate-900/60" />
                </button>
              </div>
            </div>

            {/* Quick Switch Pills (Top 5-6 courses) */}
            {courses.length > 1 && (
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Chuyển nhanh:
                </span>
                <div className="flex items-center gap-2">
                  {courses.slice(0, 6).map((c) => {
                    const isSelected = String(c.id) === String(selectedCourseId);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCourse(String(c.id))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                        <span className="max-w-[140px] truncate">{c.name}</span>
                      </button>
                    );
                  })}
                  {courses.length > 6 && (
                    <button
                      onClick={() => setIsCoursePickerOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/15 text-slate-300 transition-all shrink-0 cursor-pointer"
                    >
                      +{courses.length - 6} khóa khác...
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('LEARNING')}
            className={`px-5 py-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'LEARNING'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Thống Kê Học Tập & Học Viên</span>
          </button>

          <button
            onClick={() => setActiveTab('LESSON_PROGRESS')}
            className={`px-5 py-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'LESSON_PROGRESS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Tỷ Lệ Hoàn Thành & Điểm Rơi Bài Học</span>
          </button>

          <button
            onClick={() => setActiveTab('REVENUE')}
            className={`px-5 py-3 text-sm font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'REVENUE'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Doanh Thu & Lượt Mua Khóa Học</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Loading Spinner for Courses & Analytics */}
        {isLoadingCourses || (isLoadingAnalytics && !analytics) ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Đang tổng hợp dữ liệu phân tích học tập...</p>
          </div>
        ) : !analytics ? (
          <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Chưa có khóa học nào</h3>
            <p className="text-sm text-slate-500 mt-1">Hãy tạo hoặc xuất bản khóa học để bắt đầu theo dõi báo cáo.</p>
          </div>
        ) : (
          <>
            {/* ==================== TAB 1: LEARNING ANALYTICS ==================== */}
            {activeTab === 'LEARNING' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* KPI Cards for Learning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Total Students */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Học Viên</span>
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{analytics.totalEnrolledStudents}</span>
                      <span className="text-xs font-semibold text-slate-500">người tham gia</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1 text-emerald-600" title="Đang hoạt động">
                        <UserCheck className="w-3.5 h-3.5" /> {analytics.activeStudents} active
                      </span>
                      <span className="flex items-center gap-1 text-blue-600" title="Đã hoàn thành khóa">
                        <GraduationCap className="w-3.5 h-3.5" /> {analytics.completedStudents} xong
                      </span>
                      <span className="flex items-center gap-1 text-rose-500" title="Bỏ học / Đã hủy">
                        <UserMinus className="w-3.5 h-3.5" /> {analytics.droppedStudents} bỏ
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Average Exam Score */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Thi TB</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {analytics.averageScore > 0 ? analytics.averageScore.toFixed(1) : '--'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/ 10 điểm</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đậu: {analytics.passRate ? analytics.passRate.toFixed(1) : 0}%
                      </span>
                      <span className="text-slate-400">
                        ({analytics.passedAttempts}/{analytics.passedAttempts + analytics.failedAttempts} bài)
                      </span>
                    </div>
                  </div>

                  {/* Card 3: High Performers (>= 8.5 pts) */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học Viên Xuất Sắc</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {analytics.scoreDistribution?.range85To10 || 0}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">học viên &ge; 8.5đ</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      {analytics.scoreDistribution?.range7To85 || 0} học viên đạt loại Khá (7.0 - 8.4)
                    </p>
                  </div>

                  {/* Card 4: 30-Day Activity Count */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt Học 30 Ngày</span>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {(analytics.activityTimeline || []).reduce((acc, c) => acc + c.completedLessons + c.examSubmissions, 0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">tương tác</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      Đo lường bài học và bài thi được hoàn thành
                    </p>
                  </div>
                </div>

                {/* 30-Day Activity Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Xu Hướng Hoạt Động 30 Ngày Gần Nhất
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Số lượt học viên hoàn thành bài học và nộp bài kiểm tra mỗi ngày trong khóa học này.
                      </p>
                    </div>
                  </div>

                  {analytics.activityTimeline && analytics.activityTimeline.length > 0 ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickFormatter={(val) => {
                              const parts = val.split('-');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                            }}
                          />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '16px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                              fontSize: '12px',
                            }}
                            labelFormatter={(label) => `Ngày: ${label}`}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Area
                            type="monotone"
                            dataKey="completedLessons"
                            name="Bài học hoàn thành"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorLessons)"
                          />
                          <Area
                            type="monotone"
                            dataKey="examSubmissions"
                            name="Bài thi đã nộp"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorExams)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 text-sm">Chưa có lượt học nào trong 30 ngày qua.</div>
                  )}
                </div>

                {/* Score Distribution Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Phân Bố Điểm Thi Của Học Viên (Thang Điểm 10)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Thống kê xếp loại kết quả bài thi của các học viên trong khóa.</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`${val} lượt nộp`, 'Số lượt thi']}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={44}>
                          {scoreDistributionData.map((entry, index) => (
                            <Cell key={`cell-score-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Students / Student Directory Table */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Danh Sách Học Viên Trong Khóa ({analytics.topStudents?.length || 0})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Xếp hạng theo tiến độ học tập và điểm thi trung bình. Nhấp &ldquo;Hồ sơ&rdquo; để xem chi tiết học tập.
                      </p>
                    </div>

                    <div className="relative min-w-[240px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchStudent}
                        onChange={(e) => setSearchStudent(e.target.value)}
                        placeholder="Tìm theo tên, email học viên..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">Không tìm thấy học viên nào phù hợp.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pl-2">Học viên</th>
                            <th className="pb-3">Trạng thái</th>
                            <th className="pb-3">Tiến độ</th>
                            <th className="pb-3">Điểm TB</th>
                            <th className="pb-3">Bài học đã xong</th>
                            <th className="pb-3 pr-2 text-right">Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map((s) => (
                            <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-3 pl-2">
                                <div className="flex items-center gap-3">
                                  {s.avatarUrl ? (
                                    <img
                                      src={s.avatarUrl}
                                      alt={s.studentName}
                                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                                      {s.studentName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900 leading-tight">{s.studentName}</p>
                                    <p className="text-[11px] text-slate-400">{s.studentEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    s.enrollmentStatus === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-700'
                                      : s.enrollmentStatus === 'ENROLLED'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {s.enrollmentStatus === 'COMPLETED' ? 'Hoàn thành' : s.enrollmentStatus === 'ENROLLED' ? 'Đang học' : s.enrollmentStatus}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${s.progressPercent || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{s.progressPercent || 0}%</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`font-black text-xs ${
                                    (s.averageScore || 0) >= 8.5
                                      ? 'text-emerald-600'
                                      : (s.averageScore || 0) >= 7.0
                                      ? 'text-blue-600'
                                      : (s.averageScore || 0) >= 5.0
                                      ? 'text-amber-600'
                                      : (s.averageScore || 0) > 0
                                      ? 'text-rose-500'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {(s.averageScore || 0) > 0 ? `${s.averageScore?.toFixed(1)} / 10` : '--'}
                                </span>
                              </td>
                              <td className="py-3 text-xs font-semibold text-slate-600">{s.completedLessonsCount} bài</td>
                              <td className="py-3 pr-2 text-right">
                                <button
                                  onClick={() => handleOpenStudentDetail(s.studentId)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Hồ sơ</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 2: LESSON PROGRESS & DROP-OFFS ==================== */}
            {activeTab === 'LESSON_PROGRESS' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* KPI Cards for Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Average Progress */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiến Độ Trung Bình</span>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {analytics.averageProgressPercent ? analytics.averageProgressPercent.toFixed(1) : 0}%
                      </span>
                      <span className="text-xs font-semibold text-slate-500">hoàn thành</span>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${analytics.averageProgressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Completed Students */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tốt Nghiệp / Hoàn Thành</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{analytics.completedStudents}</span>
                      <span className="text-xs font-semibold text-slate-500">học viên 100%</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      {analytics.totalEnrolledStudents > 0
                        ? `Tỉ lệ hoàn thành: ${((analytics.completedStudents / analytics.totalEnrolledStudents) * 100).toFixed(1)}%`
                        : 'Chưa có dữ liệu'}
                    </p>
                  </div>

                  {/* Card 3: Drop-off Lessons Count */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Rơi Cần Chú Ý</span>
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{analytics.dropOffLessons?.length || 0}</span>
                      <span className="text-xs font-semibold text-slate-500">bài học dở dang</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      {analytics.dropOffLessons && analytics.dropOffLessons.length > 0
                        ? `Tỉ lệ dừng cao nhất: ${analytics.dropOffLessons[0].dropOffRate}%`
                        : 'Không có điểm rơi nghiêm trọng'}
                    </p>
                  </div>

                  {/* Card 4: Active Learners */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học Viên Tiến Độ Cao (&ge;75%)</span>
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {analytics.progressDistribution?.range75To100 || 0}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">người</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      Đang ở chặng cuối của khóa học
                    </p>
                  </div>
                </div>

                {/* Progress Distribution Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Phân Bố Tiến Độ Học Tập Của Toàn Bộ Học Viên
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Số lượng học viên chia theo từng dải % hoàn thành khóa học.</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                          formatter={(val: any) => [`${val} học viên`, 'Số lượng']}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={48}>
                          {progressDistributionData.map((entry, index) => (
                            <Cell key={`cell-progress-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Deep Drop-off Lessons Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        Phân Tích Chi Tiết Bài Học &ldquo;Điểm Rơi&rdquo; (Drop-off Rate)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Xếp hạng các bài giảng có tỷ lệ học sinh dừng lại hoặc bỏ dở cao nhất để giáo viên kịp thời cải tiến.
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>Gợi ý: Chia nhỏ video & bổ sung Quiz ngắn</span>
                    </div>
                  </div>

                  {!analytics.dropOffLessons || analytics.dropOffLessons.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <p className="text-base font-bold text-emerald-900">Không có bài học điểm rơi nghiêm trọng!</p>
                      <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                        Học viên hoàn thành các bài học một cách liền mạch và không có bài học nào ghi nhận tỉ lệ dở dang bất thường.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.dropOffLessons.map((lesson, idx) => (
                        <div
                          key={lesson.lessonId}
                          className="p-5 rounded-2xl border border-slate-200 hover:border-rose-300 bg-slate-50/50 hover:bg-rose-50/30 transition-all space-y-3 relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-black">
                              Top #{idx + 1} Điểm Rơi
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-black">
                              {lesson.dropOffRate}% Dừng Lại
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 line-clamp-2">{lesson.title}</h4>

                          {lesson.chapterTitle && (
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {lesson.chapterTitle}
                            </p>
                          )}

                          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-semibold">
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              ● Đang dở: <strong>{lesson.inProgressStudentsCount} học viên</strong>
                            </span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              ✓ Đã xong: <strong>{lesson.completedStudentsCount}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TAB 3: REVENUE & SALES ANALYTICS ==================== */}
            {activeTab === 'REVENUE' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Revenue Top Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Course Total Earnings */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Khóa Này</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {formatCurrency(courseTotalRevenue)}
                      </span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      Tổng giá trị gốc: {formatCurrency(courseGrossRevenue)}
                    </p>
                  </div>

                  {/* Card 2: Total Balance Available */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số Dư Khả Dụng</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                        {formatCurrency(balanceSummary?.availableBalance || 0)}
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Có thể yêu cầu rút tiền</span>
                      <Link
                        href="/teacher/finance"
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                      >
                        Rút tiền <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Card 3: Pending Balance */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chờ Đối Soát</span>
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {formatCurrency(balanceSummary?.pendingBalance || 0)}
                      </span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      Đã rút thành công: {formatCurrency(balanceSummary?.withdrawnAmount || 0)}
                    </p>
                  </div>

                  {/* Card 4: Successful Orders Count */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt Mua Thành Công</span>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Receipt className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{filteredEarnings.length}</span>
                      <span className="text-xs font-semibold text-slate-500">đơn hàng</span>
                    </div>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
                      Tự động xác nhận qua mã QR SePay
                    </p>
                  </div>
                </div>

                {/* Earnings List & Transactions Table */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-600" />
                        Lịch Sử Giao Dịch & Thu Nhập Khóa Học ({filteredEarnings.length})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ghi nhận từng giao dịch học viên mua khóa học, tỷ lệ chia sẻ doanh thu và trạng thái thanh toán.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRevenueCourseFilter('CURRENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          revenueCourseFilter === 'CURRENT'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Khóa học này
                      </button>
                      <button
                        onClick={() => setRevenueCourseFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          revenueCourseFilter === 'ALL'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tất cả các khóa ({earnings.length})
                      </button>
                    </div>
                  </div>

                  {isLoadingFinance ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                      <p className="text-xs">Đang tải lịch sử giao dịch tài chính...</p>
                    </div>
                  ) : filteredEarnings.length === 0 ? (
                    <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                      <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">Chưa có giao dịch bán khóa học nào</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Khi học viên thanh toán mua khóa học, lịch sử giao dịch và doanh thu chia sẻ sẽ hiển thị tự động tại đây.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pl-2">Mã đơn hàng</th>
                            <th className="pb-3">Khóa học</th>
                            <th className="pb-3">Giá trị gốc</th>
                            <th className="pb-3">Tỷ lệ chia sẻ</th>
                            <th className="pb-3">Thu nhập nhận</th>
                            <th className="pb-3">Thời gian</th>
                            <th className="pb-3 pr-2 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEarnings.map((earn) => (
                            <tr key={earn.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 pl-2">
                                <span className="font-mono text-xs font-bold text-slate-900">
                                  #{earn.orderCode || earn.orderId?.substring(0, 8)}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="font-bold text-xs text-slate-800 line-clamp-1 max-w-[200px]">
                                  {earn.courseName || currentCourse?.name || 'Khóa học'}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-xs text-slate-600">
                                {formatCurrency(earn.grossAmount || 0)}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                                  {earn.teacherShareRate ? (earn.teacherShareRate * 100).toFixed(0) : 100}%
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="font-black text-xs text-emerald-600">
                                  {formatCurrency(earn.teacherAmount || 0)}
                                </span>
                              </td>
                              <td className="py-3 text-xs text-slate-400">
                                {earn.createdAt ? new Date(earn.createdAt).toLocaleDateString('vi-VN') : '--'}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                    earn.status === 'AVAILABLE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : earn.status === 'PAID'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {earn.status === 'AVAILABLE'
                                    ? 'Khả dụng'
                                    : earn.status === 'PAID'
                                    ? 'Đã chi trả'
                                    : 'Chờ đối soát'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Course Search & Filter Selector Modal */}
        {isCoursePickerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl">Chọn Khóa Học Để Thống Kê</h3>
                    <p className="text-xs text-slate-500">
                      Tìm kiếm và lọc trong danh sách {courses.length} khóa học của bạn
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCoursePickerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-5 border-b border-slate-100 space-y-4 bg-white">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchCourseQuery}
                    onChange={(e) => setSearchCourseQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tên khóa học, mã khóa (#MATH101), môn học, khối lớp..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    autoFocus
                  />
                  {searchCourseQuery && (
                    <button
                      onClick={() => setSearchCourseQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Subject Pills (Horizontal scrollable) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                    <button
                      onClick={() => setSelectedSubjectFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedSubjectFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả môn ({courses.length})
                    </button>
                    {availableSubjects.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={() => setSelectedSubjectFilter(sub.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                          selectedSubjectFilter === sub.name
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                          {sub.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Secondary Dropdown Filters (Grade & Status) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Grade Level Filter */}
                    {availableGrades.length > 0 && (
                      <select
                        value={selectedGradeFilter}
                        onChange={(e) => setSelectedGradeFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="ALL">Tất cả khối lớp</option>
                        {availableGrades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Status Filter */}
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang hoạt động (Active)</option>
                      <option value="DRAFT">Bản nháp (Draft)</option>
                      <option value="ARCHIVED">Lưu trữ (Archived)</option>
                    </select>

                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa toàn bộ bộ lọc"
                      >
                        Xóa lọc
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Results List */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 bg-slate-50/40">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 mb-1">
                  <span>DANH SÁCH KHÓA HỌC ({filteredCourses.length})</span>
                  {hasActiveFilters && <span>Đang áp dụng bộ lọc</span>}
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                    <Search className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-base font-bold text-slate-800">Không tìm thấy khóa học nào phù hợp</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Hãy thử tìm với từ khóa khác hoặc xóa bớt bộ lọc môn học / khối lớp để thấy thêm kết quả.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredCourses.map((c) => {
                      const isSelected = String(c.id) === String(selectedCourseId);
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCourse(String(c.id))}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 relative group ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                          }`}
                        >
                          {/* Thumbnail / Placeholder */}
                          {c.thumbnailUrl ? (
                            <img
                              src={c.thumbnailUrl}
                              alt={c.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs">
                              <BookOpen className="w-6 h-6 opacity-90" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                {c.subjectName || 'Chung'}
                              </span>
                              {c.gradeLevel && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  {c.gradeLevel}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                                #{c.code}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
                              {c.name}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span
                                className={`font-semibold ${
                                  c.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                              >
                                {c.status === 'ACTIVE' ? '● Đang mở' : '● Bản nháp'}
                              </span>

                              {isSelected ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                  <Check className="w-3.5 h-3.5" /> Đang xem
                                </span>
                              ) : (
                                <span className="group-hover:text-emerald-600 font-bold text-[11px] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                  Chọn xem <ArrowRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  {filteredCourses.length > 0 && (
                    <span>
                      Nhấp vào bất kỳ khóa học nào để chuyển đổi tức thì bảng phân tích.
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsCoursePickerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    👤
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Chi Tiết Tiến Độ Học Viên</h3>
                </div>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingStudentDetail ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs">Đang tải hồ sơ tiến độ học viên...</p>
                  </div>
                ) : studentDetailError ? (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-sm">{studentDetailError}</div>
                ) : studentDetail ? (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      {studentDetail.avatarUrl ? (
                        <img
                          src={studentDetail.avatarUrl}
                          alt={studentDetail.studentName}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                          {studentDetail.studentName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-black text-slate-900">{studentDetail.studentName}</h4>
                        <p className="text-xs text-slate-500">{studentDetail.studentEmail}</p>
                        {studentDetail.phone && (
                          <p className="text-xs text-slate-400 mt-0.5">SĐT: {studentDetail.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                        Khóa Học Đang Theo Học ({studentDetail.courses?.length || 0})
                      </h4>

                      {!studentDetail.courses || studentDetail.courses.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Học viên chưa đăng ký khóa học nào.</p>
                      ) : (
                        studentDetail.courses.map((course) => (
                          <div
                            key={course.courseId}
                            className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm">{course.courseName}</h5>
                                <p className="text-[11px] text-slate-400">
                                  Đã học: {course.completedLessonsCount}/{course.totalLessonsCount} bài học
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  course.enrollmentStatus === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {course.enrollmentStatus}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Tiến độ hoàn thành</span>
                                <span>{course.progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${course.progressPercent}%` }}
                                />
                              </div>
                            </div>

                            {course.examAttempts && course.examAttempts.length > 0 && (
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <span className="text-[11px] font-bold text-slate-500">Kết quả bài thi:</span>
                                <div className="space-y-1.5">
                                  {course.examAttempts.map((ex) => (
                                    <div
                                      key={ex.attemptId}
                                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50"
                                    >
                                      <span className="font-medium text-slate-800 line-clamp-1">{ex.examTitle}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-bold text-slate-900">{ex.totalScore?.toFixed(1)} đ</span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                            ex.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                          }`}
                                        >
                                          {ex.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tùy biến Xuất Bảng Điểm Lớp Học */}
        <ExportCustomizationModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportCourseExcel}
          title="Tùy biến & Xuất Bảng Điểm Khóa Học (Excel)"
          defaultReportTitle={
            currentCourse
              ? `BẢNG ĐIỂM TỔNG HỢP KHÓA HỌC: ${currentCourse.name.toUpperCase()}`
              : 'BẢNG ĐIỂM TỔNG HỢP KHÓA HỌC'
          }
          format="EXCEL"
        />
      </div>
    </RoleGuard>
  );
}
