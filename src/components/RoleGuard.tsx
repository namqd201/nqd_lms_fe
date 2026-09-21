'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface RoleGuardProps {
  allowedRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles = [], children, fallback }) => {
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-[#83C75D]/15 text-[#83C75D] rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Yêu cầu đăng nhập</h3>
        <p className="text-sm text-slate-600 mb-6">Bạn cần đăng nhập để truy cập trang này.</p>
        <button
          onClick={loginWithGoogle}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-medium shadow-sm transition-all"
        >
          Đăng nhập bằng Google
        </button>
      </div>
    );
  }

  if (allowedRoles.length > 0) {
    const hasRole = user.roles.some((r) => {
      const clean = r.startsWith('ROLE_') ? r.substring(5) : r;
      return allowedRoles.some((ar) => ar === clean || `ROLE_${ar}` === r);
    });

    if (!hasRole) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="max-w-md mx-auto my-12 p-8 bg-white border border-rose-100 rounded-2xl shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Không đủ quyền truy cập</h3>
          <p className="text-sm text-slate-600 mb-6">
            Trang này chỉ dành cho tài khoản có vai trò: <strong className="text-slate-800">{allowedRoles.join(', ')}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-all"
          >
            Quay lại Trang chủ
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
};
