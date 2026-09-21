'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types/auth';
import { SubscriptionResponse } from '@/types/membership';
import { authService } from '@/services/auth.service';
import { membershipService } from '@/services/membership.service';

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionResponse | null;
  isVip: boolean;
  isPro: boolean;
  isUltra: boolean;
  isTeacherPro: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        try {
          const sub = await membershipService.getCurrentSubscription();
          setSubscription(sub);
        } catch {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
      return currentUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải thông tin tài khoản';
      setError(message);
      setUser(null);
      setSubscription(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      setSubscription(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi đăng xuất';
      setError(message);
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlanCode = subscription?.planCode
    ?? (subscription as { plan?: { planCode?: string } | null })?.plan?.planCode
    ?? '';
  const activePlanId = subscription?.planId
    ?? (subscription as { plan?: { id?: string } | null })?.plan?.id
    ?? '';
  const activePlanPrice = (subscription as { plan?: { price?: number } | null })?.plan?.price ?? 0;
  const paidPlan = Boolean(activePlanPrice && activePlanPrice > 0);

  const codeUpper = activePlanCode.toUpperCase();

  const isUltra = Boolean(
    subscription &&
    subscription.status === 'ACTIVE' &&
    codeUpper.includes('ULTRA')
  );

  const isTeacherPro = Boolean(
    subscription &&
    subscription.status === 'ACTIVE' &&
    (codeUpper.includes('TEACHER_PRO') || (codeUpper.includes('TEACHER') && codeUpper.includes('PRO')))
  );

  const isPro = Boolean(
    subscription &&
    subscription.status === 'ACTIVE' &&
    (codeUpper.includes('PRO') || codeUpper.includes('VIP') || (paidPlan && !codeUpper.includes('FREE')))
  );

  const isVip = isPro || isUltra;

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isVip,
        isPro,
        isUltra,
        isTeacherPro,
        isLoading,
        isAuthenticated: !!user,
        error,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
