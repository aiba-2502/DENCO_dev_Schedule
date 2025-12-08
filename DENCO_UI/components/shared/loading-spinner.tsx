import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LoadingSpinnerのプロパティ
 */
interface LoadingSpinnerProps {
  /** サイズ（ピクセル） */
  size?: number;
  /** 追加のCSSクラス */
  className?: string;
  /** 表示テキスト */
  text?: string;
  /** フルスクリーン表示 */
  fullScreen?: boolean;
}

/**
 * ローディングスピナーコンポーネント
 *
 * データ読み込み中の表示に使用
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * <LoadingSpinner />
 *
 * // テキスト付き
 * <LoadingSpinner text="読み込み中..." />
 *
 * // フルスクリーン
 * <LoadingSpinner fullScreen text="データを取得しています..." />
 *
 * // カスタムサイズ
 * <LoadingSpinner size={32} />
 * ```
 */
export function LoadingSpinner({
  size = 24,
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        className="animate-spin text-primary"
        size={size}
        aria-label="読み込み中"
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * インラインローディング（小さいスピナー）
 */
export function InlineLoading({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('inline-block animate-spin text-primary', className)}
      size={16}
      aria-label="読み込み中"
    />
  );
}

/**
 * ボタン内ローディング
 */
export function ButtonLoading({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('mr-2 inline-block animate-spin', className)}
      size={16}
      aria-label="処理中"
    />
  );
}
