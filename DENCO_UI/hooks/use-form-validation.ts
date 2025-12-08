import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema } from 'zod';
import { useState } from 'react';

/**
 * フォーム検証オプション
 */
interface UseFormValidationOptions<T extends FieldValues> {
  /** フォーム送信時の処理 */
  onSubmit: (data: T) => Promise<void>;
  /** 送信成功時のコールバック */
  onSuccess?: () => void;
  /** 送信失敗時のコールバック */
  onError?: (error: Error) => void;
  /** デフォルト値 */
  defaultValues?: Partial<T>;
  /** 検証モード */
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

/**
 * フォーム検証フック
 *
 * react-hook-formとZodを統合したフォーム検証フック
 *
 * @param schema - Zodバリデーションスキーマ
 * @param options - オプション設定
 * @returns フォーム制御オブジェクトと送信状態
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().min(1, '名前は必須です'),
 *   email: z.string().email('有効なメールアドレスを入力してください'),
 * });
 *
 * const {
 *   register,
 *   handleSubmit,
 *   formState: { errors },
 *   isSubmitting,
 *   submitError
 * } = useFormValidation(schema, {
 *   onSubmit: async (data) => {
 *     await api.python.customers.create(data);
 *   },
 *   onSuccess: () => {
 *     toast({ title: '登録成功' });
 *   },
 *   onError: (error) => {
 *     toast({ title: 'エラー', description: error.message });
 *   }
 * });
 * ```
 */
export function useFormValidation<T extends FieldValues>(
  schema: ZodSchema<T>,
  options: UseFormValidationOptions<T>
) {
  const {
    onSubmit,
    onSuccess,
    onError,
    defaultValues,
    mode = 'onBlur',
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  // react-hook-formの初期化
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode,
  });

  /**
   * フォーム送信ハンドラー
   */
  const handleFormSubmit = form.handleSubmit(async (data: T) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Form submission failed');
      setSubmitError(error);
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    // react-hook-form標準API
    ...form,

    // カスタム送信ハンドラー
    /** フォーム送信ハンドラー */
    handleSubmit: handleFormSubmit,

    // 送信状態
    /** 送信中かどうか */
    isSubmitting,
    /** 送信エラー */
    submitError,

    // ヘルパー
    /** フォームリセット */
    resetForm: () => {
      form.reset();
      setSubmitError(null);
    },
  };
}

/**
 * よく使うバリデーションスキーマのヘルパー
 */
export const validationHelpers = {
  /** 必須文字列 */
  requiredString: (message = 'この項目は必須です') =>
    z.string().min(1, message),

  /** メールアドレス */
  email: (message = '有効なメールアドレスを入力してください') =>
    z.string().email(message),

  /** 電話番号（日本） */
  phoneJP: (message = '有効な電話番号を入力してください') =>
    z.string().regex(/^0\d{9,10}$/, message),

  /** URL */
  url: (message = '有効なURLを入力してください') =>
    z.string().url(message),

  /** 数値範囲 */
  numberRange: (min: number, max: number, message?: string) =>
    z.number().min(min, message).max(max, message),

  /** 文字列長 */
  stringLength: (min: number, max: number, message?: string) =>
    z.string().min(min, message).max(max, message),

  /** 日付（未来） */
  futureDate: (message = '未来の日付を入力してください') =>
    z.date().refine(date => date > new Date(), message),

  /** 日付（過去） */
  pastDate: (message = '過去の日付を入力してください') =>
    z.date().refine(date => date < new Date(), message),

  /** パスワード（最小8文字、英数字記号） */
  password: (message = 'パスワードは8文字以上で、英数字と記号を含む必要があります') =>
    z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, message),

  /** 確認パスワード */
  confirmPassword: (passwordField: string) =>
    z.object({
      [passwordField]: z.string(),
      confirmPassword: z.string(),
    }).refine(
      data => data[passwordField] === data.confirmPassword,
      {
        message: 'パスワードが一致しません',
        path: ['confirmPassword'],
      }
    ),
};

/**
 * よく使うフォームスキーマ例
 */
export const commonSchemas = {
  /** 顧客作成フォーム */
  customerCreate: z.object({
    name: validationHelpers.requiredString('名前は必須です'),
    phone: validationHelpers.phoneJP(),
    email: validationHelpers.email().optional(),
    tags: z.array(z.string()).optional(),
  }),

  /** ログインフォーム */
  login: z.object({
    email: validationHelpers.email(),
    password: z.string().min(1, 'パスワードを入力してください'),
  }),

  /** ナレッジ記事フォーム */
  knowledgeArticle: z.object({
    title: validationHelpers.requiredString('タイトルは必須です'),
    content: validationHelpers.stringLength(10, 10000, 'コンテンツは10文字以上10000文字以下で入力してください'),
    category: validationHelpers.requiredString('カテゴリは必須です'),
    tags: z.array(z.string()).optional(),
  }),
};
