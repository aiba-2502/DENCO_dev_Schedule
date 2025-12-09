# DENCO AI チャットボット

Dify AIと連携したチャットボット機能の技術仕様書

## 概要

DENCOナレッジデータベース内の「AI検索」機能として実装されたチャットボットです。  
ユーザーは自然言語で質問し、Dify AIエージェントからの回答を受け取ることができます。

---

## システム構成

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐     Streaming     ┌─────────────────┐
│                 │  ───────────────►  │                 │  ─────────────►   │                 │
│    Frontend     │                    │    Backend      │                   │    Dify API     │
│   (Next.js)     │  ◄───────────────  │   (Node.js)     │  ◄─────────────   │                 │
│                 │     JSON Response  │                 │   SSE Response    │                 │
└─────────────────┘                    └─────────────────┘                   └─────────────────┘
     :3000                                  :3001                          外部サーバー
```

---

## バックエンド仕様

### 基本情報

| 項目 | 値 |
|------|-----|
| ランタイム | Node.js 18+ |
| フレームワーク | Express.js 4.x |
| デフォルトポート | 3001 |
| 通信方式 | REST API (JSON) |

### ディレクトリ構成

```
ChatbotBackend/
├── server.js      # メインサーバーファイル
├── package.json   # 依存関係定義
├── .env           # 環境変数（要作成）
├── env.sample     # 環境変数テンプレート
└── README.md      # このファイル
```

### 依存パッケージ

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

### 環境変数

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|-----|
| `DIFY_API_ENDPOINT` | ✓ | Dify APIのベースURL | `https://api.dify.ai/v1` |
| `DIFY_API_KEY` | ✓ | DifyアプリのAPIキー | `app-xxxxxxxx` |
| `PORT` | - | サーバーポート（デフォルト: 3001） | `3001` |
| `CORS_ORIGIN` | - | 許可するオリジン（デフォルト: localhost:3000） | `http://localhost:3000` |

### APIエンドポイント

#### 1. チャット送信

```
POST /api/chat
```

**リクエストボディ:**

```json
{
  "message": "こんにちは",
  "conversationId": "abc-123-def",  // 任意: 会話継続時に指定
  "user": "user-001"                 // 任意: ユーザー識別子
}
```

**レスポンス（成功時）:**

```json
{
  "answer": "こんにちは！何かお手伝いできることはありますか？",
  "conversationId": "abc-123-def",
  "messageId": "msg-456"
}
```

**レスポンス（エラー時）:**

```json
{
  "error": "エラーメッセージ",
  "code": "ERROR_CODE"
}
```

| エラーコード | HTTPステータス | 説明 |
|-------------|---------------|------|
| `MISSING_MESSAGE` | 400 | メッセージが空 |
| `MISSING_API_KEY` | 500 | APIキー未設定 |
| `CHAT_ERROR` | 500 | Dify API通信エラー |

#### 2. ヘルスチェック

```
GET /api/health
```

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-08T12:00:00.000Z",
  "difyConfigured": true
}
```

#### 3. 会話履歴取得

```
GET /api/conversations/:conversationId/messages?user=user-001
```

**レスポンス:** Dify APIからの生データ

### Dify API連携

バックエンドはDify APIと**ストリーミングモード**で通信します。

```
Backend → Dify: POST /chat-messages (response_mode: "streaming")
Dify → Backend: Server-Sent Events (SSE)
```

**対応イベントタイプ:**

| イベント | 説明 |
|---------|------|
| `message` | テキストチャンク（通常のChat App） |
| `agent_message` | テキストチャンク（Agent App） |
| `message_end` | メッセージ完了 |
| `error` | エラー発生 |

**注意:** Dify Agent Appは`blocking`モードをサポートしないため、ストリーミングで受信してからクライアントにまとめて返却しています。

---

## フロントエンド仕様

### 基本情報

| 項目 | 値 |
|------|-----|
| フレームワーク | Next.js 14+ (App Router) |
| 言語 | TypeScript |
| UIライブラリ | shadcn/ui |
| 状態管理 | React useState/useEffect |

### コンポーネント

```
components/knowledge/knowledge-database.tsx
```

### 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `NEXT_PUBLIC_CHATBOT_API_URL` | バックエンドURL | `http://localhost:3001` |

### 状態管理

```typescript
// チャットメッセージ
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

// 入力テキスト
const [chatInput, setChatInput] = useState("");

// ローディング状態
const [isAiLoading, setIsAiLoading] = useState(false);

// 会話ID（Difyから返却、会話継続用）
const [conversationId, setConversationId] = useState<string>("");

// 長時間ローディング時のメッセージ表示
const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false);
```

### メッセージ型定義

```typescript
interface ChatMessage {
  id: string;                    // 一意のID
  role: "user" | "assistant";    // 送信者
  content: string;               // メッセージ内容
  timestamp: Date;               // 送信日時
  sources?: any[];               // 参照ソース（将来用）
}
```

---

## 機能一覧

### 1. チャット送受信

- ユーザーメッセージの送信
- AIからの応答表示
- 会話履歴の表示
- 各メッセージに日時表示

### 2. ローディング表示

| 状態 | 表示 |
|------|------|
| 5秒未満 | AIアバター内でスピナー回転 |
| 5秒以上 | スピナー + 「回答の精度を高めています...」（アニメーション） |

### 3. マークダウンリンク対応

AIの応答に含まれるマークダウンリンクをボタンとして表示。

**入力形式:**
```
[敬老事業](https://www.city.shizuoka.lg.jp/s2837/s002761.html)
```

**表示:**
```
[敬老事業 🔗] ← クリック可能なボタン
```

**セキュリティチェック:**
- URLパース可能性の検証
- `http://` または `https://` のみ許可
- ホスト名の存在確認
- 無効なURLはプレーンテキストとして表示

### 4. 会話継続

- `conversationId` を保持して会話コンテキストを維持
- チャットクリア時にリセット

### 5. エラーハンドリング

- ネットワークエラー時のメッセージ表示
- リクエストキャンセル対応（AbortController使用）

---

## セットアップ手順

### 1. バックエンドセットアップ

```bash
cd ChatbotBackend

# 依存関係インストール
npm install

# 環境変数設定
cp env.sample .env
# .env を編集してDify APIキーを設定

# サーバー起動
npm start
```

### 2. フロントエンド設定（任意）

バックエンドURLを変更する場合:

```bash
# プロジェクトルートに .env.local を作成
echo "NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:3001" > .env.local
```

### 3. 動作確認

1. バックエンドが起動していることを確認
   ```
   curl http://localhost:3001/api/health
   ```

2. フロントエンドでナレッジデータベースページを開く

3. 「AI検索」タブでチャットを試す

---

## トラブルシューティング

### バックエンドが起動しない

```bash
# ポートが使用中の場合
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows
```

### Dify APIエラー

| エラーメッセージ | 原因 | 対処 |
|-----------------|------|------|
| `invalid_param` | APIキーまたはエンドポイントが不正 | .env を確認 |
| `Agent Chat App does not support blocking mode` | Dify Agent Appを使用中 | 自動対応済み（ストリーミングモード使用） |
| `rate_limit_exceeded` | レート制限超過 | 少し待ってから再試行 |

### CORSエラー

`.env` の `CORS_ORIGIN` にフロントエンドのURLが含まれているか確認:

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 応答が返ってこない

1. バックエンドのコンソールログを確認
2. Dify側のAPIログを確認
3. ネットワーク接続を確認

---

## 今後の拡張案

- [ ] ストリーミング表示（文字単位でリアルタイム表示）
- [ ] 会話履歴の永続化
- [ ] ファイルアップロード対応
- [ ] 音声入力対応
- [ ] 複数エージェント切り替え
- [ ] レスポンスのマークダウン完全対応（太字、リストなど）

