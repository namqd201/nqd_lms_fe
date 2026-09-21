'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';
import { studentService } from '@/services/student.service';
import { teacherService } from '@/services/teacher.service';
import { UserProfileResponse, UpdateProfileRequest } from '@/types/user';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Jack',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Oliver',
];

export const ProfileForm: React.FC = () => {
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const isTeacher = authUser?.roles.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');
  const isStudent = authUser?.roles.some((r) => r === 'STUDENT' || r === 'ROLE_STUDENT');
  const isAdmin = authUser?.roles.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Use role-specific service if applicable, or shared userService
      let data: UserProfileResponse;
      if (isTeacher) {
        data = await teacherService.getProfile();
      } else if (isStudent) {
        data = await studentService.getProfile();
      } else {
        data = await userService.getMyProfile();
      }

      setProfile(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setAvatarUrl(data.avatarUrl || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin hồ sơ';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Họ và tên không được để trống');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    try {
      let updated: UserProfileResponse;
      if (isTeacher) {
        updated = await teacherService.updateProfile(payload);
      } else if (isStudent) {
        updated = await studentService.updateProfile(payload);
      } else {
        updated = await userService.updateMyProfile(payload);
      }

      setProfile(updated);
      setSuccessMessage('Cập nhật hồ sơ cá nhân thành công!');
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8 bg-rose-50 border border-rose-200 rounded-2xl">
        <p className="text-rose-700 font-medium">{errorMessage || 'Không thể tải hồ sơ'}</p>
        <button
          onClick={loadProfile}
          className="mt-4 px-4 py-2 bg-[#83C75D] text-white rounded-xl text-sm font-medium hover:bg-[#72b44e]"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Summary Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#83C75D]/20 via-[#83C75D]/40 to-emerald-200/30" />
          
          <div className="relative mt-8 mb-4 inline-block">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto bg-slate-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#83C75D] text-white border-4 border-white shadow-lg flex items-center justify-center font-bold text-3xl mx-auto">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 translate-x-1">
              <span className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white block" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 leading-tight">{profile.fullName}</h2>
          <p className="text-sm text-slate-500 mb-4">{profile.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
            {profile.roles.map((r) => (
              <RoleBadge key={r} role={r} size="md" />
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-left text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Trạng thái tài khoản:</span>
              <StatusBadge status={profile.status} size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-semibold text-slate-700">{profile.phoneNumber || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ngày tham gia:</span>
              <span className="font-medium text-slate-700">
                {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            {profile.lastLoginAt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Đăng nhập gần nhất:</span>
                <span className="font-medium text-slate-700">
                  {new Date(profile.lastLoginAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(profile.lastLoginAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Role Specific Highlight Banner */}
        {isTeacher && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                👨‍🏫
              </div>
              <h4 className="font-bold text-blue-950 text-sm">Góc Giảng Viên</h4>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Bạn có quyền quản lý khóa học, ngân hàng câu hỏi, soạn đề thi và chấm bài thi cho học sinh.
            </p>
          </div>
        )}

        {isStudent && (
          <div className="bg-gradient-to-br from-[#83C75D]/10 to-emerald-50 border border-[#83C75D]/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#83C75D] text-white flex items-center justify-center font-bold">
                🎓
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Góc Học Sinh</h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Truy cập các khóa học đã đăng ký, làm bài thi trực tuyến và hỏi đáp 24/7 cùng AI Tutor.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Edit Profile Form */}
      <div className="lg:col-span-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa thông tin cá nhân</h3>
            <p className="text-sm text-slate-500">
              Cập nhật thông tin hiển thị của bạn. Các trường vai trò và trạng thái được bảo vệ bởi hệ thống.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Địa chỉ Email (Google OAuth - Không thể thay đổi)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium text-sm cursor-not-allowed"
                />
                <div className="absolute right-3.5 top-3.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#83C75D] focus:ring-4 focus:ring-[#83C75D]/10 rounded-xl text-slate-900 font-medium text-sm transition-all outline-none"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#83C75D] focus:ring-4 focus:ring-[#83C75D]/10 rounded-xl text-slate-900 font-medium text-sm transition-all outline-none"
              />
            </div>

            {/* Avatar URL & Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Ảnh đại diện (URL hoặc chọn mẫu có sẵn)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#83C75D] focus:ring-4 focus:ring-[#83C75D]/10 rounded-xl text-slate-900 font-medium text-sm transition-all outline-none mb-3"
              />

              <div className="mt-2">
                <span className="text-xs text-slate-500 block mb-2">Hoặc chọn avatar hoạt hình ngẫu nhiên:</span>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden transition-all hover:scale-110 ${
                        avatarUrl === preset ? 'border-[#83C75D] ring-2 ring-[#83C75D]/30 scale-105' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 underline ml-1"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Protected fields note */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <svg className="w-4 h-4 text-[#83C75D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Chính sách bảo mật phân quyền (Phase 3)</span>
              </div>
              <p>
                • Bạn chỉ có thể cập nhật thông tin cá nhân của chính mình được xác thực qua SecurityContext.
              </p>
              <p>
                • Việc gán vai trò (Roles) và trạng thái tài khoản chỉ có thể thực hiện bởi Quản trị viên (Admin).
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-semibold text-sm shadow-md shadow-[#83C75D]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
