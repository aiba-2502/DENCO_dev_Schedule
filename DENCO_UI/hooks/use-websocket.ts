import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocketオプション
 */
interface UseWebSocketOptions {
  /** 自動再接続を有効化 */
  reconnect?: boolean;
  /** 再接続間隔（ミリ秒） */
  reconnectInterval?: number;
  /** 最大再接続試行回数 */
  maxReconnectAttempts?: number;
  /** メッセージ受信時のコールバック */
  onMessage?: (message: any) => void;
  /** 接続成功時のコールバック */
  onConnect?: () => void;
  /** 切断時のコールバック */
  onDisconnect?: (event: CloseEvent) => void;
  /** エラー時のコールバック */
  onError?: (error: Event) => void;
  /** WebSocketプロトコル */
  protocols?: string | string[];
}

/**
 * WebSocket接続状態
 */
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocketフック
 *
 * WebSocket接続の管理と自動再接続
 *
 * @param url - WebSocket URL
 * @param options - オプション設定
 * @returns WebSocket状態とヘルパー関数
 *
 * @example
 * ```typescript
 * const {
 *   isConnected,
 *   lastMessage,
 *   sendMessage,
 *   status,
 *   error
 * } = useWebSocket('ws://localhost:3001/ws/frontend', {
 *   reconnect: true,
 *   reconnectInterval: 3000,
 *   onMessage: (message) => {
 *     console.log('Received:', message);
 *   },
 *   onConnect: () => {
 *     console.log('WebSocket connected');
 *   },
 *   onDisconnect: () => {
 *     console.log('WebSocket disconnected');
 *   }
 * });
 * ```
 */
export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    protocols,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const shouldReconnectRef = useRef(true);

  /**
   * WebSocket接続
   */
  const connect = useCallback(() => {
    if (!url || !isMountedRef.current) return;

    // 既存接続をクリーンアップ
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      setStatus('connecting');
      setError(null);

      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;

        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          // JSON parse失敗時はそのまま渡す
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;

        wsRef.current = null;
        setStatus('disconnected');
        onDisconnect?.(event);

        // 自動再接続
        if (
          reconnect &&
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `WebSocket reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        if (!isMountedRef.current) return;

        setStatus('error');
        setError(event);
        onError?.(event);
        console.error('WebSocket error:', event);
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setStatus('error');
    }
  }, [
    url,
    protocols,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  ]);

  /**
   * メッセージ送信
   */
  const sendMessage = useCallback(
    (message: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket is not connected');
        return false;
      }

      try {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(payload);
        return true;
      } catch (err) {
        console.error('Failed to send message:', err);
        return false;
      }
    },
    []
  );

  /**
   * WebSocket切断
   */
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  /**
   * 手動再接続
   */
  const reconnectManually = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // 初回接続とURL変更時の再接続
  useEffect(() => {
    if (url) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      isMountedRef.current = false;
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, connect]);

  return {
    /** 接続中かどうか */
    isConnected: status === 'connected',
    /** 接続状態 */
    status,
    /** 最後に受信したメッセージ */
    lastMessage,
    /** エラー情報 */
    error,
    /** メッセージ送信関数 */
    sendMessage,
    /** 接続関数 */
    connect: reconnectManually,
    /** 切断関数 */
    disconnect,
    /** WebSocketインスタンス（高度な操作用） */
    websocket: wsRef.current,
  };
}

/**
 * WebSocket URLビルダー
 */
export const websocketUrls = {
  /**
   * HTTPスキームをWSスキームに変換
   */
  httpToWs: (httpUrl: string): string => {
    return httpUrl.replace(/^http/, 'ws');
  },

  /**
   * フロントエンド監視用WebSocket URL
   */
  frontend: (baseUrl: string): string => {
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/frontend`;
  },

  /**
   * 通話音声用WebSocket URL
   */
  callAudio: (baseUrl: string, callId: string): string => {
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/api/ws/call/${callId}`;
  },
};
