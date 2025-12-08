/**
 * テナント・部署管理関連の型定義
 */

/**
 * 部署情報
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: "active" | "inactive";
  createdAt: string;
}

/**
 * テナント情報
 */
export interface TenantEntry {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
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
  description: string;
  tenantId: string;
  status: "active" | "inactive";
}

// サンプルテナントデータ
export const initialTenants: TenantEntry[] = [
  {
    id: "1",
    name: "株式会社ABC",
    description: "メインテナント",
    status: "active",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "2",
    name: "株式会社XYZ",
    description: "サブテナント",
    status: "active",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "3",
    name: "株式会社123",
    description: "テストテナント",
    status: "inactive",
    createdAt: "2025-04-30T10:10:00"
  }
];

// サンプル部署データ
export const initialDepartments: Department[] = [
  {
    id: "dept-1",
    name: "営業部",
    description: "営業活動全般",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:00:00"
  },
  {
    id: "dept-2",
    name: "カスタマーサポート",
    description: "顧客サポート業務",
    tenantId: "1",
    status: "active",
    createdAt: "2025-04-30T10:05:00"
  },
  {
    id: "dept-3",
    name: "技術部",
    description: "システム開発・保守",
    tenantId: "2",
    status: "active",
    createdAt: "2025-04-30T10:10:00"
  },
  {
    id: "dept-4",
    name: "管理部",
    description: "総務・経理業務",
    tenantId: "2",
    status: "inactive",
    createdAt: "2025-04-30T10:15:00"
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
