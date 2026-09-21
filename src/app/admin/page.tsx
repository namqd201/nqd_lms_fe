'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin.service';
import { courseService } from '@/services/course.service';
import { UserProfileResponse } from '@/types/user';
import { TeacherCourseResponse } from '@/types/course';
import { SubjectResponse, RoleDetailResponse } from '@/types/admin';
import { reportService } from '@/services/report.service';
import { ExportCustomizationParams } from '@/types/report';
import ExportCustomizationModal from '@/components/ExportCustomizationModal';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [courses, setCourses] = useState<TeacherCourseResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [roles, setRoles] = useState<RoleDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const handleExportAdminExcel = async (params: ExportCustomizationParams) => {
    await reportService.exportAdminPlatformOverviewExcel(params);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, courseData, subjectData, roleData] = await Promise.all([
        adminService.getUsers().catch(() => []),
        courseService.getTeacherCourses().catch(() => []),
        adminService.getSubjects().catch(() => []),
        adminService.getRoles().catch(() => []),
      ]);
      setUsers(userData);
      setCourses(courseData);
      setSubjects(subjectData);
      setRoles(roleData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người dùng</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalUsers}</span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {activeUsers} tài khoản đang hoạt động
            </p>
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
      </div>

      {/* Main Management Section Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Các Khu vực Quản trị Chuyên biệt</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
    </div>
  );
}
