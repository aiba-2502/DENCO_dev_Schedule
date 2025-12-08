/**
 * 共通型定義
 * DENCO_UIで使用される共通の型定義を集約
 */

// ============================================================================
// API レスポンス型
// ============================================================================

/**
 * API呼び出しの状態
 */
export type ApiCallState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// ドメインエンティティ型
// ============================================================================

/**
 * テナント
 */
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

/**
 * 通話セッション
 */
export interface CallSession {
  id: string;
  tenant_id: string;
  phone_number: string;
  customer_phone: string;
  direction: 'inbound' | 'outbound';
  status: 'active' | 'completed' | 'failed';
  started_at: string;
  ended_at: string | null;
  duration: number | null;
}

/**
 * メッセージ
 */
export interface Message {
  id: string;
  call_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * 顧客
 */
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * ナレッジ記事
 */
export interface KnowledgeArticle {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

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

/**
 * スタッフメンバー
 */
export interface StaffMember {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// フォーム型
// ============================================================================

/**
 * フォームバリデーションエラー
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * フォーム送信状態
 */
export interface FormSubmitState {
  submitting: boolean;
  success: boolean;
  errors: FormError[];
}

// ============================================================================
// UI状態型
// ============================================================================

/**
 * モーダル状態
 */
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  data?: unknown;
}

/**
 * テーブルソート
 */
export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * フィルタ
 */
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
  value: string | number | boolean;
}

// ============================================================================
// WebSocket型
// ============================================================================

/**
 * WebSocketメッセージ
 */
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

/**
 * 通話イベント
 */
export interface CallEvent {
  call_id: string;
  event_type: 'started' | 'ended' | 'message' | 'error';
  data: unknown;
}
