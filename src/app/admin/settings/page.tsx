'use client';

import React from 'react';
import { Settings, ShieldCheck, Key, Server, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Admin Module
          </span>
          <span className="text-xs text-slate-400 font-semibold">•</span>
          <span className="text-xs text-slate-500 font-medium">Platform Configurations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cấu hình Hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Xem thông số kết nối OAuth 2.0, cổng Backend API và chính sách phân quyền.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google OAuth Config Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Google OAuth 2.0 Client</h3>
              <p className="text-xs text-slate-500">Đăng nhập tài khoản Google (OpenID Connect)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-slate-100 pt-3 text-slate-600">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Client ID:</span>
              <code className="bg-slate-50 p-2 rounded-xl border border-slate-200 block font-mono text-[11px] break-all">
                46364191352-qsidh8fvmm7q8tdgog6l4njvgofunaja.apps.googleusercontent.com
              </code>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Redirect URI:</span>
              <code className="bg-slate-50 p-2 rounded-xl border border-slate-200 block font-mono text-[11px]">
                http://localhost:8080/login/oauth2/code/google
              </code>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Scopes:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[11px]">openid, profile, email</span>
            </div>
          </div>
        </div>

        {/* Database & Security Config Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cơ sở dữ liệu & Bảo mật</h3>
              <p className="text-xs text-slate-500">PostgreSQL Local Engine & Session Security</p>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-slate-100 pt-3 text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-bold text-slate-700">Database Engine:</span>
              <span className="font-mono text-slate-900">PostgreSQL (port 5432)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-bold text-slate-700">Database Name:</span>
              <span className="font-mono text-slate-900">ai_learning_platform</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-bold text-slate-700">Hibernate DDL:</span>
              <span className="font-mono text-emerald-600 font-bold">update</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-bold text-slate-700">CORS Allowed Origin:</span>
              <span className="font-mono text-slate-900">http://localhost:3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
