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
import type { FormData } from "./types";
import { postalCodeData } from "./types";

/**
 * 顧客フォームのプロパティ
 */
interface CustomerFormProps {
  /** フォームデータ */
  formData: FormData;
  /** フォームデータ変更ハンドラー */
  onChange: (formData: FormData) => void;
  /** 編集モードかどうか */
  isEditMode?: boolean;
}

/**
 * 顧客フォームコンポーネント
 *
 * 顧客の追加・編集用のフォームを提供します
 * 郵便番号による住所の自動補完機能を含みます
 */
export function CustomerForm({ formData, onChange, isEditMode = false }: CustomerFormProps) {
  // 郵便番号の自動補完
  const handlePostalCodeChange = (value: string) => {
    // ハイフンを除去して数字のみにする
    const numbersOnly = value.replace(/[^\d]/g, '');

    // 7桁まで制限
    if (numbersOnly.length > 7) return;

    // ハイフンを自動挿入（3桁-4桁の形式）
    let formattedValue = numbersOnly;
    if (numbersOnly.length > 3) {
      formattedValue = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    }

    onChange({ ...formData, postalCode: formattedValue });

    // 7桁入力完了時に住所を自動補完
    if (numbersOnly.length === 7) {
      const addressData = postalCodeData[numbersOnly];
      if (addressData) {
        onChange({
          ...formData,
          postalCode: formattedValue,
          prefecture: addressData.prefecture,
          address: addressData.address,
        });
      }
    }
  };

  // フォーム入力の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'postalCode') {
      handlePostalCodeChange(value);
    } else {
      onChange({ ...formData, [name]: value });
    }
  };

  // テナント選択の処理
  const handleTenantChange = (value: string) => {
    onChange({ ...formData, tenant: value });
  };

  const idPrefix = isEditMode ? 'edit-' : '';

  return (
    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
      {/* 姓名 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}lastName`}>姓</Label>
          <Input
            id={`${idPrefix}lastName`}
            name="lastName"
            placeholder="山田"
            value={formData.lastName}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}firstName`}>名</Label>
          <Input
            id={`${idPrefix}firstName`}
            name="firstName"
            placeholder="太郎"
            value={formData.firstName}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* フリガナ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}lastNameKana`}>セイ</Label>
          <Input
            id={`${idPrefix}lastNameKana`}
            name="lastNameKana"
            placeholder="ヤマダ"
            value={formData.lastNameKana}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}firstNameKana`}>メイ</Label>
          <Input
            id={`${idPrefix}firstNameKana`}
            name="firstNameKana"
            placeholder="タロウ"
            value={formData.firstNameKana}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* 電話番号・FAX番号 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}phoneNumber`}>電話番号</Label>
          <Input
            id={`${idPrefix}phoneNumber`}
            name="phoneNumber"
            placeholder="090-1234-5678"
            value={formData.phoneNumber}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}faxNumber`}>FAX番号</Label>
          <Input
            id={`${idPrefix}faxNumber`}
            name="faxNumber"
            placeholder="03-1234-5678"
            value={formData.faxNumber}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* メールアドレス */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}email`}>メールアドレス</Label>
        <Input
          id={`${idPrefix}email`}
          name="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleInputChange}
        />
      </div>

      {/* 郵便番号 */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}postalCode`}>郵便番号</Label>
        <Input
          id={`${idPrefix}postalCode`}
          name="postalCode"
          placeholder="123-4567"
          value={formData.postalCode}
          onChange={handleInputChange}
        />
        {!isEditMode && (
          <p className="text-xs text-muted-foreground">
            7桁入力すると住所が自動補完されます
          </p>
        )}
      </div>

      {/* 都道府県・住所 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}prefecture`}>都道府県</Label>
          <Input
            id={`${idPrefix}prefecture`}
            name="prefecture"
            placeholder="東京都"
            value={formData.prefecture}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}address`}>住所</Label>
          <Input
            id={`${idPrefix}address`}
            name="address"
            placeholder="千代田区千代田1-1-1"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {/* テナント */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}tenant`}>テナント</Label>
        <Select
          value={formData.tenant}
          onValueChange={handleTenantChange}
        >
          <SelectTrigger id={`${idPrefix}tenant`}>
            <SelectValue placeholder="テナントを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
            <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
            <SelectItem value="株式会社123">株式会社123</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
