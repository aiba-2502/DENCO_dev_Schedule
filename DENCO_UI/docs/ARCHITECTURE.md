# DENCO UI アーキテクチャ概要

## 目次

1. [概要](#概要)
2. [アーキテクチャパターン](#アーキテクチャパターン)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [技術スタック](#技術スタック)
5. [設計原則](#設計原則)
6. [データフロー](#データフロー)

## 概要

DENCO UIは、AI音声通話・FAXシステムのフロントエンドアプリケーションです。
Next.js 13 App Routerを使用し、**Page-Based Architecture**を採用しています。

### なぜPage-Based Architecture？

- **保守性**: 1-2年経験のエンジニアでも理解しやすい
- **シンプル**: 機能ごとにファイルが整理され、探しやすい
- **拡張性**: 新機能追加時も既存パターンに従うだけ

## アーキテクチャパターン

### Page-Based Architecture

```
DENCO_UI/
├── app/                    # Next.js 13 App Router
│   ├── notifications/      # 通知設定ページ
│   ├── users/             # 顧客管理ページ
│   └── settings/          # 設定ページ
├── components/            # ページ固有コンポーネント
│   ├── notifications/     # 通知機能コンポーネント
│   ├── users/            # 顧客管理コンポーネント
│   ├── settings/         # 設定コンポーネント
│   └── shared/           # 共通コンポーネント
├── hooks/                # カスタムフック
└── lib/                  # ユーティリティ・API
```

### レイヤー構造

```
┌─────────────────────────────────┐
│      Pages (app/)               │  ← ルーティング、レイアウト
├─────────────────────────────────┤
│   Feature Components            │  ← 機能固有ビジネスロジック
│   (components/[feature]/)       │
├─────────────────────────────────┤
│   Shared Components             │  ← 再利用可能UI
│   (components/shared/)          │
├─────────────────────────────────┤
│   Custom Hooks                  │  ← ロジック抽出
│   (hooks/)                      │
├─────────────────────────────────┤
│   UI Components                 │  ← プリミティブUI
│   (components/ui/)              │
├─────────────────────────────────┤
│   API Client & Utils            │  ← バックエンド通信
│   (lib/)                        │
└─────────────────────────────────┘
```

## ディレクトリ構造

### `/app` - ページとルーティング

Next.js 13 App Routerに従った構造。各ディレクトリが1つのルートに対応。

```
app/
├── layout.tsx           # ルートレイアウト
├── page.tsx            # ホームページ (/)
├── notifications/
│   └── page.tsx        # /notifications
├── users/
│   └── page.tsx        # /users
└── settings/
    └── page.tsx        # /settings
```

### `/components` - コンポーネント

#### 機能別コンポーネント

各機能ごとにディレクトリを作成し、関連コンポーネントをまとめます。

```
components/
├── notifications/
│   ├── types.ts                           # 型定義
│   ├── notification-settings.tsx          # メインコンポーネント
│   ├── notification-rule-form.tsx         # ルールフォーム
│   ├── notification-template-manager.tsx  # テンプレート管理
│   └── notification-staff-selector.tsx    # スタッフ選択
├── users/
│   ├── types.ts                   # 型定義
│   ├── customer-management.tsx    # メインコンポーネント
│   ├── customer-form.tsx          # 顧客フォーム
│   └── customer-list.tsx          # 顧客リスト
└── settings/
    ├── tenant-types.ts                    # 型定義
    ├── tenant-management.tsx              # メインコンポーネント
    ├── tenant-department-forms.tsx        # フォーム
    └── tenant-department-lists.tsx        # リスト
```

#### 共通コンポーネント

アプリケーション全体で再利用されるコンポーネント。

```
components/shared/
├── loading-spinner.tsx    # ローディング表示
├── error-boundary.tsx     # エラーハンドリング
├── confirm-dialog.tsx     # 確認ダイアログ
├── form-modal.tsx        # モーダルフォーム
└── data-table.tsx        # データテーブル
```

#### UIコンポーネント（shadcn/ui）

```
components/ui/
├── button.tsx
├── dialog.tsx
├── input.tsx
└── ... (その他のプリミティブUI)
```

### `/hooks` - カスタムフック

ビジネスロジックやステート管理を抽出したフック。

```
hooks/
├── use-api-call.ts         # API呼び出しとエラーハンドリング
├── use-fetch-data.ts       # データフェッチング
├── use-form-validation.ts  # フォームバリデーション
├── use-websocket.ts        # WebSocket接続管理
└── README.md              # 使用方法ガイド
```

### `/lib` - ユーティリティとAPI

```
lib/
├── api-client.ts      # API通信クライアント
├── types.ts          # 共通型定義
└── utils.ts          # ユーティリティ関数
```

## 技術スタック

### コア

- **Next.js 13.5.1** - React フレームワーク（App Router）
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性

### UI/スタイリング

- **Tailwind CSS** - ユーティリティファーストCSS
- **shadcn/ui** - Radix UIベースのコンポーネント
- **Lucide React** - アイコン

### フォーム・バリデーション

- **React Hook Form** - フォーム管理
- **Zod** - スキーマバリデーション

### 状態管理

- **React Hooks** - ローカルステート
- カスタムフック - ビジネスロジック抽出
- _グローバル状態管理なし_ - 必要に応じてReact Contextを使用

### その他

- **Sonner** - トースト通知
- **date-fns** - 日付操作

## 設計原則

### 1. コンポーネント分割の基準

**300行ルール**: 1コンポーネントは最大300行を目安とする

#### 分割が必要な兆候
- ファイルが500行を超えた
- 複数の責任を持っている
- テストが書きにくい
- スクロールが多い

#### 分割方法

```typescript
// ❌ 悪い例: 1000行の巨大コンポーネント
export default function CustomerManagement() {
  // フォーム、リスト、検索、全てが混在
  return <div>...</div>;
}

// ✅ 良い例: 責任ごとに分割
export default function CustomerManagement() {
  return (
    <>
      <CustomerList {...props} />
      <CustomerForm {...props} />
    </>
  );
}
```

### 2. 型定義の分離

各機能フォルダに`types.ts`を配置し、型を集約します。

```typescript
// components/users/types.ts
export interface Customer {
  id: string;
  name: string;
  // ...
}

export interface FormData {
  // ...
}
```

### 3. Props vs State

#### Props（親から受け取る）
- 表示データ
- イベントハンドラー
- 設定オプション

#### State（コンポーネント内部）
- フォーム入力値
- ダイアログの開閉状態
- 一時的なUI状態

### 4. カスタムフックの使い時

以下の場合はカスタムフックに抽出：

- 複数コンポーネントで使う共通ロジック
- 複雑なステート管理
- 副作用（API呼び出し、WebSocket）

```typescript
// ✅ 良い例
function CustomerList() {
  const { data, loading, error } = useFetchData(fetchCustomers);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  return <Table data={data} />;
}
```

### 5. エラーハンドリング

#### レベル別対応

1. **コンポーネントレベル**: try-catch + エラーステート
2. **ページレベル**: ErrorBoundary
3. **アプリレベル**: グローバルエラーハンドラー

```typescript
// コンポーネントレベル
const { data, error } = useApiCall(api.getCustomers);
if (error) return <ErrorMessage error={error} />;

// ページレベル
<ErrorBoundary fallback={<ErrorPage />}>
  <CustomerManagement />
</ErrorBoundary>
```

## データフロー

### API通信フロー

```
Component
    ↓ 1. API呼び出し
useApiCall / useFetchData
    ↓ 2. HTTP Request
apiClient
    ↓ 3. fetch()
Backend API (port 8000)
    ↓ 4. Response
apiClient (エラーハンドリング)
    ↓ 5. データ/エラー
useApiCall / useFetchData
    ↓ 6. State更新
Component (再レンダリング)
```

### フォーム送信フロー

```
Form Component
    ↓ 1. ユーザー入力
useFormValidation (react-hook-form + zod)
    ↓ 2. バリデーション
    ↓ 3. onSubmit
API Call (useApiCall)
    ↓ 4. サーバー送信
    ↓ 5. 成功/失敗
Toast通知 (sonner)
    ↓ 6. 画面更新
Parent Component (データ再取得)
```

### WebSocket通信フロー

```
Component
    ↓ 1. 接続開始
useWebSocket
    ↓ 2. WebSocket接続
Node.js Backend (port 3001)
    ↓ 3. リアルタイムメッセージ
useWebSocket (メッセージ受信)
    ↓ 4. State更新
Component (リアルタイム表示)
```

## パフォーマンス最適化

### 1. コードスプリッティング

Next.js App Routerの自動コードスプリッティングを活用。

```typescript
// Dynamic import for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
});
```

### 2. メモ化

- `useMemo`: 重い計算結果のキャッシュ
- `useCallback`: 関数の再生成防止
- `React.memo`: コンポーネントの再レンダリング防止

```typescript
const filteredCustomers = useMemo(() => {
  return customers.filter(/* ... */);
}, [customers, searchTerm]);

const handleSubmit = useCallback(() => {
  // ...
}, [dependencies]);
```

### 3. データフェッチング最適化

```typescript
// useFetchDataで自動リフレッシュ
const { data } = useFetchData(
  fetchCustomers,
  [searchTerm], // 依存配列
  { refreshInterval: 30000 } // 30秒ごと
);
```

## セキュリティ考慮事項

### 1. XSS対策

- Reactの自動エスケープを活用
- `dangerouslySetInnerHTML`は使用禁止

### 2. CSRF対策

- APIクライアントで自動的にトークン付与

### 3. 認証・認可

- バックエンドで実装（フロントエンドは表示制御のみ）

## テスト戦略

### 単体テスト

- カスタムフック: ビジネスロジックのテスト
- ユーティリティ関数: 入出力のテスト

### 統合テスト

- コンポーネント: ユーザー操作のテスト
- API通信: モックを使ったテスト

### E2Eテスト

- 主要フロー: 顧客登録、通知設定など

## 今後の拡張方針

### 短期（1-3ヶ月）

- [ ] 残りの大規模コンポーネント分割
- [ ] カスタムフックの追加
- [ ] 共通コンポーネントの拡充

### 中期（3-6ヶ月）

- [ ] パフォーマンス最適化
- [ ] テストカバレッジ向上
- [ ] アクセシビリティ改善

### 長期（6ヶ月以上）

- [ ] 国際化対応（i18n）
- [ ] PWA化
- [ ] オフライン対応

## リファレンス

- [Next.js App Router ドキュメント](https://nextjs.org/docs/app)
- [React Hooks ガイド](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Component Guide](./COMPONENT_GUIDE.md)
