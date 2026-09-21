'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { adminService } from '@/services/admin.service';
import { teacherApplicationService } from '@/services/teacher-application.service';
import { UserProfileResponse, UserSubscriptionResponse } from '@/types/user';
import { MembershipPlanResponse } from '@/types/membership';
import { UserStatus } from '@/types/auth';
import { RoleBadge } from '@/components/RoleBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { GraduationCap, ChevronRight, UserCheck, Clock } from 'lucide-react';

const AVAILABLE_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<UserProfileResponse | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalRoleToAdd, setModalRoleToAdd] = useState<string>('TEACHER');
  const [modalStatus, setModalStatus] = useState<UserStatus>('ACTIVE');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // VIP / Subscription State in Modal
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState<boolean>(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlanResponse[]>([]);
  const [selectedVipPlanCode, setSelectedVipPlanCode] = useState<string>('VIP_STUDENT_MONTHLY');
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(1);
  const [vipReason, setVipReason] = useState<string>('Cấp miễn phí bởi Ban quản trị');
  const [isGrantingVip, setIsGrantingVip] = useState<boolean>(false);
  const [pendingTeacherCount, setPendingTeacherCount] = useState<number>(0);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [data, count] = await Promise.all([
        adminService.getUsers(
          searchQuery.trim() || undefined,
          statusFilter !== 'ALL' ? statusFilter : undefined
        ),
        teacherApplicationService.getPendingCount().catch(() => 0),
      ]);
      setUsers(data);
      setPendingTeacherCount(count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách người dùng';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Statistics calculation
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveUsers = users.filter((u) => u.status === 'INACTIVE').length;
  const bannedUsers = users.filter((u) => u.status === 'BANNED').length;
  const adminCount = users.filter((u) => u.roles.some((r) => r.includes('ADMIN'))).length;
  const teacherCount = users.filter((u) => u.roles.some((r) => r.includes('TEACHER'))).length;
  const studentCount = users.filter((u) => u.roles.some((r) => r.includes('STUDENT'))).length;
  const vipCount = users.filter((u) => u.isVip).length;

  const handleQuickStatusChange = async (user: UserProfileResponse, newStatus: UserStatus) => {
    try {
      const updated = await adminService.updateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setSuccessMessage(`Đã cập nhật trạng thái của ${user.fullName} thành ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại';
      setErrorMessage(msg);
    }
  };

  const handleAssignRole = async (userId: string, roleName: string) => {
    setIsActionLoading(true);
    try {
      const updated = await adminService.assignRole(userId, roleName);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      if (selectedUser?.id === userId) setSelectedUser(updated);
      setSuccessMessage(`Đã gán vai trò ${roleName} cho người dùng`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gán vai trò thất bại';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleName: string) => {
    setIsActionLoading(true);
    try {
      const updated = await adminService.removeRole(userId, roleName);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      if (selectedUser?.id === userId) setSelectedUser(updated);
      setSuccessMessage(`Đã gỡ vai trò ${roleName} khỏi người dùng`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gỡ vai trò thất bại';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveModal = async () => {
    if (!selectedUser) return;
    setIsActionLoading(true);
    try {
      if (modalStatus !== selectedUser.status) {
        const updated = await adminService.updateUserStatus(selectedUser.id, modalStatus);
        setSelectedUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
      }
      setSuccessMessage(`Cập nhật người dùng ${selectedUser.fullName} thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const openUserModal = async (user: UserProfileResponse) => {
    setSelectedUser(user);
    setModalStatus(user.status);
    setModalOpen(true);
    setUserSubscription(null);
    setIsLoadingSubscription(true);

    const isTeacher = user.roles.some((r) => r.includes('TEACHER'));
    const defaultCode = isTeacher ? 'TEACHER_PRO_MONTHLY' : 'VIP_STUDENT_MONTHLY';
    setSelectedVipPlanCode(defaultCode);
    setSelectedDurationMonths(1);
    setVipReason('Cấp miễn phí bởi Ban quản trị');

    try {
      const [sub, plans] = await Promise.all([
        adminService.getUserSubscription(user.id).catch(() => null),
        availablePlans.length === 0 ? adminService.getMembershipPlans().catch(() => []) : Promise.resolve(availablePlans),
      ]);
      setUserSubscription(sub);
      if (plans && Array.isArray(plans) && plans.length > 0) {
        if (availablePlans.length === 0) {
          setAvailablePlans(plans);
        }
        const matched = plans.find((p) => {
          const code = p.planCode || p.code || '';
          if (code.toUpperCase().includes('FREE')) return false;
          return isTeacher ? p.userType === 'TEACHER' : p.userType === 'STUDENT';
        });
        if (matched) {
          setSelectedVipPlanCode(matched.planCode || matched.code || defaultCode);
        }
      }
    } catch {
      // Fallback ignore
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleGrantVip = async () => {
    if (!selectedUser) return;
    setIsGrantingVip(true);
    setErrorMessage(null);
    try {
      const chosenPlan = availablePlans.find(
        (p) => (p.planCode || p.code) === selectedVipPlanCode || p.id === selectedVipPlanCode
      );
      const targetPlanCode = chosenPlan?.planCode || chosenPlan?.code || selectedVipPlanCode;
      const targetPlanId = chosenPlan?.id;

      const updatedSub = await adminService.grantUserVip(selectedUser.id, {
        planId: targetPlanId,
        planCode: targetPlanCode,
        durationMonths: selectedDurationMonths,
        reason: vipReason.trim() || undefined,
      });
      setUserSubscription(updatedSub);
      setSuccessMessage(`Đã cấp quyền VIP (${updatedSub.planName || targetPlanCode}) thành công cho ${selectedUser.fullName}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cấp quyền VIP thất bại';
      setErrorMessage(msg);
    } finally {
      setIsGrantingVip(false);
    }
  };

  const handleRevokeVip = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền VIP của ${selectedUser.fullName} và chuyển về gói Cơ bản không?`)) {
      return;
    }
    setIsGrantingVip(true);
    setErrorMessage(null);
    try {
      const updatedSub = await adminService.revokeUserVip(selectedUser.id, 'Thu hồi bởi Ban quản trị');
      setUserSubscription(updatedSub);
      setSuccessMessage(`Đã thu hồi gói VIP của ${selectedUser.fullName}. Tài khoản trở về gói Cơ bản.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thu hồi quyền VIP thất bại';
      setErrorMessage(msg);
    } finally {
      setIsGrantingVip(false);
    }
  };

  return (
    <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  Admin Module
                </span>
                <span className="text-xs text-slate-400 font-semibold">•</span>
                <span className="text-xs text-slate-500 font-medium">Phase 3: User Administration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Quản lý Người Dùng & Phân Quyền
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tìm kiếm, kích hoạt/khóa tài khoản và phân quyền vai trò (Admin, Teacher, Student).
              </p>
            </div>

            <button
              onClick={fetchUsers}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#83C75D]' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>

          {/* Teacher Application Review Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Xét duyệt Hồ sơ Đăng ký Giáo viên & Gia sư
                  </h4>
                  {pendingTeacherCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                      {pendingTeacherCount} chờ duyệt
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {pendingTeacherCount > 0
                    ? `Hiện có ${pendingTeacherCount} ứng viên đang nộp hồ sơ, giấy tờ & bằng cấp chờ Ban Quản Trị thẩm định.`
                    : 'Thẩm định thông tin, bằng cấp, thẻ sinh viên và cấp quyền ROLE_TEACHER cho các đối tác giảng dạy.'}
                </p>
              </div>
            </div>
            <Link
              href="/admin/teacher-verifications"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#83C75D] text-white text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đi đến trang xét duyệt ({pendingTeacherCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Toast Messages */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-sm shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
                ✕
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tổng người dùng
              </span>
              <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Hoạt động
              </span>
              <span className="text-2xl font-black text-emerald-600">{activeUsers}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                Ngừng hoạt động
              </span>
              <span className="text-2xl font-black text-amber-600">{inactiveUsers}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                Đã bị khóa
              </span>
              <span className="text-2xl font-black text-rose-600">{bannedUsers}</span>
            </div>
            <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                Quản trị viên
              </span>
              <span className="text-2xl font-black text-purple-700">{adminCount}</span>
            </div>
            <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Giảng viên
              </span>
              <span className="text-2xl font-black text-blue-700">{teacherCount}</span>
            </div>
            <div className="bg-white border border-[#83C75D]/30 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-[#4e8231] uppercase tracking-wider block mb-1">
                Học sinh
              </span>
              <span className="text-2xl font-black text-[#4e8231]">{studentCount}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-300 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                👑 Gói VIP / PRO
              </span>
              <span className="text-2xl font-black text-amber-700">{vipCount}</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên hoặc email người dùng..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#83C75D] focus:bg-white rounded-xl text-sm outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#83C75D]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                <option value="BANNED">Bị khóa (BANNED)</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Đang tải danh sách người dùng...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy người dùng</h4>
                <p className="text-xs text-slate-500">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ lọc trạng thái.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Người dùng</th>
                      <th className="py-3.5 px-6">Gói VIP / Hội viên</th>
                      <th className="py-3.5 px-6">Trạng thái</th>
                      <th className="py-3.5 px-6">Vai trò (Roles)</th>
                      <th className="py-3.5 px-6">Ngày tham gia</th>
                      <th className="py-3.5 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* User info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#83C75D] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-[#4e8231] transition-colors">
                                {u.fullName}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                              {u.phoneNumber && (
                                <p className="text-[11px] text-slate-400">📞 {u.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* VIP Package badge */}
                        <td className="py-4 px-6">
                          {u.isVip ? (
                            <div className="inline-flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                                <span>👑</span>
                                <span>{u.currentPlanName || u.currentPlanCode || 'VIP'}</span>
                              </span>
                              {u.subscriptionEndDate && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Hết hạn: {new Date(u.subscriptionEndDate).getFullYear() > 2100 ? 'Vĩnh viễn' : new Date(u.subscriptionEndDate).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              🌱 {u.currentPlanName || 'Gói Cơ bản'}
                            </span>
                          )}
                        </td>

                        {/* Status with Quick Toggle */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2">
                            <StatusBadge status={u.status} size="sm" />
                            <select
                              value={u.status}
                              onChange={(e) => handleQuickStatusChange(u, e.target.value as UserStatus)}
                              className="text-[11px] text-slate-500 bg-transparent hover:bg-slate-100 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 cursor-pointer outline-none"
                              title="Thay đổi trạng thái nhanh"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                              <option value="BANNED">BANNED</option>
                            </select>
                          </div>
                        </td>

                        {/* Roles with Quick Remove */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                            {u.roles.map((role) => (
                              <RoleBadge
                                key={role}
                                role={role}
                                size="sm"
                                onRemove={
                                  u.roles.length > 1
                                    ? () => handleRemoveRole(u.id, role)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => openUserModal(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#83C75D] hover:bg-[#83C75D]/10 hover:text-[#4e8231] text-xs font-semibold text-slate-700 shadow-sm transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Chi tiết & Phân quyền
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Modal: View & Edit User / Roles */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.fullName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#83C75D] bg-slate-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#83C75D] text-white font-bold text-xl flex items-center justify-center">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h3>
                    {selectedUser.isVip && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        👑 VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ID: {selectedUser.id}</p>
                </div>
              </div>

              {/* VIP / Membership Management (Admin Direct Upgrade) */}
              <div className="p-4 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/50 border border-amber-200/80 rounded-2xl space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Gói Hội Viên & Nâng Cấp VIP (Cấp Miễn Phí bởi Admin)
                      </h4>
                      <p className="text-[11px] text-amber-700/80">
                        Dành riêng cho Admin tặng quyền VIP/PRO cho học sinh, giáo viên thân thiết hoặc đối tác kiểm thử.
                      </p>
                    </div>
                  </div>
                  {userSubscription?.isVip && (
                    <button
                      type="button"
                      disabled={isGrantingVip}
                      onClick={handleRevokeVip}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-100/80 hover:bg-rose-200 border border-rose-200 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      Thu hồi VIP
                    </button>
                  )}
                </div>

                {isLoadingSubscription ? (
                  <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    Đang tải thông tin gói cước...
                  </div>
                ) : (
                  <>
                    {/* Current Plan Status */}
                    <div className="flex items-center justify-between p-2.5 bg-white/90 border border-amber-200/60 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-500">Gói hiện tại: </span>
                        <span className="font-bold text-slate-800">
                          {userSubscription?.planName || (userSubscription?.isVip ? 'VIP / PRO' : 'Gói Cơ bản (Miễn phí)')}
                        </span>
                        {userSubscription?.planCode && (
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            ({userSubscription.planCode})
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500">Hạn dùng: </span>
                        <span className="font-semibold text-amber-800">
                          {userSubscription?.endDate
                            ? new Date(userSubscription.endDate).getFullYear() > 2100
                              ? 'Vĩnh viễn (Lifetime)'
                              : new Date(userSubscription.endDate).toLocaleDateString('vi-VN')
                            : 'Không giới hạn'}
                        </span>
                      </div>
                    </div>

                    {/* Grant / Upgrade Form */}
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Chọn Gói VIP / PRO:
                          </label>
                          <select
                            value={selectedVipPlanCode}
                            onChange={(e) => setSelectedVipPlanCode(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
                          >
                            {availablePlans.length > 0 ? (
                              availablePlans
                                .filter((p) => {
                                  const code = p.planCode || p.code || '';
                                  return !code.toUpperCase().includes('FREE');
                                })
                                .map((p) => {
                                  const code = p.planCode || p.code || '';
                                  const roleLabel = p.userType === 'TEACHER' ? 'Giáo viên' : 'Học sinh';
                                  const cycleLabel =
                                    p.billingCycle === 'MONTHLY'
                                      ? 'Tháng'
                                      : p.billingCycle === 'YEARLY'
                                      ? 'Năm'
                                      : p.billingCycle === 'QUARTERLY'
                                      ? 'Quý'
                                      : p.billingCycle === 'LIFETIME'
                                      ? 'Trọn đời'
                                      : '';
                                  return (
                                    <option key={p.id || code} value={code}>
                                      {p.name} ({roleLabel}{cycleLabel ? ` - ${cycleLabel}` : ''})
                                    </option>
                                  );
                                })
                            ) : (
                              <>
                                <option value="VIP_STUDENT_MONTHLY">👑 VIP Học Sinh (1 Tháng)</option>
                                <option value="VIP_STUDENT_YEARLY">👑 VIP Học Sinh (1 Năm)</option>
                                <option value="TEACHER_PRO_MONTHLY">🌟 PRO Giáo Viên (1 Tháng)</option>
                                <option value="TEACHER_PRO_YEARLY">🌟 PRO Giáo Viên (1 Năm)</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Thời hạn kích hoạt:
                          </label>
                          <select
                            value={selectedDurationMonths}
                            onChange={(e) => setSelectedDurationMonths(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
                          >
                            <option value={1}>1 tháng</option>
                            <option value={3}>3 tháng</option>
                            <option value={6}>6 tháng</option>
                            <option value={12}>1 năm (12 tháng)</option>
                            <option value={-1}>♾️ Vĩnh viễn (Trọn đời)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Lý do cấp (Ghi chú nội bộ):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={vipReason}
                            onChange={(e) => setVipReason(e.target.value)}
                            placeholder="Ví dụ: Tài khoản người thân, tester dự án, đối tác..."
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            disabled={isGrantingVip}
                            onClick={handleGrantVip}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                          >
                            {isGrantingVip ? 'Đang cấp...' : '⚡ Cấp VIP ngay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Role Management Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vai trò hiện tại (Roles)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[50px] items-center">
                  {selectedUser.roles.map((role) => (
                    <RoleBadge
                      key={role}
                      role={role}
                      onRemove={
                        selectedUser.roles.length > 1
                          ? () => handleRemoveRole(selectedUser.id, role)
                          : undefined
                      }
                    />
                  ))}
                </div>

                {/* Add Role Control */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={modalRoleToAdd}
                    onChange={(e) => setModalRoleToAdd(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#83C75D]"
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        + Gán vai trò {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isActionLoading || selectedUser.roles.some((r) => r.includes(modalRoleToAdd))}
                    onClick={() => handleAssignRole(selectedUser.id, modalRoleToAdd)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Gán vai trò
                  </button>
                </div>
              </div>

              {/* Status Management */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trạng thái tài khoản (Status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ACTIVE', 'INACTIVE', 'BANNED'] as UserStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                        modalStatus === st
                          ? st === 'ACTIVE'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/20'
                            : st === 'INACTIVE'
                            ? 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-500/20'
                            : 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Meta Info */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Số điện thoại:</span>
                  <span className="font-semibold text-slate-700">{selectedUser.phoneNumber || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ngày khởi tạo:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedUser.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedUser.lastLoginAt && (
                  <div className="flex justify-between">
                    <span>Đăng nhập gần nhất:</span>
                    <span className="font-semibold text-slate-700">{new Date(selectedUser.lastLoginAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleSaveModal}
                  className="px-5 py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-semibold text-xs shadow-md shadow-[#83C75D]/20 transition-all disabled:opacity-50"
                >
                  {isActionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
