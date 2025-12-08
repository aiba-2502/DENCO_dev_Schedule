"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash, Plus, Building } from "lucide-react";
import type { TenantEntry, Department } from "./tenant-types";
import { getTenantName } from "./tenant-types";

/**
 * テナントリストのプロパティ
 */
interface TenantListProps {
  /** テナントリスト */
  tenants: TenantEntry[];
  /** 検索条件 */
  searchTerm: string;
  /** 検索条件変更ハンドラー */
  onSearchChange: (value: string) => void;
  /** ステータスフィルター */
  statusFilter: string;
  /** ステータスフィルター変更ハンドラー */
  onStatusFilterChange: (value: string) => void;
  /** 編集ボタンクリックハンドラー */
  onEditClick: (tenant: TenantEntry) => void;
  /** 削除ハンドラー */
  onDeleteClick: (id: string) => void;
  /** 追加ボタンクリックハンドラー */
  onAddClick: () => void;
}

/**
 * テナントリストコンポーネント
 */
export function TenantList({
  tenants,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditClick,
  onDeleteClick,
  onAddClick,
}: TenantListProps) {
  // フィルタリング
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch =
      searchTerm === "" ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.description && tenant.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          テナント管理
        </CardTitle>
        <Button className="gap-1" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          テナント追加
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* フィルター */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="テナント名、説明で検索..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("all")}
              >
                すべて
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("active")}
              >
                有効
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("inactive")}
              >
                無効
              </Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredTenants.length}件 / 全{tenants.length}件
            </div>
          </div>

          {/* テーブル */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テナント名</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                        {tenant.status === "active" ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditClick(tenant)}
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
                              <AlertDialogTitle>テナントの削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{tenant.name}」を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteClick(tenant.id)}
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
                  <TableCell colSpan={4} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== "all"
                          ? "検索条件に一致するテナントがありません"
                          : "登録されたテナントがありません"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 部署リストのプロパティ
 */
interface DepartmentListProps {
  /** 部署リスト */
  departments: Department[];
  /** テナントリスト */
  tenants: TenantEntry[];
  /** 検索条件 */
  searchTerm: string;
  /** 検索条件変更ハンドラー */
  onSearchChange: (value: string) => void;
  /** テナントフィルター */
  tenantFilter: string;
  /** テナントフィルター変更ハンドラー */
  onTenantFilterChange: (value: string) => void;
  /** ステータスフィルター */
  statusFilter: string;
  /** ステータスフィルター変更ハンドラー */
  onStatusFilterChange: (value: string) => void;
  /** 編集ボタンクリックハンドラー */
  onEditClick: (department: Department) => void;
  /** 削除ハンドラー */
  onDeleteClick: (id: string) => void;
  /** 追加ボタンクリックハンドラー */
  onAddClick: () => void;
}

/**
 * 部署リストコンポーネント
 */
export function DepartmentList({
  departments,
  tenants,
  searchTerm,
  onSearchChange,
  tenantFilter,
  onTenantFilterChange,
  statusFilter,
  onStatusFilterChange,
  onEditClick,
  onDeleteClick,
  onAddClick,
}: DepartmentListProps) {
  // フィルタリング
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch =
      searchTerm === "" ||
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTenant = tenantFilter === "all" || dept.tenantId === tenantFilter;
    const matchesStatus = statusFilter === "all" || dept.status === statusFilter;

    return matchesSearch && matchesTenant && matchesStatus;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          部署管理
        </CardTitle>
        <Button className="gap-1" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          部署追加
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 部署フィルター */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="部署名、説明で検索..."
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
                {tenants.filter(t => t.status === "active").map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("all")}
              >
                すべて
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("active")}
              >
                有効
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilterChange("inactive")}
              >
                無効
              </Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredDepartments.length}件 / 全{departments.length}件
            </div>
          </div>

          {/* 部署テーブル */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部署名</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{getTenantName(department.tenantId, tenants)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {department.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={department.status === "active" ? "default" : "secondary"}>
                        {department.status === "active" ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditClick(department)}
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
                              <AlertDialogTitle>部署の削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{department.name}」を削除してもよろしいですか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteClick(department.id)}
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
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {searchTerm || tenantFilter !== "all" || statusFilter !== "all"
                          ? "検索条件に一致する部署がありません"
                          : "登録された部署がありません"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
