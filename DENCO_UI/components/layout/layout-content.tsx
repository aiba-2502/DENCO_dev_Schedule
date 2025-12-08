'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SideNav from '@/components/layout/side-nav';

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // ログインページは特別なレイアウト（サイドナビなし）
  const isLoginPage = pathname === '/login';

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">読み込み中...</span>
      </div>
    );
  }

  // ログインページまたは未認証時はシンプルなレイアウト
  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  // 認証済みの通常レイアウト（サイドナビ付き）
  return (
    <div className="flex h-screen overflow-hidden">
      <SideNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
