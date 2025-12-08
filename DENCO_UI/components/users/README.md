# 顧客管理コンポーネント

顧客情報の管理、検索、フィルタリング、タグ管理を提供します。

## ファイル構成

```
users/
├── README.md                  # このファイル
├── types.ts                  # 型定義
├── customer-management.tsx   # メインコンポーネント
├── customer-form.tsx         # 顧客フォーム
├── customer-list.tsx         # 顧客リスト
└── tag-management.tsx        # タグ管理（既存）
```

## コンポーネント概要

### CustomerManagement (メイン)

顧客管理画面の統合コンポーネント。

**使用例**:
```typescript
import CustomerManagement from "@/components/users/customer-management";

function Page() {
  return <CustomerManagement />;
}
```

**機能**:
- 顧客一覧表示
- 顧客追加・編集・削除
- 検索・フィルタリング
- タグ管理
- 通話発信機能
- URLパラメータからの自動顧客登録

**URLパラメータ対応**:
```
/users?register=true&phoneNumber=090-1234-5678&tenant=株式会社ABC&suggestedName=山田 太郎
```
→ 自動的に顧客追加ダイアログが開き、情報が入力される

### CustomerForm

顧客の追加・編集フォーム。

**Props**:
```typescript
interface CustomerFormProps {
  formData: FormData;
  onChange: (formData: FormData) => void;
  isEditMode?: boolean;  // 編集モードかどうか
}
```

**機能**:
- 姓名・フリガナ入力
- 電話番号・FAX番号入力
- メールアドレス入力
- 郵便番号入力（自動住所補完）
- 都道府県・住所入力
- テナント選択

**郵便番号自動補完**:
```typescript
// 7桁入力時に自動的に住所を補完
"1000001" → "東京都 千代田区千代田"
```

自動補完データは`types.ts`の`postalCodeData`で定義。

### CustomerList

顧客の検索・一覧表示・操作。

**Props**:
```typescript
interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tenantFilter: string;
  onTenantFilterChange: (value: string) => void;
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  onClearTagFilters: () => void;
  availableTags: Tag[];
  onEditClick: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onCallClick: (phoneNumber: string, customerName: string) => void;
}
```

**機能**:
- 複合検索（名前、フリガナ、電話、FAX、メール、住所）
- テナントフィルター
- タグフィルター（AND条件）
- 顧客一覧テーブル
- アバター表示
- 操作ボタン（通話、編集、削除）

## 型定義（types.ts）

### 主要な型

```typescript
// 顧客情報
interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
  tags: Array<{ id: string; name: string; color: string }>;
  createdAt: string;
}

// フォームデータ
interface FormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
}

// タグ情報
interface Tag {
  id: string;
  name: string;
  color: string;  // HEX形式 (#FF0000)
}
```

### ユーティリティ関数

```typescript
// 色の明度判定（タグの文字色決定用）
function isLightColor(color: string): boolean {
  // 明るい色の場合true → 黒文字
  // 暗い色の場合false → 白文字
}
```

## 使用例

### 基本的な使い方

```typescript
import CustomerManagement from "@/components/users/customer-management";

export default function CustomersPage() {
  return (
    <div className="container py-6">
      <CustomerManagement />
    </div>
  );
}
```

### カスタムフィルターを追加する

```typescript
import { CustomerList } from "@/components/users/customer-list";
import { useState } from "react";

function CustomCustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // カスタムフィルタリング
  const filteredCustomers = customers.filter(c => {
    if (statusFilter === "vip") {
      return c.tags.some(tag => tag.name === "VIP");
    }
    return true;
  });

  return (
    <>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectItem value="all">すべて</SelectItem>
        <SelectItem value="vip">VIPのみ</SelectItem>
      </Select>

      <CustomerList
        customers={filteredCustomers}
        // ...その他のprops
      />
    </>
  );
}
```

### 外部システムからの顧客登録

通話システムからの未登録顧客を自動登録する場合：

```typescript
// 通話画面から遷移
router.push(`/users?register=true&phoneNumber=${phoneNumber}&tenant=${tenantId}&suggestedName=${aiSuggestedName}`);
```

CustomerManagementコンポーネントが自動的にダイアログを開き、情報を入力します。

### APIと連携する

```typescript
import CustomerManagement from "@/components/users/customer-management";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useApiCall } from "@/hooks/use-api-call";

function APIIntegratedCustomerManagement() {
  // データ取得
  const { data: customers, refresh } = useFetchData(
    () => fetch("/api/customers").then(r => r.json()),
    []
  );

  // 追加API
  const { execute: addCustomer } = useApiCall(
    async (customer: Customer) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(customer),
      });
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success("顧客を追加しました");
        refresh(); // リスト再取得
      },
    }
  );

  return <CustomerManagement /* propsに渡す */ />;
}
```

## 開発ガイド

### 郵便番号データの追加

`types.ts`の`postalCodeData`に追加：

```typescript
export const postalCodeData: Record<string, { prefecture: string; address: string }> = {
  "1000001": { prefecture: "東京都", address: "千代田区千代田" },
  "新しい郵便番号": { prefecture: "都道府県", address: "住所" },
  // ...
};
```

実運用では郵便番号APIを使用することを推奨。

### 新しいフィルター条件を追加

`customer-list.tsx`のフィルタリングロジックを拡張：

```typescript
const filteredCustomers = customers.filter(customer => {
  // 既存の条件
  const matchesSearch = /* ... */;
  const matchesTenant = /* ... */;
  const matchesTags = /* ... */;

  // 新しい条件を追加
  const matchesNewCondition = newFilter === "all" || /* ... */;

  return matchesSearch && matchesTenant && matchesTags && matchesNewCondition;
});
```

### タグの色を変更する

タグ管理コンポーネント（`tag-management.tsx`）でカラーピッカーから選択。

`isLightColor`関数が自動的に適切な文字色を決定します：
- 明るい色 → 黒文字
- 暗い色 → 白文字

### 通話発信機能のカスタマイズ

`customer-management.tsx`の`handleConfirmCall`を修正：

```typescript
const handleConfirmCall = () => {
  // カスタムAPI呼び出し
  await fetch("/api/calls/initiate", {
    method: "POST",
    body: JSON.stringify({
      phoneNumber: selectedCallTarget.phoneNumber,
      customerId: /* ... */
    }),
  });
};
```

## トラブルシューティング

### Q: 郵便番号を入力しても住所が補完されない

**確認事項**:
1. 7桁入力しているか（ハイフンは自動挿入）
2. `postalCodeData`に該当データがあるか

**解決策**:
```typescript
// デバッグ用
console.log("入力された郵便番号:", numbersOnly);
console.log("マッチするデータ:", postalCodeData[numbersOnly]);
```

### Q: タグフィルターが効かない

**原因**: AND条件のため、選択した全てのタグを持つ顧客のみ表示

**確認事項**:
```typescript
// AND条件（全てのタグが必要）
selectedTags.every(tagId => customer.tags.some(tag => tag.id === tagId))

// OR条件に変更する場合
selectedTags.some(tagId => customer.tags.some(tag => tag.id === tagId))
```

### Q: アバターが表示されない

**原因**: 姓名が空の場合

**解決策**:
```typescript
// フォールバック処理を追加
<AvatarFallback>
  {customer.lastName?.charAt(0) || "?"}{customer.firstName?.charAt(0) || "?"}
</AvatarFallback>
```

### Q: フォームバリデーションを追加したい

**解決策**: `useFormValidation`を使用

```typescript
import { useFormValidation } from "@/hooks/use-form-validation";
import { z } from "zod";

const schema = z.object({
  lastName: z.string().min(1, "姓は必須です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phoneNumber: z.string().regex(/^\d{2,4}-\d{2,4}-\d{4}$/, "電話番号の形式が正しくありません"),
});

// CustomerFormで使用
const { register, handleSubmit, formState: { errors } } = useFormValidation(schema, {
  onSubmit: handleAddCustomer,
});
```

## パフォーマンス最適化

### 大量データの表示

顧客数が1000件を超える場合、仮想スクロールの導入を検討：

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// 仮想スクロール実装
const virtualizer = useVirtualizer({
  count: filteredCustomers.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 60, // 行の高さ
});
```

### 検索のデバウンス

高速に入力される検索条件をデバウンス：

```typescript
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebouncedValue(searchInput, 300);

// debouncedSearchを使ってフィルタリング
```

## 関連ドキュメント

- [COMPONENT_GUIDE.md](../../docs/COMPONENT_GUIDE.md) - 共通パターン
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - アーキテクチャ概要
- [hooks/README.md](../../hooks/README.md) - カスタムフック
