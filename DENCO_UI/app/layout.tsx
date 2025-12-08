import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LayoutContent } from '@/components/layout/layout-content';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DENCO - AI Call Management System',
  description: 'Real-time voice AI call monitoring and management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            expand={true}
            richColors={true}
            closeButton={true}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}