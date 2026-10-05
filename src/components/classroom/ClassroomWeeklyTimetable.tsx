'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Box,
  Bot,
  Users,
  Paperclip,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  MoreVertical,
  Sun,
  Calendar,
} from 'lucide-react';
import { ClassroomSchedule } from '@/types/classroom';

interface ClassroomWeeklyTimetableProps {
  schedules: ClassroomSchedule[];
  studentCount?: number;
  isTeacher: boolean;
  meetingUrl?: string | null;
  onAddSchedule: (dayOfWeek: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Thứ Hai', dayIndex: 1 },
  { key: 'TUESDAY', label: 'Thứ Ba', dayIndex: 2 },
  { key: 'WEDNESDAY', label: 'Thứ Tư', dayIndex: 3 },
  { key: 'THURSDAY', label: 'Thứ Năm', dayIndex: 4 },
  { key: 'FRIDAY', label: 'Thứ Sáu', dayIndex: 5 },
  { key: 'SATURDAY', label: 'Thứ Bảy', dayIndex: 6 },
  { key: 'SUNDAY', label: 'Chủ Nhật', dayIndex: 0, isSunday: true },
];

export const ClassroomWeeklyTimetable: React.FC<ClassroomWeeklyTimetableProps> = ({
  schedules,
  studentCount = 0,
  isTeacher,
  meetingUrl,
  onAddSchedule,
  onDeleteSchedule,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Calculate dates of the selected week (Monday to Sunday)
  const { weekDates, weekLabel, isCurrentWeek } = useMemo(() => {
    const now = new Date();
    // Adjust to Monday of current week
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const startStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
    const endStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
    const label = `Tuần: ${startStr} - ${endStr}`;

    const datesMap: Record<string, { dateStr: string; isToday: boolean }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    DAYS_OF_WEEK.forEach((d, idx) => {
      const dObj = new Date(monday);
      dObj.setDate(monday.getDate() + idx);
      const isToday = dObj.getTime() === today.getTime();
      datesMap[d.key] = {
        dateStr: `${dObj.getDate()} Th${dObj.getMonth() + 1}`,
        isToday,
      };
    });

    return {
      weekDates: datesMap,
      weekLabel: label,
      isCurrentWeek: weekOffset === 0,
    };
  }, [weekOffset]);

  // Calculate duration in minutes between "HH:mm" and "HH:mm"
  const getDurationMinutes = (start?: string, end?: string): number => {
    if (!start || !end) return 90;
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return diff > 0 ? diff : 90;
    } catch {
      return 90;
    }
  };

  const handleJoin100ms = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Phòng học trực tuyến 100ms chưa được kích hoạt hoặc chưa đến giờ học.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      {/* 1. TOP BAR: Week Navigation + Legends */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="w-9 h-9 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight select-none">
            {weekLabel}
          </span>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="w-9 h-9 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            title="Tuần kế tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer ml-1"
            >
              Tuần hiện tại
            </button>
          )}
        </div>

        {/* Legends (Matching Reference Image) */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold select-none">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span>Phòng học 100ms</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50" />
            <span>Lab ảo LMS</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
            <span>Luyện đề trực tiếp</span>
          </div>
        </div>
      </div>

      {/* 2. THE 7 COLUMNS (WEEK TIMETABLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
        {DAYS_OF_WEEK.map((day) => {
          const dayDate = weekDates[day.key];
          const daySchedules = schedules
            .filter((s) => s.dayOfWeek === day.key)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const hasItems = daySchedules.length > 0;

          return (
            <div
              key={day.key}
              className={`rounded-2xl border flex flex-col justify-between transition-all p-3 sm:p-3.5 ${
                dayDate?.isToday
                  ? 'border-indigo-400 bg-indigo-50/15 shadow-sm ring-1 ring-indigo-400/30'
                  : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
              }`}
            >
              {/* Day Header */}
              <div className="text-center pb-3 border-b border-slate-200/70">
                <div
                  className={`text-xs font-extrabold uppercase tracking-wide ${
                    day.isSunday
                      ? 'text-rose-600'
                      : dayDate?.isToday
                      ? 'text-indigo-600'
                      : 'text-slate-800'
                  }`}
                >
                  {day.label}
                </div>
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    dayDate?.isToday
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {dayDate?.dateStr}
                  {dayDate?.isToday && (
                    <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                      Hôm nay
                    </span>
                  )}
                </div>
              </div>

              {/* Day Content */}
              <div className="py-3 flex-1 flex flex-col justify-start space-y-3 min-h-[220px]">
                {hasItems ? (
                  daySchedules.map((sc) => {
                    const type = (sc.sessionType || 'ONLINE_100MS').toUpperCase();
                    const is100ms = type.includes('100MS') || type.includes('ONLINE') || (!type.includes('LAB') && !type.includes('EXAM'));
                    const isLab = type.includes('LAB');
                    const isExam = type.includes('EXAM');

                    // Color theme classes
                    let cardBg = 'bg-emerald-50/60 border-emerald-200/90 text-emerald-950';
                    let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200/70';
                    let typeText = 'Phòng học 100ms';
                    let TypeIcon = Video;
                    let typeColor = 'text-emerald-700';

                    if (isLab) {
                      cardBg = 'bg-purple-50/60 border-purple-200/90 text-purple-950';
                      badgeBg = 'bg-purple-100 text-purple-800 border-purple-200/70';
                      typeText = 'Lab ảo LMS';
                      TypeIcon = Box;
                      typeColor = 'text-purple-700';
                    } else if (isExam) {
                      cardBg = 'bg-amber-50/60 border-amber-200/90 text-amber-950';
                      badgeBg = 'bg-amber-100 text-amber-800 border-amber-200/70';
                      typeText = 'Trực tiếp + AI';
                      TypeIcon = Bot;
                      typeColor = 'text-amber-700';
                    }

                    return (
                      <div
                        key={sc.id}
                        className={`rounded-2xl border p-3 flex flex-col justify-between space-y-2.5 transition-all shadow-2xs hover:shadow-xs relative ${cardBg}`}
                      >
                        {/* Time Badge + Options */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeBg}`}
                          >
                            {sc.startTime} - {sc.endTime}
                          </span>

                          {isTeacher && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === sc.id ? null : sc.id)
                                }
                                className="p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {activeMenuId === sc.id && (
                                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-20 animate-in fade-in">
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onDeleteSchedule(sc.id);
                                    }}
                                    className="w-full px-2 py-1 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Xóa tiết</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2">
                          {sc.title}
                        </h4>

                        {/* Type Icon */}
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${typeColor}`}>
                          <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{typeText}</span>
                        </div>

                        {/* Footer Row */}
                        <div className="pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-semibold text-slate-600">
                          {is100ms && (
                            <>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Users className="w-3 h-3 text-emerald-600" />
                                {studentCount} học sinh
                              </span>
                              <button
                                onClick={handleJoin100ms}
                                className="font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 group cursor-pointer"
                              >
                                <span>Vào lớp</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </>
                          )}

                          {isLab && (
                            <>
                              <span className="flex items-center gap-1 text-slate-500 truncate max-w-[90px]">
                                <Paperclip className="w-3 h-3 text-purple-600 shrink-0" />
                                {sc.roomNote ? 'Đã có tài liệu' : 'Phòng thực hành'}
                              </span>
                              <a
                                href="/labs"
                                className="font-black text-purple-700 hover:text-purple-800 flex items-center gap-0.5 group cursor-pointer"
                              >
                                <span>Vào Lab</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </a>
                            </>
                          )}

                          {isExam && (
                            <>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {getDurationMinutes(sc.startTime, sc.endTime)} phút
                              </span>
                              <span className="font-black text-amber-700 flex items-center gap-0.5">
                                Chi tiết
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                    {day.isSunday ? (
                      <div className="space-y-1.5 text-slate-400">
                        <Sun className="w-6 h-6 mx-auto text-amber-400/80 stroke-[1.5]" />
                        <span className="text-xs font-semibold block text-slate-400">
                          Nghỉ ngơi
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Không có tiết
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Column Footer: Teacher Add Button */}
              {isTeacher && (
                <div className="pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => onAddSchedule(day.key)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{hasItems ? 'Thêm giờ' : 'Thêm lịch'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
