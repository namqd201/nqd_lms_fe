'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { isAuthenticated, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 text-center">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="NQD-LMS Logo"
            className="w-20 h-20 object-contain rounded-2xl shadow-sm"
          />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 flex items-center justify-center gap-1">
            <span className="text-[#2563eb] font-mono">[</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
              NQD-LMS
            </span>
            <span className="text-[#7c3aed] font-mono font-black">]</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Tự tin học hỏi - Vững bước tương lai</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Đăng nhập không thành công ({error}). Vui lòng thử lại.</span>
          </div>
        )}

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#83C75D] hover:bg-[#72b74d] text-white font-bold text-sm shadow-lg shadow-[#83C75D]/30 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-[#6eb14b]"
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <span>Đăng nhập bằng Google</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Bảo mật qua giao thức Google OAuth 2.0</span>
        </div>

        <div className="pt-2 text-xs">
          <Link href="/" className="font-semibold text-slate-700 hover:text-[#83C75D] underline">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
