"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Ban,
  Globe
} from "lucide-react";
import { toast } from "sonner";

/**
 * セキュリティ設定
 * 
 * 【バックエンド開発者へ】
 * このコンポーネントは以下のAPIエンドポイントを呼び出す想定です：
 * 
 * 1. OTP設定の取得/保存:
 *    - GET /api/settings/security/otp
 *    - POST /api/settings/security/otp
 *    - リクエスト/レスポンス: OtpSettings型
 * 
 * 2. ブルートフォース設定の取得/保存:
 *    - GET /api/settings/security/brute-force
 *    - POST /api/settings/security/brute-force
 *    - リクエスト/レスポンス: BruteForceSettings型
 * 
 * 3. ブロック中ユーザー一覧:
 *    - GET /api/settings/security/blocked-users
 *    - レスポンス: BlockedUser[]
 * 
 * 4. ユーザーのブロック解除:
 *    - DELETE /api/settings/security/blocked-users/:userId
 *    - レスポンス: { success: boolean }
 * 
 * 5. 全ユーザーのブロック解除:
 *    - DELETE /api/settings/security/blocked-users
 *    - レスポンス: { success: boolean, count: number }
 * 
 * 6. IPホワイトリスト:
 *    - GET /api/settings/security/ip-whitelist
 *    - POST /api/settings/security/ip-whitelist
 *    - DELETE /api/settings/security/ip-whitelist/:id
 * 
 * 7. IPブラックリスト:
 *    - GET /api/settings/security/ip-blacklist
 *    - POST /api/settings/security/ip-blacklist
 *    - DELETE /api/settings/security/ip-blacklist/:id
 */

interface OtpSettings {
  enabled: boolean;
  expirationMinutes: number;
}

interface BruteForceSettings {
  enabled: boolean;
  maxAttempts: number;
  lockoutMinutes: number;
}

interface BlockedUser {
  id: string;
  email: string;
  ipAddress: string;
  failedAttempts: number;
  blockedAt: string;
  unblockAt: string;
}

interface IpEntry {
  id: string;
  ipAddress: string;
  description: string;
  createdAt: string;
}

export default function SecuritySettings() {
  // OTP設定
  const [otpSettings, setOtpSettings] = useState<OtpSettings>({
    enabled: false,
    expirationMinutes: 10,
  });

  // ブルートフォース設定
  const [bruteForceSettings, setBruteForceSettings] = useState<BruteForceSettings>({
    enabled: true,
    maxAttempts: 5,
    lockoutMinutes: 15,
  });

  // ブロック中ユーザー
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    // サンプルデータ（バックエンド実装後に削除）
    {
      id: "1",
      email: "test@example.com",
      ipAddress: "192.168.1.100",
      failedAttempts: 5,
      blockedAt: new Date().toISOString(),
      unblockAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  ]);

  // IPリスト
  const [ipWhitelist, setIpWhitelist] = useState<IpEntry[]>([]);
  const [ipBlacklist, setIpBlacklist] = useState<IpEntry[]>([]);

  // ダイアログ状態
  const [isAddIpDialogOpen, setIsAddIpDialogOpen] = useState(false);
  const [ipDialogType, setIpDialogType] = useState<"whitelist" | "blacklist">("whitelist");
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newIpDescription, setNewIpDescription] = useState("");

  // ブロック中ユーザーの取得
  const fetchBlockedUsers = async () => {
    // TODO: バックエンドAPI呼び出し
    // GET /api/settings/security/blocked-users
    toast.info("ブロック中ユーザー一覧を更新しました");
  };

  // ユーザーのブロック解除
  const unblockUser = async (userId: string) => {
    // TODO: バックエンドAPI呼び出し
    // DELETE /api/settings/security/blocked-users/:userId
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    toast.success("ユーザーのブロックを解除しました");
  };

  // 全ユーザーのブロック解除
  const unblockAllUsers = async () => {
    // TODO: バックエンドAPI呼び出し
    // DELETE /api/settings/security/blocked-users
    setBlockedUsers([]);
    toast.success("すべてのブロックを解除しました");
  };

  // IPアドレス追加
  const addIpAddress = () => {
    if (!newIpAddress) {
      toast.error("IPアドレスを入力してください");
      return;
    }

    // 簡易的なIP形式チェック
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIpAddress)) {
      toast.error("正しいIPアドレス形式で入力してください（例: 192.168.1.1 または 192.168.1.0/24）");
      return;
    }

    const newEntry: IpEntry = {
      id: Date.now().toString(),
      ipAddress: newIpAddress,
      description: newIpDescription,
      createdAt: new Date().toISOString(),
    };

    if (ipDialogType === "whitelist") {
      // TODO: POST /api/settings/security/ip-whitelist
      setIpWhitelist(prev => [...prev, newEntry]);
      toast.success("ホワイトリストにIPアドレスを追加しました");
    } else {
      // TODO: POST /api/settings/security/ip-blacklist
      setIpBlacklist(prev => [...prev, newEntry]);
      toast.success("ブラックリストにIPアドレスを追加しました");
    }

    setNewIpAddress("");
    setNewIpDescription("");
    setIsAddIpDialogOpen(false);
  };

  // IPアドレス削除
  const removeIpAddress = (id: string, type: "whitelist" | "blacklist") => {
    if (type === "whitelist") {
      // TODO: DELETE /api/settings/security/ip-whitelist/:id
      setIpWhitelist(prev => prev.filter(ip => ip.id !== id));
      toast.success("ホワイトリストからIPアドレスを削除しました");
    } else {
      // TODO: DELETE /api/settings/security/ip-blacklist/:id
      setIpBlacklist(prev => prev.filter(ip => ip.id !== id));
      toast.success("ブラックリストからIPアドレスを削除しました");
    }
  };

  // 残り時間を計算
  const getRemainingTime = (unblockAt: string) => {
    const remaining = new Date(unblockAt).getTime() - Date.now();
    if (remaining <= 0) return "まもなく解除";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  return (
    <div className="space-y-6">
      {/* OTP設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>OTP設定（二段階認証）</CardTitle>
              <CardDescription>
                メールによる二段階認証（ワンタイムパスワード）の設定
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">メール二段階認証（OTP）を有効にする</Label>
              <p className="text-sm text-muted-foreground">
                ログイン時にメールで送信されるワンタイムパスワードの入力を必須にします
              </p>
            </div>
            <Switch
              checked={otpSettings.enabled}
              onCheckedChange={(checked) => setOtpSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {otpSettings.enabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="otp-expiration">OTPの有効期限（分）</Label>
                <Input
                  id="otp-expiration"
                  type="number"
                  min="1"
                  max="60"
                  value={otpSettings.expirationMinutes}
                  onChange={(e) => setOtpSettings(prev => ({ 
                    ...prev, 
                    expirationMinutes: parseInt(e.target.value) || 10 
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  推奨: 5〜15分
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ブルートフォースアタック防止 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>ブルートフォースアタック防止</CardTitle>
              <CardDescription>
                連続したログイン失敗時のアカウントロック設定
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">ブルートフォース防止を有効にする</Label>
              <p className="text-sm text-muted-foreground">
                連続でログインに失敗した場合、一時的にアクセスをブロックします
              </p>
            </div>
            <Switch
              checked={bruteForceSettings.enabled}
              onCheckedChange={(checked) => setBruteForceSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {bruteForceSettings.enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">最大試行回数</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min="3"
                    max="20"
                    value={bruteForceSettings.maxAttempts}
                    onChange={(e) => setBruteForceSettings(prev => ({ 
                      ...prev, 
                      maxAttempts: parseInt(e.target.value) || 5 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    この回数連続で失敗するとブロックされます
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockout-minutes">ロック時間（分）</Label>
                  <Input
                    id="lockout-minutes"
                    type="number"
                    min="1"
                    max="1440"
                    value={bruteForceSettings.lockoutMinutes}
                    onChange={(e) => setBruteForceSettings(prev => ({ 
                      ...prev, 
                      lockoutMinutes: parseInt(e.target.value) || 15 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    ブロックが解除されるまでの時間
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">現在の設定</span>
                </div>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  {bruteForceSettings.maxAttempts}回連続のログイン認証失敗で、
                  {bruteForceSettings.lockoutMinutes}分間アクセスをブロックします
                </p>
              </div>

              <Separator />

              {/* ブロック中ユーザー一覧 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">ブロック中のユーザー</h4>
                    <p className="text-sm text-muted-foreground">
                      現在アクセスがブロックされているユーザー/IP
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchBlockedUsers}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      更新
                    </Button>
                    {blockedUsers.length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Unlock className="h-4 w-4 mr-1" />
                            すべて解除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>すべてのブロックを解除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              現在ブロックされている{blockedUsers.length}件のユーザー/IPのブロックをすべて解除します。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={unblockAllUsers}>
                              すべて解除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {blockedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>現在ブロックされているユーザーはいません</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>メールアドレス</TableHead>
                        <TableHead>IPアドレス</TableHead>
                        <TableHead>失敗回数</TableHead>
                        <TableHead>ブロック開始</TableHead>
                        <TableHead>残り時間</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.ipAddress}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{user.failedAttempts}回</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.blockedAt).toLocaleString("ja-JP")}
                          </TableCell>
                          <TableCell>{getRemainingTime(user.unblockAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unblockUser(user.id)}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* IP制限 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>IP制限</CardTitle>
              <CardDescription>
                IPアドレスによるアクセス制限の設定
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whitelist">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whitelist" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                ホワイトリスト
              </TabsTrigger>
              <TabsTrigger value="blacklist" className="gap-2">
                <Ban className="h-4 w-4" />
                ブラックリスト
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whitelist" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    ホワイトリストに登録されたIPアドレスからのみアクセスを許可します
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ※ ホワイトリストが空の場合、この機能は無効です（すべてのIPを許可）
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIpDialogType("whitelist");
                    setIsAddIpDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>

              {ipWhitelist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>ホワイトリストは空です</p>
                  <p className="text-xs">すべてのIPアドレスからのアクセスが許可されています</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IPアドレス</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>追加日時</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipWhitelist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIpAddress(entry.id, "whitelist")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="blacklist" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  ブラックリストに登録されたIPアドレスからのアクセスをブロックします
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setIpDialogType("blacklist");
                    setIsAddIpDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>

              {ipBlacklist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Ban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>ブラックリストは空です</p>
                  <p className="text-xs">ブロックされているIPアドレスはありません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IPアドレス</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>追加日時</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipBlacklist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIpAddress(entry.id, "blacklist")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* IPアドレス追加ダイアログ */}
      <Dialog open={isAddIpDialogOpen} onOpenChange={setIsAddIpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ipDialogType === "whitelist" ? "ホワイトリスト" : "ブラックリスト"}にIPアドレスを追加
            </DialogTitle>
            <DialogDescription>
              IPアドレスまたはCIDR形式（例: 192.168.1.0/24）で入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">IPアドレス *</Label>
              <Input
                id="ip-address"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="192.168.1.1 または 192.168.1.0/24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-description">説明</Label>
              <Input
                id="ip-description"
                value={newIpDescription}
                onChange={(e) => setNewIpDescription(e.target.value)}
                placeholder="オフィスネットワーク"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIpDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={addIpAddress}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

