"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Bot, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Settings2, 
  MoreVertical,
  Building,
  Search,
  X,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * AIエージェント設定
 * 
 * 【バックエンド開発者へ】
 * このコンポーネントは以下のAPIエンドポイントを呼び出す想定です：
 * 
 * 1. エージェント一覧取得: GET /api/agents
 *    - レスポンス: AIAgent[]
 * 
 * 2. エージェント作成: POST /api/agents
 *    - リクエストボディ: AIAgent型（idなし）
 *    - レスポンス: AIAgent（id付き）
 * 
 * 3. エージェント更新: PUT /api/agents/:id
 *    - リクエストボディ: AIAgent型
 *    - レスポンス: AIAgent
 * 
 * 4. エージェント削除: DELETE /api/agents/:id
 *    - レスポンス: { success: boolean }
 * 
 * 5. 部署一覧取得: GET /api/departments
 *    - レスポンス: Department[]
 * 
 * 6. テナント一覧取得: GET /api/tenants
 *    - レスポンス: Tenant[]
 */

interface AIAgent {
  id: string;
  name: string;
  description: string;
  departmentId: string | null;
  useDefaultAgentApi: boolean;
  agentApiKey: string;
  agentEndpoint: string;
  useDefaultKnowledgeApi: boolean;
  knowledgeApiKey: string;
  knowledgeEndpoint: string;
  isActive: boolean;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  tenantId: string;
  status: "active" | "inactive";
}

interface Tenant {
  id: string;
  name: string;
  status: "active" | "inactive";
}

interface DifySettingsProps {
  settings: {
    difyAgentApiKey: string;
    difyAgentEndpoint: string;
    difyKnowledgeApiKey: string;
    difyKnowledgeEndpoint: string;
  };
  onSettingsChange: (settings: any) => void;
}

// サンプルテナントデータ
const sampleTenants: Tenant[] = [
  { id: "1", name: "株式会社ABC", status: "active" },
  { id: "2", name: "株式会社XYZ", status: "active" },
  { id: "3", name: "株式会社123", status: "inactive" },
];

// サンプル部署データ
const sampleDepartments: Department[] = [
  { id: "dept-1", name: "営業部", tenantId: "1", status: "active" },
  { id: "dept-2", name: "カスタマーサポート", tenantId: "1", status: "active" },
  { id: "dept-3", name: "技術部", tenantId: "2", status: "active" },
  { id: "dept-4", name: "管理部", tenantId: "2", status: "active" },
  { id: "dept-5", name: "総務部", tenantId: "1", status: "active" },
  { id: "dept-6", name: "人事部", tenantId: "2", status: "active" },
];

// サンプルエージェントデータ
const initialAgents: AIAgent[] = [
  {
    id: "agent-1",
    name: "カスタマーサポート",
    description: "お客様からのお問い合わせに対応するエージェント",
    departmentId: "dept-2",
    useDefaultAgentApi: true,
    agentApiKey: "",
    agentEndpoint: "",
    useDefaultKnowledgeApi: true,
    knowledgeApiKey: "",
    knowledgeEndpoint: "",
    isActive: true,
    createdAt: "2025-01-15T10:00:00",
  },
  {
    id: "agent-2",
    name: "営業アシスタント",
    description: "営業部門の問い合わせ対応と商品案内",
    departmentId: "dept-1",
    useDefaultAgentApi: false,
    agentApiKey: "app-sales-agent-key-xxx",
    agentEndpoint: "https://api.dify.ai/v1",
    useDefaultKnowledgeApi: false,
    knowledgeApiKey: "dataset-sales-knowledge-xxx",
    knowledgeEndpoint: "https://api.dify.ai/v1",
    isActive: true,
    createdAt: "2025-02-20T14:30:00",
  },
];

const emptyAgent: Omit<AIAgent, "id" | "createdAt"> = {
  name: "",
  description: "",
  departmentId: null,
  useDefaultAgentApi: true,
  agentApiKey: "",
  agentEndpoint: "https://api.dify.ai/v1",
  useDefaultKnowledgeApi: true,
  knowledgeApiKey: "",
  knowledgeEndpoint: "https://api.dify.ai/v1",
  isActive: true,
};

export default function DifySettings({ settings, onSettingsChange }: DifySettingsProps) {
  const [agents, setAgents] = useState<AIAgent[]>(initialAgents);
  const [tenants] = useState<Tenant[]>(sampleTenants);
  const [departments] = useState<Department[]>(sampleDepartments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [formData, setFormData] = useState<Omit<AIAgent, "id" | "createdAt">>(emptyAgent);

  // Department selection modal state
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");

  // 既に他のエージェントに紐づけされている部署IDリスト
  const linkedDepartmentIds = useMemo(() => {
    return agents
      .filter(agent => agent.departmentId && agent.id !== selectedAgent?.id)
      .map(agent => agent.departmentId);
  }, [agents, selectedAgent]);

  // フィルタリングされた部署リスト
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      // アクティブな部署のみ
      if (dept.status !== "active") return false;
      // テナントでフィルター
      if (selectedTenantId && dept.tenantId !== selectedTenantId) return false;
      // 検索
      if (departmentSearchTerm && !dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [departments, selectedTenantId, departmentSearchTerm]);

  // 部署名を取得
  const getDepartmentName = (departmentId: string | null): string => {
    if (!departmentId) return "未設定";
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : "不明な部署";
  };

  // テナント名を取得
  const getTenantName = (tenantId: string): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : "不明なテナント";
  };

  // 部署のテナント名を取得
  const getDepartmentTenantName = (departmentId: string | null): string => {
    if (!departmentId) return "";
    const dept = departments.find(d => d.id === departmentId);
    if (!dept) return "";
    return getTenantName(dept.tenantId);
  };

  const handleAddAgent = () => {
    if (!formData.name.trim()) {
      toast.error("エージェント名を入力してください");
      return;
    }

    const newAgent: AIAgent = {
      ...formData,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setAgents([...agents, newAgent]);
    setIsAddDialogOpen(false);
    setFormData(emptyAgent);
    toast.success("エージェントを追加しました");
  };

  const handleEditAgent = () => {
    if (!selectedAgent || !formData.name.trim()) {
      toast.error("エージェント名を入力してください");
      return;
    }

    setAgents(agents.map(agent => 
      agent.id === selectedAgent.id 
        ? { ...agent, ...formData }
        : agent
    ));
    setIsEditDialogOpen(false);
    setSelectedAgent(null);
    setFormData(emptyAgent);
    toast.success("エージェントを更新しました");
  };

  const handleDeleteAgent = () => {
    if (!selectedAgent) return;

    setAgents(agents.filter(agent => agent.id !== selectedAgent.id));
    setIsDeleteDialogOpen(false);
    setSelectedAgent(null);
    toast.success("エージェントを削除しました");
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, isActive: !agent.isActive }
        : agent
    ));
  };

  const openEditDialog = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      departmentId: agent.departmentId,
      useDefaultAgentApi: agent.useDefaultAgentApi,
      agentApiKey: agent.agentApiKey,
      agentEndpoint: agent.agentEndpoint,
      useDefaultKnowledgeApi: agent.useDefaultKnowledgeApi,
      knowledgeApiKey: agent.knowledgeApiKey,
      knowledgeEndpoint: agent.knowledgeEndpoint,
      isActive: agent.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  const openDepartmentModal = () => {
    setSelectedTenantId("");
    setDepartmentSearchTerm("");
    setIsDepartmentModalOpen(true);
  };

  const selectDepartment = (departmentId: string | null) => {
    setFormData({ ...formData, departmentId });
    setIsDepartmentModalOpen(false);
  };

  const AgentForm = () => (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">エージェント名 *</Label>
          <Input
            id="agent-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="カスタマーサポート"
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agent-description">説明</Label>
          <Input
            id="agent-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="このエージェントの役割を簡潔に説明"
          />
        </div>
      </div>

      <Separator />

      {/* 部署紐づけ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <Label className="text-base font-semibold">紐づけ部署</Label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 border rounded-lg bg-muted/50">
            {formData.departmentId ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{getDepartmentName(formData.departmentId)}</p>
                  <p className="text-sm text-muted-foreground">{getDepartmentTenantName(formData.departmentId)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFormData({ ...formData, departmentId: null })}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">部署が選択されていません</p>
            )}
          </div>
          <Button variant="outline" onClick={openDepartmentModal}>
            選択
          </Button>
        </div>
      </div>

      <Separator />

      {/* エージェントAPI設定 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <Label className="text-base font-semibold">エージェントAPI</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.useDefaultAgentApi}
              onCheckedChange={(checked) => setFormData({ ...formData, useDefaultAgentApi: checked })}
            />
            <Label className="text-sm text-muted-foreground">デフォルトを使用</Label>
          </div>
        </div>

        {!formData.useDefaultAgentApi && (
          <div className="space-y-3 pl-6 border-l-2 border-primary/20">
            <div className="space-y-2">
              <Label htmlFor="agent-api-key">APIキー</Label>
              <Input
                id="agent-api-key"
                type="password"
                value={formData.agentApiKey}
                onChange={(e) => setFormData({ ...formData, agentApiKey: e.target.value })}
                placeholder="app-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-endpoint">エンドポイント</Label>
              <Input
                id="agent-endpoint"
                value={formData.agentEndpoint}
                onChange={(e) => setFormData({ ...formData, agentEndpoint: e.target.value })}
                placeholder="https://api.dify.ai/v1"
              />
            </div>
          </div>
        )}

        {formData.useDefaultAgentApi && (
          <p className="text-sm text-muted-foreground pl-6">
            「外部サーバ・API」タブで設定されたデフォルトのAPIキーを使用します
          </p>
        )}
      </div>

      <Separator />

      {/* ナレッジデータベースAPI設定 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <Label className="text-base font-semibold">ナレッジデータベースAPI</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.useDefaultKnowledgeApi}
              onCheckedChange={(checked) => setFormData({ ...formData, useDefaultKnowledgeApi: checked })}
            />
            <Label className="text-sm text-muted-foreground">デフォルトを使用</Label>
          </div>
        </div>

        {!formData.useDefaultKnowledgeApi && (
          <div className="space-y-3 pl-6 border-l-2 border-primary/20">
            <div className="space-y-2">
              <Label htmlFor="knowledge-api-key">APIキー</Label>
              <Input
                id="knowledge-api-key"
                type="password"
                value={formData.knowledgeApiKey}
                onChange={(e) => setFormData({ ...formData, knowledgeApiKey: e.target.value })}
                placeholder="dataset-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-endpoint">エンドポイント</Label>
              <Input
                id="knowledge-endpoint"
                value={formData.knowledgeEndpoint}
                onChange={(e) => setFormData({ ...formData, knowledgeEndpoint: e.target.value })}
                placeholder="https://api.dify.ai/v1"
              />
            </div>
          </div>
        )}

        {formData.useDefaultKnowledgeApi && (
          <p className="text-sm text-muted-foreground pl-6">
            「外部サーバ・API」タブで設定されたデフォルトのAPIキーを使用します
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">AIエージェント</h2>
          <p className="text-sm text-muted-foreground">
            通話応対用のAIエージェントを管理します
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData(emptyAgent);
            setSelectedAgent(null);
            setIsAddDialogOpen(true);
          }}
          className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          エージェント追加
        </Button>
      </div>

      {/* エージェント一覧 */}
      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">エージェントがありません</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              「エージェント追加」ボタンから最初のAIエージェントを作成してください
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setFormData(emptyAgent);
                setSelectedAgent(null);
                setIsAddDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              エージェント追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                !agent.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* ステータスインジケーター */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                agent.isActive ? 'bg-gradient-to-b from-green-400 to-emerald-500' : 'bg-gray-300'
              }`} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      agent.isActive 
                        ? 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Bot className={`h-5 w-5 ${
                        agent.isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      {agent.description && (
                        <CardDescription className="mt-1">
                          {agent.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(agent)}>
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(agent)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 紐づけ部署 */}
                {agent.departmentId && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium">{getDepartmentName(agent.departmentId)}</span>
                      <span className="text-muted-foreground ml-2">({getDepartmentTenantName(agent.departmentId)})</span>
                    </div>
                  </div>
                )}

                {/* API設定サマリー */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Bot className="h-3 w-3" />
                    {agent.useDefaultAgentApi ? 'デフォルトAPI' : 'カスタムAPI'}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Database className="h-3 w-3" />
                    {agent.useDefaultKnowledgeApi ? 'デフォルトKB' : 'カスタムKB'}
                  </Badge>
                </div>

                {/* アクション */}
                <div className="flex items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={agent.isActive}
                      onCheckedChange={() => toggleAgentStatus(agent.id)}
                    />
                    <Label className="text-sm">
                      {agent.isActive ? '有効' : '無効'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新規エージェント作成
            </DialogTitle>
            <DialogDescription>
              新しいAIエージェントを作成します
            </DialogDescription>
          </DialogHeader>
          <AgentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddAgent} className="bg-gradient-to-r from-violet-500 to-purple-600">
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              エージェント編集
            </DialogTitle>
            <DialogDescription>
              {selectedAgent?.name}の設定を編集します
            </DialogDescription>
          </DialogHeader>
          <AgentForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditAgent}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>エージェントを削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedAgent?.name}」を削除してもよろしいですか？
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 部署選択モーダル */}
      <Dialog open={isDepartmentModalOpen} onOpenChange={setIsDepartmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              部署を選択
            </DialogTitle>
            <DialogDescription>
              エージェントに紐づける部署を選択してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* テナント選択 */}
            <div className="space-y-2">
              <Label>テナント</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="すべてのテナント" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべてのテナント</SelectItem>
                  {tenants.filter(t => t.status === "active").map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 検索 */}
            <div className="space-y-2">
              <Label>部署を検索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={departmentSearchTerm}
                  onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                  placeholder="部署名で検索..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* 部署リスト */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {/* 未設定オプション */}
              <button
                onClick={() => selectDepartment(null)}
                className={`w-full flex items-center justify-between p-3 hover:bg-muted/50 border-b transition-colors ${
                  formData.departmentId === null ? 'bg-muted' : ''
                }`}
              >
                <span className="text-muted-foreground">未設定</span>
                {formData.departmentId === null && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>

              {filteredDepartments.length > 0 ? (
                filteredDepartments.map(dept => {
                  const isLinked = linkedDepartmentIds.includes(dept.id);
                  const isSelected = formData.departmentId === dept.id;

                  return (
                    <button
                      key={dept.id}
                      onClick={() => !isLinked && selectDepartment(dept.id)}
                      disabled={isLinked}
                      className={`w-full flex items-center justify-between p-3 hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                        isSelected ? 'bg-muted' : ''
                      } ${isLinked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-left">
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">{getTenantName(dept.tenantId)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLinked && (
                          <Badge variant="secondary" className="text-xs">
                            使用中
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  該当する部署がありません
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepartmentModalOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
