'use client';

import React, { useEffect, useState } from 'react';
import { Download, Bell, X, Share, Smartphone, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { pushNotificationService } from '@/services/pushNotification.service';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    // 1. Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      pushNotificationService.registerServiceWorker();
    }

    // 2. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // 3. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // 4. Capture beforeinstallprompt for Android/Desktop Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissedAt = localStorage.getItem('nqd_pwa_install_dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt) > 3 * 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not standalone, show install guide if not dismissed recently
    if (isIosDevice && !isStandaloneMode) {
      const dismissedAt = localStorage.getItem('nqd_pwa_install_dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt) > 5 * 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    }

    // 5. Check Push Notification status if logged in
    if (user && pushNotificationService.isSupported()) {
      const perm = pushNotificationService.getPermission();
      if (perm === 'default') {
        const pushDismissedAt = localStorage.getItem('nqd_push_prompt_dismissed');
        if (!pushDismissedAt || Date.now() - parseInt(pushDismissedAt) > 2 * 24 * 60 * 60 * 1000) {
          setShowPushBanner(true);
        }
      } else if (perm === 'granted') {
        setPushSubscribed(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('nqd_pwa_install_dismissed', Date.now().toString());
  };

  const handleEnablePush = async () => {
    setLoadingPush(true);
    try {
      const ok = await pushNotificationService.subscribe();
      if (ok) {
        setPushSubscribed(true);
        setShowPushBanner(false);
      }
    } finally {
      setLoadingPush(false);
    }
  };

  const dismissPushBanner = () => {
    setShowPushBanner(false);
    localStorage.setItem('nqd_push_prompt_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* 1. PWA INSTALL BANNER */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-700/60 transition-all animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Cài đặt ứng dụng NQD LMS
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isIos ? (
                  <span>
                    Bấm biểu tượng chia sẻ <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> rồi chọn{' '}
                    <b className="text-white">&ldquo;Thêm vào MH chính&rdquo;</b> để nhận thông báo bài học và học tập mượt mà hơn!
                  </span>
                ) : (
                  <span>
                    Thêm NQD LMS vào màn hình chính để học tập toàn màn hình và nhận thông báo lớp học tức thì.
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={dismissInstallBanner}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Cài đặt ngay
              </button>
            )}
            <button
              onClick={dismissInstallBanner}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Để sau
            </button>
          </div>
        </div>
      )}

      {/* 2. PUSH NOTIFICATION PROMPT BANNER (If user logged in and notifications not enabled yet) */}
      {showPushBanner && user && !pushSubscribed && !showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-indigo-500/30 transition-all animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Nhận thông báo lớp học
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Bật thông báo để điện thoại của bạn báo chuông khi có giờ học trực tuyến, bài tập mới và kết quả duyệt!
              </p>
            </div>
            <button
              onClick={dismissPushBanner}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={handleEnablePush}
              disabled={loadingPush}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loadingPush ? 'Đang bật...' : 'Bật thông báo ngay'}
            </button>
            <button
              onClick={dismissPushBanner}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Không nhắc lại
            </button>
          </div>
        </div>
      )}
    </>
  );
};
