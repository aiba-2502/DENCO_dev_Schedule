# Feature-Sliced Design ガイド

**対象**: DENCO_UI開発チーム
**目的**: Feature-Sliced Design (FSD) の理解と実践

---

## 📚 Feature-Sliced Designとは

Feature-Sliced Design (FSD) は、フロントエンドアプリケーションのための**アーキテクチャ設計手法**です。

### 核心原則

1. **機能による分割** - ビジネス機能ごとにコードを分離
2. **レイヤー化** - 明確な責務の境界
3. **低結合** - 機能間の依存を最小化
4. **高凝集** - 関連するコードを近くに配置

---

## 🏗️ レイヤー構造

### 3つの主要レイヤー

```
DENCO_UI/
├── app/              # アプリケーションレイヤー (ルーティング、ページ)
├── features/         # 機能レイヤー (ビジネスロジック)
└── shared/           # 共有レイヤー (再利用可能なコード)
```

### レイヤーの依存関係ルール

```
app → features → shared
 ↓       ↓         ↓
高    中         低
```

**重要なルール**:
- ✅ 上位レイヤーは下位レイヤーに依存できる
- ❌ 下位レイヤーは上位レイヤーに依存できない
- ❌ 同じレイヤー内の機能同士は直接依存できない

---

## 📁 ディレクトリ構造の詳細

### app/ レイヤー

**責務**: ルーティング、ページレイアウト、featuresの組み合わせ

```
app/
├── page.tsx                    # ダッシュボードページ
├── layout.tsx                  # ルートレイアウト
├── calls/
│   ├── monitor/
│   │   └── page.tsx           # /calls/monitor
│   └── history/
│       ├── page.tsx           # /calls/history
│       └── [id]/
│           └── page.tsx       # /calls/history/[id]
└── fax/
    └── page.tsx               # /fax
```

**ページの実装パターン**:
```typescript
// app/calls/monitor/page.tsx
import { CallMonitor } from '@/features/calls/components/CallMonitor';

export default function CallMonitorPage() {
  return <CallMonitor />;
}
```

### features/ レイヤー

**責務**: ビジネスロジック、機能固有のUI、状態管理

```
features/
├── calls/
│   ├── api/                   # API呼び出し
│   │   ├── calls.api.ts
│   │   └── websocket.api.ts
│   ├── hooks/                 # カスタムフック
│   │   ├── useActiveCalls.ts
│   │   └── useCallWebSocket.ts
│   ├── components/            # UIコンポーネント
│   │   ├── CallMonitor/
│   │   │   ├── index.tsx
│   │   │   ├── CallList.tsx
│   │   │   └── CallCard.tsx
│   │   └── CallSessionDetail/
│   │       ├── index.tsx
│   │       ├── CallInfo.tsx
│   │       ├── MessageHistory.tsx
│   │       └── CallActions.tsx
│   ├── stores/                # 状態管理 (Zustand)
│   │   └── callStore.ts
│   └── types/                 # 型定義
│       ├── call.types.ts
│       └── websocket.types.ts
│
├── dashboard/
│   └── [同様の構造]
│
└── fax/
    └── [同様の構造]
```

**機能の実装パターン**:

#### 1. 型定義 (types/)
```typescript
// features/calls/types/call.types.ts
export interface Call {
  id: string;
  caller: string;
  callee: string;
  status: CallStatus;
  startTime: Date;
}

export type CallStatus = 'ringing' | 'answered' | 'ended';
```

#### 2. API層 (api/)
```typescript
// features/calls/api/calls.api.ts
import { apiClient } from '@/shared/api/client';
import type { Call } from '../types/call.types';

export const callsApi = {
  getActive: () => apiClient.get<Call[]>('/api/calls/active'),
  getById: (id: string) => apiClient.get<Call>(`/api/calls/${id}`),
};
```

#### 3. カスタムフック (hooks/)
```typescript
// features/calls/hooks/useActiveCalls.ts
import { useState, useEffect } from 'react';
import { callsApi } from '../api/calls.api';
import type { Call } from '../types/call.types';

export function useActiveCalls() {
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    const loadCalls = async () => {
      const data = await callsApi.getActive();
      setCalls(data);
    };

    loadCalls();
    const interval = setInterval(loadCalls, 3000);
    return () => clearInterval(interval);
  }, []);

  return { calls };
}
```

#### 4. コンポーネント (components/)
```typescript
// features/calls/components/CallMonitor/index.tsx
'use client';

import { useActiveCalls } from '../../hooks/useActiveCalls';
import { CallList } from './CallList';

export function CallMonitor() {
  const { calls } = useActiveCalls();

  return (
    <div>
      <h1>通話モニター</h1>
      <CallList calls={calls} />
    </div>
  );
}
```

#### 5. 状態管理 (stores/)
```typescript
// features/calls/stores/callStore.ts
import { create } from 'zustand';
import type { Call } from '../types/call.types';

interface CallStore {
  activeCalls: Call[];
  setActiveCalls: (calls: Call[]) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCalls: [],
  setActiveCalls: (calls) => set({ activeCalls: calls }),
}));
```

### shared/ レイヤー

**責務**: 再利用可能なコード、ユーティリティ、共通型

```
shared/
├── api/                       # API基盤
│   ├── client.ts             # Axiosクライアント
│   ├── endpoints.ts          # エンドポイント定数
│   ├── interceptors.ts       # 認証・エラーハンドリング
│   └── types.ts              # API共通型
│
├── hooks/                     # 共有フック
│   ├── useWebSocket.ts
│   ├── usePolling.ts
│   └── useLocalStorage.ts
│
├── types/                     # 共有型定義
│   ├── api.types.ts
│   └── common.types.ts
│
├── utils/                     # ユーティリティ
│   ├── date.ts
│   ├── format.ts
│   └── validation.ts
│
└── constants/                 # 定数
    ├── routes.ts
    └── config.ts
```

**共有コードの実装パターン**:

#### 1. APIクライアント
```typescript
// shared/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10000,
});

// リクエストインターセプター
apiClient.interceptors.request.use((config) => {
  // 認証トークンの追加など
  return config;
});

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // エラーハンドリング
    return Promise.reject(error);
  }
);
```

#### 2. 共有フック
```typescript
// shared/hooks/useWebSocket.ts
import { useState, useEffect } from 'react';

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => setConnected(true);
    websocket.onclose = () => setConnected(false);

    setWs(websocket);
    return () => websocket.close();
  }, [url]);

  return { ws, connected };
}
```

---

## 🎯 実装ガイドライン

### 新機能の追加手順

#### ステップ1: 型定義
```typescript
// features/new-feature/types/feature.types.ts
export interface NewFeature {
  id: string;
  name: string;
}
```

#### ステップ2: API層
```typescript
// features/new-feature/api/feature.api.ts
export const featureApi = {
  list: () => apiClient.get<NewFeature[]>('/api/features'),
};
```

#### ステップ3: カスタムフック
```typescript
// features/new-feature/hooks/useFeatures.ts
export function useFeatures() {
  const [features, setFeatures] = useState<NewFeature[]>([]);

  useEffect(() => {
    featureApi.list().then(setFeatures);
  }, []);

  return { features };
}
```

#### ステップ4: コンポーネント
```typescript
// features/new-feature/components/FeatureList.tsx
export function FeatureList() {
  const { features } = useFeatures();

  return (
    <ul>
      {features.map(f => <li key={f.id}>{f.name}</li>)}
    </ul>
  );
}
```

#### ステップ5: ページ統合
```typescript
// app/features/page.tsx
import { FeatureList } from '@/features/new-feature/components/FeatureList';

export default function FeaturesPage() {
  return <FeatureList />;
}
```

---

## ✅ ベストプラクティス

### DO ✅

1. **機能ごとに完全に分離**
```
features/calls/        # 通話機能のすべて
features/fax/          # FAX機能のすべて
```

2. **明確な命名規則**
```typescript
// Hooks
useActiveCalls()
useCallWebSocket()

// Components
CallMonitor
CallSessionDetail

// API
callsApi.getActive()
callsApi.disconnect()

// Types
Call
CallStatus
CallMessage
```

3. **型安全性の確保**
```typescript
// すべてのany型を排除
const [calls, setCalls] = useState<Call[]>([]);  // ✅
const [calls, setCalls] = useState<any[]>([]);   // ❌
```

4. **単一責任原則**
```typescript
// 1つのコンポーネント = 1つの責務
CallInfo.tsx        // 通話情報表示のみ
MessageHistory.tsx  // メッセージ履歴表示のみ
CallActions.tsx     // アクション操作のみ
```

### DON'T ❌

1. **機能間の直接依存**
```typescript
// ❌ 避けるべき
import { callsApi } from '@/features/calls/api/calls.api';  // fax機能から

// ✅ 正しい方法
// 共通の処理はshared/に移動
```

2. **巨大なコンポーネント**
```typescript
// ❌ 600行のコンポーネント
export function BigComponent() { /* 600行 */ }

// ✅ 分割
export function Component() {
  return (
    <>
      <ComponentPart1 />
      <ComponentPart2 />
      <ComponentPart3 />
    </>
  );
}
```

3. **ハードコードされたURL**
```typescript
// ❌
fetch('http://localhost:8000/api/calls')

// ✅
apiClient.get('/api/calls')
```

---

## 🧪 テストの構造

### テストファイルの配置

```
features/calls/
├── api/
│   ├── calls.api.ts
│   └── calls.api.test.ts         # APIテスト
├── hooks/
│   ├── useActiveCalls.ts
│   └── useActiveCalls.test.ts    # フックテスト
├── components/
│   ├── CallMonitor/
│   │   ├── index.tsx
│   │   └── index.test.tsx        # コンポーネントテスト
└── stores/
    ├── callStore.ts
    └── callStore.test.ts         # ストアテスト
```

### テスト例

```typescript
// features/calls/hooks/useActiveCalls.test.ts
import { renderHook } from '@testing-library/react';
import { useActiveCalls } from './useActiveCalls';

describe('useActiveCalls', () => {
  it('should load active calls', async () => {
    const { result } = renderHook(() => useActiveCalls());

    expect(result.current.calls).toEqual([]);
    // ... テストロジック
  });
});
```

---

## 📊 移行チェックリスト

### 機能移行時のチェックポイント

- [ ] types/ - 型定義完了
- [ ] api/ - API層実装完了
- [ ] hooks/ - カスタムフック実装完了
- [ ] components/ - UIコンポーネント実装完了
- [ ] stores/ (必要な場合) - 状態管理実装完了
- [ ] テスト実装完了
- [ ] 旧コンポーネント削除
- [ ] ドキュメント更新

---

## 🎓 参考リソース

### 公式ドキュメント
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand](https://github.com/pmndrs/zustand)

### サンプル実装
- [FSD Examples](https://github.com/feature-sliced/examples)

---

## 💡 よくある質問

### Q1: 機能が小さい場合でもfeaturesに配置すべき?

**A**: はい。将来的に成長する可能性があるため、最初から features/ に配置することを推奨します。

### Q2: 複数の機能で使用するコンポーネントはどこに?

**A**: shared/components/ に配置します。ただし、本当に共通かを慎重に判断してください。

### Q3: 機能間でデータを共有したい場合は?

**A**: shared/stores/ にグローバルストアを作成するか、親コンポーネントでpropsを経由します。

---

**次のステップ**: [リファクタリング実装プラン](./REFACTORING_PLAN.md) に従って実装を開始してください。
