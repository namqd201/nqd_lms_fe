'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import StudentAiTutorWidget from '@/components/StudentAiTutorWidget';
import { useAuth } from '@/context/AuthContext';

import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Header Navbar - Stays fixed at top */}
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {isAuthenticated && !isAdminRoute && (
          <Sidebar
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* AI Tutor Chat Drawer Widget */}
      <StudentAiTutorWidget />
    </div>
  );
};
