"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TenantFormData, DepartmentFormData, TenantEntry } from "./tenant-types";

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
}

/**
 * 部署フォームコンポーネント
 */
export function DepartmentForm({ formData, onChange, tenants }: DepartmentFormProps) {
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
          onValueChange={(value) => onChange({ ...formData, tenantId: value })}
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

      <div className="space-y-2">
        <Label htmlFor="dept-description">説明</Label>
        <Input
          id="dept-description"
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="部署の説明（任意）"
        />
      </div>

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
