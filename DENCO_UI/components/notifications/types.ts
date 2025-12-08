/**
 * 通知設定関連の型定義
 */

/**
 * スタッフ情報
 */
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  chatworkId?: string;
  lineId?: string;
  phoneNumber?: string;
}

/**
 * 通知先情報
 */
export interface NotificationDestination {
  /** 送信先タイプ */
  type: "staff" | "manual";
  /** 送信先の値（メールアドレス、電話番号など） */
  value: string;
  /** スタッフIDtype === "staff" の場合のみ） */
  staffId?: string;
}

/**
 * 通知テンプレート
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
}

/**
 * キーワード条件
 */
export interface KeywordCondition {
  /** キーワードモード */
  mode: "list" | "logical";
  /** キーワードリスト */
  keywords: Array<{
    id: string;
    word: string;
    operator: "none" | "and" | "or";
  }>;
}

/**
 * 通知ルール
 */
export interface NotificationRule {
  id: string;
  name: string;
  conditions: {
    /** イベントタイプ */
    type: ("call" | "fax")[];
    /** 対象の設定 */
    target: {
      type: "phone" | "customer";
      value: string[];
    };
    /** キーワード条件（オプション） */
    keywords?: KeywordCondition;
  };
  actions: {
    /** 通知タイプ */
    type: "email" | "chatwork" | "line" | "phone";
    /** 通知設定 */
    config: {
      destination: NotificationDestination;
      template?: string;
      templateId?: string;
      useSummary?: boolean;
      customMessage?: string;
    };
  }[];
  enabled: boolean;
}

/**
 * 顧客情報（簡易版）
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
}
