# コンポーネント開発ガイド

1-2年経験のエンジニア向けの実践的なコンポーネント開発ガイドです。

## 目次

1. [新しいコンポーネントの作り方](#新しいコンポーネントの作り方)
2. [共通コンポーネント](#共通コンポーネント)
3. [カスタムフック](#カスタムフック)
4. [よくあるパターン](#よくあるパターン)
5. [トラブルシューティング](#トラブルシューティング)

## 新しいコンポーネントの作り方

### ステップ1: 配置場所を決める

#### 機能固有コンポーネント → `components/[feature]/`

例: 顧客管理機能の新しいコンポーネント

```
components/users/
└── customer-detail-modal.tsx  # 新規作成
```

#### 再利用可能コンポーネント → `components/shared/`

例: アプリ全体で使うコンポーネント

```
components/shared/
└── status-badge.tsx  # 新規作成
```

### ステップ2: テンプレートからコピー

基本的なコンポーネントテンプレート：

```typescript
"use client";

import React from "react";
// 必要なUIコンポーネントをインポート

/**
 * コンポーネントのプロパティ
 */
interface MyComponentProps {
  /** プロパティの説明 */
  title: string;
  /** オプショナルなプロパティ */
  description?: string;
  /** イベントハンドラー */
  onSubmit: (data: FormData) => void;
}

/**
 * コンポーネントの説明
 *
 * @example
 * ```tsx
 * <MyComponent
 *   title="タイトル"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function MyComponent({
  title,
  description,
  onSubmit
}: MyComponentProps) {
  // State
  const [isOpen, setIsOpen] = React.useState(false);

  // Handlers
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <button onClick={handleClick}>クリック</button>
    </div>
  );
}
```

### ステップ3: 型定義を追加

同じフォルダの`types.ts`に型を追加：

```typescript
// components/users/types.ts
export interface NewFeatureData {
  id: string;
  name: string;
  // ...
}
```

## 共通コンポーネント

アプリ全体で使える共通コンポーネントの使い方。

### LoadingSpinner

ローディング状態の表示。

```typescript
import { LoadingSpinner } from "@/components/shared/loading-spinner";

// 基本的な使い方
<LoadingSpinner />

// サイズ指定
<LoadingSpinner size={32} />

// テキスト付き
<LoadingSpinner text="読み込み中..." />

// 全画面表示
<LoadingSpinner fullScreen text="データを取得しています..." />
```

### ConfirmDialog

ユーザーに確認を求めるダイアログ。

#### コンポーネントとして使用

```typescript
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>削除</Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="削除の確認"
        description="本当に削除しますか？"
        onConfirm={() => {
          // 削除処理
          console.log("削除しました");
        }}
      />
    </>
  );
}
```

#### カスタムフックとして使用

```typescript
import { useConfirmDialog } from "@/components/shared/confirm-dialog";

function MyComponent() {
  const { dialog, confirm } = useConfirmDialog();

  const handleDelete = async () => {
    const result = await confirm({
      title: "削除の確認",
      description: "本当に削除しますか？"
    });

    if (result) {
      // 削除処理
    }
  };

  return (
    <>
      <Button onClick={handleDelete}>削除</Button>
      {dialog}
    </>
  );
}
```

### ErrorBoundary

エラーをキャッチして表示。

```typescript
import { ErrorBoundary } from "@/components/shared/error-boundary";

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h2>エラーが発生しました</h2>
          <p>{error.message}</p>
          <Button onClick={reset}>リトライ</Button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### DataTable

ソート、ページネーション、選択機能付きテーブル。

```typescript
import { DataTable } from "@/components/shared/data-table";
import type { Customer } from "./types";

function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "id", header: "ID", sortable: true },
    { key: "name", header: "名前", sortable: true },
    { key: "email", header: "メール" },
  ];

  return (
    <DataTable<Customer>
      data={customers}
      columns={columns}
      loading={loading}
      selectable
      onSelectionChange={(selected) => console.log(selected)}
      pagination={{
        currentPage: 1,
        totalPages: 10,
        onPageChange: (page) => console.log(page),
      }}
    />
  );
}
```

### FormModal

モーダル形式のフォーム用コンポーネント群。

```typescript
import {
  FormModal,
  FormLabel,
  FormError
} from "@/components/shared/form-modal";

function MyForm() {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="顧客追加"
      onSubmit={handleSubmit}
    >
      <FormLabel required>名前</FormLabel>
      <Input {...register("name")} />
      <FormError>{errors.name?.message}</FormError>
    </FormModal>
  );
}
```

## カスタムフック

### useApiCall

API呼び出しとエラーハンドリング。

```typescript
import { useApiCall } from "@/hooks/use-api-call";

function MyComponent() {
  const { data, loading, error, execute, retry } = useApiCall(
    async () => {
      const response = await fetch("/api/customers");
      return response.json();
    },
    {
      onSuccess: (data) => {
        toast.success("取得成功");
      },
      onError: (error) => {
        toast.error(`エラー: ${error.message}`);
      },
    }
  );

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} onRetry={retry} />}
      {data && <DataDisplay data={data} />}
      <Button onClick={execute}>データ取得</Button>
    </div>
  );
}
```

### useFetchData

自動データフェッチング（マウント時・依存変更時）。

```typescript
import { useFetchData } from "@/hooks/use-fetch-data";

function CustomerList() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error, refresh } = useFetchData(
    async () => {
      const response = await fetch(`/api/customers?search=${searchTerm}`);
      return response.json();
    },
    [searchTerm], // 依存配列: searchTermが変わると再取得
    {
      refreshInterval: 30000, // 30秒ごとに自動更新
    }
  );

  return (
    <div>
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button onClick={refresh}>手動更新</Button>
      {loading && <LoadingSpinner />}
      {data && <CustomerTable data={data} />}
    </div>
  );
}
```

### useFormValidation

フォームバリデーション（react-hook-form + Zod）。

```typescript
import { useFormValidation } from "@/hooks/use-form-validation";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  age: z.number().min(18, "18歳以上である必要があります"),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    isSubmitting,
  } = useFormValidation<FormData>(schema, {
    defaultValues: { name: "", email: "", age: 0 },
    onSubmit: async (data) => {
      await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("送信完了");
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <Input {...register("name")} />
      {errors.name && <ErrorText>{errors.name.message}</ErrorText>}

      <Input {...register("email")} />
      {errors.email && <ErrorText>{errors.email.message}</ErrorText>}

      <Button type="submit" disabled={isSubmitting}>
        送信
      </Button>
    </form>
  );
}
```

### useWebSocket

WebSocket接続管理。

```typescript
import { useWebSocket } from "@/hooks/use-websocket";

function CallMonitor() {
  const {
    isConnected,
    lastMessage,
    sendMessage
  } = useWebSocket("ws://localhost:3001/ws/frontend", {
    reconnect: true,
    reconnectInterval: 3000,
    onOpen: () => {
      console.log("接続しました");
    },
    onMessage: (event) => {
      console.log("メッセージ受信:", event.data);
    },
  });

  return (
    <div>
      <StatusBadge
        status={isConnected ? "接続中" : "切断"}
      />
      {lastMessage && (
        <div>最新メッセージ: {lastMessage}</div>
      )}
      <Button onClick={() => sendMessage("ping")}>
        Ping送信
      </Button>
    </div>
  );
}
```

## よくあるパターン

### パターン1: CRUD操作

Create, Read, Update, Deleteの基本パターン。

```typescript
function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Create
  const handleAdd = (data: CustomerFormData) => {
    const newCustomer = { id: Date.now().toString(), ...data };
    setCustomers([...customers, newCustomer]);
    setIsAddDialogOpen(false);
    toast.success("追加しました");
  };

  // Read (useFetchData使用)
  const { data } = useFetchData(fetchCustomers, []);

  // Update
  const handleUpdate = (id: string, data: CustomerFormData) => {
    setCustomers(customers.map(c =>
      c.id === id ? { ...c, ...data } : c
    ));
    toast.success("更新しました");
  };

  // Delete
  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast.success("削除しました");
  };

  return (
    <div>
      <Button onClick={() => setIsAddDialogOpen(true)}>
        追加
      </Button>
      <CustomerList
        customers={customers}
        onEdit={setEditingCustomer}
        onDelete={handleDelete}
      />
      <CustomerFormDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}
```

### パターン2: 検索とフィルタリング

```typescript
function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // フィルタリングロジック
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch =
        searchTerm === "" ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  return (
    <div>
      <Input
        placeholder="検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectItem value="all">すべて</SelectItem>
        <SelectItem value="active">有効</SelectItem>
        <SelectItem value="inactive">無効</SelectItem>
      </Select>
      <CustomerTable data={filteredCustomers} />
    </div>
  );
}
```

### パターン3: マスター・ディテールビュー

```typescript
function CustomerMasterDetail() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: customers } = useFetchData(fetchCustomers, []);
  const { data: detail } = useFetchData(
    () => fetchCustomerDetail(selectedCustomerId!),
    [selectedCustomerId],
    { skip: !selectedCustomerId }
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* マスター */}
      <Card>
        <CustomerList
          customers={customers}
          selectedId={selectedCustomerId}
          onSelect={setSelectedCustomerId}
        />
      </Card>

      {/* ディテール */}
      <Card>
        {detail ? (
          <CustomerDetail data={detail} />
        ) : (
          <p>顧客を選択してください</p>
        )}
      </Card>
    </div>
  );
}
```

### パターン4: 条件付きレンダリング

```typescript
function CustomerView({ customerId }: { customerId: string }) {
  const { data, loading, error } = useFetchData(
    () => fetchCustomer(customerId),
    [customerId]
  );

  // ローディング状態
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // エラー状態
  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // データなし
  if (!data) {
    return (
      <EmptyState
        title="顧客が見つかりません"
        description="指定されたIDの顧客は存在しません"
      />
    );
  }

  // 正常表示
  return <CustomerDetail data={data} />;
}
```

## トラブルシューティング

### Q: コンポーネントが再レンダリングされすぎる

**原因**: Props や State の不必要な変更

**解決策**:

```typescript
// ❌ 悪い例: 毎回新しいオブジェクトを作成
<MyComponent config={{ setting: true }} />

// ✅ 良い例: useMemoで安定化
const config = useMemo(() => ({ setting: true }), []);
<MyComponent config={config} />

// ❌ 悪い例: 毎回新しい関数を作成
<MyComponent onClick={() => console.log("click")} />

// ✅ 良い例: useCallbackで安定化
const handleClick = useCallback(() => {
  console.log("click");
}, []);
<MyComponent onClick={handleClick} />
```

### Q: フォームの値が更新されない

**原因**: Controlled/Uncontrolled コンポーネントの混在

**解決策**:

```typescript
// ❌ 悪い例: 初期値がundefined
const [value, setValue] = useState<string>();
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// ✅ 良い例: 初期値を空文字列に
const [value, setValue] = useState<string>("");
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

### Q: APIが複数回呼ばれる

**原因**: useEffectの依存配列が不適切

**解決策**:

```typescript
// ❌ 悪い例: 依存配列にオブジェクトや配列
useEffect(() => {
  fetchData(config); // 毎回実行される
}, [config]); // configは毎回新しいオブジェクト

// ✅ 良い例: プリミティブ値のみ
useEffect(() => {
  fetchData(config);
}, [config.id, config.type]); // プリミティブ値

// または useMemo で安定化
const config = useMemo(() => ({ id, type }), [id, type]);
```

### Q: "Cannot read property of undefined"エラー

**原因**: データが読み込まれる前にアクセス

**解決策**:

```typescript
// ❌ 悪い例: ガードなし
<div>{user.name}</div>

// ✅ 良い例: Optional chaining
<div>{user?.name}</div>

// ✅ 良い例: 条件付きレンダリング
{user && <div>{user.name}</div>}

// ✅ 良い例: デフォルト値
<div>{user?.name ?? "名無し"}</div>
```

### Q: カスタムフックでエラーが出る

**原因**: Reactのルールに違反

**解決策**:

```typescript
// ❌ 悪い例: 条件付きでフック呼び出し
if (condition) {
  const data = useFetchData(fetchData, []);
}

// ✅ 良い例: 常に呼び出し、skipオプションで制御
const { data } = useFetchData(
  fetchData,
  [],
  { skip: !condition }
);
```

## チェックリスト

新しいコンポーネントを作成したら、以下を確認：

- [ ] `"use client"`ディレクティブが必要な場合は追加した
- [ ] Props に TypeScript の型を定義した
- [ ] JSDocコメントを書いた（特に複雑なコンポーネント）
- [ ] エラーハンドリングを実装した
- [ ] ローディング状態を表示した
- [ ] 適切なカスタムフックを使った
- [ ] 不要な再レンダリングを防いだ（useMemo/useCallback）
- [ ] 300行を超えていないか確認した

## さらに学ぶ

- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ概要
- [hooks/README.md](../hooks/README.md) - カスタムフック詳細
- [Next.js ドキュメント](https://nextjs.org/docs)
- [React ドキュメント](https://react.dev)
