"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Edit, Trash, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Customer, Tag } from "./types";
import { isLightColor } from "./types";

/**
 * 顧客リストのプロパティ
 */
interface CustomerListProps {
  /** 顧客リスト */
  customers: Customer[];
  /** 検索条件 */
  searchTerm: string;
  /** 検索条件変更ハンドラー */
  onSearchChange: (value: string) => void;
  /** テナントフィルター */
  tenantFilter: string;
  /** テナントフィルター変更ハンドラー */
  onTenantFilterChange: (value: string) => void;
  /** 選択中のタグ */
  selectedTags: string[];
  /** タグ選択切り替えハンドラー */
  onTagToggle: (tagId: string) => void;
  /** タグフィルタークリアハンドラー */
  onClearTagFilters: () => void;
  /** 利用可能なタグリスト */
  availableTags: Tag[];
  /** 編集ボタンクリックハンドラー */
  onEditClick: (customer: Customer) => void;
  /** 削除ハンドラー */
  onDeleteCustomer: (customerId: string) => void;
  /** 通話発信ハンドラー */
  onCallClick: (phoneNumber: string, customerName: string) => void;
}

/**
 * 顧客リストコンポーネント
 *
 * 顧客の検索、フィルタリング、一覧表示を行います
 */
export function CustomerList({
  customers,
  searchTerm,
  onSearchChange,
  tenantFilter,
  onTenantFilterChange,
  selectedTags,
  onTagToggle,
  onClearTagFilters,
  availableTags,
  onEditClick,
  onDeleteCustomer,
  onCallClick,
}: CustomerListProps) {
  // 顧客のフィルタリング
  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.lastName} ${customer.firstName}`;
    const fullNameKana = `${customer.lastNameKana} ${customer.firstNameKana}`;

    const matchesSearch =
      searchTerm === "" ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullNameKana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(searchTerm) ||
      customer.faxNumber.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTenant = tenantFilter === "all" || customer.tenant === tenantFilter;

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tagId => customer.tags.some(tag => tag.id === tagId));

    return matchesSearch && matchesTenant && matchesTags;
  });

  return (
    <>
      {/* 検索カード */}
      <Card>
        <CardHeader>
          <CardTitle>顧客検索</CardTitle>
          <CardDescription>
            名前、フリガナ、電話番号、FAX番号、メールアドレス、住所で検索
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前、フリガナ、電話番号、メール、住所で検索"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={tenantFilter}
              onValueChange={onTenantFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="テナントでフィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのテナント</SelectItem>
                <SelectItem value="株式会社ABC">株式会社ABC</SelectItem>
                <SelectItem value="株式会社XYZ">株式会社XYZ</SelectItem>
                <SelectItem value="株式会社123">株式会社123</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タグフィルター */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">タグでフィルター</Label>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearTagFilters}
                  className="text-xs"
                >
                  クリア ({selectedTags.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-transparent'
                        : 'hover:bg-accent'
                    }`}
                    style={selectedTags.includes(tag.id) ? {
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                      borderColor: 'transparent'
                    } : {}}
                    onClick={() => onTagToggle(tag.id)}
                  >
                    {selectedTags.includes(tag.id) && "✓ "}
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">タグが登録されていません</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 顧客一覧カード */}
      <Card>
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
          <CardDescription>
            {filteredCustomers.length}件 / 全{customers.length}件
            {selectedTags.length > 0 && ` (タグフィルター: ${selectedTags.length}個)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">プロフィール</TableHead>
                <TableHead>顧客名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>登録日時</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {customer.lastName.charAt(0)}{customer.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{customer.lastName} {customer.firstName}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.lastNameKana} {customer.firstNameKana}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs py-0 h-5"
                            style={{
                              backgroundColor: tag.color,
                              color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                              borderColor: 'transparent'
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{customer.tenant}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onCallClick(customer.phoneNumber, `${customer.lastName} ${customer.firstName}`)}
                          title="通話発信"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditClick(customer)}
                          title="編集"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>顧客の削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                {customer.lastName} {customer.firstName}を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteCustomer(customer.id)}
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">検索条件に一致する顧客がいません</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
