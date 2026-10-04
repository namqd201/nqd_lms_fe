'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Zap,
  Medal,
  Award,
  Crown,
  Sparkles,
  Calendar,
  Gift,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  gamificationService,
  LeaderboardResponseData,
  LeaderboardStudentItem,
} from '@/services/gamification.service';
import { useAuth } from '@/context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'monthly' | 'alltime'>('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponseData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (tab: 'monthly' | 'alltime') => {
    try {
      setLoading(true);
      if (tab === 'monthly') {
        const res = await gamificationService.getMonthlyLeaderboard();
        setData(res);
      } else {
        const res = await gamificationService.getAllTimeLeaderboard();
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const topStudents = data?.topStudents || [];
  const top1 = topStudents[0];
  const top2 = topStudents[1];
  const top3 = topStudents[2];
  const remainingStudents = topStudents.slice(3);

  const filteredStudents = remainingStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'DIAMOND':
        return 'bg-cyan-50 text-cyan-700 border-cyan-300';
      case 'PLATINUM':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'GOLD':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'SILVER':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* ========================================================
          HERO BANNER & HEADER
          ======================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-indigo-500/20 shadow-xl">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Minh Bạch • Công Bằng • Tự Động Trao Thưởng Cuối Tháng</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                Bảng Vàng Vinh Danh LMS
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Nơi tôn vinh những học viên có chuỗi học tập bền bỉ (Streak 🔥) và điểm năng động (XP ⚡) cao nhất.
                Hệ thống tự động chốt giải vào <strong>23:59 ngày cuối tháng</strong> và gửi phần thưởng trực tiếp vào tài khoản!
              </p>
            </div>

            {/* Countdown card */}
            {data?.daysRemainingInMonth !== undefined && activeTab === 'monthly' && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-lg shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-300/90 font-semibold block">
                    Thời gian chốt giải
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {data.daysRemainingInMonth}
                    </span>
                    <span className="text-xs text-slate-300">ngày còn lại</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {data.monthYear}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TAB SWITCHER */}
          <div className="mt-8 flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-fit">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Bảng Xếp Hạng Tháng Này</span>
            </button>
            <button
              onClick={() => setActiveTab('alltime')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'alltime'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Mọi Thời Đại (All-Time)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-8">
        {/* ========================================================
            REWARD STRUCTURE CARDS
            ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥇</span>
              <div>
                <span className="text-xs font-black uppercase text-amber-800 tracking-wider">Top 1 Quán Quân</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Hội viên ULTRA + Cúp Vàng</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Tặng 1 tháng ULTRA (hoặc Voucher giảm 100% khóa học) + Vinh danh bảng vàng.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥈</span>
              <div>
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Top 2 Á Quân</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Voucher 70% + Cúp Bạc</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Voucher giảm 70% áp dụng cho bất kỳ khóa học nào trên toàn hệ thống.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥉</span>
              <div>
                <span className="text-xs font-black uppercase text-orange-800 tracking-wider">Top 3</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">Voucher 50% + Cúp Đồng</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Voucher giảm 50% toàn bộ khóa học cùng huy hiệu vinh danh hồ sơ.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⭐</span>
              <div>
                <span className="text-xs font-black uppercase text-indigo-800 tracking-wider">Top 4 - 10</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">+500 XP + Voucher 20%</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Thưởng 500 XP năng động tích lũy thăng hạng và Voucher giảm 20% học phí.
            </p>
          </div>
        </div>

        {/* ========================================================
            CURRENT USER'S STANDING (IF LOGGED IN)
            ======================================================== */}
        {data?.currentUserRank && (
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl border border-white/30 shrink-0">
                #{data.currentUserRank.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-200 font-semibold uppercase">Vị trí của bạn hiện tại</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {data.currentUserRank.rankTierName}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{data.currentUserRank.fullName}</h3>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/20">
              <div className="text-center sm:text-right">
                <span className="text-xs text-indigo-200 block">Chuỗi Streak</span>
                <span className="text-base font-black text-white flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                  🔥 {data.currentUserRank.currentStreak} ngày
                </span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-xs text-indigo-200 block">Điểm Năng Động</span>
                <span className="text-xl font-black text-amber-300 flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                  ⚡ {data.currentUserRank.monthlyXp.toLocaleString()} XP
                </span>
              </div>
              <Link
                href="/courses"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition shadow-xs"
              >
                <span>Học để bứt phá</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================
            TOP 3 PODIUM
            ======================================================== */}
        {topStudents.length > 0 && (
          <div className="pt-6 pb-4">
            <h2 className="text-center text-xl font-black text-slate-800 mb-8 flex items-center justify-center gap-2">
              <span>Bục Vinh Danh Top 3 Dẫn Đầu</span>
              <Crown className="w-5 h-5 text-amber-500" />
            </h2>

            <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* TOP 2 */}
              {top2 && (
                <div className="order-2 md:order-1 w-full md:w-1/3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center relative flex flex-col items-center hover:shadow-md transition">
                  <div className="w-12 h-12 -mt-10 rounded-2xl bg-slate-200 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                    🥈
                  </div>
                  <div className="mt-3 relative">
                    <img
                      src={top2.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={top2.fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 mx-auto"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-bold">
                      #2
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-2 text-base line-clamp-1">{top2.fullName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getTierBadgeClass(top2.rankTier)}`}>
                    {top2.rankTierName}
                  </span>
                  <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Streak</span>
                      <strong className="text-orange-600 font-bold">🔥 {top2.currentStreak}d</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Điểm XP</span>
                      <strong className="text-violet-700 font-bold">⚡ {top2.monthlyXp.toLocaleString()}</strong>
                    </div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    Voucher 70% Khóa học
                  </span>
                </div>
              )}

              {/* TOP 1 (CHAMPION) */}
              {top1 && (
                <div className="order-1 md:order-2 w-full md:w-1/3 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-400 rounded-3xl p-6 shadow-lg text-center relative flex flex-col items-center md:-translate-y-4 hover:shadow-xl transition">
                  <div className="w-14 h-14 -mt-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white shadow-lg flex items-center justify-center text-3xl animate-bounce">
                    👑
                  </div>
                  <div className="mt-3 relative">
                    <img
                      src={top1.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={top1.fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 mx-auto shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-xs">
                      #1
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 mt-2 text-lg line-clamp-1">{top1.fullName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getTierBadgeClass(top1.rankTier)}`}>
                    {top1.rankTierName}
                  </span>
                  <div className="mt-4 pt-3 border-t border-amber-200/80 w-full flex items-center justify-around text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Streak</span>
                      <strong className="text-orange-600 font-extrabold text-sm">🔥 {top1.currentStreak} ngày</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Điểm XP</span>
                      <strong className="text-amber-600 font-extrabold text-sm">⚡ {top1.monthlyXp.toLocaleString()}</strong>
                    </div>
                  </div>
                  <span className="mt-3 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    🏆 1 Tháng ULTRA + Cúp Vàng
                  </span>
                </div>
              )}

              {/* TOP 3 */}
              {top3 && (
                <div className="order-3 w-full md:w-1/3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center relative flex flex-col items-center hover:shadow-md transition">
                  <div className="w-12 h-12 -mt-10 rounded-2xl bg-orange-100 border-2 border-white shadow-md flex items-center justify-center text-2xl">
                    🥉
                  </div>
                  <div className="mt-3 relative">
                    <img
                      src={top3.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                      alt={top3.fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-300 mx-auto"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-orange-700 text-white text-[10px] font-bold">
                      #3
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-2 text-base line-clamp-1">{top3.fullName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getTierBadgeClass(top3.rankTier)}`}>
                    {top3.rankTierName}
                  </span>
                  <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Streak</span>
                      <strong className="text-orange-600 font-bold">🔥 {top3.currentStreak}d</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Điểm XP</span>
                      <strong className="text-violet-700 font-bold">⚡ {top3.monthlyXp.toLocaleString()}</strong>
                    </div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-lg">
                    Voucher 50% Khóa học
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            FULL LEADERBOARD TABLE (RANKS 4 - 50)
            ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh Sách Học Viên Bảng Xếp Hạng</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật tức thì dựa trên dữ liệu làm bài và hoạt động học tập thực tế
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Đang tải bảng xếp hạng...</p>
            </div>
          ) : topStudents.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Chưa có dữ liệu xếp hạng trong kỳ này. Hãy là người đầu tiên học bài để dẫn đầu bảng xếp hạng!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-16">Hạng</th>
                    <th className="py-3 px-4">Học viên</th>
                    <th className="py-3 px-4 text-center">Cấp Rank</th>
                    <th className="py-3 px-4 text-center">Chuỗi Streak 🔥</th>
                    <th className="py-3 px-4 text-right">Điểm Năng Động (XP)</th>
                    <th className="py-3 px-4 text-center">Phần thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStudents.map((student) => {
                    const isTop1 = student.rank === 1;
                    const isTop2 = student.rank === 2;
                    const isTop3 = student.rank === 3;
                    const isMyRow = student.isCurrentUser;

                    return (
                      <tr
                        key={student.userId}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isMyRow ? 'bg-indigo-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex w-7 h-7 rounded-xl bg-amber-100 text-amber-800 items-center justify-center font-black text-sm">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex w-7 h-7 rounded-xl bg-slate-200 text-slate-700 items-center justify-center font-black text-sm">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex w-7 h-7 rounded-xl bg-orange-100 text-orange-800 items-center justify-center font-black text-sm">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold text-xs">#{student.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                student.avatarUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                  student.fullName
                                )}`
                              }
                              alt={student.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{student.fullName}</span>
                                {isMyRow && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-600 text-white font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTierBadgeClass(
                              student.rankTier
                            )}`}
                          >
                            {student.rankTierName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-orange-600 text-xs">
                            🔥 {student.currentStreak} ngày
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-slate-900 text-sm">
                            {student.monthlyXp.toLocaleString()} <span className="text-xs text-violet-600">XP</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.rewardBadge ? (
                            <span className="inline-block text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                              {student.rewardBadge}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
