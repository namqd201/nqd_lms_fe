'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Sparkles,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  ChevronRight,
  MessageSquare,
  CornerDownRight,
  Award,
  Megaphone,
  AtSign,
} from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { NotificationResponse } from '@/types/notification';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load unread count periodically
  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore background errors
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
      // Recalculate unread count
      const unread = data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  // Handle open dropdown
  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read
  const handleItemClick = async (notif: NotificationResponse) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read', err);
      }
    }
    setIsOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  // Helper for notification icons
  const getIcon = (type: string) => {
    switch (type) {
      case 'WELCOME':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'ENROLLMENT_SUCCESS':
      case 'ENROLLMENT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ENROLLMENT_PENDING':
      case 'ENROLLMENT_REQUEST':
      case 'STUDENT_JOINED':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'ENROLLMENT_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'COURSE_DISABLED':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'COURSE_ENABLED':
        return <CheckCircle2 className="w-4 h-4 text-[#83C75D]" />;
      case 'DISCUSSION_NEW_THREAD':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'DISCUSSION_REPLY':
        return <CornerDownRight className="w-4 h-4 text-sky-500" />;
      case 'DISCUSSION_ANSWER_ACCEPTED':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'DISCUSSION_MENTION':
        return <AtSign className="w-4 h-4 text-violet-600" />;
      case 'COURSE_ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all focus:outline-none"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />

        {/* Red dot badge when unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-[#83C75D] hover:text-[#6fa84e] flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đánh dấu tất cả đã đọc</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-3 border-[#83C75D]/30 border-t-[#83C75D] rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Các thông báo về khóa học, tiến độ và cập nhật sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                    !notif.isRead ? 'bg-emerald-50/30' : 'bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      !notif.isRead ? 'bg-white shadow-xs border border-slate-100' : 'bg-slate-100'
                    }`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(notif.createdAt)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 self-center" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
