# 通知設定コンポーネント

通知ルール、テンプレート、スタッフ選択などの通知関連機能を提供します。

## ファイル構成

```
notifications/
├── README.md                           # このファイル
├── types.ts                           # 型定義
├── notification-settings.tsx          # メインコンポーネント
├── notification-rule-form.tsx         # ルールフォーム
├── notification-template-manager.tsx  # テンプレート管理
└── notification-staff-selector.tsx    # スタッフ選択
```

## コンポーネント概要

### NotificationSettings (メイン)

通知設定画面の統合コンポーネント。ルール一覧、CRUD操作を提供。

**使用例**:
```typescript
import NotificationSettings from "@/components/notifications/notification-settings";

function Page() {
  return <NotificationSettings />;
}
```

**機能**:
- 通知ルール一覧表示
- ルールの追加・編集・削除
- ページネーション
- テンプレート管理ダイアログ

### NotificationRuleForm

通知ルールの作成・編集フォーム。

**Props**:
```typescript
interface NotificationRuleFormProps {
  rule?: NotificationRule;     // 編集時のルールデータ
  onSubmit: (rule: NotificationRule) => void;
  onCancel: () => void;
  staff: Staff[];              // スタッフリスト
  customers: Customer[];       // 顧客リスト
  templates: NotificationTemplate[];
}
```

**機能**:
- イベントタイプ選択（着信/FAX）
- 対象選択（電話番号/顧客）
- キーワード条件（リストモード/論理演算モード）
- 通知アクション設定（メール/Chatwork/LINE/電話）
- テンプレート選択
- AI要約オプション

### NotificationTemplateManager

通知テンプレートの管理ダイアログ。

**Props**:
```typescript
interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: NotificationTemplate[];
  onAdd: (template: Omit<NotificationTemplate, "id">) => void;
  onUpdate: (id: string, template: Omit<NotificationTemplate, "id">) => void;
  onDelete: (id: string) => void;
}
```

**機能**:
- テンプレート一覧表示
- テンプレート作成（変数自動抽出）
- テンプレート編集
- テンプレート削除
- 変数プレビュー

**変数の使い方**:
```
テンプレート内で {変数名} を使用できます。

例: 「{caller}さんから{time}に着信がありました。」
→ 変数: [caller, time]
```

### NotificationStaffSelector

スタッフ選択ダイアログ（通知先選択用）。

**Props**:
```typescript
interface StaffSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff[];
  onSelect: (staffId: string) => void;
}
```

**機能**:
- スタッフ検索（名前、部署、メール）
- スタッフ一覧表示
- 単一選択

## 型定義（types.ts）

### 主要な型

```typescript
// 通知ルール
interface NotificationRule {
  id: string;
  name: string;
  conditions: {
    type: ("call" | "fax")[];
    target: {
      type: "phone" | "customer";
      value: string[];
    };
    keywords?: KeywordCondition;
  };
  actions: Array<{
    type: "email" | "chatwork" | "line" | "phone";
    config: {
      destination: NotificationDestination;
      templateId?: string;
      useSummary?: boolean;
    };
  }>;
  enabled: boolean;
}

// 通知テンプレート
interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];  // {変数名}から自動抽出
  createdAt: string;
}

// スタッフ情報
interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  chatworkId?: string;
  lineId?: string;
  phoneNumber?: string;
}
```

## 使用例

### 基本的な使い方

```typescript
import NotificationSettings from "@/components/notifications/notification-settings";

export default function NotificationsPage() {
  return (
    <div className="container">
      <NotificationSettings />
    </div>
  );
}
```

### カスタムデータソースを使う場合

```typescript
import { NotificationRuleForm } from "@/components/notifications/notification-rule-form";
import { useFetchData } from "@/hooks/use-fetch-data";

function CustomNotificationPage() {
  // APIからデータ取得
  const { data: staff } = useFetchData(fetchStaff, []);
  const { data: templates } = useFetchData(fetchTemplates, []);

  const handleSubmit = async (rule: NotificationRule) => {
    await fetch("/api/notification-rules", {
      method: "POST",
      body: JSON.stringify(rule),
    });
  };

  return (
    <NotificationRuleForm
      staff={staff}
      templates={templates}
      onSubmit={handleSubmit}
      onCancel={() => history.back()}
    />
  );
}
```

## 開発ガイド

### 新しい通知タイプを追加する

1. `types.ts`の`NotificationRule.actions[].type`に新しいタイプを追加
2. `notification-rule-form.tsx`のアクション選択に追加
3. バックエンドAPI対応

### 新しいキーワード演算子を追加する

1. `types.ts`の`KeywordCondition`を拡張
2. `notification-rule-form.tsx`の論理演算UIに追加

### テンプレート変数の拡張

利用可能な変数を追加したい場合：

1. バックエンドで変数を定義
2. `notification-template-manager.tsx`のヘルプテキストを更新

```typescript
<div className="text-xs text-muted-foreground">
  利用可能な変数: {"{caller}"}, {"{number}"}, {"{time}"}, {"{新しい変数}"}
</div>
```

## トラブルシューティング

### Q: キーワード条件が保存されない

**確認事項**:
- `KeywordCondition.mode`が正しく設定されているか
- `keywords`配列に正しいoperatorが設定されているか

### Q: テンプレートの変数が抽出されない

**原因**: 正規表現パターン`/\{([^}]+)\}/g`に一致しない

**解決策**:
- 変数を`{変数名}`形式で記述
- 全角括弧ではなく半角括弧を使用

### Q: スタッフ選択で表示されない

**確認事項**:
- `staff`配列が正しく渡されているか
- 検索フィルターが厳しすぎないか

## 関連ドキュメント

- [COMPONENT_GUIDE.md](../../docs/COMPONENT_GUIDE.md) - 共通パターン
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - アーキテクチャ概要
