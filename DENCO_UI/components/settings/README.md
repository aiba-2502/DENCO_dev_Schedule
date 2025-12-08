# テナント・部署管理コンポーネント

テナント（組織）と部署の管理機能を提供します。カスケード削除、ステータス管理、検索・フィルタリングに対応しています。

## ファイル構成

```
settings/
├── README.md                        # このファイル
├── tenant-types.ts                  # 型定義
├── tenant-management.tsx            # メインコンポーネント
├── tenant-department-forms.tsx      # フォームコンポーネント
└── tenant-department-lists.tsx      # リストコンポーネント
```

## コンポーネント概要

### TenantManagement (メイン)

テナントと部署を統合管理する画面コンポーネント。

**使用例**:
```typescript
import TenantManagement from "@/components/settings/tenant-management";

function SettingsPage() {
  return (
    <TenantManagement
      onTenantsUpdate={(tenants) => console.log("Tenants updated:", tenants)}
      onDepartmentsUpdate={(depts) => console.log("Departments updated:", depts)}
    />
  );
}
```

**Props**:
```typescript
interface TenantManagementProps {
  onTenantsUpdate?: (tenants: TenantEntry[]) => void;
  onDepartmentsUpdate?: (departments: Department[]) => void;
}
```

**機能**:
- テナント一覧表示・追加・編集・削除
- 部署一覧表示・追加・編集・削除
- カスケード削除（テナント削除時に紐づく部署も削除）
- 検索・フィルタリング
- ステータス管理（active/inactive）

**カスケード削除の動作**:
```typescript
// テナントを削除すると、紐づく部署も自動削除される
handleDeleteTenant("tenant-1");
// → "tenant-1"に属する全部署が削除される
// → その後テナントが削除される
```

### TenantForm / DepartmentForm

テナント・部署の追加・編集フォーム。

**TenantForm Props**:
```typescript
interface TenantFormProps {
  formData: {
    name: string;
    description: string;
    status: "active" | "inactive";
  };
  onChange: (formData: any) => void;
}
```

**DepartmentForm Props**:
```typescript
interface DepartmentFormProps {
  formData: {
    name: string;
    description: string;
    tenantId: string;  // 所属テナントID
    status: "active" | "inactive";
  };
  onChange: (formData: any) => void;
  tenants: TenantEntry[];  // テナント選択用
}
```

**機能**:
- 名前・説明入力
- ステータス選択
- テナント選択（部署のみ）
- バリデーション

### TenantList / DepartmentList

テナント・部署の検索・一覧表示・操作。

**TenantList Props**:
```typescript
interface TenantListProps {
  tenants: TenantEntry[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddClick: () => void;
  onEditClick: (tenant: TenantEntry) => void;
  onDeleteClick: (id: string) => void;
}
```

**DepartmentList Props**:
```typescript
interface DepartmentListProps {
  departments: Department[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  tenantFilter: string;
  onTenantFilterChange: (value: string) => void;
  tenants: TenantEntry[];  // テナント名表示用
  onAddClick: () => void;
  onEditClick: (department: Department) => void;
  onDeleteClick: (id: string) => void;
}
```

**機能**:
- 検索（名前・説明）
- ステータスフィルター
- テナントフィルター（部署のみ）
- 一覧テーブル表示
- ステータスバッジ表示
- 操作ボタン（編集・削除）

## 型定義（tenant-types.ts）

### 主要な型

```typescript
// テナント情報
interface TenantEntry {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

// 部署情報
interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;  // 所属テナントID
  status: "active" | "inactive";
  createdAt: string;
}

// フォームデータ型
interface TenantFormData {
  name: string;
  description: string;
  status: "active" | "inactive";
}

interface DepartmentFormData {
  name: string;
  description: string;
  tenantId: string;
  status: "active" | "inactive";
}
```

### ユーティリティ関数

```typescript
// テナント名取得
function getTenantName(tenantId: string, tenants: TenantEntry[]): string {
  return tenants.find(t => t.id === tenantId)?.name || "不明なテナント";
}
```

## 使用例

### 基本的な使い方

```typescript
import TenantManagement from "@/components/settings/tenant-management";

export default function SettingsPage() {
  return (
    <div className="container py-6">
      <TenantManagement />
    </div>
  );
}
```

### データ更新をハンドリングする

```typescript
import TenantManagement from "@/components/settings/tenant-management";
import { useState } from "react";

function SettingsWithSync() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  return (
    <TenantManagement
      onTenantsUpdate={(tenants) => {
        console.log(`${tenants.length}件のテナントが更新されました`);
        setLastUpdate(new Date());
      }}
      onDepartmentsUpdate={(depts) => {
        console.log(`${depts.length}件の部署が更新されました`);
        setLastUpdate(new Date());
      }}
    />
  );
}
```

### APIと連携する

```typescript
import TenantManagement from "@/components/settings/tenant-management";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useApiCall } from "@/hooks/use-api-call";

function APIIntegratedSettings() {
  // データ取得
  const { data: tenants, refresh: refreshTenants } = useFetchData(
    () => fetch("/api/tenants").then(r => r.json()),
    []
  );

  const { data: departments, refresh: refreshDepartments } = useFetchData(
    () => fetch("/api/departments").then(r => r.json()),
    []
  );

  // 追加API
  const { execute: addTenant } = useApiCall(
    async (tenant: TenantEntry) => {
      const response = await fetch("/api/tenants", {
        method: "POST",
        body: JSON.stringify(tenant),
      });
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success("テナントを追加しました");
        refreshTenants();
      },
    }
  );

  return <TenantManagement /* propsに渡す */ />;
}
```

### カスタムバリデーションを追加する

```typescript
import { TenantForm } from "@/components/settings/tenant-department-forms";
import { useFormValidation } from "@/hooks/use-form-validation";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(1, "テナント名は必須です").max(100, "100文字以内で入力してください"),
  description: z.string().max(500, "500文字以内で入力してください"),
  status: z.enum(["active", "inactive"]),
});

function ValidatedTenantForm() {
  const { register, handleSubmit, formState: { errors } } = useFormValidation(tenantSchema, {
    onSubmit: handleAddTenant,
  });

  return (
    <form onSubmit={handleSubmit}>
      <TenantForm {...register} />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
    </form>
  );
}
```

## 開発ガイド

### カスケード削除のカスタマイズ

デフォルトでは、テナント削除時に紐づく部署も削除されます。
この動作を変更する場合は`tenant-management.tsx`を修正：

```typescript
const handleDeleteTenant = (id: string) => {
  // カスタムロジック例: 部署が存在する場合は削除を禁止
  const relatedDepts = departments.filter(dept => dept.tenantId === id);
  if (relatedDepts.length > 0) {
    toast.error(`このテナントには${relatedDepts.length}件の部署が紐づいています。先に部署を削除してください。`);
    return;
  }

  // 部署がない場合のみテナント削除
  const updatedTenants = tenants.filter(tenant => tenant.id !== id);
  setTenants(updatedTenants);
  onTenantsUpdate?.(updatedTenants);
  toast.success("テナントを削除しました");
};
```

### 新しいステータスを追加する

1. `tenant-types.ts`のステータス型を拡張：

```typescript
// Before
status: "active" | "inactive"

// After
status: "active" | "inactive" | "suspended" | "archived"
```

2. `tenant-department-forms.tsx`の選択肢を追加：

```typescript
<Select value={formData.status} onValueChange={(value) => onChange({ ...formData, status: value })}>
  <SelectItem value="active">有効</SelectItem>
  <SelectItem value="inactive">無効</SelectItem>
  <SelectItem value="suspended">一時停止</SelectItem>
  <SelectItem value="archived">アーカイブ</SelectItem>
</Select>
```

3. `tenant-department-lists.tsx`のバッジ表示を更新：

```typescript
function getStatusBadge(status: string) {
  const statusConfig = {
    active: { label: "有効", variant: "default" },
    inactive: { label: "無効", variant: "secondary" },
    suspended: { label: "一時停止", variant: "outline" },
    archived: { label: "アーカイブ", variant: "destructive" },
  };
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

### 新しいフィルター条件を追加

`tenant-department-lists.tsx`のフィルタリングロジックを拡張：

```typescript
const filteredTenants = tenants.filter(tenant => {
  // 既存の条件
  const matchesSearch = /* ... */;
  const matchesStatus = /* ... */;

  // 新しい条件: 作成日フィルター
  const matchesDateRange =
    !dateRangeFilter ||
    new Date(tenant.createdAt) >= dateRangeFilter.start &&
    new Date(tenant.createdAt) <= dateRangeFilter.end;

  return matchesSearch && matchesStatus && matchesDateRange;
});
```

### 一括操作機能を追加

複数選択と一括削除の実装例：

```typescript
const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

const handleBulkDelete = () => {
  // 選択されたテナントと紐づく部署を削除
  const updatedDepartments = departments.filter(
    dept => !selectedTenantIds.includes(dept.tenantId)
  );
  const updatedTenants = tenants.filter(
    tenant => !selectedTenantIds.includes(tenant.id)
  );

  setDepartments(updatedDepartments);
  setTenants(updatedTenants);
  setSelectedTenantIds([]);
  toast.success(`${selectedTenantIds.length}件のテナントを削除しました`);
};

// チェックボックスをテーブルに追加
<Checkbox
  checked={selectedTenantIds.includes(tenant.id)}
  onCheckedChange={(checked) => {
    if (checked) {
      setSelectedTenantIds([...selectedTenantIds, tenant.id]);
    } else {
      setSelectedTenantIds(selectedTenantIds.filter(id => id !== tenant.id));
    }
  }}
/>
```

## トラブルシューティング

### Q: テナントを削除しても部署が残ってしまう

**原因**: カスケード削除が正しく実装されていない

**解決策**:
```typescript
// tenant-management.tsx の handleDeleteTenant を確認
const handleDeleteTenant = (id: string) => {
  // 1. 部署を先に削除
  const updatedDepartments = departments.filter(dept => dept.tenantId !== id);
  setDepartments(updatedDepartments);
  onDepartmentsUpdate?.(updatedDepartments);

  // 2. その後テナントを削除
  const updatedTenants = tenants.filter(tenant => tenant.id !== id);
  setTenants(updatedTenants);
  onTenantsUpdate?.(updatedTenants);
};
```

### Q: 部署リストでテナント名が「不明なテナント」と表示される

**原因**: テナントデータが正しく渡されていない、またはテナントIDが一致しない

**確認事項**:
```typescript
// DepartmentList に tenants prop が渡されているか
<DepartmentList
  departments={departments}
  tenants={tenants}  // ← これが必要
  // ...
/>

// department.tenantId が正しいか
console.log("Department:", department.tenantId);
console.log("Available tenants:", tenants.map(t => t.id));
```

### Q: フィルターがリセットされてしまう

**原因**: ステート管理の問題

**解決策**: フィルター用のステートを分離
```typescript
// 個別のステートで管理
const [tenantSearchTerm, setTenantSearchTerm] = useState("");
const [tenantStatusFilter, setTenantStatusFilter] = useState("all");
const [deptSearchTerm, setDeptSearchTerm] = useState("");
const [deptStatusFilter, setDeptStatusFilter] = useState("all");
const [deptTenantFilter, setDeptTenantFilter] = useState("all");

// 各リストに対応するステートを渡す
```

### Q: ダイアログを閉じてもフォーム内容が残る

**原因**: フォームデータがリセットされていない

**解決策**:
```typescript
const handleCloseDialog = () => {
  setIsAddDialogOpen(false);
  setIsEditMode(false);
  setEditingId(null);
  // フォームデータをリセット
  setFormData({
    name: "",
    description: "",
    status: "active",
  });
};
```

### Q: ステータス変更が反映されない

**原因**: オブジェクトの不変性が保たれていない

**解決策**:
```typescript
// ❌ 悪い例
const handleStatusChange = (id: string, newStatus: string) => {
  const tenant = tenants.find(t => t.id === id);
  tenant.status = newStatus;  // 直接変更はNG
  setTenants(tenants);
};

// ✅ 良い例
const handleStatusChange = (id: string, newStatus: string) => {
  const updatedTenants = tenants.map(tenant =>
    tenant.id === id ? { ...tenant, status: newStatus } : tenant
  );
  setTenants(updatedTenants);
};
```

## パフォーマンス最適化

### 大量データの表示

テナント・部署が数百件を超える場合：

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// 仮想スクロール実装
const virtualizer = useVirtualizer({
  count: filteredTenants.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 60,
});
```

### 検索のデバウンス

高速に入力される検索条件をデバウンス：

```typescript
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebouncedValue(searchInput, 300);

// debouncedSearch を使ってフィルタリング
```

### メモ化

フィルタリング処理の最適化：

```typescript
const filteredTenants = useMemo(() => {
  return tenants.filter(tenant => {
    const matchesSearch = searchTerm === "" ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}, [tenants, searchTerm, statusFilter]);
```

## セキュリティ考慮事項

### 削除操作の確認

重要なデータの削除には確認ダイアログを使用：

```typescript
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

<ConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={() => handleDeleteTenant(deletingId)}
  title="テナントを削除しますか？"
  description="このテナントに紐づく全ての部署も削除されます。この操作は取り消せません。"
  confirmText="削除"
  variant="destructive"
/>
```

### 権限チェック

削除や編集操作に権限チェックを追加：

```typescript
const canDeleteTenant = (tenantId: string) => {
  // 現在のユーザーの権限をチェック
  return userRole === "admin" || userTenantId === tenantId;
};

<Button
  onClick={() => handleDeleteTenant(tenant.id)}
  disabled={!canDeleteTenant(tenant.id)}
>
  削除
</Button>
```

## 関連ドキュメント

- [COMPONENT_GUIDE.md](../../docs/COMPONENT_GUIDE.md) - 共通パターン
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - アーキテクチャ概要
- [hooks/README.md](../../hooks/README.md) - カスタムフック
