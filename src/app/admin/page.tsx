'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { courseService } from '@/services/course.service';
import { classroomService } from '@/services/classroom.service';
import { UserProfileResponse } from '@/types/user';
import { TeacherCourseResponse } from '@/types/course';
import { SubjectResponse, RoleDetailResponse, OnlineUsersStats } from '@/types/admin';
import { AdminClassroomStats } from '@/types/classroom';
import { reportService } from '@/services/report.service';
import { ExportCustomizationParams } from '@/types/report';
import ExportCustomizationModal from '@/components/ExportCustomizationModal';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Users,
  ShieldAlert,
  BookMarked,
  BookOpen,
  HelpCircle,
  Activity,
  ArrowRight,
  Server,
  Sparkles,
  RefreshCw,
  GraduationCap,
  FileSpreadsheet,
  Presentation,
  Flame,
  Ticket,
  Radio,
  Eye,
  Globe,
  Search,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [roles, setRoles] = useState<RoleDetailResponse[]>([]);
  const [classroomStats, setClassroomStats] = useState<AdminClassroomStats | null>(null);
  const [onlineStats, setOnlineStats] = useState<OnlineUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);
  const [onlineFilterRole, setOnlineFilterRole] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ADMIN'>('ALL');
  const [onlineSearch, setOnlineSearch] = useState<string>('');

  const handleExportAdminExcel = async (params: ExportCustomizationParams) => {
    await reportService.exportAdminPlatformOverviewExcel(params);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, courseData, subjectData, roleData, clsStats, onlineData] = await Promise.all([
        adminService.getUsers().catch(() => []),
        courseService.getTeacherCourses().catch(() => []),
        adminService.getSubjects().catch(() => []),
        adminService.getRoles().catch(() => []),
        classroomService.getAdminClassroomStats().catch(() => null),
        adminService.getOnlineUsersStats().catch(() => null),
      ]);
      setUsers(userData);
      setCourses(courseData);
      setSubjects(subjectData);
      setRoles(roleData);
      setClassroomStats(clsStats);
      if (onlineData) setOnlineStats(onlineData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Kết nối Realtime qua SSE (Server-Sent Events) nhận push mỗi 3s
    const unsubscribe = adminService.subscribeOnlineUsersStream((data) => {
      setOnlineStats(data);
    });

    // 2. Backup Polling định kỳ mỗi 5s
    const pollInterval = setInterval(() => {
      adminService.getOnlineUsersStats()
        .then(setOnlineStats)
        .catch(() => {});
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const filteredOnlineUsers = useMemo(() => {
    if (!onlineStats?.recentUsers) return [];
    return onlineStats.recentUsers.filter((u) => {
      if (onlineFilterRole !== 'ALL') {
        const hasRole = u.roles?.some((r) => r.toUpperCase().includes(onlineFilterRole));
        if (!hasRole) return false;
      }
      if (onlineSearch.trim()) {
        const q = onlineSearch.toLowerCase();
        const matchName = u.fullName?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPath = u.currentPath?.toLowerCase().includes(q);
        return matchName || matchEmail || matchPath;
      }
      return true;
    });
  }, [onlineStats, onlineFilterRole, onlineSearch]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.status === 'ACTIVE').length;
  const totalSubjects = subjects.length;
  const totalRoles = roles.length;

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Bảng điều khiển Trung tâm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tổng quan Quản trị Hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giám sát toàn diện người dùng, phân quyền vai trò, danh mục môn học, khóa học và cài đặt hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Xuất báo cáo tổng quan toàn nền tảng định dạng Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo Nền Tảng (Excel)</span>
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Làm mới số liệu</span>
          </button>
        </div>
      </div>

      {/* Real-time Online Users Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span>Theo Dõi Trực Tuyến Thời Gian Thực (Live Real-Time)</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {onlineStats?.totalOnline ?? 0}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-300">
                người dùng đang online ngay lúc này
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Số liệu cập nhật trực tiếp qua kết nối SSE liên tục (chu kỳ 3 giây)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Breakdown Pills */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 text-xs">
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">Học sinh</span>
                <span className="text-base font-black text-white">{onlineStats?.studentsOnline ?? 0}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                <span className="text-[10px] text-indigo-300 uppercase font-bold block">Giáo viên</span>
                <span className="text-base font-black text-white">{onlineStats?.teachersOnline ?? 0}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                <span className="text-[10px] text-purple-300 uppercase font-bold block">Admin</span>
                <span className="text-base font-black text-white">{onlineStats?.adminsOnline ?? 0}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                <span className="text-[10px] text-slate-300 uppercase font-bold block">Khách</span>
                <span className="text-base font-black text-white">{onlineStats?.guestOnline ?? 0}</span>
              </div>
            </div>

            {/* Action to view details */}
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span>Xem chi tiết danh sách ({onlineStats?.authenticatedOnline ?? 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người dùng</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalUsers}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[11px] text-emerald-700 font-bold">
                {onlineStats?.totalOnline ?? 0} đang online thực tế
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vai trò (Roles)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalRoles}</span>
            <p className="text-[11px] text-purple-600 font-semibold mt-1">
              ADMIN, TEACHER, STUDENT
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Môn học</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSubjects}</span>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              Môn học cơ sở đã tạo
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khóa học</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalCourses}</span>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">
              {activeCourses} đã xuất bản
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Presentation className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{classroomStats?.totalClassrooms ?? 0}</span>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">
              {classroomStats?.totalLiveNow ? `${classroomStats.totalLiveNow} lớp đang Live` : `${classroomStats?.activeClassrooms ?? 0} đang hoạt động`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Management Section Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Các Khu vực Quản trị Chuyên biệt</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* User Management */}
          <Link
            href="/admin/users"
            className="bg-white border border-slate-200 hover:border-purple-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Quản lý Người dùng
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Tìm kiếm, quản lý trạng thái tài khoản (Active, Inactive, Banned) và thông tin cá nhân.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Người dùng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Role Management */}
          <Link
            href="/admin/roles"
            className="bg-white border border-slate-200 hover:border-purple-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Quản lý Vai trò (Roles)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Xem thống kê theo vai trò (ADMIN, TEACHER, STUDENT), gán và gỡ vai trò cho thành viên.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Vai trò</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Subject Management */}
          <Link
            href="/admin/subjects"
            className="bg-white border border-slate-200 hover:border-amber-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Quản lý Môn học
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Tạo mới, chỉnh sửa mã/tên môn học, bật/tắt hiển thị môn học trong hệ thống đào tạo.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Môn học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Course Management */}
          <Link
            href="/admin/courses"
            className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Quản lý Khóa học
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Kiểm duyệt khóa học toàn hệ thống, theo dõi xuất bản/lưu trữ và cấu trúc giáo trình.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Khóa học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Classrooms Management */}
          <Link
            href="/admin/classrooms"
            className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Quản lý Lớp học
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Theo dõi toàn bộ lớp học trực tuyến, trạng thái Live, giáo viên giảng dạy và kiểm duyệt đóng/mở lớp.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Lớp học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Promotion Events Management */}
          <Link
            href="/admin/promotions"
            className="bg-white border border-slate-200 hover:border-rose-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                Sự kiện Giảm giá (Flash Sale)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Tạo sự kiện ưu đãi, cấu hình % giảm giá cho các gói thành viên. Tự động hoàn về giá gốc khi hết hạn.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
              <span>Vào Sự kiện Giảm giá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Coupons Management */}
          <Link
            href="/admin/coupons"
            className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Quản lý Mã Giảm giá (Coupons)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Tạo và phát hành mã ưu đãi cùng số lượng giới hạn, theo dõi tiến độ lượt sử dụng thời gian thực.
              </p>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Vào trang Mã Giảm giá</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Trạng thái Cơ sở hạ tầng Backend</h3>
              <p className="text-xs text-slate-500">PostgreSQL Local Database • Spring Boot Security Core</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hoạt động bình thường</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800">Database Engine:</span>
            <p className="text-slate-500 font-mono">PostgreSQL (ai_learning_platform)</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800">Cơ chế xác thực:</span>
            <p className="text-slate-500">Google OAuth 2.0 (OpenID Connect)</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800">Phân quyền (RBAC):</span>
            <p className="text-slate-500">Spring Method Security (@PreAuthorize)</p>
          </div>
        </div>
      </div>

      {/* Modal Tùy biến Xuất Báo Cáo Nền Tảng Excel */}
      <ExportCustomizationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportAdminExcel}
        title="Tùy biến & Xuất Báo Cáo Nền Tảng (Excel)"
        defaultReportTitle="BÁO CÁO TỔNG QUAN VẬN HÀNH TOÀN NỀN TẢNG NQD LMS"
        defaultSignerTitle="BAN GIÁM ĐỐC / QUẢN TRỊ VIÊN HỆ THỐNG"
        format="EXCEL"
      />

      {/* Modal Xem Chi Tiết Người Dùng Đang Online Thực Tế */}
      {isOnlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOnlineModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  🟢
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Danh Sách Người Dùng Đang Online
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Real-time
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tổng cộng {onlineStats?.totalOnline ?? 0} người đang truy cập ({onlineStats?.authenticatedOnline ?? 0} tài khoản đăng nhập, {onlineStats?.guestOnline ?? 0} khách)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOnlineModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setOnlineFilterRole('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    onlineFilterRole === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({onlineStats?.authenticatedOnline ?? 0})
                </button>
                <button
                  onClick={() => setOnlineFilterRole('STUDENT')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    onlineFilterRole === 'STUDENT'
                      ? 'bg-emerald-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Học sinh ({onlineStats?.studentsOnline ?? 0})
                </button>
                <button
                  onClick={() => setOnlineFilterRole('TEACHER')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    onlineFilterRole === 'TEACHER'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Giáo viên ({onlineStats?.teachersOnline ?? 0})
                </button>
                <button
                  onClick={() => setOnlineFilterRole('ADMIN')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    onlineFilterRole === 'ADMIN'
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin ({onlineStats?.adminsOnline ?? 0})
                </button>
              </div>

              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={onlineSearch}
                  onChange={(e) => setOnlineSearch(e.target.value)}
                  placeholder="Tìm theo tên, email, trang..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* User List Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {filteredOnlineUsers.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Không tìm thấy người dùng phù hợp</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chưa có người dùng nào thuộc bộ lọc này trong 3 phút qua.
                  </p>
                </div>
              ) : (
                filteredOnlineUsers.map((u) => {
                  const isTeacher = u.roles?.some((r) => r.includes('TEACHER'));
                  const isAdmin = u.roles?.some((r) => r.includes('ADMIN'));

                  return (
                    <div
                      key={u.userId}
                      className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/60 transition flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <UserAvatar
                            src={u.avatarUrl}
                            name={u.fullName}
                            size="md"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {u.fullName || 'Người dùng'}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wider ${
                                isAdmin
                                  ? 'bg-purple-100 text-purple-800'
                                  : isTeacher
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isAdmin ? 'Quản trị' : isTeacher ? 'Giáo viên' : 'Học sinh'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono text-[10px] font-medium max-w-[150px] sm:max-w-xs truncate">
                          {u.currentPath || '/'}
                        </span>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>
                            {u.lastActiveAgoSeconds <= 5
                              ? 'Vừa xong'
                              : `${u.lastActiveAgoSeconds}s trước`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dữ liệu tự động đồng bộ theo thời gian thực (SSE)
              </span>
              <button
                onClick={() => setIsOnlineModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
