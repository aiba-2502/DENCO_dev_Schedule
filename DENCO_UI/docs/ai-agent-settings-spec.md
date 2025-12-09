# AIエージェント設定 - 設計仕様書

## 概要

AIエージェント設定は、通話応対用のAIエージェントを管理するための機能です。各エージェントには部署を紐づけることができ、部署ごとに異なるAIエージェントを使用して通話応対を行うことができます。

---

## 1. 現在の機能

### 1.1 エージェント管理（CRUD）

| 操作 | 説明 |
|------|------|
| **作成** | 新規AIエージェントを作成 |
| **参照** | エージェント一覧をカード形式で表示 |
| **更新** | エージェントの設定を編集 |
| **削除** | エージェントを削除（確認ダイアログあり） |
| **複製** | 既存エージェントをコピーして新規作成（部署紐づけはリセット） |

### 1.2 エージェント設定項目

| 項目 | 型 | 必須 | 説明 |
|------|------|------|------|
| `name` | string | ✓ | エージェント名（ラベル） |
| `description` | string | | エージェントの説明 |
| `departmentId` | string \| null | | 紐づけ部署ID |
| `useDefaultAgentApi` | boolean | ✓ | デフォルトAPIを使用するか |
| `agentApiKey` | string | | カスタムエージェントAPIキー |
| `agentEndpoint` | string | | カスタムエージェントエンドポイント |
| `useDefaultKnowledgeApi` | boolean | ✓ | デフォルトナレッジAPIを使用するか |
| `knowledgeApiKey` | string | | カスタムナレッジAPIキー |
| `knowledgeEndpoint` | string | | カスタムナレッジエンドポイント |
| `isActive` | boolean | ✓ | エージェントの有効/無効 |

### 1.3 部署紐づけ機能

- **1対1の関係**: 1つのエージェントには1つの部署のみ紐づけ可能
- **排他制御**: 既に他のエージェントに紐づけされている部署は選択不可
- **検索機能**: テナント選択 → 部署名検索で絞り込み可能

### 1.4 Dify API設定

各エージェントで以下の2種類のAPIを設定可能：

1. **エージェントAPI**: チャット応答生成用
   - APIキーは `app-` で始まる
   - エンドポイント: `/v1/chat-messages`

2. **ナレッジデータベースAPI**: 文書検索・RAG機能用
   - APIキーは `dataset-` で始まる
   - エンドポイント: `/v1/datasets`

「デフォルトを使用」をONにすると、「外部サーバ・API」タブで設定されたデフォルトAPIを使用します。

---

## 2. フロントエンド設計

### 2.1 ファイル構成

```
components/settings/
├── dify-settings.tsx          # AIエージェント設定メインコンポーネント
├── external-api-settings.tsx  # デフォルトDify API設定を含む
└── settings-management.tsx    # システム設定全体の管理
```

### 2.2 コンポーネント構造

```
DifySettings
├── ヘッダー（タイトル + 追加ボタン）
├── エージェント一覧（カードグリッド）
│   └── AgentCard
│       ├── ステータスインジケーター
│       ├── エージェント情報
│       ├── 紐づけ部署表示
│       ├── API設定バッジ
│       └── 有効/無効トグル
├── 追加ダイアログ
│   └── AgentForm
├── 編集ダイアログ
│   └── AgentForm
├── 削除確認ダイアログ
└── 部署選択モーダル
    ├── テナント選択
    ├── 部署検索
    └── 部署リスト
```

### 2.3 状態管理

```typescript
// エージェント一覧
const [agents, setAgents] = useState<AIAgent[]>([]);

// ダイアログ状態
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

// 選択中のエージェント
const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);

// フォームデータ
const [formData, setFormData] = useState<Omit<AIAgent, "id" | "createdAt">>(emptyAgent);

// 部署選択モーダル用
const [selectedTenantId, setSelectedTenantId] = useState<string>("");
const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
```

### 2.4 データ型定義

```typescript
interface AIAgent {
  id: string;
  name: string;
  description: string;
  departmentId: string | null;
  useDefaultAgentApi: boolean;
  agentApiKey: string;
  agentEndpoint: string;
  useDefaultKnowledgeApi: boolean;
  knowledgeApiKey: string;
  knowledgeEndpoint: string;
  isActive: boolean;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  tenantId: string;
  status: "active" | "inactive";
}

interface Tenant {
  id: string;
  name: string;
  status: "active" | "inactive";
}
```

### 2.5 UI/UXデザイン

- **カラースキーム**: バイオレット〜パープルのグラデーション
- **カードレイアウト**: 2カラムグリッド（レスポンシブ）
- **ステータス表示**: 左サイドのカラーライン（緑=有効、グレー=無効）
- **バッジ**: API設定状態を視覚的に表示
- **モーダル**: 部署選択は子モーダルで検索可能

---

## 3. 想定されるバックエンド

### 3.1 APIエンドポイント

#### エージェント管理

| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| `GET` | `/api/agents` | エージェント一覧取得 |
| `GET` | `/api/agents/:id` | エージェント詳細取得 |
| `POST` | `/api/agents` | エージェント作成 |
| `PUT` | `/api/agents/:id` | エージェント更新 |
| `DELETE` | `/api/agents/:id` | エージェント削除 |

#### マスタデータ取得

| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| `GET` | `/api/tenants` | テナント一覧取得 |
| `GET` | `/api/departments` | 部署一覧取得 |
| `GET` | `/api/departments?tenantId=xxx` | テナント別部署取得 |

### 3.2 リクエスト/レスポンス例

#### エージェント一覧取得
```http
GET /api/agents
```

**レスポンス:**
```json
{
  "data": [
    {
      "id": "agent-1",
      "name": "カスタマーサポート",
      "description": "お客様からのお問い合わせに対応",
      "departmentId": "dept-2",
      "useDefaultAgentApi": true,
      "agentApiKey": "",
      "agentEndpoint": "",
      "useDefaultKnowledgeApi": true,
      "knowledgeApiKey": "",
      "knowledgeEndpoint": "",
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### エージェント作成
```http
POST /api/agents
Content-Type: application/json

{
  "name": "新規エージェント",
  "description": "説明文",
  "departmentId": "dept-1",
  "useDefaultAgentApi": true,
  "agentApiKey": "",
  "agentEndpoint": "https://api.dify.ai/v1",
  "useDefaultKnowledgeApi": true,
  "knowledgeApiKey": "",
  "knowledgeEndpoint": "https://api.dify.ai/v1",
  "isActive": true
}
```

**レスポンス:**
```json
{
  "id": "agent-123",
  "name": "新規エージェント",
  "description": "説明文",
  "departmentId": "dept-1",
  "useDefaultAgentApi": true,
  "agentApiKey": "",
  "agentEndpoint": "https://api.dify.ai/v1",
  "useDefaultKnowledgeApi": true,
  "knowledgeApiKey": "",
  "knowledgeEndpoint": "https://api.dify.ai/v1",
  "isActive": true,
  "createdAt": "2025-12-08T12:00:00Z"
}
```

#### エージェント更新
```http
PUT /api/agents/agent-123
Content-Type: application/json

{
  "name": "更新後の名前",
  "description": "更新後の説明",
  "departmentId": "dept-2",
  "useDefaultAgentApi": false,
  "agentApiKey": "app-xxxxx",
  "agentEndpoint": "https://custom.dify.ai/v1",
  "useDefaultKnowledgeApi": false,
  "knowledgeApiKey": "dataset-xxxxx",
  "knowledgeEndpoint": "https://custom.dify.ai/v1",
  "isActive": true
}
```

#### エージェント削除
```http
DELETE /api/agents/agent-123
```

**レスポンス:**
```json
{
  "success": true,
  "message": "エージェントを削除しました"
}
```

### 3.3 データベーススキーマ（参考）

```sql
-- AIエージェントテーブル
CREATE TABLE ai_agents (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_id VARCHAR(50) UNIQUE,  -- 1対1の関係を保証
  use_default_agent_api BOOLEAN DEFAULT TRUE,
  agent_api_key VARCHAR(255),
  agent_endpoint VARCHAR(255) DEFAULT 'https://api.dify.ai/v1',
  use_default_knowledge_api BOOLEAN DEFAULT TRUE,
  knowledge_api_key VARCHAR(255),
  knowledge_endpoint VARCHAR(255) DEFAULT 'https://api.dify.ai/v1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_ai_agents_department ON ai_agents(department_id);
CREATE INDEX idx_ai_agents_active ON ai_agents(is_active);
```

### 3.4 バリデーションルール

| フィールド | ルール |
|------------|--------|
| `name` | 必須、1〜255文字 |
| `description` | 任意、最大1000文字 |
| `departmentId` | 任意、存在する部署ID、他エージェントで未使用 |
| `agentApiKey` | `useDefaultAgentApi=false`の場合必須、`app-`で始まる |
| `agentEndpoint` | `useDefaultAgentApi=false`の場合必須、有効なURL |
| `knowledgeApiKey` | `useDefaultKnowledgeApi=false`の場合必須、`dataset-`で始まる |
| `knowledgeEndpoint` | `useDefaultKnowledgeApi=false`の場合必須、有効なURL |

### 3.5 ビジネスロジック

1. **部署紐づけの排他制御**
   - エージェント作成/更新時、指定された`departmentId`が他のエージェントで使用中でないか確認
   - 使用中の場合はエラーを返す

2. **デフォルトAPI設定の適用**
   - `useDefaultAgentApi=true`の場合、システム設定のデフォルトAPIキー/エンドポイントを使用
   - 実際のDify API呼び出し時に解決

3. **エージェント削除時の処理**
   - 関連する通話履歴は保持（エージェント名を文字列として保存推奨）
   - 部署の紐づけは自動解除

---

## 4. 関連機能との連携

### 4.1 部署・番号設定との関係

- 部署管理で作成された部署をエージェントに紐づけ
- 部署削除時、紐づけられたエージェントの`departmentId`は`null`に

### 4.2 外部サーバ・APIとの関係

- 「Dify デフォルトAPI設定」で設定されたAPIキー/エンドポイントが、
  「デフォルトを使用」がONのエージェントで使用される

### 4.3 通話処理との関係（想定）

```
着信 → 部署特定 → 紐づけエージェント検索 → Dify API呼び出し → 応答生成
```

---

## 5. 今後の拡張案

1. **エージェントのテスト機能**: 設定したAPIキーで接続テストを実行
2. **プロンプト設定**: エージェントごとのシステムプロンプト設定
3. **応答ログ**: エージェントごとの通話応答履歴
4. **パフォーマンス分析**: エージェントごとの応答時間・満足度分析
5. **複数部署紐づけ**: 1エージェント複数部署への拡張（要件次第）

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|------------|------|
| 2025-12-08 | 1.0 | 初版作成 |

