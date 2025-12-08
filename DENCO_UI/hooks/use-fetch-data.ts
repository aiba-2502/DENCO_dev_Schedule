import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiCallState } from '@/lib/types';

/**
 * データ取得オプション
 */
interface UseFetchDataOptions {
  /** 自動リフレッシュ間隔（ミリ秒）。0または未指定で無効 */
  refreshInterval?: number;
  /** エラー時の自動リトライ */
  retryOnError?: boolean;
  /** リトライ回数 */
  retryCount?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** 初回ロードを無効化 */
  skip?: boolean;
}

/**
 * データ取得フック
 *
 * データ取得の標準パターン（初回ロード + 自動リフレッシュ + リトライ）
 *
 * @param fetchFunction - データ取得関数
 * @param deps - 依存配列（変更時に再取得）
 * @param options - オプション設定
 * @returns データ取得状態とヘルパー関数
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   loading,
 *   error,
 *   refresh,
 *   refetch
 * } = useFetchData(
 *   () => api.python.customers.list(tenantId),
 *   [tenantId],
 *   {
 *     refreshInterval: 30000, // 30秒ごとに自動リフレッシュ
 *     retryOnError: true
 *   }
 * );
 * ```
 */
export function useFetchData<T>(
  fetchFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseFetchDataOptions = {}
) {
  const {
    refreshInterval = 0,
    retryOnError = false,
    retryCount = 3,
    retryDelay = 1000,
    skip = false,
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryAttemptsRef = useRef(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Unmount時のクリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  /**
   * データ取得実行
   */
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (skip) return;

      // 前回のリクエストをキャンセル
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // リフレッシュでない場合のみローディング表示
      if (!isRefresh) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        const result = await fetchFunction();

        if (isMountedRef.current) {
          setState({ data: result, loading: false, error: null });
          retryAttemptsRef.current = 0; // 成功したらリトライカウントリセット

          // 自動リフレッシュ設定
          if (refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              fetchData(true);
            }, refreshInterval);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Fetch failed');

        if (isMountedRef.current) {
          setState({ data: null, loading: false, error });

          // エラー時の自動リトライ
          if (retryOnError && retryAttemptsRef.current < retryCount) {
            retryAttemptsRef.current += 1;
            setTimeout(() => {
              if (isMountedRef.current) {
                fetchData(isRefresh);
              }
            }, retryDelay);
          }
        }
      }
    },
    [fetchFunction, skip, refreshInterval, retryOnError, retryCount, retryDelay]
  );

  // 初回ロードと依存値変更時のリロード
  useEffect(() => {
    if (!skip) {
      fetchData();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip]);

  /**
   * 手動リフレッシュ（ローディング表示なし）
   */
  const refresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    fetchData(true);
  }, [fetchData]);

  /**
   * 再取得（ローディング表示あり）
   */
  const refetch = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    retryAttemptsRef.current = 0;
    fetchData(false);
  }, [fetchData]);

  /**
   * 状態リセット
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    retryAttemptsRef.current = 0;
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    /** 取得したデータ */
    data: state.data,
    /** ローディング中かどうか */
    loading: state.loading,
    /** エラー情報 */
    error: state.error,
    /** 手動リフレッシュ（ローディング表示なし） */
    refresh,
    /** 再取得（ローディング表示あり） */
    refetch,
    /** 状態リセット */
    reset,
  };
}
