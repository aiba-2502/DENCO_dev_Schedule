"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Database, 
  User, 
  Eye, 
  FileText,
  Clock,
  Building,
  Phone,
  Sparkles,
  Send,
  Bot,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  BookOpen,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  ExternalLink
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * ナレッジデータベース
 * 
 * 【バックエンド開発者へ】
 * このコンポーネントは以下のAPIエンドポイントを呼び出す想定です：
 * 
 * 1. お客様検索: GET /api/knowledge/customers?q=xxx&tags=xxx&callDirection=xxx&dateFrom=xxx&dateTo=xxx
 *    - レスポンス: { results: CustomerInquiry[], total: number }
 * 
 * 2. 社内マニュアル検索: GET /api/knowledge/manuals?q=xxx&category=xxx&tags=xxx
 *    - レスポンス: { results: KnowledgeItem[], total: number }
 * 
 * 3. AI検索（チャット）: POST /api/knowledge/ai-search
 *    - リクエストボディ: { message: string, searchType: string, conversationId?: string }
 *    - レスポンス: { answer: string, sources: any[], conversationId: string }
 */

// 部署リスト
const departments = [
  { id: "dept-1", name: "営業部" },
  { id: "dept-2", name: "カスタマーサポート" },
  { id: "dept-3", name: "技術部" },
  { id: "dept-4", name: "総務部" },
  { id: "dept-5", name: "経理部" },
];

// サンプル社内マニュアルデータ
const manualData = [
  {
    id: "kb-1",
    title: "請求書の発行について",
    content: "請求書は毎月末日に発行され、翌月10日までにお支払いください。支払い方法は銀行振込、クレジットカード、口座振替から選択できます。",
    category: "請求・支払い",
    departmentId: "dept-5",
    tags: ["請求書", "支払い", "銀行振込", "クレジットカード"],
    lastUpdated: "2025-04-25T10:30:00",
  },
  {
    id: "kb-2", 
    title: "パスワードリセットの手順",
    content: "パスワードをリセットするには、ログイン画面の「パスワードを忘れた方」をクリックし、登録済みのメールアドレスを入力してください。リセット用のリンクが送信されます。",
    category: "アカウント管理",
    departmentId: "dept-3",
    tags: ["パスワード", "リセット", "ログイン", "メール"],
    lastUpdated: "2025-04-20T14:15:00",
  },
  {
    id: "kb-3",
    title: "サービス利用料金について",
    content: "基本プランは月額5,000円、プレミアムプランは月額10,000円です。年間契約の場合は10%割引が適用されます。",
    category: "料金・プラン",
    departmentId: "dept-1",
    tags: ["料金", "プラン", "基本", "プレミアム", "年間契約"],
    lastUpdated: "2025-04-18T09:45:00",
  },
  {
    id: "kb-4",
    title: "解約手続きについて",
    content: "解約は月末までにマイページから申請してください。日割り計算は行っておりませんので、月初での解約がお勧めです。",
    category: "契約・解約",
    departmentId: "dept-4",
    tags: ["解約", "手続き", "マイページ"],
    lastUpdated: "2025-04-15T11:20:00",
  },
  {
    id: "kb-5",
    title: "サポート受付時間",
    content: "電話サポートは平日9:00〜18:00、メールサポートは24時間受付しております。土日祝日のお問い合わせは翌営業日の対応となります。",
    category: "サポート",
    departmentId: "dept-2",
    tags: ["サポート", "受付時間", "電話", "メール"],
    lastUpdated: "2025-04-10T16:00:00",
  }
];

// サンプルお客様データ
const customerData = [
  {
    id: "cust-1",
      name: "山田 太郎",
    company: "株式会社ABC",
    phone: "090-1234-5678",
    tags: ["VIP", "長期顧客"],
    lastCallDate: "2025-04-29T14:30:00",
    callDirection: "incoming" as const,
    contactType: "phone" as const,
    summary: "請求書の支払い期限について質問。銀行振込での支払い方法を確認。次回から口座振替への変更を希望。",
  },
  {
    id: "cust-2",
      name: "佐藤 花子", 
    company: "株式会社ABC",
    phone: "090-8765-4321",
    tags: ["新規", "要フォロー"],
    lastCallDate: "2025-04-29T10:15:00",
    callDirection: "incoming" as const,
    contactType: "phone" as const,
    summary: "ログインできない問題。パスワードリセットを実行したが、メールが届かない。メールアドレスの変更が必要。",
  },
  {
    id: "cust-3",
      name: "鈴木 一郎",
    company: "株式会社XYZ",
    phone: "090-2345-6789",
    tags: ["見込み客"],
    lastCallDate: "2025-04-28T16:20:00",
    callDirection: "outgoing" as const,
    contactType: "fax" as const,
    summary: "プレミアムプランへのアップグレードを検討。年間契約の割引条件と機能差について詳細を確認。",
  },
  {
    id: "cust-4",
    name: "田中 美咲",
    company: "有限会社DEF",
    phone: "080-1111-2222",
    tags: ["VIP", "大口"],
    lastCallDate: "2025-04-27T09:00:00",
    callDirection: "incoming" as const,
    contactType: "phone" as const,
    summary: "複数アカウントの一括管理について相談。管理者権限の設定方法を案内。",
  },
  {
    id: "cust-5",
    name: "高橋 健太",
    company: "株式会社GHI",
    phone: "090-3333-4444",
    tags: ["クレーム対応中"],
    lastCallDate: "2025-04-26T15:45:00",
    callDirection: "outgoing" as const,
    contactType: "fax" as const,
    summary: "前回のサービス障害についてのフォローアップ。お詫びと今後の対策について説明。",
  }
];

// お客様タグ
const customerTags = [
  { id: "ctag-1", name: "VIP", color: "#F59E0B" },
  { id: "ctag-2", name: "長期顧客", color: "#10B981" },
  { id: "ctag-3", name: "新規", color: "#3B82F6" },
  { id: "ctag-4", name: "要フォロー", color: "#EF4444" },
  { id: "ctag-5", name: "見込み客", color: "#8B5CF6" },
  { id: "ctag-6", name: "大口", color: "#06B6D4" },
  { id: "ctag-7", name: "クレーム対応中", color: "#EC4899" },
];

// マニュアルタグ
const manualTags = [
  { id: "tag-1", name: "請求書", color: "#3B82F6" },
  { id: "tag-2", name: "支払い", color: "#10B981" },
  { id: "tag-3", name: "パスワード", color: "#F59E0B" },
  { id: "tag-4", name: "ログイン", color: "#EF4444" },
  { id: "tag-5", name: "料金", color: "#8B5CF6" },
  { id: "tag-6", name: "プラン", color: "#06B6D4" },
  { id: "tag-7", name: "解約", color: "#EC4899" },
  { id: "tag-8", name: "サポート", color: "#14B8A6" },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  timestamp: Date;
}

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}

/**
 * URLが有効かどうかを厳密にチェック
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // http または https のみ許可
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // ホスト名が存在するか
    if (!url.hostname || url.hostname.length === 0) {
      return false;
    }
    // ホスト名に少なくとも1つのドットが含まれる（例: example.com）
    // ただし localhost は許可
    if (url.hostname !== 'localhost' && !url.hostname.includes('.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * マークダウン形式のリンクをパースしてReact要素に変換
 * 形式: [テキスト](URL)
 */
function parseMarkdownLinks(content: string): React.ReactNode[] {
  // マークダウンリンクの正規表現
  // [任意のテキスト](URL) の形式にマッチ
  // - テキスト部分: 角括弧内の任意の文字（空でない）
  // - URL部分: 丸括弧内の任意の文字（空でない、スペースなし）
  const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchIndex = match.index;

    // マッチ前のテキストを追加
    if (matchIndex > lastIndex) {
      const textBefore = content.slice(lastIndex, matchIndex);
      elements.push(<span key={`text-${keyIndex++}`}>{textBefore}</span>);
    }

    // URLが有効かチェック
    if (isValidUrl(url)) {
      // 有効なURLの場合、ボタンリンクとして表示
      elements.push(
        <a
          key={`link-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 mx-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
        >
          {linkText}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    } else {
      // 無効なURLの場合、プレーンテキストとして表示
      elements.push(<span key={`invalid-${keyIndex++}`}>{fullMatch}</span>);
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // 残りのテキストを追加
  if (lastIndex < content.length) {
    elements.push(<span key={`text-${keyIndex++}`}>{content.slice(lastIndex)}</span>);
  }

  // マッチがなかった場合は元のテキストを返す
  if (elements.length === 0) {
    return [<span key="text-0">{content}</span>];
  }

  return elements;
}

export default function KnowledgeDatabase() {
  const [searchMode, setSearchMode] = useState<"keyword" | "ai">("ai");
  
  // Search type (customer or manual)
  const [searchType, setSearchType] = useState<"customer" | "manual">("customer");
  
  // Common search state
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Customer search filters
  const [selectedCustomerTags, setSelectedCustomerTags] = useState<string[]>([]);
  const [callDirection, setCallDirection] = useState<string>("all");
  const [contactType, setContactType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Manual search filters
  const [selectedManualTags, setSelectedManualTags] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  // Dialog state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Chatbot Backend API URL
  const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || "http://localhost:3001";

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 5秒以上のローディング時にメッセージを表示
  useEffect(() => {
    if (!isAiLoading) {
      setShowLongLoadingMessage(false);
      setLoadingDots(1);
      return;
    }

    // 5秒後にメッセージを表示
    const timer = setTimeout(() => {
      setShowLongLoadingMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAiLoading]);

  // ドットのアニメーション
  useEffect(() => {
    if (!showLongLoadingMessage) return;

    const interval = setInterval(() => {
      setLoadingDots(prev => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [showLongLoadingMessage]);

  // お客様データのフィルタリング
  const filteredCustomers = customerData.filter((item) => {
    const matchesSearch = 
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm);

    const matchesTags = selectedCustomerTags.length === 0 || 
      selectedCustomerTags.some(tagName => item.tags.includes(tagName));

    const matchesDirection = callDirection === "all" || item.callDirection === callDirection;
    
    const matchesContactType = contactType === "all" || item.contactType === contactType;

    const matchesDateFrom = !dateFrom || new Date(item.lastCallDate) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(item.lastCallDate) <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesTags && matchesDirection && matchesContactType && matchesDateFrom && matchesDateTo;
  });

  // マニュアルデータのフィルタリング
  const filteredManuals = manualData.filter((item) => {
    const matchesSearch = 
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    const matchesDepartment = departmentFilter === "all" || item.departmentId === departmentFilter;
    
    const matchesTags = selectedManualTags.length === 0 || 
      selectedManualTags.some(tagName => item.tags.includes(tagName));

    return matchesSearch && matchesCategory && matchesDepartment && matchesTags;
  });
  
  // 部署名を取得
  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : "";
  };

  const handleCustomerTagToggle = (tagName: string) => {
    setSelectedCustomerTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(name => name !== tagName)
        : [...prev, tagName]
    );
  };

  const handleManualTagToggle = (tagName: string) => {
    setSelectedManualTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(name => name !== tagName)
        : [...prev, tagName]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCustomerTags([]);
    setSelectedManualTags([]);
    setCategoryFilter("all");
    setDepartmentFilter("all");
    setCallDirection("all");
    setContactType("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleSearch = () => {
    // 検索実行（現在はフィルタリングで自動的に反映されるが、
    // バックエンドAPI呼び出し時はここで実行）
    console.log("Search executed:", { searchTerm, searchType });
  };

  const handleItemView = (item: any) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  // AI Chat handlers - Streaming implementation
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageText = chatInput.trim();
    setChatInput("");
    setIsAiLoading(true);

    // Create AbortController for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId,
          user: "denco-user",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "チャットリクエストに失敗しました");
        } catch {
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
      }

      const data = await response.json();
      
      // 会話IDを保存
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // AIメッセージを追加
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: data.answer || "応答がありませんでした",
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      
      // エラーメッセージを追加
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: `申し訳ございません。エラーが発生しました: ${error.message || "不明なエラー"}\n\nバックエンドサーバーが起動しているか確認してください。`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsAiLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setChatMessages([]);
    setConversationId("");
    setIsAiLoading(false);
  };

  const hasActiveFilters = searchType === "customer" 
    ? (selectedCustomerTags.length > 0 || callDirection !== "all" || contactType !== "all" || dateFrom || dateTo)
    : (selectedManualTags.length > 0 || categoryFilter !== "all" || departmentFilter !== "all");

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* メインコンテンツ - 検索モード切替 */}
      <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "keyword" | "ai")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI検索
            </TabsTrigger>
            <TabsTrigger value="keyword" className="gap-2">
              <Search className="h-4 w-4" />
              キーワード検索
            </TabsTrigger>
          </TabsList>

          {/* キーワード検索 */}
          <TabsContent value="keyword" className="flex-1 mt-0 min-h-0">
            <div className="flex gap-6 h-full">
              {/* 検索パネル */}
              <Card className="w-72 shrink-0 flex flex-col">
                <CardContent className="p-4 space-y-4 flex-1 overflow-auto">
                  {/* 検索タイプ切替 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">検索対象</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={searchType === "customer" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSearchType("customer")}
                        className="gap-1.5"
                      >
                        <Users className="h-4 w-4" />
                        お客様
                      </Button>
                      <Button
                        variant={searchType === "manual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSearchType("manual")}
                        className="gap-1.5"
                      >
                        <BookOpen className="h-4 w-4" />
                        社内マニュアル
                      </Button>
                    </div>
      </div>

                  {/* キーワード入力 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">キーワード</Label>
            <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                        placeholder={searchType === "customer" ? "名前、会社名、電話番号..." : "検索ワードを入力..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10"
              />
                    </div>
            </div>

                  {/* 検索ボタン */}
                  <Button onClick={handleSearch} className="w-full gap-2">
                    <Search className="h-4 w-4" />
                    検索
                  </Button>

                  {/* 詳細検索条件（折りたたみ） */}
                  <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          検索条件
                          {hasActiveFilters && (
                            <Badge variant="secondary" className="text-xs px-1.5">
                              設定中
                            </Badge>
                          )}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      {searchType === "customer" ? (
                        <>
                          {/* 受信・送信フィルター */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">通話種別</Label>
                            <Select value={callDirection} onValueChange={setCallDirection}>
                              <SelectTrigger>
                                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                                <SelectItem value="all">すべて</SelectItem>
                                <SelectItem value="incoming">
                                  <span className="flex items-center gap-2">
                                    <PhoneIncoming className="h-4 w-4" />
                                    受信のみ
                                  </span>
                                </SelectItem>
                                <SelectItem value="outgoing">
                                  <span className="flex items-center gap-2">
                                    <PhoneOutgoing className="h-4 w-4" />
                                    送信のみ
                                  </span>
                                </SelectItem>
                </SelectContent>
              </Select>
                          </div>

                          {/* 連絡種別（電話/FAX） */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">連絡種別</Label>
                            <Select value={contactType} onValueChange={setContactType}>
                              <SelectTrigger>
                                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                                <SelectItem value="all">すべて</SelectItem>
                                <SelectItem value="phone">
                                  <span className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    電話
                                  </span>
                                </SelectItem>
                                <SelectItem value="fax">
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    FAX
                                  </span>
                                </SelectItem>
                </SelectContent>
              </Select>
                          </div>

                          {/* 最終着信日時 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">最終着信日</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">から</Label>
                                <Input
                                  type="date"
                                  value={dateFrom}
                                  onChange={(e) => setDateFrom(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">まで</Label>
                                <Input
                                  type="date"
                                  value={dateTo}
                                  onChange={(e) => setDateTo(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
            </div>

                          {/* お客様タグ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">タグ</Label>
                              {selectedCustomerTags.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCustomerTags.length}個
                                </Badge>
                )}
              </div>
                            <div className="flex flex-wrap gap-1.5">
                              {customerTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                                  className={`cursor-pointer transition-all text-xs ${
                                    selectedCustomerTags.includes(tag.name)
                                      ? 'border-transparent shadow-sm'
                        : 'hover:bg-accent'
                    }`}
                                  style={selectedCustomerTags.includes(tag.name) ? {
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                      borderColor: 'transparent'
                    } : {}}
                                  onClick={() => handleCustomerTagToggle(tag.name)}
                  >
                                  {selectedCustomerTags.includes(tag.name) && "✓ "}
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
                        </>
                      ) : (
                        <>
                          {/* 部署 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">部署</Label>
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="すべて" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">すべての部署</SelectItem>
                                {departments.map(dept => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
          </div>

                          {/* カテゴリ */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">カテゴリー</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのカテゴリー</SelectItem>
                  <SelectItem value="請求・支払い">請求・支払い</SelectItem>
                  <SelectItem value="アカウント管理">アカウント管理</SelectItem>
                  <SelectItem value="料金・プラン">料金・プラン</SelectItem>
                                <SelectItem value="契約・解約">契約・解約</SelectItem>
                                <SelectItem value="サポート">サポート</SelectItem>
                </SelectContent>
              </Select>
            </div>

                          {/* マニュアルタグ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">タグ</Label>
                              {selectedManualTags.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedManualTags.length}個
                                </Badge>
                )}
              </div>
                            <div className="flex flex-wrap gap-1.5">
                              {manualTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                                  className={`cursor-pointer transition-all text-xs ${
                                    selectedManualTags.includes(tag.name)
                                      ? 'border-transparent shadow-sm'
                        : 'hover:bg-accent'
                    }`}
                                  style={selectedManualTags.includes(tag.name) ? {
                      backgroundColor: tag.color,
                      color: isLightColor(tag.color) ? "#000000" : "#FFFFFF",
                      borderColor: 'transparent'
                    } : {}}
                                  onClick={() => handleManualTagToggle(tag.name)}
                  >
                                  {selectedManualTags.includes(tag.name) && "✓ "}
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
                        </>
                      )}

                      {/* クリアボタン */}
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} size="sm" className="w-full gap-2">
                          <X className="h-4 w-4" />
                          条件をクリア
                        </Button>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
        </CardContent>
      </Card>

              {/* 検索結果 */}
              <Card className="flex-1 flex flex-col min-w-0">
                <CardHeader className="pb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {searchType === "customer" ? (
                        <>
                          <Users className="h-5 w-5" />
                          お客様検索結果
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5" />
                          社内マニュアル検索結果
                        </>
                      )}
                    </CardTitle>
                    <Badge variant="secondary">
                      {searchType === "customer" ? filteredCustomers.length : filteredManuals.length}件
                    </Badge>
                  </div>
            </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-6 pb-6">
                    <div className="space-y-3 pr-4">
                      {searchType === "customer" ? (
                        // お客様検索結果
                        filteredCustomers.length > 0 ? (
                          filteredCustomers.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                              onClick={() => handleItemView(item)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                        {item.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Building className="h-3 w-3" />
                                        {item.company}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                      {item.callDirection === "incoming" ? (
                                        <PhoneIncoming className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {formatDateShort(item.lastCallDate)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {item.summary}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.tags.map(tag => {
                                      const tagInfo = customerTags.find(t => t.name === tag);
                                      return (
                                        <Badge 
                                          key={tag} 
                                          variant="secondary" 
                                          className="text-xs"
                                          style={tagInfo ? {
                                            backgroundColor: tagInfo.color + "20",
                                            color: tagInfo.color,
                                            borderColor: tagInfo.color
                                          } : {}}
                                        >
                                          {tag}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2">お客様が見つかりません</h3>
                            <p className="text-sm text-muted-foreground">
                              検索条件を変更してお試しください
                            </p>
                          </div>
                        )
                      ) : (
                        // 社内マニュアル検索結果
                        filteredManuals.length > 0 ? (
                          filteredManuals.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                              onClick={() => handleItemView(item)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                      {item.title}
                                    </h3>
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                      {item.category}
                                    </Badge>
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {getDepartmentName(item.departmentId)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {item.content}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                                    {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                        +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              </div>
                            </div>
                    ))
                  ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold mb-2">マニュアルが見つかりません</h3>
                            <p className="text-sm text-muted-foreground">
                              検索条件を変更してお試しください
                          </p>
                        </div>
                        )
                  )}
                    </div>
                  </ScrollArea>
            </CardContent>
          </Card>
            </div>
        </TabsContent>

          {/* AI検索 */}
          <TabsContent value="ai" className="flex-1 mt-0 min-h-0">
            <Card className="h-full w-full flex flex-col">
              {chatMessages.length > 0 && (
                <CardHeader className="pb-4 border-b shrink-0">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearChat}>
                      会話をクリア
                    </Button>
                  </div>
            </CardHeader>
              )}
              
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                {/* チャットエリア */}
                <ScrollArea className="flex-1">
                  <div className="space-y-6 max-w-4xl mx-auto p-6">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <h3 className="font-bold text-xl mb-4">DENCOに質問する</h3>
                        {/* DENCOロゴ */}
                        <div className="mb-6">
                          <img 
                            src="/logo.png" 
                            alt="DENCO" 
                            className="h-24 w-auto object-contain"
                          />
                            </div>
                        <p className="text-base font-medium text-foreground mb-2">
                          ベテランAIコンシェルジュになんでも聞いてください！
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mb-8">
                          キーワードではなく、人間に話しかけるように会話してください
                        </p>
                        <div className="flex flex-col gap-2 w-full max-w-lg">
                          {[
                            "〇〇様からのFAXの内容を教えて",
                            "〇月〇日に〇〇さんからの電話ってきてたっけ？内容を教えて",
                            "〇〇さんから電話きたのっていつ？"
                          ].map((suggestion) => (
                          <Button
                              key={suggestion}
                            variant="outline"
                              onClick={() => {
                                setChatInput(suggestion);
                              }}
                              className="text-sm justify-start h-auto py-3 px-4 text-left"
                            >
                              {suggestion}
                          </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`flex flex-col gap-1 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{parseMarkdownLinks(message.content)}</p>
                            </div>
                            <span className="text-xs text-muted-foreground px-1">
                              {message.timestamp.toLocaleString('ja-JP', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {message.role === "user" && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))
                    )}
                    {isAiLoading && (
                      <div className="flex gap-3 justify-start items-start">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </AvatarFallback>
                        </Avatar>
                        {showLongLoadingMessage && (
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                              回答の精度を高めています{'.'.repeat(loadingDots)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* 入力エリア */}
                <div className="p-4 border-t bg-background shrink-0">
                  <div className="max-w-3xl mx-auto flex gap-3">
                    <Textarea
                      placeholder="質問を入力してください..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[52px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isAiLoading}
                      className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                      {isAiLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 詳細ダイアログ */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              {/* お客様詳細 */}
              {'company' in selectedItem ? (
                <>
          <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{selectedItem.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span>{selectedItem.name}</span>
                        <p className="text-sm font-normal text-muted-foreground">{selectedItem.company}</p>
                      </div>
            </DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Phone className="h-4 w-4" />
                          電話番号
                        </div>
                        <p className="font-medium">{selectedItem.phone}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          最終通話
                        </div>
                        <p className="font-medium flex items-center gap-2">
                          {selectedItem.callDirection === "incoming" ? (
                            <PhoneIncoming className="h-4 w-4 text-green-500" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                          )}
                          {formatDate(selectedItem.lastCallDate)}
                        </p>
                      </div>
              </div>
              
                    <div>
                      <h4 className="text-sm font-medium mb-2">タグ</h4>
              <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag: string) => {
                          const tagInfo = customerTags.find(t => t.name === tag);
                          return (
                            <Badge 
                              key={tag}
                              style={tagInfo ? {
                                backgroundColor: tagInfo.color + "20",
                                color: tagInfo.color,
                                borderColor: tagInfo.color
                              } : {}}
                            >
                    {tag}
                  </Badge>
                          );
                        })}
                      </div>
              </div>
              
                    <div>
                      <h4 className="text-sm font-medium mb-2">通話要約</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed">{selectedItem.summary}</p>
                  </div>
                </div>
                </div>
                </>
              ) : (
                /* マニュアル詳細 */
                <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {selectedItem.title}
            </DialogTitle>
            <DialogDescription>
                      カテゴリー: {selectedItem.category}
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{selectedItem.content}</p>
              </div>
              
                <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground pt-2 border-t">
                      <Clock className="h-4 w-4 mr-1" />
                      最終更新: {formatDate(selectedItem.lastUpdated)}
              </div>
            </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
