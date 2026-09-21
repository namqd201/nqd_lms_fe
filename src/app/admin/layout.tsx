'use client';

import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="min-h-[calc(100vh-4rem)] flex bg-slate-50">
        {/* Left Sidebar */}
        <AdminSidebar />

        {/* Right Content Area */}
        <main className="flex-1 overflow-x-hidden p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
