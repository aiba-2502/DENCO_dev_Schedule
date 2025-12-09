"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TenantFormData, DepartmentFormData, TenantEntry, Department } from "./tenant-types";

/**
 * テナントフォームのプロパティ
 */
interface TenantFormProps {
  /** フォームデータ */
  formData: TenantFormData;
  /** フォームデータ変更ハンドラー */
  onChange: (formData: TenantFormData) => void;
}

/**
 * テナントフォームコンポーネント
 */
export function TenantForm({ formData, onChange }: TenantFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">テナント名 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="株式会社ABC"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="テナントの説明（任意）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">状態</Label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="active"
              checked={formData.status === "active"}
              onChange={() => onChange({ ...formData, status: "active" })}
              className="form-radio"
            />
            <span>有効</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value="inactive"
              checked={formData.status === "inactive"}
              onChange={() => onChange({ ...formData, status: "inactive" })}
              className="form-radio"
            />
            <span>無効</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * 部署フォームのプロパティ
 */
interface DepartmentFormProps {
  /** フォームデータ */
  formData: DepartmentFormData;
  /** フォームデータ変更ハンドラー */
  onChange: (formData: DepartmentFormData) => void;
  /** 利用可能なテナントリスト */
  tenants: TenantEntry[];
  /** 既存の部署リスト（番号の割り当て状況確認用） */
  departments: Department[];
  /** 編集中の部署ID（編集時は自分の番号も選択可能にするため） */
  editingDepartmentId?: string;
}

/**
 * 部署フォームコンポーネント
 * 
 * 【バックエンド開発者へ】
 * テナント選択時に、そのテナントの電話番号・FAX番号リストを取得し、
 * 他の部署に割り当てられていない番号のみ選択可能として表示します。
 * API: GET /api/tenants/{tenantId}/available-numbers
 * Response: { phoneNumbers: string[], faxNumbers: string[] }
 */
export function DepartmentForm({ 
  formData, 
  onChange, 
  tenants, 
  departments,
  editingDepartmentId 
}: DepartmentFormProps) {
  // 選択されたテナントを取得
  const selectedTenant = useMemo(() => {
    return tenants.find(t => t.id === formData.tenantId);
  }, [tenants, formData.tenantId]);

  // 利用可能な電話番号（未割り当て or 編集中の部署に割り当て済み）
  const availablePhoneNumbers = useMemo(() => {
    if (!selectedTenant?.phoneNumbers) return [];
    
    // 同じテナントの他の部署で使われている電話番号を取得
    const usedPhoneNumbers = departments
      .filter(d => d.tenantId === formData.tenantId && d.id !== editingDepartmentId)
      .map(d => d.phoneNumber)
      .filter(Boolean);
    
    // 未使用の番号のみ返す
    return selectedTenant.phoneNumbers.filter(num => !usedPhoneNumbers.includes(num));
  }, [selectedTenant, departments, formData.tenantId, editingDepartmentId]);

  // 利用可能なFAX番号（未割り当て or 編集中の部署に割り当て済み）
  const availableFaxNumbers = useMemo(() => {
    if (!selectedTenant?.faxNumbers) return [];
    
    // 同じテナントの他の部署で使われているFAX番号を取得
    const usedFaxNumbers = departments
      .filter(d => d.tenantId === formData.tenantId && d.id !== editingDepartmentId)
      .map(d => d.faxNumber)
      .filter(Boolean);
    
    // 未使用の番号のみ返す
    return selectedTenant.faxNumbers.filter(num => !usedFaxNumbers.includes(num));
  }, [selectedTenant, departments, formData.tenantId, editingDepartmentId]);

  // テナント変更時に番号をリセット
  const handleTenantChange = (tenantId: string) => {
    onChange({ 
      ...formData, 
      tenantId, 
      phoneNumber: "", 
      faxNumber: "" 
    });
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name">部署名 *</Label>
        <Input
          id="dept-name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="営業部"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dept-tenant">テナント *</Label>
        <Select
          value={formData.tenantId}
          onValueChange={handleTenantChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="テナントを選択" />
          </SelectTrigger>
          <SelectContent>
            {tenants.filter(t => t.status === "active").map(tenant => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* テナント選択後に番号選択を表示 */}
      {formData.tenantId && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dept-phone">電話番号</Label>
            <Select
              value={formData.phoneNumber}
              onValueChange={(value) => onChange({ ...formData, phoneNumber: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="電話番号を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">未割り当て</SelectItem>
                {availablePhoneNumbers.map(num => (
                  <SelectItem key={num} value={num}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availablePhoneNumbers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                利用可能な電話番号がありません
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-fax">FAX番号</Label>
            <Select
              value={formData.faxNumber}
              onValueChange={(value) => onChange({ ...formData, faxNumber: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="FAX番号を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">未割り当て</SelectItem>
                {availableFaxNumbers.map(num => (
                  <SelectItem key={num} value={num}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableFaxNumbers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                利用可能なFAX番号がありません
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dept-status">状態</Label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dept-status"
              value="active"
              checked={formData.status === "active"}
              onChange={() => onChange({ ...formData, status: "active" })}
              className="form-radio"
            />
            <span>有効</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="dept-status"
              value="inactive"
              checked={formData.status === "inactive"}
              onChange={() => onChange({ ...formData, status: "inactive" })}
              className="form-radio"
            />
            <span>無効</span>
          </label>
        </div>
      </div>
    </div>
  );
}
