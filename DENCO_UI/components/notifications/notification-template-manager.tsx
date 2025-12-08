"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import type { NotificationTemplate } from "./types";

/**
 * テンプレート管理ダイアログのプロパティ
 */
interface TemplateManagerProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラー */
  onOpenChange: (open: boolean) => void;
  /** テンプレートリスト */
  templates: NotificationTemplate[];
  /** テンプレート追加ハンドラー */
  onAdd: (template: Omit<NotificationTemplate, "id">) => void;
  /** テンプレート更新ハンドラー */
  onUpdate: (id: string, template: Omit<NotificationTemplate, "id">) => void;
  /** テンプレート削除ハンドラー */
  onDelete: (id: string) => void;
}

/**
 * テンプレート管理コンポーネント
 *
 * 通知テンプレートの作成、編集、削除を行うダイアログ
 */
export function NotificationTemplateManager({
  open,
  onOpenChange,
  templates,
  onAdd,
  onUpdate,
  onDelete,
}: TemplateManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
  });

  // フォームリセット
  const resetForm = () => {
    setFormData({ name: "", content: "" });
    setEditingTemplate(null);
  };

  // テンプレート追加
  const handleAdd = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("テンプレート名と内容を入力してください");
      return;
    }

    // 変数を抽出
    const variableMatches = formData.content.match(/\{([^}]+)\}/g);
    const variables = variableMatches
      ? [...new Set(variableMatches.map(match => match.slice(1, -1)))]
      : [];

    onAdd({
      name: formData.name.trim(),
      content: formData.content.trim(),
      variables,
      createdAt: new Date().toISOString(),
    });

    setIsAddDialogOpen(false);
    resetForm();
    toast.success("テンプレートを追加しました");
  };

  // テンプレート編集開始
  const handleEditStart = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
    });
    setIsEditDialogOpen(true);
  };

  // テンプレート更新
  const handleUpdate = () => {
    if (!editingTemplate) return;

    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("テンプレート名と内容を入力してください");
      return;
    }

    // 変数を抽出
    const variableMatches = formData.content.match(/\{([^}]+)\}/g);
    const variables = variableMatches
      ? [...new Set(variableMatches.map(match => match.slice(1, -1)))]
      : [];

    onUpdate(editingTemplate.id, {
      name: formData.name.trim(),
      content: formData.content.trim(),
      variables,
      createdAt: editingTemplate.createdAt,
    });

    setIsEditDialogOpen(false);
    resetForm();
    toast.success("テンプレートを更新しました");
  };

  // テンプレート削除
  const handleDelete = (templateId: string) => {
    onDelete(templateId);
    toast.success("テンプレートを削除しました");
  };

  return (
    <>
      {/* メインダイアログ */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>通知テンプレート管理</DialogTitle>
                <DialogDescription>
                  通知メッセージのテンプレートを管理します
                </DialogDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" />
                    新規テンプレート
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新規テンプレート作成</DialogTitle>
                    <DialogDescription>
                      通知メッセージのテンプレートを作成します
                    </DialogDescription>
                  </DialogHeader>
                  <TemplateForm formData={formData} onChange={setFormData} />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleAdd}>作成</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <div className="text-sm text-muted-foreground">
                      作成日: {new Date(template.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditStart(template)}
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
                          <AlertDialogTitle>テンプレートの削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{template.name}」を削除してもよろしいですか？この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm whitespace-pre-wrap">{template.content}</div>
                  </div>
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">変数:</span>
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {"{" + variable + "}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                テンプレートが登録されていません
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* テンプレート編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テンプレートの編集</DialogTitle>
            <DialogDescription>
              通知テンプレートを編集します
            </DialogDescription>
          </DialogHeader>
          <TemplateForm formData={formData} onChange={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * テンプレートフォームコンポーネント
 */
function TemplateForm({
  formData,
  onChange,
}: {
  formData: { name: string; content: string };
  onChange: (data: { name: string; content: string }) => void;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">テンプレート名</Label>
        <Input
          id="template-name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="テンプレートの名前"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-content">テンプレート内容</Label>
        <Textarea
          id="template-content"
          value={formData.content}
          onChange={(e) => onChange({ ...formData, content: e.target.value })}
          placeholder="通知メッセージのテンプレート&#10;変数は {変数名} の形式で記述"
          rows={6}
        />
        <div className="text-xs text-muted-foreground">
          利用可能な変数例: {"{caller}"}, {"{number}"}, {"{time}"}, {"{sender}"}, {"{details}"}
        </div>
      </div>
    </div>
  );
}
