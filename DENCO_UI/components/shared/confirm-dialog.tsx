import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ButtonLoading } from './loading-spinner';

/**
 * ConfirmDialogのプロパティ
 */
interface ConfirmDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラー */
  onOpenChange: (open: boolean) => void;
  /** タイトル */
  title: string;
  /** 説明文 */
  description: string;
  /** 確認ボタンのテキスト */
  confirmText?: string;
  /** キャンセルボタンのテキスト */
  cancelText?: string;
  /** 確認時のコールバック */
  onConfirm: () => void | Promise<void>;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
  /** 処理中フラグ */
  loading?: boolean;
  /** 確認ボタンの種類 */
  variant?: 'default' | 'destructive';
}

/**
 * 確認ダイアログコンポーネント
 *
 * ユーザーに確認を求めるダイアログ
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const [loading, setLoading] = useState(false);
 *
 * const handleDelete = async () => {
 *   setLoading(true);
 *   try {
 *     await api.python.customers.delete(id);
 *     toast({ title: '削除しました' });
 *   } catch (error) {
 *     toast({ title: 'エラー', variant: 'destructive' });
 *   } finally {
 *     setLoading(false);
 *     setOpen(false);
 *   }
 * };
 *
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="顧客を削除"
 *   description="本当にこの顧客を削除しますか？この操作は取り消せません。"
 *   confirmText="削除"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   loading={loading}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {loading && <ButtonLoading />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * useConfirmDialog - 確認ダイアログ管理フック
 *
 * @example
 * ```tsx
 * const { confirmDialog, confirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '削除確認',
 *     description: '本当に削除しますか？',
 *     variant: 'destructive'
 *   });
 *
 *   if (confirmed) {
 *     await api.python.customers.delete(id);
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>削除</button>
 *     {confirmDialog}
 *   </>
 * );
 * ```
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: '確認',
    cancelText: 'キャンセル',
    variant: 'default',
    resolve: null,
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }): Promise<boolean> => {
    return new Promise(resolve => {
      setDialogState({
        open: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || '確認',
        cancelText: options.cancelText || 'キャンセル',
        variant: options.variant || 'default',
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    dialogState.resolve?.(true);
    setDialogState((prev: typeof dialogState) => ({ ...prev, open: false, resolve: null }));
  };

  const handleCancel = () => {
    dialogState.resolve?.(false);
    setDialogState((prev: typeof dialogState) => ({ ...prev, open: false, resolve: null }));
  };

  const confirmDialog = (
    <AlertDialog
      open={dialogState.open}
      onOpenChange={open => {
        if (!open) {
          handleCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {dialogState.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              dialogState.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {dialogState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirmDialog, confirm };
}
