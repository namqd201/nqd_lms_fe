'use client';

import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function AdminLogsPage() {
  const sampleLogs = [
    {
      id: '1',
      action: 'USER_LOGIN_SUCCESS',
      entityType: 'User',
      details: 'Google OAuth login authenticated successfully',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
    },
    {
      id: '2',
      action: 'COURSE_PUBLISHED',
      entityType: 'Course',
      details: 'Course status updated to ACTIVE (Published for students)',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
    },
    {
      id: '3',
      action: 'ROLE_ASSIGNED',
      entityType: 'UserRole',
      details: 'Role TEACHER assigned to user',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            Admin Module
          </span>
          <span className="text-xs text-slate-400 font-semibold">•</span>
          <span className="text-xs text-slate-500 font-medium">Security & System Events</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Nhật ký Hoạt động (Audit Logs)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Giám sát các thao tác đăng nhập, phân quyền, sửa đổi dữ liệu và sự kiện bảo mật.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/75 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sự kiện gần nhất (Live Events)
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit Stream Active</span>
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {sampleLogs.map((log) => (
            <div key={log.id} className="p-4 sm:px-6 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                </div>
              </div>

              <div className="text-right shrink-0 text-slate-400">
                <p className="font-medium text-slate-600">{log.timestamp}</p>
                <p className="font-mono text-[10px] mt-0.5">IP: {log.ipAddress}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
