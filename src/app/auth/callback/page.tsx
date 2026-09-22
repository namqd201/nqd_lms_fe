'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function handleCallback() {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const token = params.get('token') || params.get('session_id');
          if (token) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_session_id', token);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        const currentUser = await refreshUser();

        if (!isMounted) return;

        if (currentUser) {
          setStatus('success');
          setTimeout(() => {
            if (currentUser.isOnboarded === false) {
              router.push('/onboarding');
            } else {
              router.push('/');
            }
          }, 1000);
        } else {
          setStatus('error');
          setErrorMessage('Không thể xác thực thông tin người dùng từ máy chủ.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Đã xảy ra lỗi trong quá trình xác thực.');
      }
    }

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [refreshUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 text-center text-slate-900 space-y-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-[#83C75D] animate-spin" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-950">Đang đồng bộ đăng nhập Google...</h2>
            <p className="text-xs text-slate-500">
              Hệ thống đang hoàn tất xác thực phiên làm việc. Vui lòng chờ trong giây lát.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#83C75D]/15 border border-[#83C75D]/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-[#83C75D] animate-bounce" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-950">Đăng nhập thành công!</h2>
            <p className="text-xs text-slate-600">Đang chuyển hướng về trang chủ...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <XCircle className="w-14 h-14 text-rose-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-950">Đăng nhập không thành công</h2>
            <p className="text-xs text-slate-500">{errorMessage}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-[#83C75D] hover:bg-[#72b74d] text-white font-bold text-xs shadow-sm transition-colors"
              >
                Quay lại trang chính
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
