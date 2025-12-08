# DENCO_UI FAX受信機能 現状報告書

## 概要

**調査日**: 2025-11-24
**対象ブランチ**: `feature/fax_receive`
**ステータス**: UIモックアップのみ実装済み、バックエンドAPI未接続

DENCO_UIのFAX受信機能は現在、ハードコードされたサンプルデータで動作しており、実際のバックエンドAPIと接続されていません。

---

## UIコンポーネント構造

### ファイル一覧

| ファイル | 役割 | 状態 |
|----------|------|------|
| `app/fax/page.tsx` | FAX管理ページのルート | 実装済み |
| `components/fax/fax-management.tsx` | メインのFAX管理コンポーネント | UIのみ実装 |
| `components/dashboard/recent-faxes.tsx` | ダッシュボードの最近のFAX一覧 | UIのみ実装 |
| `lib/api-client.ts` | FAX APIクライアント定義 | 定義済み |
| `lib/types.ts` | FaxDocument型定義 | 定義済み |

---

## 実装済み機能

### 1. FAX管理画面 (`fax-management.tsx`)

#### 受信FAX一覧表示
- 送信元番号・送信者名
- 受信日時
- 状態（完了/処理中/失敗）バッジ表示
- OCRテキストの要約（先頭30文字）

#### 操作機能
- **プレビュー**: iframeでPDFを表示するダイアログ
- **ダウンロード**: `download_url`を新規タブで開く
- **OCRテキスト表示**: OCR結果をダイアログで表示

#### フィルタリング機能
- 名前またはFAX番号による検索
- 状態フィルター（すべて/完了/処理中/失敗）
- 日付範囲指定（DateRangePicker）
- 時刻範囲指定

#### タブ構成
- **受信FAX**: インバウンドFAXの一覧
- **送信FAX**: アウトバウンドFAXの一覧

### 2. FAX送信機能（UI実装済み）
- PDFファイルのアップロード
- 送信先顧客の複数選択（チェックボックス）
- 顧客検索機能

### 3. ダッシュボード (`recent-faxes.tsx`)
- 最近のFAX一覧を簡易表示
- 種別（受信/送信）、送信元/先、状態、日時

---

## 未実装・問題点

### 1. APIとの接続が未実装

**現状**: `fax-management.tsx`はハードコードされたサンプルデータを使用

```typescript
// fax-management.tsx:68-113
const faxDocuments = [
  {
    id: "fax-1",
    direction: "inbound",
    sender: { name: "山田 太郎", number: "03-1234-5678" },
    // ... サンプルデータ
  },
  // ...
];
```

**必要な実装**:
```typescript
import { apiClient } from '@/lib/api-client';

const [faxDocuments, setFaxDocuments] = useState([]);

useEffect(() => {
  const fetchFaxes = async () => {
    const response = await apiClient.fax.list(tenantId, limit, offset);
    setFaxDocuments(response.documents);
  };
  fetchFaxes();
}, [tenantId]);
```

### 2. APIクライアント定義（定義済み、未使用）

`lib/api-client.ts:130-143`:
```typescript
fax = {
  list: (tenantId: string, limit = 50, offset = 0) =>
    this.get<{ documents: unknown[]; total: number }>(
      `/api/fax?tenant_id=${tenantId}&limit=${limit}&offset=${offset}`
    ),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${PYTHON_API}/api/fax/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
};
```

### 3. 型定義の不整合

**API側の型定義** (`lib/types.ts:101-110`):
```typescript
interface FaxDocument {
  id: string;
  tenant_id: string;
  sender: string;
  recipient: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
  pages: number;
  file_path: string;
  received_at: string;
}
```

**UI側のサンプルデータ構造**:
```typescript
{
  id: string;
  direction: "inbound" | "outbound";
  sender: { name: string; number: string; };
  receiver_number: string;
  status: "completed" | "pending" | "failed";
  created_at: string;
  has_ocr: boolean;
  preview_url: string;
  download_url: string;
  ocr_text?: string;
}
```

**不整合点**:
- `sender`が文字列 vs オブジェクト
- `received_at` vs `created_at`
- `file_path` vs `preview_url`/`download_url`
- `ocr_text`、`has_ocr`が型定義に存在しない
- `direction`が型定義に存在しない

---

## バックエンド連携状況

### Git Status（feature/fax_receiveブランチ）

**削除されたファイル**:
- `DENCO_manager/app/services/fax_processing_service.py`
- `DENCO_manager/app/tasks/fax_tasks.py`
- `DENCO_manager/app/infrastructure/adapters/google_vision_adapter.py`
- `DENCO_manager/tests/tasks/test_fax_tasks.py`

**新規追加（未コミット）**:
- `DENCO_manager/app/routers/fax_router.py`

### 現状
バックエンド側でFAX機能が再構築中であり、以下のAPIエンドポイントが必要：

| エンドポイント | メソッド | 用途 |
|----------------|----------|------|
| `/api/fax` | GET | FAX一覧取得 |
| `/api/fax/{id}` | GET | FAX詳細取得 |
| `/api/fax/upload` | POST | FAX送信用ファイルアップロード |
| `/api/fax/{id}/download` | GET | FAXファイルダウンロード |

---

## 今後の実装計画

### Phase 1: バックエンドAPI完成

1. **`fax_router.py`の完全実装**
   - FAX一覧取得エンドポイント
   - FAX詳細取得エンドポイント
   - ファイルダウンロードエンドポイント

2. **FAX受信処理の実装**
   - Asteriskからのwebhook受信
   - FAXファイルの保存
   - OCR処理（Google Vision API等）

3. **データベーススキーマの確認**
   - `fax_documents`テーブルの構造確認
   - 必要なカラムの追加（`ocr_text`、`direction`等）

### Phase 2: フロントエンド接続

1. **型定義の統一**
   - `lib/types.ts`のFaxDocument型をAPIレスポンスに合わせて更新

2. **APIクライアント呼び出しの実装**
   - `fax-management.tsx`で`apiClient.fax.list()`を呼び出す
   - `useEffect`でのデータ取得
   - ローディング状態・エラーハンドリング

3. **ページネーション実装**
   - 大量のFAXに対応するためのページネーション

### Phase 3: 追加機能

1. **リアルタイム更新**
   - 新規FAX受信時のWebSocket通知
   - 自動リフレッシュ

2. **OCR検索機能**
   - OCRテキストでの全文検索

3. **一括操作**
   - 複数FAXの一括ダウンロード
   - 一括削除

---

## 関連ファイル

### DENCO_UI
- `app/fax/page.tsx`
- `components/fax/fax-management.tsx`
- `components/dashboard/recent-faxes.tsx`
- `lib/api-client.ts`
- `lib/types.ts`

### DENCO_manager
- `app/routers/fax_router.py`（新規・未コミット）
- `app/infrastructure/repositories/fax_repository.py`（必要）
- `app/services/fax_service.py`（必要）

---

## 参考：サンプルデータ構造

現在UIで使用されているサンプルデータの完全な構造：

```typescript
interface SampleFaxDocument {
  id: string;
  direction: "inbound" | "outbound";

  // インバウンドの場合
  sender?: {
    name: string;
    number: string;
  };
  receiver_number?: string;

  // アウトバウンドの場合
  sender_number?: string;
  receiver?: {
    name: string;
    number: string;
  };

  status: "completed" | "pending" | "failed";
  created_at: string;  // ISO 8601形式
  has_ocr: boolean;
  preview_url: string;
  download_url: string;
  ocr_text?: string;
}
```

---

**作成日**: 2025-11-24
**作成者**: Claude Code
**ステータス**: 調査完了、実装待ち
