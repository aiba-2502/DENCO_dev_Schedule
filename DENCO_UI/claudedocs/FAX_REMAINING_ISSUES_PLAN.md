# FAX DB統合 残存課題修正計画

## 概要

FAX DB統合の実装完了後に残存する3つの懸念事項に対する修正計画を定義する。

---

## 懸念事項1: 認証未実装（tenantIdハードコード）

### 現状

`tenantId`が`'default-tenant'`でハードコードされている箇所:

| ファイル | 行 | 用途 |
|----------|-----|------|
| `components/fax/fax-management.tsx` | 91 | FAX一覧取得 |
| `components/dashboard/recent-faxes.tsx` | 25 | 最近のFAX取得 |
| `components/calls/session-detail.tsx` | 106 | Authorization ヘッダー |

### 既存の認証基盤

- **AuthContext**: `contexts/AuthContext.tsx`に実装済み
- **useAuth Hook**: 認証状態とユーザー情報を取得
- **User型**: `lib/auth-service.ts`で定義
  ```typescript
  interface User {
    id: string;
    email: string;
    tenant_id: string;  // ← これを使用
    full_name: string;
    role: 'admin' | 'staff';
    // ...
  }
  ```

### 修正計画

#### Phase 1: 認証コンテキストからの取得

**対象ファイル**: `components/fax/fax-management.tsx`

```typescript
// Before
const tenantId = 'default-tenant'; // 暫定ハードコード

// After
import { useAuth } from '@/contexts/AuthContext';

export function FaxManagement() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? '';

  // user未ロード時のガード
  if (!user) {
    return <LoadingSpinner />;
  }
  // ...
}
```

**対象ファイル**: `components/dashboard/recent-faxes.tsx`

```typescript
// Before
const tenantId = 'default-tenant'; // 暫定ハードコード

// After
import { useAuth } from '@/contexts/AuthContext';

export function RecentFaxes() {
  const { user, isLoading } = useAuth();
  const tenantId = user?.tenant_id ?? '';

  // 認証ロード中またはユーザー未取得時
  if (isLoading || !user) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }
  // ...
}
```

**対象ファイル**: `components/calls/session-detail.tsx`

```typescript
// Before
headers: { 'Authorization': 'Bearer default-tenant' }

// After
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/auth-service';

// コンポーネント内で
const accessToken = getAccessToken();
headers: { 'Authorization': `Bearer ${accessToken}` }
```

#### Phase 2: useEffect依存配列の更新

tenantIdが変更可能になるため、useEffectの依存配列を適切に設定:

```typescript
useEffect(() => {
  if (tenantId) {
    fetchFaxDocuments();
  }
}, [tenantId]); // tenantIdを依存配列に追加
```

### 前提条件

- Phase 0の認証設計が完了していること
- AuthProviderがアプリケーションルートでラップされていること
- バックエンドAPIがJWT認証をサポートしていること

### テスト項目

- [ ] 認証済みユーザーでFAX一覧が正常に表示される
- [ ] 異なるtenantのユーザーでデータが分離される
- [ ] 未認証状態でログインページにリダイレクトされる
- [ ] トークン期限切れ時に適切にリフレッシュされる

---

## 懸念事項2: プレビュー機能未実装

### 現状

- バックエンドエンドポイント `/api/fax/{id}/preview` が未実装
- フロントエンドでは `preview_url` が空文字列のため、ボタンが常にdisabled

```typescript
// fax-management.tsx:269, 340
<Button
  variant="outline"
  size="icon"
  disabled={!doc.preview_url}  // 常にtrue（無効）
>
  <Eye className="h-4 w-4" />
</Button>
```

### 修正計画

#### 設計方針: ファイル直接配信方式

プレビューAPIは**PDFまたは画像ファイルを直接ストリーミング配信**する方式を採用する。
これにより、フロントエンドはAPIエンドポイントURLをそのまま`iframe`の`src`に使用できる。

**選択理由**:
- JSONでURLを返す方式だと、フロントエンドで2段階のフェッチが必要になり複雑化する
- ファイル直接配信により、ブラウザのキャッシュ機構を活用できる
- `Content-Type`ヘッダーでブラウザが適切にレンダリングできる

#### Phase 5: バックエンドエンドポイント実装

**DENCO_manager側の実装**:

```python
# app/routers/fax_router.py

import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from DENCO_manager.app.core.dependencies import get_current_user, get_fax_service
from DENCO_manager.app.core.config import settings
from DENCO_manager.app.domain.entities import User

# ストレージルートディレクトリ（設定から取得）
# 注意: settings.FAX_STORAGE_PATH が未定義の場合のフォールバック
FAX_STORAGE_PATH = getattr(settings, 'FAX_STORAGE_PATH', None)
if not FAX_STORAGE_PATH:
    raise RuntimeError(
        "FAX_STORAGE_PATH is not configured. "
        "Please set FAX_STORAGE_PATH in your .env file or config."
    )
FAX_STORAGE_ROOT = Path(FAX_STORAGE_PATH).resolve()

# 起動時バリデーション: ストレージディレクトリの存在確認
if not FAX_STORAGE_ROOT.exists():
    raise RuntimeError(
        f"FAX storage directory does not exist: {FAX_STORAGE_ROOT}. "
        "Please create the directory or update FAX_STORAGE_PATH."
    )

def validate_file_path(relative_path: str, storage_root: Path) -> Path:
    """
    パストラバーサル防止とファイル存在確認

    Args:
        relative_path: DBに保存された相対パス
        storage_root: ストレージルートディレクトリ

    Returns:
        検証済みの絶対パス

    Raises:
        HTTPException: パストラバーサル検出またはファイル不存在
    """
    # 絶対パスが渡された場合は拒否
    if os.path.isabs(relative_path):
        raise HTTPException(
            status_code=400,
            detail="Invalid file path: absolute paths not allowed"
        )

    # パスを正規化し、ストレージルート内に収まることを確認
    full_path = (storage_root / relative_path).resolve()

    # パストラバーサル防止: ストレージルート外へのアクセスをブロック
    try:
        full_path.relative_to(storage_root)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Access denied: path traversal detected"
        )

    # ファイル存在確認
    if not full_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if not full_path.is_file():
        raise HTTPException(
            status_code=400,
            detail="Invalid path: not a file"
        )

    return full_path


@router.get("/{fax_id}/preview")
async def get_fax_preview(
    fax_id: str,
    current_user: User = Depends(get_current_user),  # JWT認証必須
    service: FaxService = Depends(get_fax_service)
):
    """
    FAXプレビュー用のPDFまたは画像を直接配信

    認証・認可:
        - JWTトークンによる認証必須
        - current_user.tenant_id でテナント所有権を検証
        - 他テナントのFAXにはアクセス不可

    Returns:
        - pdf_path が存在: PDF (application/pdf)
        - tiff_path のみ: 変換されたPNG (image/png)
        - どちらもなし: 404
    """
    # テナント所有権検証: JWTから取得したtenant_idを使用
    tenant_id = current_user.tenant_id

    fax = await service.get_by_id(fax_id, tenant_id)
    if not fax:
        raise HTTPException(
            status_code=404,
            detail="FAX not found or access denied"
        )

    if fax.pdf_path:
        # パストラバーサル防止と存在確認
        file_path = validate_file_path(fax.pdf_path, FAX_STORAGE_ROOT)
        return FileResponse(
            path=str(file_path),
            media_type="application/pdf",
            filename=f"fax_{fax_id}.pdf"
        )
    elif fax.tiff_path:
        # TIFF→PNG変換（一時ファイル経由でメモリ消費を抑制）
        # 注意: 大容量ファイル対応のため、一時ファイルに保存してFileResponseで返す
        tiff_path = validate_file_path(fax.tiff_path, FAX_STORAGE_ROOT)
        png_path = await service.convert_tiff_to_png_file(tiff_path, fax_id)

        return FileResponse(
            path=str(png_path),
            media_type="image/png",
            filename=f"fax_{fax_id}.png",
            # 一時ファイルはレスポンス送信後に削除
            background=BackgroundTask(lambda: png_path.unlink(missing_ok=True))
        )
    else:
        raise HTTPException(
            status_code=404,
            detail="No preview available for this FAX"
        )
```

**サービス層のTIFF変換実装例**:

```python
# app/services/fax_service.py

import tempfile
import uuid
from pathlib import Path
from PIL import Image

class FaxService:
    async def convert_tiff_to_png_file(self, tiff_path: Path, fax_id: str) -> Path:
        """
        TIFFをPNGに変換し、一時ファイルとして保存

        メモリ消費を抑えるため、全データをメモリに載せずファイル経由で処理。
        10MB以上のTIFFファイルでも安全に変換可能。

        Args:
            tiff_path: 入力TIFFファイルのパス
            fax_id: FAX ID（ファイル名用）

        Returns:
            変換されたPNGファイルのパス（一時ファイル）
        """
        # 一時ディレクトリに保存（自動削除はしない、呼び出し側で削除）
        temp_dir = Path(tempfile.gettempdir()) / "fax_previews"
        temp_dir.mkdir(exist_ok=True)

        # ファイル名衝突防止: 同一fax_idへの同時リクエスト対策
        # fax_id のみだと複数リクエストで上書きされるリスクがあるためUUIDを付与
        unique_suffix = uuid.uuid4().hex[:8]
        png_path = temp_dir / f"fax_{fax_id}_{unique_suffix}.png"

        # Pillowでストリーミング変換（メモリ効率が良い）
        with Image.open(tiff_path) as img:
            # マルチページTIFFの場合は最初のページのみ
            img.save(png_path, "PNG", optimize=True)

        return png_path
```

> **⚠️ 一時ファイルの衝突リスク**: 同一`fax_id`に対する同時リクエストでファイル名が衝突する可能性があります。`uuid4()`を付与することで一意性を保証しています。一時ファイルは`BackgroundTask`でレスポンス送信後に自動削除されます。

> **⚠️ メモリ消費に関する注意**: 当初の`StreamingResponse(iter([png_bytes]))`実装は、変換結果全体をメモリに保持するため、10MB以上のファイルではメモリ不足のリスクがあります。上記の一時ファイル方式を推奨します。

**セキュリティ要件**:

| 要件 | 実装方法 |
|------|----------|
| 認証必須 | `Depends(get_current_user)` でJWTトークン検証 |
| テナント分離 | `current_user.tenant_id` をサービス層に渡して所有権検証 |
| パストラバーサル防止 | ファイルパスの正規化とホワイトリスト検証 |
| レート制限 | 大容量ファイル対策として同一ユーザーの同時リクエスト制限 |

> **⚠️ 本番禁止事項**: クエリパラメータで `tenant_id` を受け取る暫定実装は**絶対に本番環境に投入しないこと**。必ずJWT経由でテナントIDを取得すること。

#### Phase 5: APIクライアント更新

**lib/api-client.ts の更新**:

```typescript
// PythonApiClient クラス内の fax オブジェクト

fax = {
  // 既存メソッド...
  list: (tenantId: string, limit = 50, offset = 0, direction?: 'inbound' | 'outbound') =>
    this.get<{ items: unknown[]; total: number; limit: number; offset: number }>(
      `/api/fax?tenant_id=${tenantId}&limit=${limit}&offset=${offset}${
        direction ? `&direction=${direction}` : ''
      }`
    ),

  getById: (faxId: string, tenantId: string) =>
    this.get<unknown>(`/api/fax/${faxId}?tenant_id=${tenantId}`),

  /**
   * プレビューエンドポイントURL生成
   *
   * このメソッドはURLを返すのみで、実際のファイル取得はブラウザが行う。
   * エンドポイントはPDF/PNGを直接ストリーミング配信する。
   *
   * 認証: Authorization ヘッダーが必要なため、iframe直接埋め込みには
   * 追加の認証トークン付与が必要（下記フロントエンド実装参照）
   */
  getPreviewUrl: (faxId: string) =>
    `${PYTHON_API}/api/fax/${faxId}/preview`,

  // アップロード...
};
```

**設計上の注意**:
- `getPreviewUrl` は認証不要のURL文字列を返すのみ
- 実際のプレビュー表示時には認証トークンの付与が必要
- `tenantId` パラメータは不要（JWT経由で取得するため）

#### Phase 5: フロントエンド更新

**transform関数の更新**:

```typescript
// fax-management.tsx
const transformToDisplay = (doc: FaxDocument): FaxDocumentDisplay => ({
  ...doc,
  // プレビュー可能かどうかのフラグ（URLは動的に生成）
  preview_url: (doc.pdf_path || doc.tiff_path)
    ? api.python.fax.getPreviewUrl(doc.id)
    : '',
  has_ocr: doc.ocr_text !== null,
});
```

**プレビューダイアログの実装（認証トークン付き）**:

```typescript
import { getAccessToken } from '@/lib/auth-service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// コンポーネント内で
const { user, isLoading: authLoading } = useAuth();
const { toast } = useToast();

const [previewFax, setPreviewFax] = useState<FaxDocumentDisplay | null>(null);
const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
const [previewLoading, setPreviewLoading] = useState(false);
const [previewError, setPreviewError] = useState<string | null>(null);

// ボタンクリックハンドラ: 認証付きでファイルを取得
const handlePreview = async (doc: FaxDocumentDisplay) => {
  // 認証状態のガード
  if (authLoading) {
    toast({
      title: "認証確認中",
      description: "しばらくお待ちください",
      variant: "default",
    });
    return;
  }

  // 未認証チェック
  const token = getAccessToken();
  if (!token || !user) {
    toast({
      title: "認証エラー",
      description: "ログインが必要です。再度ログインしてください。",
      variant: "destructive",
    });
    // 必要に応じてログインページへリダイレクト
    // router.push('/login');
    return;
  }

  setPreviewFax(doc);
  setPreviewLoading(true);
  setPreviewError(null);

  try {
    const response = await fetch(doc.preview_url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // トークン期限切れの可能性
      toast({
        title: "セッション期限切れ",
        description: "再度ログインしてください",
        variant: "destructive",
      });
      setPreviewFax(null);
      return;
    }

    if (!response.ok) {
      throw new Error(`Preview failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    setPreviewBlobUrl(blobUrl);
  } catch (err) {
    setPreviewError(err instanceof Error ? err.message : 'プレビューの取得に失敗しました');
  } finally {
    setPreviewLoading(false);
  }
};

// ダイアログクローズ時のクリーンアップ
const handleClosePreview = () => {
  if (previewBlobUrl) {
    URL.revokeObjectURL(previewBlobUrl);
  }
  setPreviewFax(null);
  setPreviewBlobUrl('');
  setPreviewError(null);
};

// プレビューダイアログ
<Dialog open={!!previewFax} onOpenChange={handleClosePreview}>
  <DialogContent className="max-w-4xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle>FAXプレビュー</DialogTitle>
      <DialogDescription>
        {previewFax?.sender_number} → {previewFax?.receiver_number}
      </DialogDescription>
    </DialogHeader>

    {previewLoading && (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )}

    {previewError && (
      <div className="text-destructive text-center py-4">
        {previewError}
      </div>
    )}

    {previewBlobUrl && !previewLoading && (
      <iframe
        src={previewBlobUrl}
        className="w-full h-[70vh] border rounded"
        title="FAX Preview"
      />
    )}
  </DialogContent>
</Dialog>
```

### 前提条件

- DENCO_managerにFAXファイルストレージが設定されていること
- JWT認証ミドルウェアが実装されていること（Phase 0依存）
- `get_current_user` 依存関数がJWTからUserを取得できること
- TIFF→PNG変換ライブラリ（Pillow等）がインストールされていること

### テスト項目

- [ ] 認証済みユーザーでPDFプレビューが表示される
- [ ] 認証済みユーザーでTIFF→PNGプレビューが表示される
- [ ] **他テナントのFAXにアクセスすると403/404が返る**
- [ ] **未認証でアクセスすると401が返る**
- [ ] ファイルが存在しないFAXでは適切なエラーメッセージが表示される
- [ ] 大きなファイル（10MB以上）でもプレビューが正常に動作する
- [ ] ダイアログクローズ時にBlobURLが解放される

---

## 懸念事項3: 既存の型エラー

### 現状

TypeScriptビルドで多数のエラーが検出されているが、FAX関連コードには影響なし。

**エラー分類**:

| カテゴリ | ファイル例 | エラー内容 |
|----------|------------|------------|
| APIクライアント未定義 | `page-api.tsx`, `tenant-management.tsx` | `campaigns`, `tenants`プロパティが未定義 |
| テスト型定義欠落 | `*.test.tsx` | Jest型が見つからない |
| 通知コンポーネント型不整合 | `notification-*.tsx` | KeywordConditionの`mode`プロパティ欠落 |
| 設定コンポーネント型不整合 | `settings-management.tsx` | ARI設定プロパティ名不一致 |

### 修正計画

#### 優先度1: テスト型定義（即時対応可能）

**バックエンド依存: なし**

```bash
npm install --save-dev @types/jest @testing-library/jest-dom
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

#### 優先度2: APIクライアント拡張

**⚠️ バックエンド実装状況の確認が必要**

以下のAPIエンドポイントについて、DENCO_manager側の実装状況を確認する必要がある。

| API | 想定エンドポイント | 実装状況 | 対応方針 |
|-----|-------------------|---------|---------|
| campaigns | `/api/campaigns` | **要確認** | 下記参照 |
| tenants | `/api/tenants` | **要確認** | 下記参照 |

**対応方針の決定フロー**:

```
バックエンドにエンドポイントが存在する？
├─ Yes → APIクライアントに実装を追加（下記コード参照）
└─ No
   ├─ 機能として必要？
   │  ├─ Yes → バックエンドに実装を追加（別タスク）
   │  └─ No → フロントエンドのコンポーネントを削除または無効化
   └─ 暫定対応が必要？
      ├─ Yes → スタブ実装を追加（下記参照）
      └─ No → 型エラーのまま放置（非推奨）
```

**方針A: バックエンドが実装済みの場合**

```typescript
// lib/api-client.ts に追加

// PythonApiClient クラス内
campaigns = {
  list: (tenantId: string, limit = 50, offset = 0) =>
    this.get<{ campaigns: unknown[]; total: number }>(
      `/api/campaigns?tenant_id=${tenantId}&limit=${limit}&offset=${offset}`
    ),
  create: (data: unknown) =>
    this.post<unknown>('/api/campaigns', data),
  update: (id: string, data: unknown) =>
    this.put<unknown>(`/api/campaigns/${id}`, data),
  delete: (id: string) =>
    this.delete<unknown>(`/api/campaigns/${id}`),
};

tenants = {
  list: (limit = 50, offset = 0) =>
    this.get<{ tenants: unknown[]; total: number }>(
      `/api/tenants?limit=${limit}&offset=${offset}`
    ),
  getById: (id: string) =>
    this.get<unknown>(`/api/tenants/${id}`),
  create: (data: unknown) =>
    this.post<unknown>('/api/tenants', data),
  update: (id: string, data: unknown) =>
    this.put<unknown>(`/api/tenants/${id}`, data),
  delete: (id: string) =>
    this.delete<unknown>(`/api/tenants/${id}`),
};
```

**方針B: バックエンド未実装でスタブが必要な場合**

> **⚠️ 本番禁止**: スタブ実装は開発・テスト環境専用。本番投入前に必ず実装を完了すること。

```typescript
// lib/api-client.ts に追加

// PythonApiClient クラス内 - スタブ実装
campaigns = {
  list: async (tenantId: string, limit = 50, offset = 0) => {
    console.warn('⚠️ campaigns.list is using STUB implementation');
    return { campaigns: [], total: 0 };
  },
  create: async (data: unknown) => {
    throw new Error('campaigns.create is not implemented');
  },
  // ...
};

tenants = {
  list: async (limit = 50, offset = 0) => {
    console.warn('⚠️ tenants.list is using STUB implementation');
    return { tenants: [], total: 0 };
  },
  // ...
};
```

**方針C: 該当コンポーネントを無効化する場合**

型エラーが発生しているコンポーネント（`page-api.tsx`, `tenant-management.tsx`等）が未完成機能の場合、一時的に無効化する:

```typescript
// 該当ファイルの先頭に追加
// @ts-nocheck
// TODO: campaigns/tenants APIがバックエンドに実装されたら有効化

// または、ルーティングから除外
// app/(dashboard)/campaigns/page.tsx → app/(dashboard)/campaigns/page.tsx.disabled
```

#### 優先度3: 型定義の修正

**バックエンド依存: なし（フロントエンドのみ）**

**KeywordCondition型の修正**:

```typescript
// lib/types.ts または該当ファイル
interface KeywordCondition {
  mode: 'any' | 'all';  // 欠落していたプロパティ
  keywords: {
    id: string;
    word: string;
    operator: 'and' | 'or';
  }[];
}
```

**設定型の統一**:

バックエンドAPIのレスポンス形式を確認し、フロントエンドの型定義を合わせる:

```typescript
// components/settings/settings-management.tsx
// プロパティ名をバックエンドAPIに合わせる
interface AsteriskSettings {
  ari_host: string;
  ari_port: string;
  ari_username: string;
  ari_password: string;
  ari_app_name: string;
}
```

### 修正の影響範囲

これらの修正はFAX機能には直接影響しないが、以下の理由で対応を推奨:

1. **CI/CDパイプライン**: 型エラーでビルドが失敗する
2. **開発体験**: エラーがノイズになり本質的な問題を見逃す
3. **コード品質**: 型安全性の低下

### 推奨アクション

1. **即時**: DENCO_managerのルーター一覧を確認し、campaigns/tenantsエンドポイントの有無を特定
   ```bash
   grep -r "router\|@router" DENCO_manager/app/routers/
   ```

2. **方針決定**: バックエンド実装状況に基づいて方針A/B/Cを選択

3. **実装**: 選択した方針に従って修正を実施

### テスト項目

- [ ] `npx tsc --noEmit` がエラーなしで完了する
- [ ] 既存の機能に回帰がないこと
- [ ] Jestテストが正常に実行される
- [ ] **スタブ使用時**: コンソールに警告が表示されることを確認
- [ ] **本番デプロイ前**: 全スタブが実装に置き換えられていることを確認

---

## 実装優先度

| 優先度 | 懸念事項 | 依存関係 | 推定工数 |
|--------|----------|----------|----------|
| **高** | 1. 認証統合 | Phase 0（認証設計）完了後 | 2-3時間 |
| **中** | 3. 型エラー修正 | なし（即時対応可能） | 3-4時間 |
| **低** | 2. プレビュー機能 | Phase 5（バックエンド実装）完了後 | 4-6時間 |

---

## 関連ドキュメント

- `DENCO_UI/claudedocs/FAX_DB_INTEGRATION_DESIGN.md` - FAX DB統合設計書
- `contexts/AuthContext.tsx` - 認証コンテキスト実装
- `lib/auth-service.ts` - 認証サービスとUser型定義

---

## 更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2025-11-24 | 初版作成 |
| 2025-11-24 | プレビューAPI設計を修正（ファイル直接配信方式に統一）、セキュリティ要件追記、APIクライアント設計明確化、型エラー対応のバックエンド前提を明記 |
| 2025-11-24 | パストラバーサル防止の実装例追加、TIFF変換を一時ファイル方式に変更（メモリ消費対策）、フロントエンドの未認証ハンドリング追加 |
| 2025-11-24 | FAX_STORAGE_PATHの起動時バリデーション追加、一時ファイル名にUUIDを付与して衝突リスク対策 |
