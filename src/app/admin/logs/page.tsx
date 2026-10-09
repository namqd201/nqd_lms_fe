'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ShieldCheck,
  Clock,
  Search,
  Calendar,
  Filter,
  User as UserIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Video,
  LogIn,
  LogOut,
  BookOpen,
  UserCheck,
  ShieldAlert,
  X,
  Laptop,
  CheckCircle2,
  CalendarDays,
  Flame,
  ArrowRight
} from 'lucide-react';
import { auditService } from '@/services/audit.service';
import { AuditLogItem, AuditStats } from '@/types/audit';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'all' | 'date' | 'month'>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // User inspect drawer / modal
  const [inspectedUser, setInspectedUser] = useState<{ id: string; name: string; email?: string | null } | null>(null);
  const [userTimelineLogs, setUserTimelineLogs] = useState<AuditLogItem[]>([]);
  const [userTimelineLoading, setUserTimelineLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch stats once or on refresh
  const fetchStats = async () => {
    try {
      const res = await auditService.getAuditStats();
      setStats(res);
    } catch (err) {
      console.warn('Failed to fetch audit stats:', err);
    }
  };

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Parameters<typeof auditService.getAuditLogs>[0] = {
        page,
        size: pageSize,
      };

      if (debouncedSearch.trim()) params.searchTerm = debouncedSearch.trim();
      if (selectedAction !== 'ALL') params.action = selectedAction;

      if (filterMode === 'date' && selectedDate) {
        params.date = selectedDate;
      } else if (filterMode === 'month') {
        params.year = selectedYear;
        params.month = selectedMonth;
      }

      const res = await auditService.getAuditLogs(params);
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, selectedAction, filterMode, selectedDate, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedAction('ALL');
    setFilterMode('all');
    setSelectedDate('');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setPage(0);
  };

  const handleInspectUser = async (user: { id: string; name: string; email?: string | null }) => {
    setInspectedUser(user);
    setUserTimelineLoading(true);
    try {
      let dateParam: string | undefined = undefined;
      let yearParam: number | undefined = undefined;
      let monthParam: number | undefined = undefined;

      if (filterMode === 'date' && selectedDate) {
        dateParam = selectedDate;
      } else if (filterMode === 'month') {
        yearParam = selectedYear;
        monthParam = selectedMonth;
      }

      const timeline = await auditService.getUserAuditLogs(user.id, dateParam, yearParam, monthParam);
      setUserTimelineLogs(timeline || []);
    } catch (err) {
      console.error('Failed to load user timeline:', err);
    } finally {
      setUserTimelineLoading(false);
    }
  };

  // Format action badges & descriptions
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CLASSROOM_JOIN')) {
      return {
        label: 'Vào lớp học',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (act.includes('CLASSROOM_LEAVE')) {
      return {
        label: 'Rời lớp học',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <LogOut className="w-3.5 h-3.5 text-amber-600" />,
      };
    }
    if (act.includes('ONLINE_MEETING') || act.includes('LIVE')) {
      return {
        label: 'Phòng học trực tuyến',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Video className="w-3.5 h-3.5 text-blue-600" />,
      };
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return {
        label: 'Đăng nhập',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: <LogIn className="w-3.5 h-3.5 text-teal-600" />,
      };
    }
    if (act.includes('ROLE') || act.includes('USER_STATUS')) {
      return {
        label: 'Phân quyền / Tài khoản',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />,
      };
    }
    return {
      label: action,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <Activity className="w-3.5 h-3.5 text-slate-500" />,
    };
  };

  // Helper date formatter
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      };
    } catch {
      return { time: '--:--', date: dateStr };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#5e963e] border border-[#83C75D]/30">
              Admin Shield
            </span>
            <span className="text-xs text-slate-300 font-semibold">•</span>
            <span className="text-xs text-slate-500 font-medium">Bảo mật & Giám sát hoạt động</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Nhật ký Hoạt động Người dùng</span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-mono font-semibold">
              Audit Logs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Theo dõi chi tiết các thao tác của người dùng trên toàn hệ thống (tham gia lớp học, vào phòng trực tuyến, đăng nhập...). Chỉ Admin mới có quyền truy cập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total logs today */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hoạt động hôm nay</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {stats ? stats.totalLogsToday.toLocaleString() : '...'}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ghi nhận tự động thời gian thực
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#83C75D]/10 text-[#67a544] flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active users today */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người dùng hoạt động</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {stats ? stats.activeUsersToday.toLocaleString() : '...'}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Tương tác trong ngày
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Live Meeting Joins */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học trực tuyến</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {stats && stats.topActions ? (stats.topActions['ONLINE_MEETING_JOIN'] || 0).toLocaleString() : '0'}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Lượt vào phòng học live
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Top Action */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hành vi sôi nổi nhất</p>
            <h3 className="text-sm font-black text-slate-800 mt-1 truncate max-w-[150px]">
              {stats && stats.topActions && Object.keys(stats.topActions).length > 0
                ? Object.keys(stats.topActions)[0]
                : 'Chưa có dữ liệu'}
            </h3>
            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-1 mt-1">
              <Flame className="w-3 h-3 text-purple-500" />
              Chiếm tỉ trọng cao nhất
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học viên, email, hành động, hoặc từ khóa mô tả..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#83C75D] cursor-pointer"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="CLASSROOM_JOIN">Vào lớp học (CLASSROOM_JOIN)</option>
              <option value="CLASSROOM_LEAVE">Rời lớp học (CLASSROOM_LEAVE)</option>
              <option value="ONLINE_MEETING_JOIN">Vào phòng trực tuyến (ONLINE_MEETING_JOIN)</option>
              <option value="USER_LOGIN">Đăng nhập hệ thống (USER_LOGIN)</option>
              <option value="ROLE_ASSIGNED">Phân quyền vai trò</option>
            </select>
          </div>
        </div>

        {/* Date / Month Picker Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#6aa947]" />
              Khoảng thời gian:
            </span>

            {/* Filter mode pill buttons */}
            <button
              onClick={() => {
                setFilterMode('all');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả thời gian
            </button>

            <button
              onClick={() => {
                setFilterMode('date');
                if (!selectedDate) {
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                filterMode === 'date'
                  ? 'bg-[#83C75D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Theo ngày cụ thể
            </button>

            <button
              onClick={() => {
                setFilterMode('month');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                filterMode === 'month'
                  ? 'bg-[#83C75D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Theo tháng & năm
            </button>

            {/* Specific Date input */}
            {filterMode === 'date' && (
              <div className="flex items-center gap-2 ml-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(0);
                  }}
                  className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                    setPage(0);
                  }}
                  className="text-[11px] text-[#5e963e] hover:underline font-bold"
                >
                  Hôm nay
                </button>
              </div>
            )}

            {/* Month & Year input */}
            {filterMode === 'month' && (
              <div className="flex items-center gap-2 ml-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Tháng:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setPage(0);
                  }}
                  className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>

                <span className="text-slate-400 font-medium ml-1">Năm:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setPage(0);
                  }}
                  className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedAction !== 'ALL' || filterMode !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium underline transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. AUDIT LOGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/75 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách Hoạt động ({totalElements.toLocaleString()} sự kiện)
            </span>
          </div>

          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đang giám sát</span>
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#83C75D]" />
            <p className="text-xs font-semibold">Đang tải nhật ký kiểm toán...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy hoạt động nào phù hợp</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm, ngày tháng hoặc chọn loại hành động khác.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);
              const dt = formatDateTime(log.createdAt);

              return (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* User Avatar or Default */}
                    <div className="relative shrink-0 mt-0.5">
                      {log.userAvatarUrl ? (
                        <img
                          src={log.userAvatarUrl}
                          alt={log.userName}
                          className="w-9 h-9 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#5e963e] flex items-center justify-center font-bold text-xs border border-emerald-100">
                          {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {/* User Info & Role */}
                      <div className="flex flex-wrap items-center gap-2">
                        {log.userId ? (
                          <button
                            onClick={() =>
                              handleInspectUser({
                                id: log.userId!,
                                name: log.userName,
                                email: log.userEmail,
                              })
                            }
                            className="font-bold text-slate-900 hover:text-[#5e963e] hover:underline text-left cursor-pointer transition"
                            title="Bấm để xem toàn bộ lịch sử hoạt động của người này"
                          >
                            {log.userName}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-900">{log.userName}</span>
                        )}

                        {log.userRole && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                            {log.userRole}
                          </span>
                        )}

                        {log.userEmail && (
                          <span className="text-[11px] text-slate-400">
                            ({log.userEmail})
                          </span>
                        )}
                      </div>

                      {/* Action & Entity */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[11px] font-mono text-slate-400">
                          {log.action}
                        </span>

                        {log.entityType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            {log.entityType}
                          </span>
                        )}
                      </div>

                      {/* Log details */}
                      <p className="text-slate-700 text-xs font-normal pt-0.5 leading-relaxed">
                        {log.details}
                      </p>

                      {/* Device & IP if available */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-slate-400" />
                            IP: {log.ipAddress}
                          </span>
                        )}
                        {log.userId && (
                          <button
                            onClick={() =>
                              handleInspectUser({
                                id: log.userId!,
                                name: log.userName,
                                email: log.userEmail,
                              })
                            }
                            className="text-[#5e963e] font-semibold hover:underline flex items-center gap-0.5 font-sans"
                          >
                            Xem dòng thời gian của người này <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right shrink-0 text-slate-400 sm:self-start pt-1">
                    <p className="font-bold text-slate-700 text-xs flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dt.time}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{dt.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Trang <span className="font-bold text-slate-700">{page + 1}</span> / {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. MODAL / DRAWER: XEM DÒNG THỜI GIAN HOẠT ĐỘNG CỦA 1 NGƯỜI DÙNG */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#83C75D]/15 text-[#5e963e] flex items-center justify-center font-bold text-base">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Lịch sử hoạt động: {inspectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {inspectedUser.email || 'Người dùng'} • {filterMode === 'date' && selectedDate ? `Ngày ${selectedDate}` : filterMode === 'month' ? `Tháng ${selectedMonth}/${selectedYear}` : 'Toàn thời gian'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedUser(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Chronological Timeline */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {userTimelineLoading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#83C75D]" />
                  <span className="text-xs">Đang tải lịch sử chi tiết...</span>
                </div>
              ) : userTimelineLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">Chưa có bản ghi hoạt động nào trong khoảng thời gian này.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  {userTimelineLogs.map((item) => {
                    const badge = getActionBadge(item.action);
                    const dt = formatDateTime(item.createdAt);

                    return (
                      <div key={item.id} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#83C75D] shadow-xs" />

                        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 transition">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {dt.time} • {dt.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                            {item.details}
                          </p>
                          {item.ipAddress && (
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              IP: {item.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Tổng cộng: <strong className="text-slate-800">{userTimelineLogs.length}</strong> thao tác được ghi lại
              </span>
              <button
                onClick={() => setInspectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
