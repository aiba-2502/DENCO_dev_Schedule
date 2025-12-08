# DENCO_UI リファクタリング実装プラン

**作成日**: 2025-01-14
**対象**: DENCO_UI フロントエンド
**期間**: 2週間
**目標**: Feature-Sliced Design + 型安全 + 保守性向上

---

## 📋 実装フェーズ

### Phase 1: 緊急対応 (Day 1) 🔴

**目標**: ビルド可能な状態にする
**工数**: 1日 (8時間)
**担当**: 全員必須

#### タスク 1.1: libディレクトリ作成
**工数**: 5分

```bash
mkdir -p DENCO_UI/lib
```

#### タスク 1.2: lib/utils.ts実装
**工数**: 10分
**ファイル**: `DENCO_UI/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**テスト**:
```bash
# インポートエラーがないか確認
npm run build
```

#### タスク 1.3: lib/api-client.ts実装 (最小版)
**工数**: 2時間
**ファイル**: `DENCO_UI/lib/api-client.ts`

```typescript
/**
 * DENCO API Client
 *
 * Python Backend: http://localhost:8000
 * Node.js Backend: http://localhost:3001
 */

const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const NODE_API = process.env.NEXT_PUBLIC_NODE_BACKEND_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

const pythonClient = new ApiClient(PYTHON_API);
const nodeClient = new ApiClient(NODE_API);

// API構造
export const api = {
  // Health checks
  health: {
    python: () => pythonClient.get<{ status: string; database: string }>('/health'),
    node: () => nodeClient.get<{ status: string; activeCalls: number; asterisk: { connected: boolean } }>('/health'),
  },

  // Calls API
  calls: {
    active: () => pythonClient.get<{ calls: any[] }>('/api/calls/active'),
    getById: (id: string) => pythonClient.get(`/api/calls/${id}`),
    history: (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return pythonClient.get(`/api/calls?${query}`);
    },

    // Node.js backend API
    nodeApi: {
      active: () => nodeClient.get<any[]>('/api/calls/active'),
      disconnect: (id: string) => nodeClient.post(`/api/calls/${id}/disconnect`),
    }
  },

  // Customers API
  customers: {
    list: (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return pythonClient.get(`/api/customers?${query}`);
    },
    getById: (id: string) => pythonClient.get(`/api/customers/${id}`),
    create: (data: any) => pythonClient.post('/api/customers', data),
    update: (id: string, data: any) => pythonClient.put(`/api/customers/${id}`, data),
    delete: (id: string) => pythonClient.delete(`/api/customers/${id}`),
  },

  // Knowledge API
  knowledge: {
    articles: {
      list: () => pythonClient.get('/api/knowledge/articles'),
      getById: (id: string) => pythonClient.get(`/api/knowledge/articles/${id}`),
      create: (data: any) => pythonClient.post('/api/knowledge/articles', data),
      update: (id: string, data: any) => pythonClient.put(`/api/knowledge/articles/${id}`, data),
      delete: (id: string) => pythonClient.delete(`/api/knowledge/articles/${id}`),
    },
    inquiries: {
      list: () => pythonClient.get('/api/knowledge/inquiries'),
      getById: (id: string) => pythonClient.get(`/api/knowledge/inquiries/${id}`),
      create: (data: any) => pythonClient.post('/api/knowledge/inquiries', data),
    }
  },

  // Tenants API
  tenants: {
    list: () => pythonClient.get('/api/tenants'),
    getById: (id: string) => pythonClient.get(`/api/tenants/${id}`),
    create: (data: any) => pythonClient.post('/api/tenants', data),
    update: (id: string, data: any) => pythonClient.put(`/api/tenants/${id}`, data),
  },

  // Asterisk API
  asterisk: {
    status: () => nodeClient.get('/api/asterisk/status'),
  }
};
```

**テスト**:
```bash
npm run build
npm run dev

# ブラウザで確認
# http://localhost:3000
# System Statusが表示されればOK
```

#### タスク 1.4: 環境変数確認
**工数**: 10分

`.env.local`の確認:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
```

#### Phase 1 完了条件
- ✅ `npm run build` が成功
- ✅ `npm run dev` が成功
- ✅ ブラウザでダッシュボードが表示される
- ✅ System Statusが動作する

---

### Phase 2: Feature-Sliced Design導入 (Week 1) 🟡

**目標**: Calls機能を完全移行
**工数**: 5日 (40時間)

#### Day 2: ディレクトリ構造作成
**工数**: 2時間

```bash
# features構造作成
mkdir -p features/calls/{api,hooks,components,stores,types}
mkdir -p features/dashboard/{api,hooks,components,types}

# shared構造作成
mkdir -p shared/{api,hooks,types,utils,constants}
```

#### Day 2-3: 型定義の整備
**工数**: 8時間
**ファイル**: `features/calls/types/call.types.ts`

```typescript
/**
 * Call Types
 * 通話関連の型定義
 */

export interface Call {
  id: string;
  tenant_id: string;
  caller: string;
  callee: string;
  status: CallStatus;
  direction: CallDirection;
  start_time: string;
  end_time?: string;
  duration?: number;
  channel_id?: string;
}

export type CallStatus = 'ringing' | 'answered' | 'ended' | 'failed';
export type CallDirection = 'inbound' | 'outbound';

export interface CallMessage {
  id: string;
  call_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CallSession {
  call: Call;
  messages: CallMessage[];
}

export interface ActiveCallsResponse {
  calls: Call[];
  total: number;
}

export interface CallHistoryParams {
  limit?: number;
  offset?: number;
  status?: CallStatus;
  direction?: CallDirection;
  start_date?: string;
  end_date?: string;
}
```

**ファイル**: `features/calls/types/websocket.types.ts`

```typescript
/**
 * WebSocket Types
 * WebSocket通信の型定義
 */

export type WebSocketMessageType =
  | 'call:started'
  | 'call:answered'
  | 'call:ended'
  | 'message:new'
  | 'message:updated'
  | 'error';

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
}

export interface CallStartedPayload {
  callId: string;
  caller: string;
  callee: string;
}

export interface CallEndedPayload {
  callId: string;
  duration: number;
  reason: string;
}

export interface MessageNewPayload {
  callId: string;
  message: CallMessage;
}
```

#### Day 3-4: API層の実装
**工数**: 12時間
**ファイル**: `features/calls/api/calls.api.ts`

```typescript
/**
 * Calls API
 * 通話関連のAPI呼び出し
 */

import { api } from '@/lib/api-client';
import type { Call, CallSession, ActiveCallsResponse, CallHistoryParams } from '../types/call.types';

export const callsApi = {
  /**
   * アクティブな通話一覧取得
   */
  getActive: async (): Promise<ActiveCallsResponse> => {
    return api.calls.active();
  },

  /**
   * 通話詳細取得
   */
  getById: async (id: string): Promise<CallSession> => {
    return api.calls.getById(id);
  },

  /**
   * 通話履歴取得
   */
  getHistory: async (params?: CallHistoryParams): Promise<{ calls: Call[]; total: number }> => {
    return api.calls.history(params);
  },

  /**
   * 通話切断 (Node.js API)
   */
  disconnect: async (id: string): Promise<void> => {
    return api.calls.nodeApi.disconnect(id);
  },
};
```

**ファイル**: `features/calls/api/websocket.api.ts`

```typescript
/**
 * WebSocket API
 * WebSocket接続管理
 */

import type { WebSocketMessage } from '../types/websocket.types';

export class CallWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(callId: string) {
    const wsUrl = process.env.NEXT_PUBLIC_NODE_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:3001';
    this.url = `${wsUrl}/ws/call/${callId}`;
  }

  connect(
    onMessage: (message: WebSocketMessage) => void,
    onError?: (error: Event) => void
  ): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect(onMessage, onError);
    };
  }

  private attemptReconnect(
    onMessage: (message: WebSocketMessage) => void,
    onError?: (error: Event) => void
  ): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

#### Day 4-5: カスタムフックの実装
**工数**: 12時間

**ファイル**: `features/calls/hooks/useActiveCalls.ts`

```typescript
/**
 * useActiveCalls Hook
 * アクティブな通話一覧を取得
 */

import { useState, useEffect } from 'react';
import { callsApi } from '../api/calls.api';
import type { Call } from '../types/call.types';

export function useActiveCalls(pollingInterval = 3000) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCalls = async () => {
      try {
        const response = await callsApi.getActive();
        setCalls(response.calls);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load calls'));
      } finally {
        setLoading(false);
      }
    };

    loadCalls();
    const interval = setInterval(loadCalls, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { calls, loading, error };
}
```

**ファイル**: `features/calls/hooks/useCallWebSocket.ts`

```typescript
/**
 * useCallWebSocket Hook
 * 通話のWebSocket接続を管理
 */

import { useState, useEffect, useCallback } from 'react';
import { CallWebSocketClient } from '../api/websocket.api';
import type { WebSocketMessage } from '../types/websocket.types';
import type { CallMessage } from '../types/call.types';

export function useCallWebSocket(callId: string) {
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [client] = useState(() => new CallWebSocketClient(callId));

  useEffect(() => {
    client.connect(
      (message: WebSocketMessage) => {
        if (message.type === 'message:new') {
          setMessages(prev => [...prev, message.payload]);
        }
        setConnected(true);
      },
      () => setConnected(false)
    );

    return () => {
      client.disconnect();
    };
  }, [callId, client]);

  const sendMessage = useCallback((content: string) => {
    client.send({ type: 'message', content });
  }, [client]);

  return { messages, connected, sendMessage };
}
```

**ファイル**: `features/calls/hooks/useCallDetail.ts`

```typescript
/**
 * useCallDetail Hook
 * 通話詳細を取得
 */

import { useState, useEffect } from 'react';
import { callsApi } from '../api/calls.api';
import type { CallSession } from '../types/call.types';

export function useCallDetail(callId: string) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await callsApi.getById(callId);
        setSession(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load call detail'));
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [callId]);

  return { session, loading, error };
}
```

#### Day 5: コンポーネントのリファクタリング開始

**session-detail.tsx (600行) を分割**:

```
components/calls/session-detail.tsx (600行)
↓
features/calls/components/CallSessionDetail/
├── index.tsx              # レイアウト (150行)
├── CallInfo.tsx           # 通話情報 (100行)
├── MessageHistory.tsx     # メッセージ履歴 (200行)
└── CallActions.tsx        # アクション (100行)
```

**ファイル**: `features/calls/components/CallSessionDetail/index.tsx`

```typescript
/**
 * CallSessionDetail
 * 通話セッション詳細画面
 */

'use client';

import { useCallDetail } from '../../hooks/useCallDetail';
import { useCallWebSocket } from '../../hooks/useCallWebSocket';
import { CallInfo } from './CallInfo';
import { MessageHistory } from './MessageHistory';
import { CallActions } from './CallActions';
import { Card } from '@/components/ui/card';

interface CallSessionDetailProps {
  callId: string;
}

export function CallSessionDetail({ callId }: CallSessionDetailProps) {
  const { session, loading, error } = useCallDetail(callId);
  const { messages, connected } = useCallWebSocket(callId);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error || !session) {
    return <div>エラー: {error?.message}</div>;
  }

  return (
    <div className="space-y-6">
      <CallInfo call={session.call} connected={connected} />
      <MessageHistory messages={[...session.messages, ...messages]} />
      <CallActions callId={callId} status={session.call.status} />
    </div>
  );
}
```

#### Phase 2 完了条件
- ✅ features/calls/ 構造完成
- ✅ 型定義完了
- ✅ API層完了
- ✅ カスタムフック完了
- ✅ 1つ以上のコンポーネント移行完了

---

### Phase 3: 状態管理導入 (Day 6) 🟢

**目標**: Zustandで通話状態を管理
**工数**: 1日 (8時間)

#### タスク 3.1: Zustandインストール
```bash
npm install zustand
```

#### タスク 3.2: callStoreの実装
**ファイル**: `features/calls/stores/callStore.ts`

```typescript
/**
 * Call Store
 * 通話状態のグローバル管理
 */

import { create } from 'zustand';
import type { Call } from '../types/call.types';

interface CallStore {
  // State
  activeCalls: Call[];
  selectedCallId: string | null;

  // Actions
  setActiveCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  removeCall: (id: string) => void;
  selectCall: (id: string | null) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  // Initial state
  activeCalls: [],
  selectedCallId: null,

  // Actions
  setActiveCalls: (calls) => set({ activeCalls: calls }),

  addCall: (call) => set((state) => ({
    activeCalls: [...state.activeCalls, call]
  })),

  updateCall: (id, updates) => set((state) => ({
    activeCalls: state.activeCalls.map(call =>
      call.id === id ? { ...call, ...updates } : call
    )
  })),

  removeCall: (id) => set((state) => ({
    activeCalls: state.activeCalls.filter(call => call.id !== id)
  })),

  selectCall: (id) => set({ selectedCallId: id }),
}));
```

#### タスク 3.3: Storeを使用するようにフック更新

**更新**: `features/calls/hooks/useActiveCalls.ts`

```typescript
import { useEffect } from 'react';
import { useCallStore } from '../stores/callStore';
import { callsApi } from '../api/calls.api';

export function useActiveCalls(pollingInterval = 3000) {
  const { activeCalls, setActiveCalls } = useCallStore();

  useEffect(() => {
    const loadCalls = async () => {
      try {
        const response = await callsApi.getActive();
        setActiveCalls(response.calls);
      } catch (error) {
        console.error('Failed to load calls:', error);
      }
    };

    loadCalls();
    const interval = setInterval(loadCalls, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, setActiveCalls]);

  return { calls: activeCalls };
}
```

---

### Phase 4: 他機能の移行 (Week 2) 🟢

**目標**: Dashboard, FAX, Knowledge機能を移行
**工数**: 5日 (40時間)

#### Day 7-8: Dashboard機能移行
- features/dashboard/types/
- features/dashboard/api/
- features/dashboard/hooks/
- features/dashboard/components/

#### Day 9: FAX機能移行
- features/fax/

#### Day 10: Knowledge機能移行
- features/knowledge/

#### Day 11: Settings, Users機能移行
- features/settings/
- features/users/

---

## 📊 進捗トラッキング

### チェックリスト

#### Phase 1: 緊急対応
- [ ] lib/ディレクトリ作成
- [ ] lib/utils.ts実装
- [ ] lib/api-client.ts実装
- [ ] npm run build成功
- [ ] npm run dev成功
- [ ] ダッシュボード表示確認

#### Phase 2: Feature-Sliced Design
- [ ] features/calls/構造作成
- [ ] shared/構造作成
- [ ] calls型定義完了
- [ ] callsApi実装完了
- [ ] WebSocket API実装完了
- [ ] useActiveCalls実装完了
- [ ] useCallWebSocket実装完了
- [ ] useCallDetail実装完了
- [ ] CallSessionDetail分割完了
- [ ] CallMonitor移行完了
- [ ] CallHistory移行完了

#### Phase 3: 状態管理
- [ ] Zustandインストール
- [ ] callStore実装完了
- [ ] フックでStore使用

#### Phase 4: 他機能移行
- [ ] Dashboard機能移行完了
- [ ] FAX機能移行完了
- [ ] Knowledge機能移行完了
- [ ] Settings機能移行完了
- [ ] Users機能移行完了

---

## 🧪 テスト計画

各フェーズでテストを実施:

### Phase 1テスト
```bash
npm run build
npm run dev
# ブラウザで動作確認
```

### Phase 2テスト
```bash
# 型チェック
npm run type-check

# 各機能の動作確認
# - /calls/monitor
# - /calls/history
# - /calls/history/[id]
```

### Phase 3テスト
```bash
# 状態管理の動作確認
# - 複数コンポーネント間での状態共有
```

---

## 📝 コミット戦略

### コミットメッセージ規約

```
[Phase 1] lib: create lib directory and api-client
[Phase 2] feat(calls): add Feature-Sliced Design structure
[Phase 2] feat(calls): implement call types
[Phase 2] feat(calls): implement calls API
[Phase 2] feat(calls): add useActiveCalls hook
[Phase 2] refactor(calls): split CallSessionDetail into 4 components
[Phase 3] feat(calls): add Zustand store
[Phase 4] feat(dashboard): migrate to Feature-Sliced Design
```

---

## 🚀 デプロイ戦略

### 段階的デプロイ

1. **Phase 1完了後**: 即座にデプロイ（ビルド修正）
2. **Phase 2完了後**: Calls機能のみデプロイ
3. **Phase 3完了後**: 状態管理デプロイ
4. **Phase 4完了後**: 全機能デプロイ

### ロールバック計画

各フェーズでGitタグを作成:
```bash
git tag -a phase-1-complete -m "Phase 1: Emergency fix complete"
git tag -a phase-2-complete -m "Phase 2: Feature-Sliced Design complete"
git tag -a phase-3-complete -m "Phase 3: State management complete"
git tag -a phase-4-complete -m "Phase 4: All features migrated"
```

---

**次のステップ**: Phase 1の実装を開始してください。
