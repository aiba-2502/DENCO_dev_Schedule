/**
 * 顧客管理関連の型定義
 */

/**
 * 顧客情報
 */
export interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
  tags: Array<{ id: string; name: string; color: string }>;
  createdAt: string;
}

/**
 * フォームデータ
 */
export interface FormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tenant: string;
}

/**
 * タグ情報
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * 通話発信ターゲット
 */
export interface CallTarget {
  phoneNumber: string;
  customerName: string;
}

// 初期タグデータ
export const initialTags: Tag[] = [
  {
    id: "tag-1",
    name: "VIP",
    color: "#FF0000",
  },
  {
    id: "tag-2",
    name: "新規",
    color: "#00FF00",
  },
  {
    id: "tag-3",
    name: "要フォロー",
    color: "#0000FF",
  },
];

// 郵便番号から住所を取得するサンプルデータ
export const postalCodeData: Record<string, { prefecture: string; address: string }> = {
  "1000001": { prefecture: "東京都", address: "千代田区千代田" },
  "1500001": { prefecture: "東京都", address: "渋谷区神宮前" },
  "5300001": { prefecture: "大阪府", address: "大阪市北区梅田" },
  "5410041": { prefecture: "大阪府", address: "大阪市中央区北浜" },
  "2310023": { prefecture: "神奈川県", address: "横浜市中区山下町" },
};

// サンプル顧客データ
export const initialCustomers: Customer[] = [
  {
    id: "user-1",
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    phoneNumber: "090-1234-5678",
    faxNumber: "03-1234-5678",
    email: "yamada.t@example.com",
    postalCode: "100-0001",
    prefecture: "東京都",
    address: "千代田区千代田1-1-1",
    tenant: "株式会社ABC",
    tags: [
      { id: "tag-1", name: "VIP", color: "#FF0000" },
      { id: "tag-2", name: "新規", color: "#00FF00" },
    ],
    createdAt: "2024-12-15T14:30:00",
  },
  {
    id: "user-2",
    lastName: "佐藤",
    firstName: "花子",
    lastNameKana: "サトウ",
    firstNameKana: "ハナコ",
    phoneNumber: "090-8765-4321",
    faxNumber: "03-8765-4321",
    email: "sato.h@example.com",
    postalCode: "150-0001",
    prefecture: "東京都",
    address: "渋谷区神宮前2-2-2",
    tenant: "株式会社ABC",
    tags: [],
    createdAt: "2025-01-05T10:15:00",
  },
  {
    id: "user-3",
    lastName: "鈴木",
    firstName: "一郎",
    lastNameKana: "スズキ",
    firstNameKana: "イチロウ",
    phoneNumber: "090-2345-6789",
    faxNumber: "03-2345-6789",
    email: "suzuki.i@globex.com",
    postalCode: "530-0001",
    prefecture: "大阪府",
    address: "大阪市北区梅田3-3-3",
    tenant: "株式会社XYZ",
    tags: [
      { id: "tag-3", name: "要フォロー", color: "#0000FF" },
    ],
    createdAt: "2025-01-12T09:30:00",
  },
];

/**
 * 色の明度を判定するユーティリティ
 * @param color - カラーコード (#RRGGBB形式)
 * @returns 明るい色の場合true
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}
