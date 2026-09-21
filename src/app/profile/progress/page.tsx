'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { analyticsService } from '@/services/analytics.service';
import {
  StudentOverallAnalyticsResponse,
  DailyHeatmapItem,
} from '@/types/analytics';
import { formatErrorMessage } from '@/utils/errorMessage';
import { reportService } from '@/services/report.service';
import { ExportCustomizationParams } from '@/types/report';
import ExportCustomizationModal from '@/components/ExportCustomizationModal';
import {
  Flame,
  Trophy,
  Clock,
  BookOpen,
  Award,
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function StudentProgressPage() {
  const [analytics, setAnalytics] = useState<StudentOverallAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DailyHeatmapItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleExportTranscript = async (params: ExportCustomizationParams) => {
    await reportService.exportStudentTranscriptPdf(params);
  };

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  const fetchStudentAnalytics = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await analyticsService.getStudentOverallAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải thống kê tiến độ học tập của bạn'));
    } finally {
      setIsLoading(false);
    }
  };

  // Organize 365 days into a 52-week calendar grid (Sun - Sat)
  const { weeks, monthLabels } = useMemo(() => {
    if (!analytics || !analytics.activityHeatmap) {
      return { weeks: [], monthLabels: [] };
    }

    const activityMap = new Map<string, number>();
    analytics.activityHeatmap.forEach((item) => {
      activityMap.set(item.date, item.count);
    });

    // Generate date array from 365 days ago to today
    const today = new Date();
    const days: { dateStr: string; dateObj: Date; dayOfWeek: number; count: number }[] = [];

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;
      days.push({
        dateStr,
        dateObj: d,
        dayOfWeek: d.getDay(),
        count,
      });
    }

    // Group into weeks
    const calculatedWeeks: { days: (typeof days[0] | null)[] }[] = [];
    let currentWeek: (typeof days[0] | null)[] = [];

    if (days.length > 0) {
      const firstDayOfWeek = days[0].dayOfWeek;
      for (let j = 0; j < firstDayOfWeek; j++) {
        currentWeek.push(null);
      }
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        calculatedWeeks.push({ days: currentWeek });
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calculatedWeeks.push({ days: currentWeek });
    }

    // Determine month labels positions
    const labels: { monthName: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    calculatedWeeks.forEach((week, wIdx) => {
      const firstValidDay = week.days.find((d) => d !== null);
      if (firstValidDay) {
        const m = firstValidDay.dateObj.getMonth();
        if (m !== lastMonth) {
          labels.push({
            monthName: `Th${m + 1}`,
            weekIndex: wIdx,
          });
          lastMonth = m;
        }
      }
    });

    return { weeks: calculatedWeeks, monthLabels: labels };
  }, [analytics]);

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 hover:ring-1 hover:ring-slate-300';
    if (count === 1) return 'bg-emerald-200 hover:ring-2 hover:ring-emerald-400';
    if (count <= 3) return 'bg-emerald-400 hover:ring-2 hover:ring-emerald-500';
    if (count <= 5) return 'bg-emerald-600 hover:ring-2 hover:ring-emerald-700';
    return 'bg-emerald-800 hover:ring-2 hover:ring-emerald-900';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-1">
            <Trophy className="w-4 h-4" />
            <span>Hành Trình Tri Thức</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tiến Độ Học Tập & Hoạt Động
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Xem tổng số giờ học, chuỗi ngày liên tiếp (Streak) và biểu đồ nhiệt tương tác 365 ngày qua.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isLoading || !analytics}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            title="Tải bảng điểm học tập cá nhân kèm mã xác thực QR"
          >
            <FileText className="w-4 h-4" />
            <span>Tải Bảng Điểm (PDF)</span>
          </button>

          <button
            onClick={fetchStudentAnalytics}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
            title="Làm mới thống kê"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !analytics ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Đang tính toán tiến độ và lịch sử học tập của bạn...</p>
        </div>
      ) : analytics ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Streak */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/15 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">Chuỗi Học Tập</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6 text-yellow-200" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black">{analytics.currentStreakDays}</span>
                <span className="text-sm font-bold text-amber-100">ngày liên tiếp</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-1 text-xs text-amber-100 font-semibold">
                <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                <span>Kỷ lục: {analytics.longestStreakDays} ngày</span>
              </div>
            </div>

            {/* Card 2: Total Study Hours */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Giờ Học</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{analytics.totalStudyHours}</span>
                <span className="text-xs font-semibold text-slate-500">giờ tích lũy</span>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Tính theo thời lượng các bài giảng đã hoàn thành
              </p>
            </div>

            {/* Card 3: Completed Lessons */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài Đã Hoàn Thành</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{analytics.totalCompletedLessons}</span>
                <span className="text-xs font-semibold text-slate-500">bài học</span>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Từ tất cả các khóa học bạn tham gia
              </p>
            </div>

            {/* Card 4: Average Exam Score */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Thi Trung Bình</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {analytics.averageExamScore > 0 ? `${analytics.averageExamScore.toFixed(1)}%` : '--'}
                </span>
                <span className="text-xs font-semibold text-slate-500">tỉ lệ đạt</span>
              </div>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Đậu {analytics.totalExamsPassed}/{analytics.totalExamsTaken} bài kiểm tra
              </p>
            </div>
          </div>

          {/* GitHub-Style 365-Day Activity Heatmap */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Bản Đồ Nhiệt Học Tập 365 Ngày
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi ô vuông đại diện cho 1 ngày hoạt động học tập (hoàn thành bài học, làm bài kiểm tra).
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Ít</span>
                <div className="w-3 h-3 rounded-xs bg-slate-100" />
                <div className="w-3 h-3 rounded-xs bg-emerald-200" />
                <div className="w-3 h-3 rounded-xs bg-emerald-400" />
                <div className="w-3 h-3 rounded-xs bg-emerald-600" />
                <div className="w-3 h-3 rounded-xs bg-emerald-800" />
                <span>Nhiều</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[760px] select-none">
                <div className="flex mb-1 pl-6 text-[10px] font-semibold text-slate-400">
                  {weeks.map((_, idx) => {
                    const label = monthLabels.find((l) => l.weekIndex === idx);
                    return (
                      <div key={`month-col-${idx}`} className="w-3.5 mr-1 text-left">
                        {label ? label.monthName : ''}
                      </div>
                    );
                  })}
                </div>

                <div className="flex">
                  <div className="flex flex-col justify-between pr-2 text-[9px] font-semibold text-slate-400 py-0.5">
                    <span className="h-3 leading-3">CN</span>
                    <span className="h-3 leading-3">T2</span>
                    <span className="h-3 leading-3">T3</span>
                    <span className="h-3 leading-3">T4</span>
                    <span className="h-3 leading-3">T5</span>
                    <span className="h-3 leading-3">T6</span>
                    <span className="h-3 leading-3">T7</span>
                  </div>

                  <div className="flex gap-1">
                    {weeks.map((week, wIdx) => (
                      <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                        {week.days.map((day, dIdx) => {
                          if (!day) {
                            return <div key={`empty-${wIdx}-${dIdx}`} className="w-3 h-3 rounded-xs opacity-0" />;
                          }
                          const colorClass = getActivityColor(day.count);
                          return (
                            <div
                              key={day.dateStr}
                              onMouseEnter={() => setHoveredDay({ date: day.dateStr, count: day.count })}
                              onMouseLeave={() => setHoveredDay(null)}
                              className={`w-3 h-3 rounded-xs cursor-pointer transition-all ${colorClass}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-[28px] text-xs font-medium text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-100">
              {hoveredDay ? (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">📅 Ngày {hoveredDay.date}:</span>
                  {hoveredDay.count === 0 ? (
                    <span className="text-slate-400">Không có hoạt động học tập nào</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      ✨ {hoveredDay.count} hoạt động học tập
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400">Di chuột vào ô vuông để xem chi tiết hoạt động từng ngày</span>
              )}
            </div>
          </div>

          {/* Enrolled Courses Progress Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Khóa Học Của Bạn ({analytics.recentCourses?.length || 0})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tiến độ và kết quả các khóa học bạn đã đăng ký.</p>
              </div>
            </div>

            {!analytics.recentCourses || analytics.recentCourses.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">Bạn chưa đăng ký khóa học nào</p>
                <Link
                  href="/courses"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {analytics.recentCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            course.enrollmentStatus === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {course.enrollmentStatus === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang học'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {course.courseTitle}
                      </h4>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Tiến độ: {course.completedLessons}/{course.totalLessons} bài</span>
                          <span className="font-bold text-emerald-600">{course.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${course.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.courseId}`}
                        className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>{course.progressPercent === 100 ? 'Xem lại bài học' : 'Tiếp tục học'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Modal Tùy biến Xuất Bảng Điểm Cá Nhân PDF */}
      <ExportCustomizationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportTranscript}
        title="Tùy biến & Tải Bảng Điểm Học Tập (PDF)"
        defaultReportTitle="BẢNG ĐIỂM HỌC TẬP & KẾT QUẢ KHẢO THÍ CÁ NHÂN"
        format="PDF"
      />
    </div>
  );
}
