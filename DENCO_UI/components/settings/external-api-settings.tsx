"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TestTube, CheckCircle, XCircle, AlertCircle, Mail, MessageSquare, Bot, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * 外部サーバ・API設定
 * 
 * 【バックエンド開発者へ】
 * このコンポーネントは以下のAPIエンドポイントを呼び出す想定です：
 * 
 * 1. SMTP設定の保存: POST /api/settings/smtp
 *    - リクエストボディ: SmtpSettings型のオブジェクト
 *    - レスポンス: { success: boolean, message: string }
 * 
 * 2. SMTP接続テスト: POST /api/settings/smtp/test
 *    - リクエストボディ: SmtpSettings型のオブジェクト
 *    - レスポンス: { success: boolean, message: string }
 * 
 * 3. ChatWork設定の保存: POST /api/settings/chatwork
 *    - リクエストボディ: ChatWorkSettings型のオブジェクト
 *    - レスポンス: { success: boolean, message: string }
 * 
 * 4. ChatWork接続テスト: POST /api/settings/chatwork/test
 *    - リクエストボディ: ChatWorkSettings型のオブジェクト
 *    - レスポンス: { success: boolean, message: string }
 * 
 * 5. 設定の取得: GET /api/settings/external
 *    - レスポンス: { smtp: SmtpSettings, chatwork: ChatWorkSettings }
 */

interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: "none" | "ssl" | "tls";
  fromAddress: string;
  fromName: string;
}

interface ChatWorkSettings {
  enabled: boolean;
  apiToken: string;
  defaultRoomId: string;
}

interface DifyDefaultSettings {
  agentApiKey: string;
  agentEndpoint: string;
  knowledgeApiKey: string;
  knowledgeEndpoint: string;
}

interface ExternalApiSettingsProps {
  smtpSettings?: SmtpSettings;
  chatworkSettings?: ChatWorkSettings;
  difySettings?: DifyDefaultSettings;
  onSmtpSettingsChange?: (settings: SmtpSettings) => void;
  onChatworkSettingsChange?: (settings: ChatWorkSettings) => void;
  onDifySettingsChange?: (settings: DifyDefaultSettings) => void;
}

const defaultSmtpSettings: SmtpSettings = {
  enabled: false,
  host: "",
  port: "587",
  username: "",
  password: "",
  encryption: "tls",
  fromAddress: "",
  fromName: "",
};

const defaultChatworkSettings: ChatWorkSettings = {
  enabled: false,
  apiToken: "",
  defaultRoomId: "",
};

const defaultDifySettings: DifyDefaultSettings = {
  agentApiKey: "",
  agentEndpoint: "https://api.dify.ai/v1",
  knowledgeApiKey: "",
  knowledgeEndpoint: "https://api.dify.ai/v1",
};

export default function ExternalApiSettings({
  smtpSettings: initialSmtpSettings,
  chatworkSettings: initialChatworkSettings,
  difySettings: initialDifySettings,
  onSmtpSettingsChange,
  onChatworkSettingsChange,
  onDifySettingsChange,
}: ExternalApiSettingsProps) {
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(
    initialSmtpSettings || defaultSmtpSettings
  );
  const [chatworkSettings, setChatworkSettings] = useState<ChatWorkSettings>(
    initialChatworkSettings || defaultChatworkSettings
  );
  const [difySettings, setDifySettings] = useState<DifyDefaultSettings>(
    initialDifySettings || defaultDifySettings
  );
  
  const [testResults, setTestResults] = useState({
    smtp: "idle" as "idle" | "testing" | "success" | "error",
    chatwork: "idle" as "idle" | "testing" | "success" | "error",
    difyAgent: "idle" as "idle" | "testing" | "success" | "error",
    difyKnowledge: "idle" as "idle" | "testing" | "success" | "error",
  });

  const handleSmtpChange = (updates: Partial<SmtpSettings>) => {
    const newSettings = { ...smtpSettings, ...updates };
    setSmtpSettings(newSettings);
    onSmtpSettingsChange?.(newSettings);
  };

  const handleChatworkChange = (updates: Partial<ChatWorkSettings>) => {
    const newSettings = { ...chatworkSettings, ...updates };
    setChatworkSettings(newSettings);
    onChatworkSettingsChange?.(newSettings);
  };

  const handleDifyChange = (updates: Partial<DifyDefaultSettings>) => {
    const newSettings = { ...difySettings, ...updates };
    setDifySettings(newSettings);
    onDifySettingsChange?.(newSettings);
  };

  const testDifyAgentConnection = async () => {
    setTestResults(prev => ({ ...prev, difyAgent: "testing" }));
    
    // TODO: バックエンドAPI呼び出し
    // POST /api/settings/dify/agent/test
    
    setTimeout(() => {
      if (difySettings.agentApiKey && difySettings.agentEndpoint) {
        setTestResults(prev => ({ ...prev, difyAgent: "success" }));
        toast.success("Dify エージェントAPI接続テスト成功");
      } else {
        setTestResults(prev => ({ ...prev, difyAgent: "error" }));
        toast.error("Dify エージェントAPI接続テスト失敗", {
          description: "APIキーとエンドポイントを入力してください",
        });
      }
    }, 1500);
  };

  const testDifyKnowledgeConnection = async () => {
    setTestResults(prev => ({ ...prev, difyKnowledge: "testing" }));
    
    // TODO: バックエンドAPI呼び出し
    // POST /api/settings/dify/knowledge/test
    
    setTimeout(() => {
      if (difySettings.knowledgeApiKey && difySettings.knowledgeEndpoint) {
        setTestResults(prev => ({ ...prev, difyKnowledge: "success" }));
        toast.success("Dify ナレッジAPI接続テスト成功");
      } else {
        setTestResults(prev => ({ ...prev, difyKnowledge: "error" }));
        toast.error("Dify ナレッジAPI接続テスト失敗", {
          description: "APIキーとエンドポイントを入力してください",
        });
      }
    }, 1500);
  };

  const testSmtpConnection = async () => {
    setTestResults(prev => ({ ...prev, smtp: "testing" }));
    
    // TODO: バックエンドAPI呼び出し
    // POST /api/settings/smtp/test
    // リクエストボディ: smtpSettings
    
    // 仮の実装（バックエンド実装後に置き換え）
    setTimeout(() => {
      if (smtpSettings.host && smtpSettings.port) {
        setTestResults(prev => ({ ...prev, smtp: "success" }));
        toast.success("SMTP接続テスト成功", {
          description: `${smtpSettings.host}:${smtpSettings.port}に接続できました`,
        });
      } else {
        setTestResults(prev => ({ ...prev, smtp: "error" }));
        toast.error("SMTP接続テスト失敗", {
          description: "ホストとポートを入力してください",
        });
      }
    }, 1500);
  };

  const testChatworkConnection = async () => {
    setTestResults(prev => ({ ...prev, chatwork: "testing" }));
    
    // TODO: バックエンドAPI呼び出し
    // POST /api/settings/chatwork/test
    // リクエストボディ: chatworkSettings
    
    // 仮の実装（バックエンド実装後に置き換え）
    setTimeout(() => {
      if (chatworkSettings.apiToken) {
        setTestResults(prev => ({ ...prev, chatwork: "success" }));
        toast.success("ChatWork接続テスト成功", {
          description: "APIトークンが有効です",
        });
      } else {
        setTestResults(prev => ({ ...prev, chatwork: "error" }));
        toast.error("ChatWork接続テスト失敗", {
          description: "APIトークンを入力してください",
        });
      }
    }, 1500);
  };

  const getTestIcon = (status: "idle" | "testing" | "success" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dify デフォルトAPI設定 */}
      <Card>
        <CardHeader>
          <CardTitle>Dify デフォルトAPI設定</CardTitle>
          <CardDescription>
            AIエージェントで「デフォルトを使用」をONにした場合に使用されるAPIキー
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* エージェントAPI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-500" />
                <Label className="font-semibold">エージェントAPI</Label>
              </div>
              <div className="flex items-center gap-2">
                {testResults.difyAgent === "testing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                )}
                {getTestIcon(testResults.difyAgent)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testDifyAgentConnection}
                  disabled={testResults.difyAgent === "testing"}
                  className="gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  テスト
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-violet-200 dark:border-violet-800">
              <div className="space-y-2">
                <Label htmlFor="dify-agent-key">APIキー</Label>
                <Input
                  id="dify-agent-key"
                  type="password"
                  value={difySettings.agentApiKey}
                  onChange={(e) => handleDifyChange({ agentApiKey: e.target.value })}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  「app-」で始まるAPIキー
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dify-agent-endpoint">エンドポイント</Label>
                <Input
                  id="dify-agent-endpoint"
                  value={difySettings.agentEndpoint}
                  onChange={(e) => handleDifyChange({ agentEndpoint: e.target.value })}
                  placeholder="https://api.dify.ai/v1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ナレッジデータベースAPI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-500" />
                <Label className="font-semibold">ナレッジデータベースAPI</Label>
              </div>
              <div className="flex items-center gap-2">
                {testResults.difyKnowledge === "testing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                )}
                {getTestIcon(testResults.difyKnowledge)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testDifyKnowledgeConnection}
                  disabled={testResults.difyKnowledge === "testing"}
                  className="gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  テスト
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-violet-200 dark:border-violet-800">
              <div className="space-y-2">
                <Label htmlFor="dify-knowledge-key">APIキー</Label>
                <Input
                  id="dify-knowledge-key"
                  type="password"
                  value={difySettings.knowledgeApiKey}
                  onChange={(e) => handleDifyChange({ knowledgeApiKey: e.target.value })}
                  placeholder="dataset-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  「dataset-」で始まるAPIキー
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dify-knowledge-endpoint">エンドポイント</Label>
                <Input
                  id="dify-knowledge-endpoint"
                  value={difySettings.knowledgeEndpoint}
                  onChange={(e) => handleDifyChange({ knowledgeEndpoint: e.target.value })}
                  placeholder="https://api.dify.ai/v1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>SMTPサーバ設定</CardTitle>
                <CardDescription>
                  メール通知用のSMTPサーバ設定を行います
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={smtpSettings.enabled}
                  onCheckedChange={(checked) => handleSmtpChange({ enabled: checked })}
                />
                <Label>有効</Label>
              </div>
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.smtp)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSmtpConnection}
                  disabled={testResults.smtp === "testing" || !smtpSettings.enabled}
                  className="gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  接続テスト
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTPホスト *</Label>
              <Input
                id="smtp-host"
                value={smtpSettings.host}
                onChange={(e) => handleSmtpChange({ host: e.target.value })}
                placeholder="smtp.example.com"
                disabled={!smtpSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                SMTPサーバのホスト名またはIPアドレス
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">ポート *</Label>
              <Input
                id="smtp-port"
                value={smtpSettings.port}
                onChange={(e) => handleSmtpChange({ port: e.target.value })}
                placeholder="587"
                disabled={!smtpSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                一般的なポート: 25, 465(SSL), 587(TLS)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-username">ユーザー名</Label>
              <Input
                id="smtp-username"
                value={smtpSettings.username}
                onChange={(e) => handleSmtpChange({ username: e.target.value })}
                placeholder="user@example.com"
                disabled={!smtpSettings.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">パスワード</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtpSettings.password}
                onChange={(e) => handleSmtpChange({ password: e.target.value })}
                placeholder="••••••••"
                disabled={!smtpSettings.enabled}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="smtp-encryption">暗号化</Label>
              <Select
                value={smtpSettings.encryption}
                onValueChange={(value: "none" | "ssl" | "tls") => 
                  handleSmtpChange({ encryption: value })
                }
                disabled={!smtpSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="tls">TLS (推奨)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from-address">送信元メールアドレス *</Label>
              <Input
                id="smtp-from-address"
                type="email"
                value={smtpSettings.fromAddress}
                onChange={(e) => handleSmtpChange({ fromAddress: e.target.value })}
                placeholder="noreply@example.com"
                disabled={!smtpSettings.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from-name">送信者名</Label>
              <Input
                id="smtp-from-name"
                value={smtpSettings.fromName}
                onChange={(e) => handleSmtpChange({ fromName: e.target.value })}
                placeholder="DENCO通知システム"
                disabled={!smtpSettings.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ChatWork設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>ChatWork連携設定</CardTitle>
                <CardDescription>
                  ChatWorkへの通知連携設定を行います
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={chatworkSettings.enabled}
                  onCheckedChange={(checked) => handleChatworkChange({ enabled: checked })}
                />
                <Label>有効</Label>
              </div>
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.chatwork)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testChatworkConnection}
                  disabled={testResults.chatwork === "testing" || !chatworkSettings.enabled}
                  className="gap-1"
                >
                  <TestTube className="h-4 w-4" />
                  接続テスト
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chatwork-token">APIトークン *</Label>
              <Input
                id="chatwork-token"
                type="password"
                value={chatworkSettings.apiToken}
                onChange={(e) => handleChatworkChange({ apiToken: e.target.value })}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={!chatworkSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                ChatWorkの「動作設定」→「API」から取得できます
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatwork-room">デフォルトルームID</Label>
              <Input
                id="chatwork-room"
                value={chatworkSettings.defaultRoomId}
                onChange={(e) => handleChatworkChange({ defaultRoomId: e.target.value })}
                placeholder="123456789"
                disabled={!chatworkSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                通知先のデフォルトルームID（通知ルールで個別設定も可能）
              </p>
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">ChatWork APIトークンの取得方法</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>ChatWorkにログイン</li>
              <li>右上のプロフィールアイコン → 「動作設定」をクリック</li>
              <li>「API」タブを選択</li>
              <li>「APIトークン」の「発行」ボタンをクリック</li>
              <li>表示されたトークンをコピーして上記に貼り付け</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

