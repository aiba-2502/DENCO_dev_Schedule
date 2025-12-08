# FAX DB実データ表示 設計計画書

## 概要

**作成日**: 2025-11-24
**更新日**: 2025-11-24
**対象ブランチ**: `feature/fax_receive`
**目的**: DENCO_UIでFAXのDB実データを表示するための実装計画

---

## 前提条件と制約事項

### 認証・テナント分離（Phase 0 - 要先行設計）

現在のバックエンドAPI（`fax_router.py`）には**UI向け認証機構が未実装**です。
`tenant_id`はクエリパラメータで任意に指定可能であり、テナント間のデータ分離が保証されていません。

**UI実装前に決定が必要な事項**:

| 項目 | 現状 | 要決定事項 |
|------|------|-----------|
| 認証方式 | なし | JWT/Session/OAuth2など |
| テナントIDの取得元 | クエリパラメータ | 認証トークンから抽出 or セッション |
| API認証ミドルウェア | `/api/fax/inbound`のみAPIキー認証 | 全エンドポイントへの認証適用 |

**推奨アプローチ**:
1. 認証コンテキストを提供するReact Contextを作成
2. バックエンドに認証ミドルウェアを追加（`auth_router.py`の`get_current_user`を活用）
3. `tenant_id`をJWTクレームまたはセッションから取得

**リスク**: 認証設計を後回しにすると、UI実装後に大きな手戻りが発生します。

### 型の命名規約

**方針**: APIレスポンスはスネークケース（snake_case）で受け取り、UI内部ではキャメルケース（camelCase）に変換する

| レイヤー | 命名規約 | 例 |
|----------|----------|-----|
| バックエンドAPI | snake_case | `sender_number`, `created_at` |
| フロントエンド型定義 | snake_case | `FaxDocument.sender_number` |
| UI表示用変換後 | camelCase | `FaxDocumentDisplay.senderNumber`（将来対応） |

**暫定対応**: 本設計ではAPIレスポンスをそのまま使用（snake_case）。
将来的にcamelCase変換が必要な場合は、`transformToDisplay`関数を拡張する。

---

## 現状分析サマリー

### バックエンド（実装済み）

| コンポーネント | 状態 | ファイル |
|----------------|------|----------|
| FAX Router | ✅ 完成 | `app/routers/fax_router.py` |
| FAX Repository | ✅ 完成 | `app/infrastructure/repositories/fax_repository.py` |
| main.py登録 | ✅ 完成 | `fax_repo`初期化済み、ルーター登録済み |

**利用可能なAPIエンドポイント**:
- `GET /api/fax` - FAX一覧取得（認証なし）
- `GET /api/fax/{fax_id}` - FAX詳細取得（認証なし）
- `POST /api/fax/inbound` - 受信FAX登録（DENCO_Sentinel用、APIキー認証あり）

**未実装エンドポイント**:
- `GET /api/fax/{fax_id}/preview` - ファイルプレビュー

### フロントエンド（未接続）

| コンポーネント | 状態 | 問題点 |
|----------------|------|--------|
| `fax-management.tsx` | UIのみ | ハードコードされたサンプルデータ使用 |
| `lib/api-client.ts` | 定義済み | `{ documents, total }`形式で返却 |
| `lib/types.ts` | 定義済み | APIレスポンスと型が不整合 |

---

## 設計計画

### Phase 1: 型定義とAPIクライアントの統一

**目的**: フロントエンドの型定義をバックエンドAPIレスポンスに合わせ、APIクライアントを更新

#### 1.0 現行型定義との差分（実装前に必ず確認）

**ファイル**: `DENCO_UI/lib/types.ts` (101-110行目)

**現行の型定義**:
```typescript
export interface FaxDocument {
  id: string;
  tenant_id: string;
  sender: string;        // ← 削除対象
  recipient: string;     // ← 削除対象
  status: 'received' | 'processing' | 'completed' | 'failed';  // ← 変更対象
  pages: number;         // ← 削除対象
  file_path: string;     // ← 変更対象
  received_at: string;   // ← 変更対象
}
```

**差分一覧と修正手順**:

| 現行フィールド | 変更内容 | 新フィールド |
|---------------|----------|-------------|
| `sender: string` | **削除→新規追加** | `sender_number: string` |
| `recipient: string` | **削除→新規追加** | `receiver_number: string` |
| `status: 'received'\|'processing'\|...` | **変更** | `status: 'pending'\|'completed'\|'failed'` |
| `pages: number` | **削除** | （使用しない） |
| `file_path: string` | **削除→新規追加** | `tiff_path: string \| null` |
| `received_at: string` | **削除→新規追加** | `created_at: string` |
| （なし） | **新規追加** | `direction: 'inbound' \| 'outbound'` |
| （なし） | **新規追加** | `pdf_path: string \| null` |
| （なし） | **新規追加** | `ocr_text: string \| null` |
| （なし） | **新規追加** | `processed_at: string \| null` |

**具体的な修正手順**:
1. 現行の`FaxDocument`インターフェースを**全削除**
2. 下記1.1の新しい型定義に**置換**
3. `FaxListResponse`と`FaxDocumentDisplay`を**新規追加**
4. 既存コードで旧フィールド名を参照している箇所をIDEで検索し、新フィールド名に置換

**影響を受けるファイル**:
- `components/fax/fax-management.tsx` - サンプルデータとテーブル表示
- `components/dashboard/recent-faxes.tsx` - フィールド参照

#### 1.1 FaxDocument型の更新

**ファイル**: `DENCO_UI/lib/types.ts`

```typescript
/**
 * FAX文書（APIレスポンス準拠）
 *
 * direction: バックエンド仕様に準拠
 *   - 'inbound': 受信FAX
 *   - 'outbound': 送信FAX
 *
 * status: バックエンド仕様に準拠
 *   - 'pending': 処理待ち（DB デフォルト値）
 *   - 'completed': 完了（/inbound登録時の固定値）
 *   - 'failed': 失敗
 *
 * 注意: UI旧実装の 'received', 'processing' は使用しない
 */
export interface FaxDocument {
  id: string;
  tenant_id: string;
  direction: 'inbound' | 'outbound';
  sender_number: string;
  receiver_number: string;
  status: 'pending' | 'completed' | 'failed';
  tiff_path: string | null;
  pdf_path: string | null;
  ocr_text: string | null;
  created_at: string;  // ISO 8601
  processed_at: string | null;
}

/**
 * FAX一覧APIレスポンス
 *
 * 注意: 現在のバックエンド実装では total は len(items) を返すのみ。
 * 正確な総件数ではないため、ページネーションUIでは暫定対応が必要。
 *
 * 重要: 現行APIクライアントは { documents, total } を返すが、
 * バックエンドは { items, total } を返す。APIクライアントを更新する。
 */
export interface FaxListResponse {
  items: FaxDocument[];
  total: number;  // 暫定: 現ページの件数のみ
  limit: number;
  offset: number;
}

/**
 * FAX表示用拡張データ（UI用）
 *
 * 注意: preview_url は Phase 5 のバックエンド実装が
 * 完了するまで空文字列とし、ボタンはdisabledにする。
 */
export interface FaxDocumentDisplay extends FaxDocument {
  // UI表示用の算出プロパティ
  sender_name?: string;       // 顧客DBから取得（将来実装）
  receiver_name?: string;     // 顧客DBから取得（将来実装）
  preview_url: string;        // Phase 5 実装まで空文字列
  has_ocr: boolean;           // ocr_text !== null
}
```

#### 1.2 APIクライアントの更新

**ファイル**: `DENCO_UI/lib/api-client.ts`

**重要**: 現行の`lib/api-client.ts`には`getPreviewUrl`メソッドが存在しません。
Phase 5のUI実装で`api.python.fax.getPreviewUrl()`を呼び出すため、
Phase 1の段階で以下の更新後コードのとおり**新規追加**が必要です。

**現行実装**:
```typescript
fax = {
  list: (tenantId: string, limit = 50, offset = 0) =>
    this.get<{ documents: unknown[]; total: number }>(
      `/api/fax?tenant_id=${tenantId}&limit=${limit}&offset=${offset}`
    ),
};
```

**更新後** (バックエンドレスポンス `{ items, total, limit, offset }` に合わせる):
```typescript
import { FaxDocument, FaxListResponse } from '@/lib/types';

// FAX API
fax = {
  /**
   * FAX一覧を取得
   * @param direction - フィルタ値: 'inbound' | 'outbound' | undefined（全件）
   */
  list: (tenantId: string, limit = 50, offset = 0, direction?: 'inbound' | 'outbound') =>
    this.get<FaxListResponse>(
      `/api/fax?tenant_id=${tenantId}&limit=${limit}&offset=${offset}${
        direction ? `&direction=${direction}` : ''
      }`
    ),

  getById: (faxId: string, tenantId: string) =>
    this.get<FaxDocument>(
      `/api/fax/${faxId}?tenant_id=${tenantId}`
    ),

  /**
   * ファイルプレビューURL生成（新規追加）
   *
   * 注意:
   * - このメソッドは現行のlib/api-client.tsには存在しないため新規追加が必要
   * - Phase 5 のバックエンドエンドポイント実装が完了するまでは404を返す
   * - Phase 5 完了後、api.python.fax.getPreviewUrl() で呼び出し可能になる
   */
  getPreviewUrl: (faxId: string, tenantId: string) =>
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fax/${faxId}/preview?tenant_id=${tenantId}`,
};
```

---

### Phase 2: fax-management.tsx の改修

**目的**: ハードコードされたデータをAPI呼び出しに置き換える

#### 2.1 状態管理の追加

**APIクライアント利用名について**:
現行の`lib/api-client.ts`では`export const api = { python, node }`としてエクスポートされています。
本設計書では`api.python.fax`を使用します。

```typescript
// 新規import
import { api } from '@/lib/api-client';
import { FaxDocument, FaxDocumentDisplay } from '@/lib/types';
import { toast } from '@/components/ui/use-toast'; // トースト通知用

// 状態定義
const [faxDocuments, setFaxDocuments] = useState<FaxDocumentDisplay[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(0);
const [currentDirection, setCurrentDirection] = useState<'inbound' | 'outbound' | undefined>(undefined);
const ITEMS_PER_PAGE = 50;

// TODO: 認証コンテキストからテナントIDを取得
// 認証システム実装後に以下を置き換え:
// const { tenantId } = useAuth();
const tenantId = 'default-tenant'; // 暫定ハードコード
```

#### 2.2 データ取得ロジック

```typescript
// FaxDocumentをFaxDocumentDisplayに変換
const transformToDisplay = (doc: FaxDocument): FaxDocumentDisplay => ({
  ...doc,
  // Phase 5 実装まではURL生成せず空文字列とし、ボタンをdisabledにする
  preview_url: '',  // Phase 5まで空
  has_ocr: doc.ocr_text !== null && doc.ocr_text !== '',
});

// データ取得関数（offsetを明示的に受け取る）
const fetchFaxDocuments = async (
  direction?: 'inbound' | 'outbound',
  offset: number = currentPage * ITEMS_PER_PAGE
) => {
  setLoading(true);
  setError(null);

  try {
    const response = await api.python.fax.list(
      tenantId,
      ITEMS_PER_PAGE,
      offset,
      direction
    );

    const displayDocs = response.items.map(transformToDisplay);
    setFaxDocuments(displayDocs);
    // 注意: response.totalは現ページ件数のみ。表示には使用しない。
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'FAXデータの取得に失敗しました';
    setError(errorMessage);
    console.error('FAX fetch error:', err);

    // トースト通知でユーザーにエラーを表示
    toast({
      title: 'エラー',
      description: errorMessage,
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

// useEffectでのデータ取得（currentDirectionも依存配列に追加）
useEffect(() => {
  fetchFaxDocuments(currentDirection, currentPage * ITEMS_PER_PAGE);
}, [tenantId, currentPage, currentDirection]);
```

#### 2.3 フィルタリングの改修

**現状**: クライアントサイドフィルタリング
**改修後**: サーバーサイドフィルタリング（方向）+ クライアントサイドフィルタリング（検索・日時）

```typescript
// タブ切り替え時のデータ再取得
// 方針: setCurrentDirectionとsetCurrentPageを更新し、useEffectに再取得を任せる
const handleTabChange = (value: string) => {
  // direction値域: 'inbound' | 'outbound' | undefined
  const direction = value === 'inbound' ? 'inbound' as const :
                    value === 'outbound' ? 'outbound' as const : undefined;
  setCurrentDirection(direction);
  setCurrentPage(0); // ページをリセット
  // useEffect([currentDirection, currentPage])が再取得を実行
};

// 代替案: 即時リセット方式（useEffectに依存しない）
// const handleTabChange = (value: string) => {
//   const direction = value === 'inbound' ? 'inbound' as const :
//                     value === 'outbound' ? 'outbound' as const : undefined;
//   setCurrentDirection(direction);
//   setCurrentPage(0);
//   fetchFaxDocuments(direction, 0); // offset=0を明示的に渡す
// };

// クライアントサイドフィルタリング（検索・状態・日時）
const filteredDocuments = useMemo(() => {
  return faxDocuments.filter((doc) => {
    const matchesSearch = searchTerm === "" ||
      doc.sender_number.includes(searchTerm) ||
      doc.receiver_number.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

    const docDate = new Date(doc.created_at);
    const matchesDateRange = !dateRange?.from || !dateRange?.to ||
      (docDate >= dateRange.from && docDate <= dateRange.to);

    return matchesSearch && matchesStatus && matchesDateRange;
  });
}, [faxDocuments, searchTerm, statusFilter, dateRange]);
```

#### 2.4 UI表示の更新

**重要: プレビューボタンの状態管理**

Phase 5のバックエンドエンドポイント実装が完了するまで、プレビューボタンは**常にdisabled**とすること。

これは`transformToDisplay`で`preview_url`を空文字列に設定し、
`disabled={!doc.preview_url}`で制御することで実現する。
Phase 5完了後に`transformToDisplay`を更新してURL生成を有効化する。

```typescript
// ローディング状態
{loading && (
  <div className="flex justify-center py-8">
    <Spinner />
  </div>
)}

// エラー状態（リトライボタン付き）
{error && (
  <div className="text-center py-8 text-destructive">
    <p>{error}</p>
    <Button onClick={() => fetchFaxDocuments(currentDirection)} className="mt-4">
      再試行
    </Button>
  </div>
)}

// テーブル表示の更新
// ステータスマッピング: pending→処理中, completed→完了, failed→失敗
<TableCell>{doc.sender_number}</TableCell>
<TableCell>{doc.sender_name || '-'}</TableCell>
<TableCell>
  <Badge variant={
    doc.status === "completed" ? "default" :
    doc.status === "pending" ? "secondary" : "destructive"
  }>
    {doc.status === "completed" ? "完了" :
     doc.status === "pending" ? "処理中" : "失敗"}
  </Badge>
</TableCell>
<TableCell>{new Date(doc.created_at).toLocaleString('ja-JP')}</TableCell>

// プレビューボタン（Phase 5完了前は常にdisabled）
<Button
  variant="outline"
  size="icon"
  title="プレビュー"
  disabled={!doc.preview_url}  // Phase 5まで空文字列なので無効
  onClick={() => window.open(doc.preview_url, '_blank')}
>
  <Eye className="h-4 w-4" />
</Button>
```

---

### Phase 3: ページネーション実装

**目的**: 大量のFAXデータに対応

#### 3.1 暫定対応（バックエンドtotal未対応）

**現状の制約**: バックエンドの`list_fax_documents`は`len(items)`を`total`に返すため、
正確な総件数が取得できません。

**暫定対応**:
- `response.total`は表示に**使用しない**（正確でないため）
- 件数表示は`faxDocuments.length`（実際の取得件数）を使用
- 「次へ」ボタンは`faxDocuments.length === ITEMS_PER_PAGE`で判定

```typescript
// ページネーションUI（暫定対応版）
const hasMorePages = faxDocuments.length === ITEMS_PER_PAGE;

<div className="flex items-center justify-between mt-4">
  <p className="text-sm text-muted-foreground">
    {faxDocuments.length > 0
      ? `${currentPage * ITEMS_PER_PAGE + 1} - ${currentPage * ITEMS_PER_PAGE + faxDocuments.length}件を表示`
      : '0件'}
  </p>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === 0}
      onClick={() => setCurrentPage(p => p - 1)}
    >
      前へ
    </Button>
    <Button
      variant="outline"
      size="sm"
      disabled={!hasMorePages}
      onClick={() => setCurrentPage(p => p + 1)}
    >
      次へ
    </Button>
  </div>
</div>
```

#### 3.2 将来対応（バックエンドtotal実装後）

バックエンドに以下の修正を行った後、正確なページネーションが可能:

```python
# fax_repository.py に追加
async def count_fax_documents(self, tenant_id: str, direction: Optional[str] = None) -> int:
    if direction:
        query = "SELECT COUNT(*) FROM fax_documents WHERE tenant_id = $1 AND direction = $2"
        result = await self.db.fetchval(query, tenant_id, direction)
    else:
        query = "SELECT COUNT(*) FROM fax_documents WHERE tenant_id = $1"
        result = await self.db.fetchval(query, tenant_id)
    return result
```

---

### Phase 4: ダッシュボード連携

**目的**: `recent-faxes.tsx`も実データに接続

#### 4.1 RecentFaxes コンポーネントの改修

**ファイル**: `DENCO_UI/components/dashboard/recent-faxes.tsx`

**現行実装のフィールド名**:
```typescript
// 現在のコンポーネントが期待するフィールド
{
  sender: string;      // ← sender_number
  receiver: string;    // ← receiver_number
  startTime: string;   // ← created_at
}
```

**対応方針**: コンポーネント側の表示をAPIレスポンスのフィールド名に合わせて更新

```typescript
import { api } from '@/lib/api-client';
import { FaxDocument } from '@/lib/types';

export function RecentFaxes() {
  const [recentFaxes, setRecentFaxes] = useState<FaxDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: 認証コンテキストからテナントIDを取得
  // 認証システム実装後に以下を置き換え:
  // const { tenantId } = useAuth();
  const tenantId = 'default-tenant'; // 暫定ハードコード

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.python.fax.list(tenantId, 5, 0);
        setRecentFaxes(response.items);
      } catch (err) {
        console.error('Recent fax fetch error:', err);
        // ダッシュボードでは静かに失敗（トースト不要）
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [tenantId]);

  // テーブル表示を更新（フィールド名をAPIに合わせる）
  return (
    <Table>
      <TableBody>
        {recentFaxes.map((fax) => (
          <TableRow key={fax.id}>
            <TableCell>{fax.sender_number}</TableCell>    {/* sender → sender_number */}
            <TableCell>{fax.receiver_number}</TableCell>  {/* receiver → receiver_number */}
            <TableCell>
              {new Date(fax.created_at).toLocaleTimeString('ja-JP')}  {/* startTime → created_at */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### Phase 5: ファイルプレビュー機能（バックエンド拡張必要）

**目的**: TIFFファイルのプレビュー表示

**現状の制約**:
- `/preview`エンドポイントは**未実装**
- `tiff_path`はサーバー上の絶対パスであり、フロントエンドから直接アクセス不可
- **Phase 1-4のUI実装時点ではプレビューボタンは無効（disabled）にする**

**セキュリティ要件（重要）**:
このエンドポイントはファイルシステムへのアクセスを伴うため、Phase 0の認証設計が完了した上で実装すること。
- UI向け認証ミドルウェア（JWT/Session）を適用
- `tenant_id`は認証トークンから取得（クエリパラメータではなく）
- ファイルアクセス前に`tenant_id`の所有権検証を必須とする

#### 5.1 バックエンドエンドポイント追加（必要）

**ファイル**: `DENCO_manager/app/routers/fax_router.py`

**注意**: 以下のコード例は認証ミドルウェア適用後の実装です。
`get_current_user`依存関係と`tenant_id`検証が必要です。

```python
from fastapi.responses import FileResponse
from DENCO_manager.app.core.dependencies import get_current_user

@router.get("/{fax_id}/preview")
async def preview_fax_file(
    request: Request,
    fax_id: str,
    current_user = Depends(get_current_user)  # 認証ミドルウェア
):
    """
    FAXファイルをプレビュー

    セキュリティ:
    - 認証済みユーザーのみアクセス可能
    - tenant_idは認証トークンから取得
    - ファイル所有権の検証を実施

    将来対応:
    - TIFFをPDFに変換してブラウザ表示を改善
    """
    tenant_id = current_user.tenant_id  # トークンから取得
    fax_repo = request.app.state.fax_repo
    document = await fax_repo.get_fax_document(fax_id, tenant_id)

    if not document or not document.get("tiff_path"):
        raise HTTPException(status_code=404, detail="File not found")

    # ファイルパスの検証（ディレクトリトラバーサル防止）
    import os
    tiff_path = document["tiff_path"]
    if not os.path.isabs(tiff_path) or ".." in tiff_path:
        raise HTTPException(status_code=400, detail="Invalid file path")

    return FileResponse(
        tiff_path,
        media_type="image/tiff",
        filename=f"fax_{fax_id}.tiff"
    )
```

---

#### ⚠️ 警告: 暫定実装（開発環境限定・本番使用厳禁）

> **🚨 重要: この暫定実装は本番環境に絶対に使用しないでください**
>
> - 認証なしでファイルシステムにアクセス可能
> - `tenant_id`の検証がなく、他テナントのデータにアクセス可能
> - ディレクトリトラバーサル攻撃のリスクあり
>
> **推奨**: このコードは**削除**し、Phase 0（認証設計）完了後に上記の認証付き実装のみを使用してください。
> 動作確認が必要な場合のみ、ローカル開発環境に限定して使用してください。

```python
# ⚠️ 暫定実装（開発環境のみ・本番環境に絶対使用禁止）
# 推奨: Phase 0完了後にこのコードを削除し、認証付き実装に置き換え

@router.get("/{fax_id}/preview")
async def preview_fax_file(
    request: Request,
    fax_id: str,
    tenant_id: str  # ⚠️ セキュリティリスク: クエリパラメータで任意指定可能
):
    """
    ⚠️ 警告: この実装は認証なし - 開発環境のみ使用

    本番環境では必ず以下を実装:
    1. 認証ミドルウェア（get_current_user）
    2. tenant_idをトークンから取得
    3. ファイルパスの検証
    """
    fax_repo = request.app.state.fax_repo
    document = await fax_repo.get_fax_document(fax_id, tenant_id)

    if not document or not document.get("tiff_path"):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        document["tiff_path"],
        media_type="image/tiff",
        filename=f"fax_{fax_id}.tiff"
    )
```

**本番デプロイ前チェックリスト**:
- [ ] 暫定実装コードが削除されていること
- [ ] 認証ミドルウェアが適用されていること
- [ ] `tenant_id`がトークンから取得されていること
- [ ] ファイルパス検証が実装されていること

---

#### 5.2 Phase 5実装後のUI更新

```typescript
// transformToDisplay関数を更新（Phase 5完了後）
const transformToDisplay = (doc: FaxDocument): FaxDocumentDisplay => ({
  ...doc,
  preview_url: doc.tiff_path
    ? api.python.fax.getPreviewUrl(doc.id, tenantId)
    : '',
  has_ocr: doc.ocr_text !== null && doc.ocr_text !== '',
});
```

---

## 実装タスク一覧

### 優先度: 最高（Phase 0 - 先行設計）

| # | タスク | 担当 | 工数 |
|---|--------|------|------|
| 0-1 | 認証方式の決定（JWT/Session等） | 設計 | 2h |
| 0-2 | テナントID取得方針の決定 | 設計 | 1h |
| 0-3 | fax_router.pyへの認証ミドルウェア追加 | バックエンド | 2h |

### 優先度: 高（Phase 1-2）

| # | タスク | ファイル | 工数 |
|---|--------|----------|------|
| 1 | FaxDocument型定義の更新 | `lib/types.ts` | 0.5h |
| 2 | APIクライアントの更新（`{ documents }` → `{ items }`） | `lib/api-client.ts` | 0.5h |
| 3 | fax-management.tsx: 状態管理追加 | `components/fax/fax-management.tsx` | 1h |
| 4 | fax-management.tsx: データ取得実装 | `components/fax/fax-management.tsx` | 1h |
| 5 | fax-management.tsx: ローディング/エラー表示 | `components/fax/fax-management.tsx` | 0.5h |
| 6 | サンプルデータの削除 | `components/fax/fax-management.tsx` | 0.5h |

### 優先度: 中（Phase 3-4）

| # | タスク | ファイル | 工数 |
|---|--------|----------|------|
| 7 | ページネーション実装（暫定版） | `components/fax/fax-management.tsx` | 1h |
| 8 | recent-faxes.tsx フィールド名更新 | `components/dashboard/recent-faxes.tsx` | 1h |
| 9 | バックエンドtotalカウント実装 | `fax_router.py`, `fax_repository.py` | 1.5h |

### 優先度: 低（Phase 5 - 将来実装）

| # | タスク | ファイル | 工数 |
|---|--------|----------|------|
| 10 | ファイルプレビューエンドポイント | `fax_router.py` | 1h |
| 11 | transformToDisplayでURL生成有効化 | `fax-management.tsx` | 0.5h |
| 12 | 顧客名の自動解決 | `fax-management.tsx`, `customer API` | 2h |
| 13 | リアルタイム更新（WebSocket） | 全体 | 3h |

---

## データフロー図

```
┌─────────────────────────────────────────────────────────┐
│                    DENCO_UI                             │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │ fax-management  │    │    api.python.fax       │    │
│  │    .tsx         │───▶│       .list()           │    │
│  │                 │    └───────────┬─────────────┘    │
│  │ - useState      │                │                  │
│  │ - useEffect     │                │                  │
│  │ - transform     │                │                  │
│  └────────▲────────┘                │                  │
│           │                         │                  │
│           │ FaxDocumentDisplay[]    │                  │
│           │                         │                  │
└───────────┼─────────────────────────┼──────────────────┘
            │                         │
            │                         ▼
            │              GET /api/fax?tenant_id=X
            │                         │
┌───────────┼─────────────────────────┼──────────────────┐
│           │      DENCO_manager      │                  │
│           │                         ▼                  │
│           │          ┌──────────────────────┐          │
│           │          │    fax_router.py     │          │
│           │          │  list_fax_documents  │          │
│           │          └──────────┬───────────┘          │
│           │                     │                      │
│           │                     ▼                      │
│           │          ┌──────────────────────┐          │
│           │          │  fax_repository.py   │          │
│           │          │ list_fax_documents   │          │
│           │          └──────────┬───────────┘          │
│           │                     │                      │
│           │                     ▼                      │
│           │          ┌──────────────────────┐          │
│           │          │   PostgreSQL         │          │
│           │          │  fax_documents table │          │
│           │          └──────────┬───────────┘          │
│           │                     │                      │
│           │    FaxListResponse  │                      │
│           │    { items, total } │                      │
│           └─────────────────────┘                      │
│                                                        │
└────────────────────────────────────────────────────────┘

APIクライアント利用方法:
import { api } from '@/lib/api-client';
const response = await api.python.fax.list(tenantId, limit, offset, direction);
```

---

## テスト計画

### 単体テスト

1. **型変換テスト**: `transformToDisplay`関数の正常動作
2. **フィルタリングテスト**: 検索・状態・日時フィルターの正確性
3. **エラーハンドリング**: API失敗時の適切なエラー表示とトースト

### 統合テスト

1. **API接続テスト**: 実際のバックエンドからデータ取得
2. **ページネーションテスト**: 複数ページの遷移
3. **認証テスト**: テナントIDによるデータ分離

### E2Eテスト

1. FAX管理画面の表示
2. フィルター操作
3. ページ遷移
4. プレビュー操作（Phase 5実装後）

---

## 注意事項

### 認証・認可（最重要）

- **現状**: `tenant_id`はクエリパラメータで任意指定可能（セキュリティリスク）
- **対応必須**: Phase 0の認証設計を先行して完了させること
- `fax-management.tsx`と`recent-faxes.tsx`の両方で`tenantId`がハードコードされている
- 将来的に認証コンテキスト（`useAuth`フック等）からの取得に置き換え必要

### ステータス値のマッピング

| DB値 | UI表示 | バッジVariant |
|------|--------|---------------|
| `pending` | 処理中 | `secondary` |
| `completed` | 完了 | `default` |
| `failed` | 失敗 | `destructive` |

注意: UI旧実装の`received`, `processing`は使用しない

### ファイルプレビュー（Phase 5まで無効）

- `preview_url`はPhase 5まで**空文字列**とする
- ボタンは`disabled={!doc.preview_url}`で無効化
- Phase 5実装後に`transformToDisplay`でURL生成を有効化

### ページネーション

- **現状のバックエンド**: `total`は`len(items)`を返すのみ
- **暫定対応**: `response.total`は表示に使用しない。`faxDocuments.length`を使用
- **「次へ」判定**: `faxDocuments.length === ITEMS_PER_PAGE`
- **将来対応**: バックエンドにCOUNTクエリ追加

### APIクライアント整合性

- **現行**: `{ documents, total }` を返す
- **更新後**: `{ items, total, limit, offset }` を返す（バックエンドに合わせる）
- `lib/api-client.ts`のFAX API定義を更新必須

**利用名の統一**:
- 現行実装: `export const api = { python, node }`
- 本設計書での呼び出し: `api.python.fax.list(...)`
- インポート: `import { api } from '@/lib/api-client';`

### recent-faxes.tsxのフィールド名

- **現行コンポーネント**: `sender`, `receiver`, `startTime`
- **APIレスポンス**: `sender_number`, `receiver_number`, `created_at`
- コンポーネント側の表示フィールドを更新する

---

## 関連ドキュメント

- `DENCO_UI/claudedocs/FAX_RECEIVE_CURRENT_STATUS.md` - 現状報告書
- `DENCO_manager/docs/PYTHON_BACKEND_API.md` - バックエンドAPI仕様
- `DENCO_UI/docs/ARCHITECTURE.md` - フロントエンドアーキテクチャ

---

**作成日**: 2025-11-24
**更新日**: 2025-11-24
**作成者**: Claude Code
**ステータス**: 設計完了、Phase 0（認証設計）の先行着手を推奨
**最終レビュー**: 2025-11-24（ダウンロード機能削除、プレビュー機能のみに変更）
