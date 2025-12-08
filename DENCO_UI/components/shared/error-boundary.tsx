'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * ErrorBoundaryのプロパティ
 */
interface ErrorBoundaryProps {
  /** 子コンポーネント */
  children: ReactNode;
  /** フォールバックUI（カスタマイズ可能） */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  /** エラー時のコールバック */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * ErrorBoundaryの状態
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * エラーバウンダリコンポーネント
 *
 * Reactコンポーネントツリーのエラーをキャッチし、フォールバックUIを表示
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * // カスタムフォールバックUI
 * <ErrorBoundary
 *   fallback={(error, resetError) => (
 *     <div>
 *       <h1>エラーが発生しました</h1>
 *       <p>{error.message}</p>
 *       <button onClick={resetError}>再試行</button>
 *     </div>
 *   )}
 *   onError={(error, errorInfo) => {
 *     console.error('Error caught by boundary:', error, errorInfo);
 *   }}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * デフォルトエラーフォールバックUI
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>エラーが発生しました</CardTitle>
          </div>
          <CardDescription>
            申し訳ございません。予期しないエラーが発生しました。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground break-words">
              {error.message}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            再試行
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            ページをリロード
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * エラー表示コンポーネント（ErrorBoundary外での使用）
 */
export function ErrorDisplay({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">エラー</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
        {retry && (
          <CardFooter>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

/**
 * シンプルなエラーメッセージ表示
 */
export function ErrorMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive ${className || ''}`}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
