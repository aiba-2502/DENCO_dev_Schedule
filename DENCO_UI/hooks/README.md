# カスタムフックガイド

このディレクトリには、DENCO_UIで共通利用されるカスタムフックが格納されています。

## 📋 概要

カスタムフックを使用することで、以下のメリットがあります：

- **ロジックの再利用**: 同じパターンのコードを複数コンポーネントで共有
- **テストの容易性**: ロジックを独立してテスト可能
- **保守性の向上**: ロジック変更時の影響範囲が明確
- **コード量削減**: 重複コード削減

## 🎯 利用可能なフック

### useApiCall

**用途**: API呼び出しのローディング状態、エラーハンドリング、リトライを統一管理

```typescript
import { useApiCall } from '@/hooks/useApiCall';
import { api } from '@/lib/api-client';

function MyComponent() {
  const { data, loading, error, execute, retry } = useApiCall(
    () => api.python.customers.list('tenant-id')
  );

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message} <button onClick={retry}>Retry</button></div>;

  return <div>{/* data を使用 */}</div>;
}
```

**主な機能**:
- ローディング状態の自動管理
- エラーハンドリング
- リトライ機能
- キャンセル処理（unmount時）

---

### useFetchData

**用途**: データ取得の標準パターン（初回ロード + 自動リフレッシュ）

```typescript
import { useFetchData } from '@/hooks/useFetchData';

function CustomerList() {
  const {
    data,
    loading,
    error,
    refresh,
    refetch
  } = useFetchData(
    () => api.python.customers.list(tenantId),
    [tenantId], // 依存配列
    {
      refreshInterval: 30000, // 30秒ごとに自動リフレッシュ
      retryOnError: true
    }
  );

  return (
    <div>
      <button onClick={refresh}>手動リフレッシュ</button>
      {/* データ表示 */}
    </div>
  );
}
```

**主な機能**:
- 初回自動ロード
- 依存値変更時の自動再取得
- 定期的な自動リフレッシュ
- 手動リフレッシュ
- エラー時の自動リトライ

---

### useFormValidation

**用途**: フォームバリデーションとエラー表示の統一管理

```typescript
import { useFormValidation } from '@/hooks/useFormValidation';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
});

function CustomerForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting
  } = useFormValidation(schema, {
    onSubmit: async (data) => {
      await api.python.customers.create(data);
    },
    onSuccess: () => {
      toast({ title: '登録成功' });
    },
    onError: (error) => {
      toast({ title: 'エラー', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : '登録'}
      </button>
    </form>
  );
}
```

**主な機能**:
- Zodスキーマによるバリデーション
- フォーム送信状態管理
- エラーメッセージ表示
- 成功/失敗時のコールバック

---

### useWebSocket

**用途**: WebSocket接続の管理と自動再接続

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function CallMonitor() {
  const {
    isConnected,
    lastMessage,
    sendMessage,
    error
  } = useWebSocket('ws://localhost:3001/ws/frontend', {
    reconnect: true,
    reconnectInterval: 3000,
    onMessage: (message) => {
      console.log('Received:', message);
    },
    onConnect: () => {
      console.log('WebSocket connected');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    }
  });

  useEffect(() => {
    if (lastMessage) {
      // メッセージ処理
    }
  }, [lastMessage]);

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

**主な機能**:
- 自動接続・再接続
- メッセージ送受信
- 接続状態の監視
- エラーハンドリング
- unmount時の自動クリーンアップ

---

## 🔧 カスタムフック作成ガイドライン

### 命名規則

- **必ず `use` で始める**: `useCustomerData`, `useCallMonitor`
- **動詞 + 名詞**: `useFetchData`, `useFormValidation`
- **具体的な名前**: `useCallMonitor` > `useData`

### 基本構造

```typescript
import { useState, useEffect } from 'react';

/**
 * フックの説明
 * @param param1 - パラメータ1の説明
 * @param options - オプション設定
 * @returns 返り値の説明
 */
export function useCustomHook(param1: string, options?: Options) {
  const [state, setState] = useState<StateType>(initialValue);

  useEffect(() => {
    // 副作用処理

    return () => {
      // クリーンアップ処理
    };
  }, [param1]); // 依存配列

  // ヘルパー関数
  const helperFunction = () => {
    // ...
  };

  // 返り値
  return { state, helperFunction };
}
```

### ベストプラクティス

1. **単一責任の原則**: 1つのフックは1つの関心事のみ扱う
2. **依存配列を正確に**: useEffectの依存配列は必ず正しく設定
3. **クリーンアップ処理**: unmount時の処理を必ず実装
4. **TypeScriptで型定義**: パラメータと返り値の型を明示
5. **JSDocコメント**: 使用方法を説明するコメントを追加

### 悪い例 ❌

```typescript
// 複数の関心事を扱っている
export function useEverything(tenantId: string) {
  const customers = useFetch(/* ... */);
  const calls = useFetch(/* ... */);
  const settings = useFetch(/* ... */);

  // 300行のロジック...

  return { customers, calls, settings, /* ... */ };
}
```

### 良い例 ✅

```typescript
// 単一の関心事に集中
export function useCustomers(tenantId: string) {
  return useFetchData(
    () => api.python.customers.list(tenantId),
    [tenantId]
  );
}

export function useCalls(tenantId: string) {
  return useFetchData(
    () => api.python.calls.history(),
    [tenantId]
  );
}
```

---

## 📝 既存のフック

### use-toast.ts

shadcn/uiのトースト通知フック。そのまま使用してください。

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
    });
  };
}
```

---

## 🚀 フック追加手順

新しいカスタムフックを追加する場合：

1. **このディレクトリに新しいファイルを作成**
   - ファイル名: `use-feature-name.ts`
   - 例: `use-customer-data.ts`

2. **TypeScriptで型定義を含めて実装**
   ```typescript
   import { useState, useEffect } from 'react';

   export function useFeatureName() {
     // 実装
   }
   ```

3. **JSDocコメントを追加**
   ```typescript
   /**
    * 機能の説明
    * @param param - パラメータ説明
    * @returns 返り値の説明
    * @example
    * const { data } = useFeatureName(id);
    */
   ```

4. **このREADMEに使用例を追加**

5. **単体テストを作成**（推奨）
   - `hooks/__tests__/use-feature-name.test.ts`

---

## 🧪 テスト

カスタムフックのテストには `@testing-library/react-hooks` を使用してください。

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useApiCall } from './useApiCall';

describe('useApiCall', () => {
  it('should fetch data successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useApiCall(() => Promise.resolve({ data: 'test' }))
    );

    act(() => {
      result.current.execute();
    });

    await waitForNextUpdate();

    expect(result.current.data).toEqual({ data: 'test' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

---

## 📚 参考リンク

- [React Hooks 公式ドキュメント](https://react.dev/reference/react)
- [カスタムフックのベストプラクティス](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Testing Library for React Hooks](https://github.com/testing-library/react-hooks-testing-library)

---

## 💡 質問・改善提案

フックの使い方で不明点がある場合や、新しいフックのアイデアがあれば、チームで相談してください。
