# DENCO UI

Next.js-based frontend for the DENCO real-time AI voice call and FAX system.

## Directory Structure

```
DENCO_UI/
├── app/           # Next.js 13 App Router pages
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
└── public/        # Static assets
```

## Development

```bash
cd DENCO_UI
npm install
npm run dev       # Start dev server on port 3000
npm run build     # Build for production
```

### 開発モードでの認証スキップ

`npm run dev` で開発サーバーを起動すると、**認証（ログイン）が自動的にスキップ**されます。

- ログイン画面を経由せず、直接ダッシュボードにアクセス可能
- ダミーユーザー（管理者権限）で自動ログイン

| 項目 | 値 |
|------|-----|
| メール | `debug@denco.local` |
| 名前 | `デバッグユーザー` |
| ロール | `admin` |

#### 本番環境での認証

`npm run build` でビルドした本番環境では、通常の認証フローが有効になります。

環境変数で認証を制御することも可能です：

```env
# 認証を強制的に無効化（本番環境では非推奨）
NEXT_PUBLIC_DISABLE_AUTH=true
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **Forms**: React Hook Form, Zod
- **Testing**: Vitest, Testing Library

## Configuration

See parent repository's CLAUDE.md for complete setup instructions.
