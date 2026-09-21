'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { RoleDetailResponse } from '@/types/admin';
import { UserProfileResponse } from '@/types/user';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Users,
  Search,
  UserPlus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleDetailResponse[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('TEACHER');
  const [roleUsers, setRoleUsers] = useState<UserProfileResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedUserIdToAssign, setSelectedUserIdToAssign] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getRoles();
      setRoles(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoleUsers = async (roleName: string) => {
    setIsUsersLoading(true);
    try {
      const users = await adminService.getUsersByRole(roleName);
      setRoleUsers(users);
    } catch {
      setRoleUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadAllUsersForModal = async () => {
    try {
      const users = await adminService.getUsers();
      setAllUsers(users);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRoles();
    loadAllUsersForModal();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRoleUsers(selectedRole);
    }
  }, [selectedRole]);

  const handleAssignRole = async () => {
    if (!selectedUserIdToAssign) return;
    setIsAssigning(true);
    setErrorMessage(null);
    try {
      await adminService.assignRole(selectedUserIdToAssign, selectedRole);
      setSuccessMessage(`Đã gán vai trò ${selectedRole} cho người dùng thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setAssignModalOpen(false);
      setSelectedUserIdToAssign('');
      loadRoles();
      loadRoleUsers(selectedRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gán vai trò thất bại';
      setErrorMessage(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (userId: string, userFullName: string) => {
    if (!confirm(`Bạn có chắc muốn gỡ vai trò ${selectedRole} khỏi người dùng "${userFullName}"?`)) {
      return;
    }
    try {
      await adminService.removeRole(userId, selectedRole);
      setSuccessMessage(`Đã gỡ vai trò ${selectedRole} khỏi ${userFullName}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadRoles();
      loadRoleUsers(selectedRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gỡ vai trò thất bại';
      setErrorMessage(msg);
    }
  };

  const filteredUsers = roleUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (name: string) => {
    if (name === 'ADMIN') return ShieldAlert;
    if (name === 'TEACHER') return GraduationCap;
    return Sparkles;
  };

  const getRoleColor = (name: string) => {
    if (name === 'ADMIN') return 'text-purple-700 bg-purple-100 border-purple-200';
    if (name === 'TEACHER') return 'text-blue-700 bg-blue-100 border-blue-200';
    return 'text-[#4e8231] bg-[#83C75D]/20 border-[#83C75D]/40';
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Toast feedback */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Admin Module
            </span>
            <span className="text-xs text-slate-400 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Role & Permission Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Vai trò (Roles)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xem danh sách các vai trò hệ thống, số lượng thành viên và phân quyền thành viên theo vai trò.
          </p>
        </div>

        <button
          onClick={() => {
            loadRoles();
            if (selectedRole) loadRoleUsers(selectedRole);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {roles.map((r) => {
          const isSelected = selectedRole === r.name;
          const Icon = getRoleIcon(r.name);
          const colorClass = getRoleColor(r.name);

          return (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.name)}
              className={`text-left p-6 rounded-3xl border transition-all duration-200 relative ${
                isSelected
                  ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-900">{r.userCount}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">{r.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {r.description || `Vai trò ${r.name} trong hệ thống LMS`}
              </p>
              {isSelected && (
                <span className="absolute bottom-3 right-4 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                  Đang chọn
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Member Management for Selected Role */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Danh sách thành viên thuộc vai trò:</span>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-black">
                {selectedRole}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Có {filteredUsers.length} người dùng đang nắm giữ vai trò này.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thành viên..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-purple-500"
              />
            </div>

            <button
              onClick={() => setAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-600/30 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Gán thành viên</span>
            </button>
          </div>
        </div>

        {/* Member Table */}
        {isUsersLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách thành viên...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy thành viên</h4>
            <p className="text-xs text-slate-500">Bấm &quot;Gán thành viên&quot; để thêm người dùng vào vai trò này.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Người dùng</th>
                  <th className="py-3 px-6">Trạng thái</th>
                  <th className="py-3 px-6">Tất cả vai trò</th>
                  <th className="py-3 px-6">Ngày tham gia</th>
                  <th className="py-3 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-slate-400 text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleRemoveRole(u.id, u.fullName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors"
                        title={`Gỡ vai trò ${selectedRole}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Gỡ vai trò</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Assign Role to User */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Gán vai trò cho người dùng</h3>
                <p className="text-xs text-slate-500">
                  Thêm vai trò <span className="font-bold text-purple-700">{selectedRole}</span> cho tài khoản
                </p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn người dùng:
              </label>
              <select
                value={selectedUserIdToAssign}
                onChange={(e) => setSelectedUserIdToAssign(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:bg-white"
              >
                <option value="">-- Chọn tài khoản người dùng --</option>
                {allUsers
                  .filter((u) => !u.roles.includes(selectedRole))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                disabled={!selectedUserIdToAssign || isAssigning}
                onClick={handleAssignRole}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isAssigning ? 'Đang gán...' : 'Xác nhận gán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
