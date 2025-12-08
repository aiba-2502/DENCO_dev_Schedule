"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash, Phone, Mail, MessageSquare, MessagesSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { NotificationRule, NotificationTemplate, Customer, Staff } from "./types";
import { NotificationRuleForm } from "./notification-rule-form";
import { NotificationTemplateManager } from "./notification-template-manager";
import { NotificationStaffSelector } from "./notification-staff-selector";

// サンプルデータ
const sampleCustomers: Customer[] = [
  { id: "1", name: "山田太郎", phone: "090-1234-5678" },
  { id: "2", name: "佐藤花子", phone: "090-8765-4321" },
  { id: "3", name: "鈴木一郎", phone: "090-2345-6789" },
];

const initialTemplates: NotificationTemplate[] = [
  {
    id: "template-1",
    name: "着信通知（標準）",
    content: "着信がありました\n発信者: {caller}\n番号: {number}\n時刻: {time}",
    variables: ["caller", "number", "time"],
    createdAt: "2025-04-30T10:00:00",
  },
  {
    id: "template-2",
    name: "FAX受信通知",
    content: "新しいFAXを受信しました\n送信元: {sender}\n受信時刻: {time}\nページ数: {pages}",
    variables: ["sender", "time", "pages"],
    createdAt: "2025-04-30T10:05:00",
  },
];

const initialRules: NotificationRule[] = [
  {
    id: "rule-1",
    name: "着信通知",
    conditions: {
      type: ["call"],
      target: {
        type: "phone",
        value: ["090-1234-5678", "090-8765-4321"],
      },
      keywords: {
        mode: "logical",
        keywords: [
          { id: "kw-1", word: "緊急", operator: "none" },
          { id: "kw-2", word: "至急", operator: "and" },
        ],
      },
    },
    actions: [
      {
        type: "email",
        config: {
          destination: { type: "manual", value: "support@example.com" },
          templateId: "template-1",
          useSummary: false,
        },
      },
    ],
    enabled: true,
  },
];

const sampleStaff: Staff[] = [
  {
    id: "staff-1",
    firstName: "太郎",
    lastName: "山田",
    department: "営業部",
    email: "taro.yamada@example.com",
    chatworkId: "12345678",
    lineId: "notify-token-123",
    phoneNumber: "090-1234-5678",
  },
  {
    id: "staff-2",
    firstName: "花子",
    lastName: "鈴木",
    department: "カスタマーサポート",
    email: "hanako.suzuki@example.com",
    chatworkId: "87654321",
    lineId: "notify-token-456",
    phoneNumber: "090-8765-4321",
  },
];

const emptyRule: Omit<NotificationRule, "id"> = {
  name: "",
  conditions: {
    type: ["call"],
    target: {
      type: "phone",
      value: [],
    },
  },
  actions: [
    {
      type: "email",
      config: {
        destination: { type: "manual", value: "" },
        templateId: "",
        useSummary: false,
        customMessage: "",
      },
    },
  ],
  enabled: true,
};

/**
 * 通知設定メインコンポーネント
 *
 * 通知ルールの一覧表示、追加、編集、削除を管理
 */
export default function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRule[]>(initialRules);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(initialTemplates);
  const [staff] = useState<Staff[]>(sampleStaff);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStaffSelectionOpen, setIsStaffSelectionOpen] = useState(false);
  const [isTemplateManagementOpen, setIsTemplateManagementOpen] = useState(false);

  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  const [formData, setFormData] = useState<Omit<NotificationRule, "id">>(emptyRule);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // ページネーション計算
  const totalPages = Math.ceil(rules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRules = rules.slice(startIndex, endIndex);

  // ルール追加
  const handleAddRule = () => {
    const newRule: NotificationRule = {
      id: `rule-${Date.now()}`,
      ...formData,
    };
    setRules([...rules, newRule]);
    setIsAddDialogOpen(false);
    setFormData(emptyRule);
    setCurrentPage(1);
    toast.success("通知ルールを追加しました");
  };

  // ルール編集開始
  const handleEditStart = (rule: NotificationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
    });
    setIsEditDialogOpen(true);
  };

  // ルール更新
  const handleUpdateRule = () => {
    if (!editingRule) return;

    setRules(rules.map(rule =>
      rule.id === editingRule.id ? { ...rule, ...formData } : rule
    ));
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setFormData(emptyRule);
    toast.success("通知ルールを更新しました");
  };

  // ルール削除
  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    const newTotalPages = Math.ceil((rules.length - 1) / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    toast.success("通知ルールを削除しました");
  };

  // ルール有効/無効切り替え
  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // スタッフ選択
  const handleStaffSelection = (staffId: string) => {
    const selectedStaff = staff.find(s => s.id === staffId);
    if (!selectedStaff) return;

    const currentAction = formData.actions[currentActionIndex];
    const value =
      currentAction.type === "email" ? selectedStaff.email :
      currentAction.type === "chatwork" ? selectedStaff.chatworkId :
      currentAction.type === "line" ? selectedStaff.lineId :
      selectedStaff.phoneNumber;

    const newActions = [...formData.actions];
    newActions[currentActionIndex] = {
      ...currentAction,
      config: {
        ...currentAction.config,
        destination: { type: "staff", value: value || "", staffId },
      },
    };
    setFormData({ ...formData, actions: newActions });
  };

  // テンプレート追加
  const handleAddTemplate = (template: Omit<NotificationTemplate, "id">) => {
    const newTemplate: NotificationTemplate = {
      id: `template-${Date.now()}`,
      ...template,
    };
    setTemplates([...templates, newTemplate]);
  };

  // テンプレート更新
  const handleUpdateTemplate = (id: string, template: Omit<NotificationTemplate, "id">) => {
    setTemplates(templates.map(t => (t.id === id ? { id, ...template } : t)));
  };

  // テンプレート削除
  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">通知設定</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              新規ルール
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新規通知ルール</DialogTitle>
              <DialogDescription>
                通知ルールの条件とアクションを設定
              </DialogDescription>
            </DialogHeader>
            <NotificationRuleForm
              formData={formData}
              onChange={setFormData}
              templates={templates}
              customers={sampleCustomers}
              staff={staff}
              onOpenStaffSelector={(index) => {
                setCurrentActionIndex(index);
                setIsStaffSelectionOpen(true);
              }}
              onOpenTemplateManager={() => setIsTemplateManagementOpen(true)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddRule}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>通知ルール一覧</CardTitle>
            <div className="text-sm text-muted-foreground">
              {rules.length}件のルール
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {currentRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "有効" : "無効"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {rule.conditions.type.includes("call") && <Phone className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditStart(rule)}
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
                          <AlertDialogTitle>通知ルールの削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{rule.name}」を削除してもよろしいですか？この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">条件:</div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      {rule.conditions.target.type === "phone" ? (
                        <>着信番号: {rule.conditions.target.value.join(", ")}</>
                      ) : (
                        <>
                          顧客:{" "}
                          {rule.conditions.target.value
                            .map(id => sampleCustomers.find(c => c.id === id)?.name)
                            .join(", ")}
                        </>
                      )}
                    </div>
                    {rule.conditions.keywords && (
                      <div>
                        キーワード ({rule.conditions.keywords.mode === "list" ? "リスト" : "論理結合"}):
                        {rule.conditions.keywords.mode === "list" ? (
                          <span> {rule.conditions.keywords.keywords.map(kw => kw.word).join(", ")}</span>
                        ) : (
                          <span>
                            {" "}
                            {rule.conditions.keywords.keywords
                              .map((kw, index) =>
                                index === 0 ? kw.word : ` ${kw.operator.toUpperCase()} ${kw.word}`
                              )
                              .join("")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium">通知アクション:</div>
                  <div className="grid gap-2">
                    {rule.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {action.type === "email" && <Mail className="h-4 w-4" />}
                        {action.type === "chatwork" && <MessageSquare className="h-4 w-4" />}
                        {action.type === "line" && <MessagesSquare className="h-4 w-4" />}
                        {action.type === "phone" && <Phone className="h-4 w-4" />}
                        <span className="font-medium">
                          {action.type === "email"
                            ? "メール"
                            : action.type === "chatwork"
                            ? "ChatWork"
                            : action.type === "line"
                            ? "LINE"
                            : "電話"}
                          :
                        </span>
                        <span className="text-muted-foreground">{action.config.destination.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                通知ルールが設定されていません
              </div>
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, rules.length)}件 / 全{rules.length}件
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>通知ルールの編集</DialogTitle>
            <DialogDescription>通知ルールの条件とアクションを編集</DialogDescription>
          </DialogHeader>
          <NotificationRuleForm
            formData={formData}
            onChange={setFormData}
            templates={templates}
            customers={sampleCustomers}
            staff={staff}
            onOpenStaffSelector={(index) => {
              setCurrentActionIndex(index);
              setIsStaffSelectionOpen(true);
            }}
            onOpenTemplateManager={() => setIsTemplateManagementOpen(true)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateRule}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* スタッフ選択ダイアログ */}
      <NotificationStaffSelector
        open={isStaffSelectionOpen}
        onOpenChange={setIsStaffSelectionOpen}
        staff={staff}
        onSelect={handleStaffSelection}
      />

      {/* テンプレート管理ダイアログ */}
      <NotificationTemplateManager
        open={isTemplateManagementOpen}
        onOpenChange={setIsTemplateManagementOpen}
        templates={templates}
        onAdd={handleAddTemplate}
        onUpdate={handleUpdateTemplate}
        onDelete={handleDeleteTemplate}
      />
    </div>
  );
}
