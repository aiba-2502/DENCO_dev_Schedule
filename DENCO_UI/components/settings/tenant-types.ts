/**
 * テナント・部署管理関連の型定義
 */

/**
 * 部署情報
 */
export interface Department {
  id: string;
  name: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
  /** 割り当て電話番号（1件） */
  phoneNumber?: string;
  /** 割り当てFAX番号（1件） */
  faxNumber?: string;
}

/**
 * テナント情報
 * 
 * 【バックエンド開発者へ】
 * phoneNumbers, faxNumbers はバックエンドから取得する読み取り専用データです。
 * フロントエンドでは表示のみ行い、編集機能は提供しません。
 * 最大10件ずつ格納可能です。
 */
export interface TenantEntry {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  /** 電話番号（最大10件、表示専用） */
  phoneNumbers?: string[];
  /** FAX番号（最大10件、表示専用） */
  faxNumbers?: string[];
}

/**
 * テナントフォームデータ
 */
export interface TenantFormData {
  name: string;
  description: string;
  status: "active" | "inactive";
}

/**
 * 部署フォームデータ
 */
export interface DepartmentFormData {
  name: string;
  tenantId: string;
  status: "active" | "inactive";
  phoneNumber: string;
  faxNumber: string;
}

// サンプルテナントデータ
export const initialTenants: TenantEntry[] = [
  {
    id: "1",
    name: "株式会社ABC",
    description: "メインテナント",
    status: "active",
    createdAt: "2025-04-30T10:00:00",
    phoneNumbers: ["03-1234-5678", "03-1234-5679"],
    faxNumbers: ["03-1234-6780", "03-1234-6781"],
  },
  {
    id: "2",
    name: "株式会社XYZ",
    description: "サブテナント",
    status: "active",
    createdAt: "2025-04-30T10:05:00",
    phoneNumbers: ["06-9876-5432", "06-9876-5433"],
    faxNumbers: ["06-9876-6540", "06-9876-6541"],
  },
  {
    id: "3",
    name: "株式会社123",
    description: "テストテナント",
    status: "inactive",
    createdAt: "2025-04-30T10:10:00",
    phoneNumbers: ["052-111-2222", "052-111-2223"],
    faxNumbers: ["052-111-3330", "052-111-3331"],
  }
];

// サンプル部署データ
export const initialDepartments: Department[] = [
  {
    id: "dept-1",
    name: "営業部",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:00:00",
    phoneNumber: "03-1234-5678",
    faxNumber: "03-1234-6780",
  },
  {
    id: "dept-2",
    name: "カスタマーサポート",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:05:00",
    phoneNumber: "03-1234-5679",
    faxNumber: "03-1234-6781",
  },
  {
    id: "dept-3",
    name: "技術部",
    tenantId: "2",
    status: "active",
    createdAt: "2025-04-30T10:10:00",
    phoneNumber: "06-9876-5432",
    faxNumber: "06-9876-6540",
  },
  {
    id: "dept-4",
    name: "管理部",
    tenantId: "2",
    status: "inactive",
    createdAt: "2025-04-30T10:15:00",
    phoneNumber: "06-9876-5433",
    faxNumber: "06-9876-6541",
  }
];

/**
 * テナント名を取得するユーティリティ
 * @param tenantId - テナントID
 * @param tenants - テナントリスト
 * @returns テナント名
 */
export function getTenantName(tenantId: string, tenants: TenantEntry[]): string {
  return tenants.find(t => t.id === tenantId)?.name || "不明なテナント";
}
