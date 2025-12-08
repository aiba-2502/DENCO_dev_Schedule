"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, Users, Edit } from "lucide-react";
import { toast } from "sonner";
import type { NotificationRule, NotificationTemplate, Customer, Staff } from "./types";

/**
 * ルールフォームのプロパティ
 */
interface NotificationRuleFormProps {
  /** フォームデータ */
  formData: Omit<NotificationRule, "id">;
  /** フォームデータ変更ハンドラー */
  onChange: (data: Omit<NotificationRule, "id">) => void;
  /** テンプレートリスト */
  templates: NotificationTemplate[];
  /** 顧客リスト */
  customers: Customer[];
  /** スタッフリスト */
  staff: Staff[];
  /** スタッフ選択ダイアログを開くハンドラー */
  onOpenStaffSelector: (actionIndex: number) => void;
  /** テンプレート管理ダイアログを開くハンドラー */
  onOpenTemplateManager: () => void;
}

/**
 * 通知ルールフォームコンポーネント
 *
 * 通知ルールの条件とアクションを設定するフォーム
 */
export function NotificationRuleForm({
  formData,
  onChange,
  templates,
  customers,
  staff,
  onOpenStaffSelector,
  onOpenTemplateManager,
}: NotificationRuleFormProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordMode, setKeywordMode] = useState<"list" | "logical">("list");
  const [workingKeywords, setWorkingKeywords] = useState<Array<{
    id: string;
    word: string;
    operator: "none" | "and" | "or";
  }>>([{ id: "temp-1", word: "", operator: "none" }]);

  // キーワード追加（リスト形式）
  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;

    const newKeyword = {
      id: `kw-${Date.now()}`,
      word: keywordInput.trim(),
      operator: "none" as const,
    };

    onChange({
      ...formData,
      conditions: {
        ...formData.conditions,
        keywords: {
          mode: "list",
          keywords: [...(formData.conditions.keywords?.keywords || []), newKeyword],
        },
      },
    });
    setKeywordInput("");
  };

  // 作業中キーワード追加（論理結合）
  const handleAddWorkingKeyword = (operator: "and" | "or") => {
    const newKeyword = {
      id: `temp-${Date.now()}`,
      word: "",
      operator: operator,
    };
    setWorkingKeywords([...workingKeywords, newKeyword]);
  };

  // キーワード条件確定（論理結合）
  const handleConfirmKeywords = () => {
    const validKeywords = workingKeywords.filter(kw => kw.word.trim());
    if (validKeywords.length === 0) return;

    const finalKeywords = validKeywords.map((kw, index) => ({
      id: `kw-${Date.now()}-${index}`,
      word: kw.word.trim(),
      operator: index === 0 ? ("none" as const) : kw.operator,
    }));

    onChange({
      ...formData,
      conditions: {
        ...formData.conditions,
        keywords: {
          mode: "logical",
          keywords: finalKeywords,
        },
      },
    });

    setWorkingKeywords([{ id: "temp-1", word: "", operator: "none" }]);
    toast.success("キーワード条件を確定しました");
  };

  // キーワード削除
  const handleRemoveKeyword = (keywordId: string) => {
    onChange({
      ...formData,
      conditions: {
        ...formData.conditions,
        keywords: {
          mode: formData.conditions.keywords?.mode || "list",
          keywords: formData.conditions.keywords?.keywords.filter(k => k.id !== keywordId) || [],
        },
      },
    });
  };

  return (
    <div className="grid gap-4 py-4">
      {/* ルール名 */}
      <div className="space-y-2">
        <Label htmlFor="name">ルール名</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="通知ルールの名前"
        />
      </div>

      {/* 通知条件 */}
      <div className="space-y-4">
        <Label>通知条件</Label>
        <div className="grid gap-4">
          {/* イベントタイプ */}
          <div>
            <Label htmlFor="type" className="text-sm">イベントタイプ</Label>
            <Select
              value={formData.conditions.type[0]}
              onValueChange={(value: "call" | "fax") =>
                onChange({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    type: [value],
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">通話</SelectItem>
                <SelectItem value="fax">FAX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 対象の選択 */}
          <div className="space-y-2">
            <Label>対象の選択</Label>
            <RadioGroup
              value={formData.conditions.target.type}
              onValueChange={(value: "phone" | "customer") => {
                onChange({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    target: {
                      type: value,
                      value: [],
                    },
                  },
                });
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="target-phone" />
                <Label htmlFor="target-phone">着信番号で指定</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="target-customer" />
                <Label htmlFor="target-customer">顧客で指定</Label>
              </div>
            </RadioGroup>

            {formData.conditions.target.type === "phone" ? (
              <div className="space-y-2">
                <Input
                  placeholder="電話番号を入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.currentTarget;
                      if (input.value) {
                        onChange({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            target: {
                              ...formData.conditions.target,
                              value: [...formData.conditions.target.value, input.value],
                            },
                          },
                        });
                        input.value = "";
                      }
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {formData.conditions.target.value.map((phone) => (
                    <Badge
                      key={phone}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        onChange({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            target: {
                              ...formData.conditions.target,
                              value: formData.conditions.target.value.filter(p => p !== phone),
                            },
                          },
                        });
                      }}
                    >
                      {phone} ✕
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map(customer => (
                  <div key={customer.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`customer-${customer.id}`}
                      checked={formData.conditions.target.value.includes(customer.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              target: {
                                ...formData.conditions.target,
                                value: [...formData.conditions.target.value, customer.id],
                              },
                            },
                          });
                        } else {
                          onChange({
                            ...formData,
                            conditions: {
                              ...formData.conditions,
                              target: {
                                ...formData.conditions.target,
                                value: formData.conditions.target.value.filter(id => id !== customer.id),
                              },
                            },
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`customer-${customer.id}`}>
                      {customer.name} ({customer.phone})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* キーワード条件 */}
          <div className="space-y-2">
            <Label>キーワード条件</Label>
            <div className="space-y-2">
              <Label className="text-sm">キーワードモード</Label>
              <RadioGroup
                value={keywordMode}
                onValueChange={(value: "list" | "logical") => {
                  setKeywordMode(value);
                  setWorkingKeywords([{ id: "temp-1", word: "", operator: "none" }]);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="mode-list" />
                  <Label htmlFor="mode-list" className="text-sm">
                    リスト形式（複数キーワードのいずれかに一致）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="logical" id="mode-logical" />
                  <Label htmlFor="mode-logical" className="text-sm">
                    論理結合（AND/ORで詳細な条件設定）
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* リスト形式の入力 */}
            {keywordMode === "list" && (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="キーワードを入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddKeyword}
                  disabled={!keywordInput.trim()}
                >
                  追加
                </Button>
              </div>
            )}

            {/* 論理結合モード専用の作業エリア */}
            {keywordMode === "logical" && (
              <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-medium">キーワード条件の作成</Label>
                {workingKeywords.map((keyword, index) => (
                  <div key={keyword.id} className="flex items-center gap-2">
                    {index > 0 && (
                      <Select
                        value={keyword.operator}
                        onValueChange={(value: "and" | "or") => {
                          const newWorkingKeywords = [...workingKeywords];
                          newWorkingKeywords[index] = { ...keyword, operator: value };
                          setWorkingKeywords(newWorkingKeywords);
                        }}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">AND</SelectItem>
                          <SelectItem value="or">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={keyword.word}
                      onChange={(e) => {
                        const newWorkingKeywords = [...workingKeywords];
                        newWorkingKeywords[index] = { ...keyword, word: e.target.value };
                        setWorkingKeywords(newWorkingKeywords);
                      }}
                      placeholder="キーワードを入力..."
                      className="flex-1"
                    />
                    {workingKeywords.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setWorkingKeywords(workingKeywords.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWorkingKeyword("and")}
                    disabled={!workingKeywords[workingKeywords.length - 1]?.word.trim()}
                  >
                    AND
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWorkingKeyword("or")}
                    disabled={!workingKeywords[workingKeywords.length - 1]?.word.trim()}
                  >
                    OR
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleConfirmKeywords}
                    disabled={!workingKeywords.some(kw => kw.word.trim())}
                    className="ml-auto"
                  >
                    キーワード条件を確定
                  </Button>
                </div>
              </div>
            )}

            {/* 確定済みキーワード条件の表示 */}
            {formData.conditions.keywords?.keywords && formData.conditions.keywords.keywords.length > 0 && (
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-sm font-medium">確定済みキーワード条件</Label>
                {formData.conditions.keywords.mode === "list" ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.keywords.keywords.map((keyword) => (
                      <Badge
                        key={keyword.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveKeyword(keyword.id)}
                      >
                        {keyword.word} ✕
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">
                    {formData.conditions.keywords.keywords.map((kw, index) =>
                      index === 0 ? kw.word : ` ${kw.operator.toUpperCase()} ${kw.word}`
                    ).join("")}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChange({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        keywords: { mode: keywordMode, keywords: [] },
                      },
                    });
                    setWorkingKeywords([{ id: "temp-1", word: "", operator: "none" }]);
                  }}
                >
                  条件をリセット
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 通知アクション */}
      <div className="space-y-2">
        <Label>通知アクション</Label>
        {formData.actions.map((action, index) => (
          <div key={index} className="grid gap-4 border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <Select
                value={action.type}
                onValueChange={(value: "email" | "chatwork" | "line" | "phone") => {
                  const newActions = [...formData.actions];
                  newActions[index] = {
                    type: value,
                    config: {
                      destination: { type: "manual", value: "" },
                      templateId: "",
                    },
                  };
                  onChange({ ...formData, actions: newActions });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">メール</SelectItem>
                  <SelectItem value="chatwork">ChatWork</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="phone">電話</SelectItem>
                </SelectContent>
              </Select>

              {formData.actions.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newActions = formData.actions.filter((_, i) => i !== index);
                    onChange({ ...formData, actions: newActions });
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 送信先設定 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">送信先</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenStaffSelector(index)}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                  スタッフを選択
                </Button>
                <Select
                  value={action.config.destination.type}
                  onValueChange={(value: "staff" | "manual") => {
                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: value, value: "" },
                      },
                    };
                    onChange({ ...formData, actions: newActions });
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">スタッフ</SelectItem>
                    <SelectItem value="manual">手動入力</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {action.config.destination.type === "staff" ? (
                <Select
                  value={action.config.destination.staffId || ""}
                  onValueChange={(staffId) => {
                    const selectedStaff = staff.find(s => s.id === staffId);
                    if (!selectedStaff) return;

                    const value =
                      action.type === "email" ? selectedStaff.email :
                      action.type === "chatwork" ? selectedStaff.chatworkId :
                      action.type === "line" ? selectedStaff.lineId :
                      selectedStaff.phoneNumber;

                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: "staff", value: value || "", staffId },
                      },
                    };
                    onChange({ ...formData, actions: newActions });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.lastName} {s.firstName} ({s.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={action.config.destination.value}
                  onChange={(e) => {
                    const newActions = [...formData.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        destination: { type: "manual", value: e.target.value },
                      },
                    };
                    onChange({ ...formData, actions: newActions });
                  }}
                  placeholder={
                    action.type === "email" ? "メールアドレス" :
                    action.type === "chatwork" ? "ChatWork ID" :
                    action.type === "line" ? "LINE Notify トークン" :
                    "電話番号"
                  }
                />
              )}
            </div>

            {/* 通知内容設定 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">通知内容</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenTemplateManager}
                  className="gap-1"
                >
                  <Edit className="h-4 w-4" />
                  テンプレート管理
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">テンプレート選択</Label>
                  <Select
                    value={action.config.templateId || ""}
                    onValueChange={(templateId) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, templateId },
                      };
                      onChange({ ...formData, actions: newActions });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="テンプレートを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`summary-${index}`}
                    checked={action.config.useSummary || false}
                    onCheckedChange={(checked) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, useSummary: checked as boolean },
                      };
                      onChange({ ...formData, actions: newActions });
                    }}
                  />
                  <Label htmlFor={`summary-${index}`} className="text-sm">
                    要約を送信（GPTで通話内容を要約）
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">カスタムメッセージ（任意）</Label>
                  <Textarea
                    value={action.config.customMessage || ""}
                    onChange={(e) => {
                      const newActions = [...formData.actions];
                      newActions[index] = {
                        ...action,
                        config: { ...action.config, customMessage: e.target.value },
                      };
                      onChange({ ...formData, actions: newActions });
                    }}
                    placeholder="追加のメッセージがあれば入力..."
                    rows={2}
                  />
                </div>

                {/* テンプレートプレビュー */}
                {action.config.templateId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">プレビュー:</Label>
                    <div className="text-sm mt-1">
                      {templates.find(t => t.id === action.config.templateId)?.content}
                    </div>
                    {templates.find(t => t.id === action.config.templateId)?.variables.length! > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        利用可能な変数: {templates.find(t => t.id === action.config.templateId)?.variables.map(v => `{${v}}`).join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => {
            onChange({
              ...formData,
              actions: [
                ...formData.actions,
                {
                  type: "email",
                  config: {
                    destination: { type: "manual", value: "" },
                    templateId: "",
                  },
                },
              ],
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          通知アクションを追加
        </Button>
      </div>
    </div>
  );
}
