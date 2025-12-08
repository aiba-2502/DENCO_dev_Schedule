# 実装計画: ログイン後画面の統一化

**作成日**: 2025-11-21
**更新日**: 2025-11-21
**ステータス**: 未着手

---

## 📋 概要

DENCO_UIをarchive_reference/pre_DENCO_UIに合わせて、ログイン後の画面レイアウトとページ構造を統一します。

### ⚠️ 重要な方針

**UIの外観のみ同期し、API呼び出しロジックは現行を維持します。**

- ページファイル（`app/*/page.tsx`）: pre_DENCO_UIからコピー
- レイアウトコンポーネント（`components/layout/*`）: pre_DENCO_UIに合わせて編集
- **API依存コンポーネント**: コピーせず、差分を確認後にUI部分のみ手動で反映
  - 理由: history-api.tsx, settings/*.tsx などはAPI呼び出しを含むため、単純コピーはレグレッションリスクあり

---

## 🔧 Phase 1: レイアウト基盤の更新

### 1.1 app/layout.tsx の更新

**変更内容:**
- メタデータタイトル: `"Voice AI Call System"` → `"DENCO - AI Call Management System"`
- 言語: `lang="en"` → `lang="ja"`

### 1.2 components/layout/layout-content.tsx の更新

**変更内容:**
- エクスポート方式: `export function` → `export default function`
- インポート先: `@/components/navigation/SideNav` → `@/components/layout/side-nav`
- レイアウト構造: bg-gray-100とp-6を削除し、pre_DENCO_UIスタイルに統一
- ローディング表示: Loader2アイコン → シンプルなテキスト

### 1.3 components/layout/side-nav.tsx の更新

**変更内容:**
- AuthContext統合: `useAuth()` フックを追加
- ユーザー名表示: ハードコード `"管理者"` → `user?.full_name || 'ゲスト'`
- ログアウト処理: `router.push('/login')` → `await logout()`

---

## 🔧 Phase 2: 不要コンポーネントの削除

### 2.1 navigation フォルダの削除

**変更内容:**
- `components/navigation/SideNav.tsx` を削除
- `components/navigation/` フォルダを削除

---

## 🔧 Phase 3: ページファイルの更新

### 3.1 app/page.tsx (ダッシュボード)

**変更内容:**
- `export const dynamic = 'force-dynamic'` を削除
- `export const revalidate = 0` → `export const revalidate = 10`
- ISRコメント追加

### 3.2 app/calls/ai/page.tsx

**変更内容:** 差分なし（同期済み）

### 3.3 app/calls/monitor/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.4 app/calls/history/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.5 app/fax/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.6 app/knowledge/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.7 app/notifications/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.8 app/settings/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.9 app/staff/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

### 3.10 app/users/page.tsx

**変更内容:** pre_DENCO_UIに合わせてコピー

---

## 🔧 Phase 4: コンポーネントの更新

### 4.1 UIのみ反映（コピー可）

以下はAPI呼び出しを含まないため、pre_DENCO_UIからコピー:

| ファイル | 内容 |
|---------|-----|
| `components/auth/PasswordInput.tsx` | UI入力コンポーネント |
| `components/dashboard/call-stats.tsx` | 統計表示UI |
| `components/dashboard/system-status.tsx` | ステータス表示UI |

### 4.2 API互換性確認後に反映（要差分確認）

以下はAPI呼び出しを含むため、差分確認後にUI部分のみ手動反映:

| ファイル | 含まれるAPI処理 | 対応方針 |
|---------|----------------|---------|
| `components/calls/history-api.tsx` | 通話履歴API | UI差分のみ反映、APIロジック維持 |
| `components/settings/dify-settings.tsx` | Dify設定API | UI差分のみ反映、APIロジック維持 |
| `components/settings/settings-management.tsx` | 設定管理API | UI差分のみ反映、APIロジック維持 |
| `components/settings/staff-management.tsx` | スタッフ管理API | UI差分のみ反映、APIロジック維持 |

### 4.3 新規追加

| ファイル | 内容 |
|---------|-----|
| `components/settings/api-settings.tsx` | pre_DENCO_UIからコピー（DENCO_UIには存在しない） |

---

## 🔧 Phase 5: テストの更新

### 5.1 既存テストの更新

Phase 1の変更によりテストが失敗する可能性があるため、以下を更新:

| ファイル | 更新内容 |
|---------|---------|
| `components/layout/side-nav.test.tsx` | AuthContext依存のモック追加、エクスポート方式の変更に対応 |
| `app/settings/page.test.tsx` | 必要に応じて更新 |
| `app/staff/page.test.tsx` | 必要に応じて更新 |

### 5.2 テスト更新内容

**side-nav.test.tsx の主な変更:**
- `useAuth` フックのモック追加
- `logout` 関数のモック追加
- ユーザー名表示のテスト更新

---

## 📁 変更対象ファイル一覧

### ページファイル (app/)

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `app/layout.tsx` | 編集 | メタデータ・言語設定 |
| `app/page.tsx` | 編集 | ISR設定 |
| `app/calls/ai/page.tsx` | 確認済 | 差分なし（同期不要） |
| `app/calls/monitor/page.tsx` | コピー | ページ同期 |
| `app/calls/history/page.tsx` | コピー | ページ同期 |
| `app/fax/page.tsx` | コピー | ページ同期 |
| `app/knowledge/page.tsx` | コピー | ページ同期 |
| `app/notifications/page.tsx` | コピー | ページ同期 |
| `app/settings/page.tsx` | コピー | ページ同期 |
| `app/staff/page.tsx` | コピー | ページ同期 |
| `app/users/page.tsx` | コピー | ページ同期 |

### レイアウトコンポーネント (components/layout/)

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `components/layout/layout-content.tsx` | 編集 | レイアウト構造・インポート |
| `components/layout/side-nav.tsx` | 編集 | Auth統合・ログアウト処理 |

### その他コンポーネント (components/)

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `components/auth/PasswordInput.tsx` | コピー | UI同期 |
| `components/dashboard/call-stats.tsx` | コピー | UI同期 |
| `components/dashboard/system-status.tsx` | コピー | UI同期 |
| `components/calls/history-api.tsx` | UI差分反映 | APIロジック維持 |
| `components/settings/dify-settings.tsx` | UI差分反映 | APIロジック維持 |
| `components/settings/settings-management.tsx` | UI差分反映 | APIロジック維持 |
| `components/settings/staff-management.tsx` | UI差分反映 | APIロジック維持 |
| `components/settings/api-settings.tsx` | 新規 | pre_DENCO_UIから追加 |

### テストファイル

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `components/layout/side-nav.test.tsx` | 編集 | AuthContextモック追加 |
| `app/settings/page.test.tsx` | 確認 | 必要に応じて更新 |
| `app/staff/page.test.tsx` | 確認 | 必要に応じて更新 |

### 削除対象

| ファイル | 変更種別 | 内容 |
|---------|---------|-----|
| `components/navigation/SideNav.tsx` | 削除 | 不要コンポーネント |
| `components/navigation/` | 削除 | 不要フォルダ |

---

## ⏱ 想定実装ステップ

### Step 1: レイアウト基盤 (Phase 1)
1. layout.tsx更新 (メタデータ)
2. side-nav.tsx更新 (Auth統合)
3. layout-content.tsx更新 (インポート変更)

### Step 2: 不要コンポーネント削除 (Phase 2)
4. navigation フォルダ削除

### Step 3: ページファイル同期 (Phase 3)
5. app/page.tsx更新 (ISR設定)
6. 各ページファイルをpre_DENCO_UIからコピー (8ファイル)

### Step 4: コンポーネント同期 (Phase 4)
7. UIのみコンポーネントをpre_DENCO_UIからコピー (3ファイル)
8. API依存コンポーネントの差分確認・UI部分のみ反映 (4ファイル)
9. api-settings.tsx を新規追加 (1ファイル)

### Step 5: テスト更新 (Phase 5)
10. side-nav.test.tsx にAuthContextモック追加
11. その他テストファイルの確認・更新

### Step 6: 動作確認
12. テスト実行: `npm test`
13. ビルド確認: `npm run build`
14. ログイン→ダッシュボード遷移テスト
15. 各ページへのナビゲーションテスト
16. ログアウト機能テスト

---

## 📊 変更概要サマリー

| 種別 | ファイル数 |
|------|-----------|
| ページ編集/コピー | 10 |
| コンポーネント（コピー） | 4 |
| コンポーネント（UI差分反映） | 4 |
| テスト更新 | 3 |
| 新規追加 | 1 |
| 削除 | 2 |
| **合計** | **24** |

---

## 📝 備考

- 参照元: `archive_reference/pre_DENCO_UI`
- ターゲット: `DENCO_UI`
- ログインページ (`app/login/page.tsx`, `components/auth/LoginForm.tsx`) は既に更新済み
- `/calls/ai/page.tsx` は差分なし（確認済み）
- UIコンポーネント (`components/ui/`) の差分は追加分のみで、削除は不要
- **API依存コンポーネントは単純コピーせず、UI差分のみ手動反映**

---

## ⚠️ リスクと対策

### API互換性リスク

**リスク**: API依存コンポーネントを単純コピーすると、現行APIとの互換性が失われレグレッションが発生する可能性

**対策**:
1. history-api.tsx, settings/*.tsx はコピーせず差分確認
2. UI部分（スタイル、レイアウト）のみ手動で反映
3. APIロジック（fetch, データ処理）は現行を維持

### テスト失敗リスク

**リスク**: Phase 1でAuthContext依存やエクスポート方式を変更すると、既存テストが失敗

**対策**:
1. side-nav.test.tsx にuseAuthモック追加
2. logout関数のモック追加
3. Phase 5でテスト更新を実施

---

## ✅ 完了条件

1. すべてのページが pre_DENCO_UI と同じ外観で表示される
2. サイドナビゲーションが正しく機能する
3. ログイン/ログアウトが正しく動作する
4. すべてのナビゲーションリンク（/calls/ai含む）が機能する
5. 既存のAPI呼び出しが正常に動作する
6. すべてのテストがパスする
7. エラーなくビルドが完了する
