import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from './loading-spinner';

/**
 * FormModalのプロパティ
 */
interface FormModalProps {
  /** モーダルの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラー */
  onOpenChange: (open: boolean) => void;
  /** タイトル */
  title: string;
  /** 説明文（オプション） */
  description?: string;
  /** フォームの内容 */
  children: React.ReactNode;
  /** 送信ボタンのテキスト */
  submitText?: string;
  /** キャンセルボタンのテキスト */
  cancelText?: string;
  /** 送信ハンドラー */
  onSubmit: () => void | Promise<void>;
  /** キャンセルハンドラー */
  onCancel?: () => void;
  /** 送信中フラグ */
  loading?: boolean;
  /** 送信ボタンを無効化 */
  disableSubmit?: boolean;
  /** 最大幅 */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * フォームモーダルコンポーネント
 *
 * フォーム送信用のモーダルダイアログ
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const [loading, setLoading] = useState(false);
 *
 * const handleSubmit = async () => {
 *   setLoading(true);
 *   try {
 *     await api.python.customers.create(formData);
 *     toast({ title: '登録しました' });
 *     setOpen(false);
 *   } catch (error) {
 *     toast({ title: 'エラー', variant: 'destructive' });
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 *
 * <FormModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="顧客登録"
 *   description="新しい顧客を登録します"
 *   submitText="登録"
 *   onSubmit={handleSubmit}
 *   loading={loading}
 * >
 *   <form>
 *     <input name="name" placeholder="名前" />
 *     <input name="email" placeholder="メールアドレス" />
 *   </form>
 * </FormModal>
 * ```
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitText = '保存',
  cancelText = 'キャンセル',
  onSubmit,
  onCancel,
  loading = false,
  disableSubmit = false,
  maxWidth = 'md',
}: FormModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidthClass}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="py-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button type="submit" disabled={loading || disableSubmit}>
              {loading && <ButtonLoading />}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * フォームフィールドラベル
 */
export function FormLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-foreground mb-1.5"
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

/**
 * フォームフィールドエラー
 */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <p className="mt-1.5 text-sm text-destructive">{children}</p>
  );
}

/**
 * フォームフィールドヘルパーテキスト
 */
export function FormHelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-sm text-muted-foreground">{children}</p>
  );
}

/**
 * フォームフィールドグループ
 */
export function FormField({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {children}
    </div>
  );
}
