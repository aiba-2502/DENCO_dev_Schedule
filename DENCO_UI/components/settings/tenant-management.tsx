"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TenantForm, DepartmentForm } from "./tenant-department-forms";
import { TenantList, DepartmentList } from "./tenant-department-lists";
import type { TenantEntry, Department, TenantFormData, DepartmentFormData } from "./tenant-types";
import { initialTenants, initialDepartments } from "./tenant-types";

/**
 * テナント管理のプロパティ
 */
interface TenantManagementProps {
  /** テナント更新時のコールバック */
  onTenantsUpdate?: (tenants: TenantEntry[]) => void;
  /** 部署更新時のコールバック */
  onDepartmentsUpdate?: (departments: Department[]) => void;
}

/**
 * テナント管理メインコンポーネント
 *
 * テナントと部署の作成、編集、削除を管理します
 */
export default function TenantManagement({ onTenantsUpdate, onDepartmentsUpdate }: TenantManagementProps) {
  // State
  const [tenants, setTenants] = useState<TenantEntry[]>(initialTenants);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);

  // Filter state for departments
  const [deptTenantFilter, setDeptTenantFilter] = useState<string>("all");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);

  // Form states
  const [editingTenant, setEditingTenant] = useState<TenantEntry | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    description: "",
    status: "active"
  });
  const [deptFormData, setDeptFormData] = useState<DepartmentFormData>({
    name: "",
    tenantId: "",
    status: "active",
    phoneNumber: "",
    faxNumber: "",
  });

  // Form reset functions
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active"
    });
    setEditingTenant(null);
  };

  const resetDeptForm = () => {
    setDeptFormData({
      name: "",
      tenantId: "",
      status: "active",
      phoneNumber: "",
      faxNumber: "",
    });
    setEditingDepartment(null);
  };

  // Tenant management handlers
  const handleAddTenant = () => {
    if (!formData.name.trim()) {
      toast.error("テナント名を入力してください");
      return;
    }

    if (tenants.some(t => t.name === formData.name.trim())) {
      toast.error("このテナント名は既に登録されています");
      return;
    }

    const newTenant: TenantEntry = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      createdAt: new Date().toISOString()
    };

    const updatedTenants = [...tenants, newTenant];
    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("テナントを追加しました");
  };

  const handleEditTenant = (tenant: TenantEntry) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      description: tenant.description || "",
      status: tenant.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = () => {
    if (!editingTenant) return;

    if (!formData.name.trim()) {
      toast.error("テナント名を入力してください");
      return;
    }

    if (tenants.some(t => t.id !== editingTenant.id && t.name === formData.name.trim())) {
      toast.error("このテナント名は既に登録されています");
      return;
    }

    const updatedTenants = tenants.map(tenant =>
      tenant.id === editingTenant.id
        ? {
            ...tenant,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            status: formData.status
          }
        : tenant
    );

    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    setIsEditDialogOpen(false);
    resetForm();
    toast.success("テナントを更新しました");
  };

  const handleDeleteTenant = (id: string) => {
    // Delete associated departments first
    const updatedDepartments = departments.filter(dept => dept.tenantId !== id);
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);

    const updatedTenants = tenants.filter(tenant => tenant.id !== id);
    setTenants(updatedTenants);
    onTenantsUpdate?.(updatedTenants);
    toast.success("テナントを削除しました");
  };

  // Department management handlers
  const handleAddDepartment = () => {
    if (!deptFormData.name.trim() || !deptFormData.tenantId) {
      toast.error("部署名とテナントを入力してください");
      return;
    }

    if (departments.some(d => d.name === deptFormData.name.trim() && d.tenantId === deptFormData.tenantId)) {
      toast.error("この部署名は既に登録されています");
      return;
    }

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name: deptFormData.name.trim(),
      tenantId: deptFormData.tenantId,
      status: deptFormData.status,
      createdAt: new Date().toISOString(),
      phoneNumber: deptFormData.phoneNumber.trim() || undefined,
      faxNumber: deptFormData.faxNumber.trim() || undefined,
    };

    const updatedDepartments = [...departments, newDepartment];
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    setIsAddDeptDialogOpen(false);
    resetDeptForm();
    toast.success("部署を追加しました");
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDeptFormData({
      name: department.name,
      tenantId: department.tenantId,
      status: department.status,
      phoneNumber: department.phoneNumber || "",
      faxNumber: department.faxNumber || "",
    });
    setIsEditDeptDialogOpen(true);
  };

  const handleUpdateDepartment = () => {
    if (!editingDepartment) return;

    if (!deptFormData.name.trim() || !deptFormData.tenantId) {
      toast.error("部署名とテナントを入力してください");
      return;
    }

    if (departments.some(d =>
      d.id !== editingDepartment.id &&
      d.name === deptFormData.name.trim() &&
      d.tenantId === deptFormData.tenantId
    )) {
      toast.error("この部署名は既に登録されています");
      return;
    }

    const updatedDepartments = departments.map(dept =>
      dept.id === editingDepartment.id
        ? {
            ...dept,
            name: deptFormData.name.trim(),
            tenantId: deptFormData.tenantId,
            status: deptFormData.status,
            phoneNumber: deptFormData.phoneNumber.trim() || undefined,
            faxNumber: deptFormData.faxNumber.trim() || undefined,
          }
        : dept
    );

    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    setIsEditDeptDialogOpen(false);
    resetDeptForm();
    toast.success("部署を更新しました");
  };

  const handleDeleteDepartment = (id: string) => {
    const updatedDepartments = departments.filter(dept => dept.id !== id);
    setDepartments(updatedDepartments);
    onDepartmentsUpdate?.(updatedDepartments);
    toast.success("部署を削除しました");
  };

  return (
    <div className="space-y-6">
      {/* テナント一覧 */}
      <TenantList
        tenants={tenants}
        onEditClick={handleEditTenant}
      />

      {/* 部署リスト */}
      <DepartmentList
        departments={departments}
        tenants={tenants}
        tenantFilter={deptTenantFilter}
        onTenantFilterChange={setDeptTenantFilter}
        onAddClick={() => setIsAddDeptDialogOpen(true)}
        onEditClick={handleEditDepartment}
        onDeleteClick={handleDeleteDepartment}
      />

      {/* テナント追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規テナント登録</DialogTitle>
            <DialogDescription>
              新しいテナントを登録します
            </DialogDescription>
          </DialogHeader>
          <TenantForm formData={formData} onChange={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddTenant}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* テナント編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テナントの編集</DialogTitle>
            <DialogDescription>
              テナント情報を編集します
            </DialogDescription>
          </DialogHeader>
          <TenantForm formData={formData} onChange={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateTenant}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 部署追加ダイアログ */}
      <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規部署登録</DialogTitle>
            <DialogDescription>
              新しい部署を登録します
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm 
            formData={deptFormData} 
            onChange={setDeptFormData} 
            tenants={tenants}
            departments={departments}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddDepartment}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 部署編集ダイアログ */}
      <Dialog open={isEditDeptDialogOpen} onOpenChange={setIsEditDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>部署の編集</DialogTitle>
            <DialogDescription>
              部署情報を編集します
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm 
            formData={deptFormData} 
            onChange={setDeptFormData} 
            tenants={tenants}
            departments={departments}
            editingDepartmentId={editingDepartment?.id}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDeptDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateDepartment}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
