'use client';

import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { ProfileForm } from '@/components/ProfileForm';

export default function ProfilePage() {
  return (
    <RoleGuard>
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold rounded-full border border-[#83C75D]/30">
                Phase 3: User & Profile Management
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
            <p className="text-sm text-slate-500 mt-1">
              Xem và cập nhật thông tin cá nhân của bạn trên hệ thống NQD LMS.
            </p>
          </div>

          {/* Profile Form */}
          <ProfileForm />
        </div>
      </div>
    </RoleGuard>
  );
}
