'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { User, LoginCredentials } from '@/lib/auth-service';

// ==================== Types ====================

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ==================== Provider ====================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const accessToken = authService.getAccessToken();
      if (!accessToken) {
        setUser(null);
        return;
      }

      const currentUser = await authService.getCurrentUser(accessToken);
      setUser(currentUser);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.login(credentials);
        setUser(response.user);

        router.push('/');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ログインに失敗しました';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
      router.push('/login');
    }
  }, [router]);

  const logoutAllSessions = useCallback(async () => {
    try {
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        await authService.logoutAllSessions(accessToken);
      }
    } catch (err) {
      console.error('Logout all sessions error:', err);
    } finally {
      setUser(null);
      setError(null);
      router.push('/login');
    }
  }, [router]);

  // 初回マウント時: ローカルストレージからユーザー情報を復元
  useEffect(() => {
    const initAuth = async () => {
      try {
        // デバッグモード: 認証バイパス
        if (authService.isAuthDisabled()) {
          console.warn('⚠️ AUTHENTICATION DISABLED - Auto-login with dummy user');
          await login({
            email: 'debug@denco.local',
            password: 'dummy',
          });
          return;
        }

        // 通常の認証フロー
        const storedUser = authService.getStoredUser();
        const accessToken = authService.getAccessToken();

        if (storedUser && accessToken) {
          setUser(storedUser);
          setIsLoading(false);

          // バックグラウンドでトークンリフレッシュとユーザー情報最新化
          (async () => {
            try {
              await authService.autoRefreshToken();

              const currentUser = await authService.getCurrentUser(
                authService.getAccessToken()!
              );
              setUser(currentUser);
            } catch (error) {
              console.error('Background auth refresh failed:', error);
              authService.clearAuth();
              setUser(null);
            }
          })();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [login]);

  // 定期的なトークンリフレッシュ（5分ごと）
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(
      async () => {
        try {
          await authService.autoRefreshToken();
        } catch (err) {
          console.error('Auto refresh failed:', err);
          await logout();
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [user, logout]);

  // ルート保護
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/login';
    const isPublicPage = isLoginPage;

    if (!user && !isPublicPage) {
      router.push('/login');
    }

    if (user && isLoginPage) {
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    error,
    login,
    logout,
    logoutAllSessions,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== Hook ====================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
