"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Search, Edit, Trash, Building, Phone, Printer, Plus } from "lucide-react";
import type { TenantEntry, Department } from "./tenant-types";
import { getTenantName } from "./tenant-types";

/**
 * テナントリストのプロパティ
 */
interface TenantListProps {
  /** テナントリスト */
  tenants: TenantEntry[];
  /** 編集ボタンクリックハンドラー */
  onEditClick: (tenant: TenantEntry) => void;
}

/**
 * テナントリストコンポーネント
 */
export function TenantList({
  tenants,
  onEditClick,
}: TenantListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          テナント一覧
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テナント名</TableHead>
                <TableHead>説明</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>FAX番号</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenant.description || "-"}
                    </TableCell>
                    <TableCell>
                      {tenant.phoneNumbers && tenant.phoneNumbers.length > 0 ? (
                        <div className="space-y-1">
                          {tenant.phoneNumbers.map((phone, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs">{phone}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.faxNumbers && tenant.faxNumbers.length > 0 ? (
                        <div className="space-y-1">
                          {tenant.faxNumbers.map((fax, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-sm">
                              <Printer className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs">{fax}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                        {tenant.status === "active" ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEditClick(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Building className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        登録されたテナントがありません
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
  /** テナントフィルター */
  tenantFilter: string;
  /** テナントフィルター変更ハンドラー */
  onTenantFilterChange: (value: string) => void;
  /** 追加ボタンクリックハンドラー */
  onAddClick: () => void;
  /** 編集ボタンクリックハンドラー */
  onEditClick: (department: Department) => void;
  /** 削除ハンドラー */
  onDeleteClick: (id: string) => void;
}

/**
 * 部署リストコンポーネント
 */
export function DepartmentList({
  departments,
  tenants,
  tenantFilter,
  onTenantFilterChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: DepartmentListProps) {
  // フィルタリング
  const filteredDepartments = departments.filter(dept => {
    return tenantFilter === "all" || dept.tenantId === tenantFilter;
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
          {/* テナント選択 */}
          <div className="max-w-xs">
            <Select
              value={tenantFilter}
              onValueChange={onTenantFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="テナントを選択" />
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
          </div>

          {/* 部署テーブル */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部署名</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>FAX番号</TableHead>
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
                    <TableCell>
                      {department.phoneNumber ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">{department.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {department.faxNumber ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Printer className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">{department.faxNumber}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                  <TableCell colSpan={6} className="text-center py-6">
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
