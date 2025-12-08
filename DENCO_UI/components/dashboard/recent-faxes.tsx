"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { FaxDocument } from "@/lib/types";

export function RecentFaxes() {
  const [recentFaxes, setRecentFaxes] = useState<FaxDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: 認証コンテキストからテナントIDを取得
  // 認証システム実装後に以下を置き換え:
  // const { tenantId } = useAuth();
  const tenantId = 'default-tenant'; // 暫定ハードコード

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.python.fax.list(tenantId, 5, 0);
        setRecentFaxes(response.items as FaxDocument[]);
      } catch (err) {
        console.error('Recent fax fetch error:', err);
        // ダッシュボードでは静かに失敗（トースト不要）
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recentFaxes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        FAXデータがありません
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>種別</TableHead>
          <TableHead>送信元</TableHead>
          <TableHead>送信先</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>受信日時</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentFaxes.map((fax) => (
          <TableRow key={fax.id}>
            <TableCell>
              <Badge variant="outline">
                {fax.direction === "inbound" ? "受信" : "送信"}
              </Badge>
            </TableCell>
            <TableCell>{fax.sender_number}</TableCell>
            <TableCell>{fax.receiver_number}</TableCell>
            <TableCell>
              <Badge
                variant={
                  fax.status === "completed"
                    ? "default"
                    : fax.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {fax.status === "completed" ? "完了" :
                 fax.status === "pending" ? "処理中" : "失敗"}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(fax.created_at).toLocaleTimeString('ja-JP')}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="icon" disabled>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
