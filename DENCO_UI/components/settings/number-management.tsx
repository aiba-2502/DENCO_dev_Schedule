"use client";

import TenantManagement from "./tenant-management";

/**
 * 番号管理タブのコンポーネント
 * テナント一覧と部署管理を表示
 */
export default function NumberManagement() {
  return (
    <div className="space-y-6">
      <TenantManagement />
    </div>
  );
}
