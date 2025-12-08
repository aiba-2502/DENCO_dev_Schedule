import { useState, useCallback, useRef, useEffect } from 'react';
import type { ApiCallState } from '@/lib/types';

/**
 * API呼び出しオプション
 */
interface UseApiCallOptions {
  /** エラー時の自動リトライ回数 */
  retryCount?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** 成功時のコールバック */
  onSuccess?: (data: unknown) => void;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
}

/**
 * API呼び出しフック
 *
 * API呼び出しのローディング状態、エラーハンドリング、リトライを統一管理
 *
 * @param apiMethod - 実行するAPI関数
 * @param options - オプション設定
 * @returns API呼び出し状態とヘルパー関数
 *
 * @example
 * ```typescript
 * const { data, loading, error, execute, retry } = useApiCall(
 *   () => api.python.customers.list('tenant-id'),
 *   {
 *     retryCount: 3,
 *     onSuccess: (data) => toast({ title: '取得成功' }),
 *     onError: (error) => toast({ title: 'エラー', description: error.message })
 *   }
 * );
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export function useApiCall<T>(
  apiMethod: () => Promise<T>,
  options: UseApiCallOptions = {}
) {
  const {
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Unmount時のクリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * API実行
   */
  const execute = useCallback(async () => {
    // 前回のリクエストをキャンセル
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    retryAttemptsRef.current = 0;

    setState({ data: null, loading: true, error: null });

    try {
      const result = await apiMethod();

      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('API call failed');

      if (isMountedRef.current) {
        setState({ data: null, loading: false, error });
        onError?.(error);
      }
    }
  }, [apiMethod, onSuccess, onError]);

  /**
   * リトライ実行
   */
  const retry = useCallback(async () => {
    if (retryAttemptsRef.current >= retryCount) {
      console.warn(`Max retry attempts (${retryCount}) reached`);
      return;
    }

    retryAttemptsRef.current += 1;

    // リトライ前に遅延
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiMethod();

      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('API call failed');

      if (isMountedRef.current) {
        setState({ data: null, loading: false, error });
        onError?.(error);
      }
    }
  }, [apiMethod, retryCount, retryDelay, onSuccess, onError]);

  /**
   * 状態リセット
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    retryAttemptsRef.current = 0;
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    /** 取得したデータ */
    data: state.data,
    /** ローディング中かどうか */
    loading: state.loading,
    /** エラー情報 */
    error: state.error,
    /** API実行関数 */
    execute,
    /** リトライ関数 */
    retry,
    /** 状態リセット関数 */
    reset,
  };
}
