"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Tag, Phone } from "lucide-react";
import { toast } from 'sonner';
import { useSearchParams } from "next/navigation";
import TagManagement from "./tag-management";
import { CustomerForm } from "./customer-form";
import { CustomerList } from "./customer-list";
import type { Customer, FormData, Tag as TagType, CallTarget } from "./types";
import { initialCustomers, initialTags } from "./types";

/**
 * 顧客管理メインコンポーネント
 *
 * 顧客の検索、追加、編集、削除を管理します
 */
export default function CustomerManagement() {
  const searchParams = useSearchParams();

  // State
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagType[]>(initialTags);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Form state
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    phoneNumber: "",
    faxNumber: "",
    email: "",
    postalCode: "",
    prefecture: "",
    address: "",
    tenant: "",
  });

  // Call state
  const [selectedCallTarget, setSelectedCallTarget] = useState<CallTarget | null>(null);

  // URLパラメータから初期値を設定
  useEffect(() => {
    const isRegisterMode = searchParams.get('register') === 'true';
    if (isRegisterMode) {
      const phoneNumber = searchParams.get('phoneNumber') || '';
      const tenant = searchParams.get('tenant') || '';
      const suggestedName = searchParams.get('suggestedName') || '';

      // 名前を姓名に分割（簡易的な処理）
      const nameParts = suggestedName.split(' ');
      const lastName = nameParts[0] || '';
      const firstName = nameParts[1] || '';

      setFormData(prev => ({
        ...prev,
        phoneNumber: phoneNumber,
        tenant: tenant,
        lastName: lastName,
        firstName: firstName,
      }));

      // 自動的に追加ダイアログを開く
      setIsAddDialogOpen(true);
    }
  }, [searchParams]);

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      phoneNumber: "",
      faxNumber: "",
      email: "",
      postalCode: "",
      prefecture: "",
      address: "",
      tenant: "",
    });
    setCurrentCustomer(null);
  };

  // 顧客追加の処理
  const handleAddCustomer = () => {
    const newCustomer: Customer = {
      id: `user-${customers.length + 1}`,
      ...formData,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    setCustomers([...customers, newCustomer]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  // 顧客編集ボタンの処理
  const handleEditClick = (customer: Customer) => {
    setCurrentCustomer(customer);
    setFormData({
      lastName: customer.lastName,
      firstName: customer.firstName,
      lastNameKana: customer.lastNameKana,
      firstNameKana: customer.firstNameKana,
      phoneNumber: customer.phoneNumber,
      faxNumber: customer.faxNumber,
      email: customer.email,
      postalCode: customer.postalCode,
      prefecture: customer.prefecture,
      address: customer.address,
      tenant: customer.tenant,
    });
    setIsEditDialogOpen(true);
  };

  // 顧客更新の処理
  const handleUpdateCustomer = () => {
    if (!currentCustomer) return;

    const updatedCustomers = customers.map((customer) =>
      customer.id === currentCustomer.id
        ? { ...customer, ...formData }
        : customer
    );

    setCustomers(updatedCustomers);
    setIsEditDialogOpen(false);
    resetForm();
  };

  // 顧客削除の処理
  const handleDeleteCustomer = (customerId: string) => {
    const updatedCustomers = customers.filter((customer) => customer.id !== customerId);
    setCustomers(updatedCustomers);
  };

  // タグ選択の処理
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // タグフィルターのクリア
  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  // 通話発信クリック
  const handleCallClick = (phoneNumber: string, customerName: string) => {
    setSelectedCallTarget({ phoneNumber, customerName });
    setIsCallModalOpen(true);
  };

  // 通話発信確定
  const handleConfirmCall = () => {
    if (!selectedCallTarget) return;

    setIsCallModalOpen(false);

    // 発信開始のトースト
    toast.loading("通話を発信中...", {
      id: "call-initiation",
      duration: Infinity,
    });

    // Simulate call initiation process
    setTimeout(() => {
      // 発信成功のトースト
      toast.success("通話を開始しました", {
        id: "call-initiation",
        description: `${selectedCallTarget.customerName} (${selectedCallTarget.phoneNumber})`,
        duration: 3000,
      });

      // 通話中の継続トースト
      setTimeout(() => {
        toast.info("📞 通話中", {
          id: "call-active",
          description: `${selectedCallTarget.customerName} (${selectedCallTarget.phoneNumber})`,
          duration: Infinity,
          action: {
            label: "終了",
            onClick: () => {
              toast.dismiss("call-active");
              toast.success("通話を終了しました", {
                description: `${selectedCallTarget.customerName} との通話を終了`,
                duration: 2000,
              });
            },
          },
        });
      }, 3500);
    }, 2000);

    setSelectedCallTarget(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">顧客管理</h1>
        <div className="flex gap-2">
          {/* タグ管理ダイアログ */}
          <Dialog open={isTagManagementOpen} onOpenChange={setIsTagManagementOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Tag className="h-4 w-4" />
                タグ管理
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>タグ管理</DialogTitle>
                <DialogDescription>
                  顧客に付与するタグの作成・編集・削除を行います
                </DialogDescription>
              </DialogHeader>
              <TagManagement onTagsUpdate={setAvailableTags} />
            </DialogContent>
          </Dialog>

          {/* 顧客追加ダイアログ */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <UserPlus className="h-4 w-4" />
                顧客追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新規顧客追加</DialogTitle>
                <DialogDescription>
                  新しい顧客情報を登録します
                </DialogDescription>
              </DialogHeader>
              <CustomerForm formData={formData} onChange={setFormData} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleAddCustomer}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 顧客リスト */}
      <CustomerList
        customers={customers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        tenantFilter={tenantFilter}
        onTenantFilterChange={setTenantFilter}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        onClearTagFilters={clearTagFilters}
        availableTags={availableTags}
        onEditClick={handleEditClick}
        onDeleteCustomer={handleDeleteCustomer}
        onCallClick={handleCallClick}
      />

      {/* 顧客編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>顧客編集</DialogTitle>
            <DialogDescription>
              顧客情報を更新します
            </DialogDescription>
          </DialogHeader>
          <CustomerForm formData={formData} onChange={setFormData} isEditMode />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateCustomer}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通話発信確認モーダル */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>通話発信</DialogTitle>
            <DialogDescription>
              以下の顧客に通話を発信しますか？
            </DialogDescription>
          </DialogHeader>

          {selectedCallTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">顧客名:</span>
                    <span className="font-medium">{selectedCallTarget.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">電話番号:</span>
                    <span className="font-medium">{selectedCallTarget.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleConfirmCall}>
              <Phone className="h-4 w-4 mr-1" />
              発信する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
