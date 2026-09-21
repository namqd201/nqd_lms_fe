'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '../UserAvatar';
import {
  Users,
  ShieldAlert,
  BookMarked,
  BookOpen,
  HelpCircle,
  Activity,
  Settings,
  Home,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  GraduationCap,
} from 'lucide-react';

interface AdminMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
}

interface AdminMenuGroup {
  groupTitle: string;
  items: AdminMenuItem[];
}

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const adminMenuGroups: AdminMenuGroup[] = [
    {
      groupTitle: 'Quản trị Tài khoản & Phân quyền',
      items: [
        {
          href: '/admin',
          label: 'Tổng quan (Dashboard)',
          icon: BarChart3,
          exact: true,
        },
        {
          href: '/admin/users',
          label: 'Quản lý Người dùng',
          icon: Users,
          badge: 'Users',
        },
        {
          href: '/admin/roles',
          label: 'Quản lý Vai trò (Roles)',
          icon: ShieldAlert,
          badge: 'Roles',
        },
        {
          href: '/admin/teacher-verifications',
          label: 'Duyệt hồ sơ giáo viên',
          icon: GraduationCap,
          badge: 'Xét duyệt',
        },
      ],
    },
    {
      groupTitle: 'Quản lý Đào tạo & Khảo thí',
      items: [
        {
          href: '/admin/subjects',
          label: 'Quản lý Môn học',
          icon: BookMarked,
          badge: 'Subjects',
        },
        {
          href: '/admin/courses',
          label: 'Quản lý Khóa học',
          icon: BookOpen,
          badge: 'Courses',
        },
        {
          href: '/teacher/questions',
          label: 'Ngân hàng Câu hỏi',
          icon: HelpCircle,
          badge: 'Questions',
        },
        {
          href: '/teacher/exams',
          label: 'Quản lý Đề thi',
          icon: FileSpreadsheet,
          badge: 'Exams',
        },
      ],
    },
    {
      groupTitle: 'Tài chính & Doanh thu',
      items: [
        {
          href: '/admin/finance',
          label: 'Quản lý Tài chính & Payout',
          icon: BarChart3,
          badge: 'Finance',
        },
      ],
    },
    {
      groupTitle: 'Hệ thống & Tiện ích',
      items: [
        {
          href: '/admin/logs',
          label: 'Nhật ký Hoạt động (Logs)',
          icon: Activity,
        },
        {
          href: '/admin/settings',
          label: 'Cấu hình Hệ thống',
          icon: Settings,
        },
      ],
    },
    {
      groupTitle: 'Lối tắt truy cập',
      items: [
        {
          href: '/',
          label: 'Về Trang chủ LMS',
          icon: Home,
        },
        {
          href: '/courses',
          label: 'Danh mục Khóa học',
          icon: GraduationCap,
        },
        {
          href: '/profile',
          label: 'Hồ sơ cá nhân',
          icon: User,
        },
      ],
    },
  ];

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 z-30 flex flex-col justify-between shrink-0 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Header Section inside Sidebar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="NQD-LMS Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-xs"
            />
            <div>
              <span className="font-extrabold text-slate-900 text-sm leading-none block">
                NQD-LMS
              </span>
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <img
            src="/logo.png"
            alt="NQD-LMS Logo"
            className="w-8 h-8 rounded-xl object-contain mx-auto shadow-xs"
          />
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
            collapsed ? 'hidden sm:block mx-auto mt-2' : ''
          }`}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {adminMenuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <h5 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.groupTitle}
              </h5>
            )}

            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-purple-200/80 text-purple-800'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-purple-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Card in Sidebar */}
      {user && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 truncate">
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.fullName}
                  size="md"
                  borderColor="border-slate-200"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {user.fullName}
                  </p>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                    Quản trị viên
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <UserAvatar
                src={user.avatarUrl}
                name={user.fullName}
                size="md"
                borderColor="border-slate-200"
              />
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-rose-600"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
