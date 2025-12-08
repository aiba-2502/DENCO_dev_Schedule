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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Staff } from "./types";

/**
 * スタッフ選択ダイアログのプロパティ
 */
interface StaffSelectorProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラー */
  onOpenChange: (open: boolean) => void;
  /** スタッフリスト */
  staff: Staff[];
  /** 選択完了ハンドラー */
  onSelect: (staffId: string) => void;
}

/**
 * スタッフ選択ダイアログコンポーネント
 *
 * 通知先のスタッフを検索・選択するためのダイアログ
 */
export function NotificationStaffSelector({
  open,
  onOpenChange,
  staff,
  onSelect,
}: StaffSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // スタッフ検索フィルター
  const filteredStaff = staff.filter(member => {
    const fullName = `${member.lastName} ${member.firstName}`;
    const searchLower = searchTerm.toLowerCase();

    return searchTerm === "" ||
      fullName.toLowerCase().includes(searchLower) ||
      member.department.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower);
  });

  // 選択確定
  const handleConfirm = () => {
    if (selectedStaffId) {
      onSelect(selectedStaffId);
      onOpenChange(false);
      setSearchTerm("");
      setSelectedStaffId("");
    }
  };

  // キャンセル
  const handleCancel = () => {
    onOpenChange(false);
    setSearchTerm("");
    setSelectedStaffId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>スタッフ選択</DialogTitle>
          <DialogDescription>
            通知先のスタッフを選択してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索フィールド */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="名前、部署、メールで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* スタッフリスト */}
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    selectedStaffId === member.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedStaffId(member.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {member.lastName} {member.firstName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.department}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div>{member.email}</div>
                      {member.phoneNumber && (
                        <div>{member.phoneNumber}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredStaff.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  検索条件に一致するスタッフがいません
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStaffId}
          >
            選択
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
