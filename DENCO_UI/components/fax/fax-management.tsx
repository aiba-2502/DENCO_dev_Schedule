"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Search, Send, Eye, FileText, Loader2, RefreshCw } from "lucide-react";
import { Label } from "../ui/label";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../date-range-picker";
import { Checkbox } from "../ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { FaxDocument, FaxDocumentDisplay } from "@/lib/types";

// サンプル顧客データ（FAX送信用）
const customers = [
  {
    id: "user-1",
    name: "山田 太郎",
    faxNumber: "03-1234-5678",
    tenant: "株式会社ABC",
  },
  {
    id: "user-2",
    name: "佐藤 花子",
    faxNumber: "03-8765-4321",
    tenant: "株式会社ABC",
  },
  {
    id: "user-3",
    name: "鈴木 一郎",
    faxNumber: "03-2345-6789",
    tenant: "株式会社XYZ",
  },
];

// OCRテキストの最初の行を取得
const getOcrSummary = (text: string | null) => {
  if (!text) return "";
  const firstLine = text.split('\n')[0];
  return firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine;
};

// FaxDocumentをFaxDocumentDisplayに変換
const transformToDisplay = (doc: FaxDocument): FaxDocumentDisplay => ({
  ...doc,
  // Phase 5 実装まではURL生成せず空文字列とし、ボタンをdisabledにする
  preview_url: '',  // Phase 5まで空
  has_ocr: doc.ocr_text !== null && doc.ocr_text !== '',
});

export default function FaxManagement() {
  // API データ状態
  const [faxDocuments, setFaxDocuments] = useState<FaxDocumentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<'inbound' | 'outbound'>('inbound');
  const ITEMS_PER_PAGE = 50;

  // TODO: 認証コンテキストからテナントIDを取得
  // 認証システム実装後に以下を置き換え:
  // const { tenantId } = useAuth();
  const tenantId = 'default-tenant'; // 暫定ハードコード

  // UI状態
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [isNewFaxDialogOpen, setIsNewFaxDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedFax, setSelectedFax] = useState<FaxDocumentDisplay | null>(null);
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [timeRange, setTimeRange] = useState<{start: string, end: string}>({
    start: "00:00",
    end: "23:59"
  });

  const { toast } = useToast();

  // データ取得関数
  const fetchFaxDocuments = async (
    direction: 'inbound' | 'outbound' = currentDirection,
    offset: number = currentPage * ITEMS_PER_PAGE
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.python.fax.list(
        tenantId,
        ITEMS_PER_PAGE,
        offset,
        direction
      );

      const displayDocs = (response.items as FaxDocument[]).map(transformToDisplay);
      setFaxDocuments(displayDocs);
      // 注意: response.totalは現ページ件数のみ。表示には使用しない。
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'FAXデータの取得に失敗しました';
      setError(errorMessage);
      console.error('FAX fetch error:', err);

      // トースト通知でユーザーにエラーを表示
      toast({
        title: 'エラー',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // useEffectでのデータ取得
  useEffect(() => {
    fetchFaxDocuments(currentDirection, currentPage * ITEMS_PER_PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, currentPage, currentDirection]);

  // タブ切り替え時のハンドラー
  const handleTabChange = (value: string) => {
    const direction = value === 'outbound' ? 'outbound' as const : 'inbound' as const;
    setCurrentDirection(direction);
    setCurrentPage(0); // ページをリセット
    // useEffect([currentDirection, currentPage])が再取得を実行
  };

  // クライアントサイドフィルタリング（検索・状態・日時）
  const filteredDocuments = useMemo(() => {
    return faxDocuments.filter((doc) => {
      const matchesSearch = searchTerm === "" ||
        doc.sender_number.includes(searchTerm) ||
        doc.receiver_number.includes(searchTerm) ||
        (doc.sender_name && doc.sender_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.receiver_name && doc.receiver_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

      const docDate = new Date(doc.created_at);
      const matchesDateRange = !dateRange?.from || !dateRange?.to ||
        (docDate >= dateRange.from && docDate <= new Date(dateRange.to.getTime() + 86400000));

      const docTime = docDate.toTimeString().substring(0, 5);
      const matchesTimeRange =
        docTime >= timeRange.start &&
        docTime <= timeRange.end;

      return matchesSearch && matchesStatus && matchesDateRange && matchesTimeRange;
    });
  }, [faxDocuments, searchTerm, statusFilter, dateRange, timeRange]);

  // 注意: サーバーサイドでdirectionフィルタが適用されているため、
  // filteredDocumentsには現在選択中のタブ（inbound/outbound）のデータのみ含まれる

  const filteredCustomers = customers.filter(customer => {
    return customerSearchTerm === "" ||
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.faxNumber.includes(customerSearchTerm);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendFax = async () => {
    const recipients = customers.filter(c => selectedCustomers.includes(c.id));
    console.log("送信先:", recipients, "ファイル:", selectedFile);
    setIsNewFaxDialogOpen(false);
    setSelectedFile(null);
    setSelectedCustomers([]);
  };

  const handlePreview = (doc: FaxDocumentDisplay) => {
    setSelectedFax(doc);
    setIsPreviewDialogOpen(true);
  };

  const handleViewOcr = (doc: FaxDocumentDisplay) => {
    setSelectedFax(doc);
    setIsOcrDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // ページネーション
  const hasMorePages = faxDocuments.length === ITEMS_PER_PAGE;

  const renderInboundFaxTable = (documents: FaxDocumentDisplay[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>送信元</TableHead>
          <TableHead>送信者名</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>受信日時</TableHead>
          <TableHead>内容</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.sender_number}</TableCell>
              <TableCell>{doc.sender_name || '-'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "default"
                      : doc.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {doc.status === "completed" ? "完了" :
                   doc.status === "pending" ? "処理中" : "失敗"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(doc.created_at)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {doc.has_ocr && getOcrSummary(doc.ocr_text)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="プレビュー"
                    disabled={!doc.preview_url}
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {doc.has_ocr && (
                    <Button
                      variant="outline"
                      size="icon"
                      title="OCRテキスト"
                      onClick={() => handleViewOcr(doc)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6">
              <div className="flex flex-col items-center">
                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">検索条件に一致するFAX文書がありません</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderOutboundFaxTable = (documents: FaxDocumentDisplay[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>送信先</TableHead>
          <TableHead>宛先名</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>送信日時</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.receiver_number}</TableCell>
              <TableCell>{doc.receiver_name || '-'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "default"
                      : doc.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {doc.status === "completed" ? "完了" :
                   doc.status === "pending" ? "処理中" : "失敗"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(doc.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="プレビュー"
                    disabled={!doc.preview_url}
                    onClick={() => handlePreview(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6">
              <div className="flex flex-col items-center">
                <Search className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">検索条件に一致するFAX文書がありません</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">FAX管理</h1>
        <Dialog open={isNewFaxDialogOpen} onOpenChange={setIsNewFaxDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Send className="h-4 w-4" />
              FAX送信
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>新規FAX送信</DialogTitle>
              <DialogDescription>
                送信するPDFファイルをアップロード
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file">ファイル</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>送信先の選択</Label>
                  <Input
                    placeholder="顧客を検索..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedCustomers.length === filteredCustomers.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers(filteredCustomers.map(c => c.id));
                                } else {
                                  setSelectedCustomers([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>顧客名</TableHead>
                          <TableHead>FAX番号</TableHead>
                          <TableHead>テナント</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCustomers([...selectedCustomers, customer.id]);
                                  } else {
                                    setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{customer.name}</TableCell>
                            <TableCell>{customer.faxNumber}</TableCell>
                            <TableCell>{customer.tenant}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewFaxDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSendFax}
                disabled={!selectedFile || selectedCustomers.length === 0}
              >
                送信
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="名前またはFAX番号で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "completed" | "pending" | "failed") => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="pending">処理中</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
            />

            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={timeRange.start}
                onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full"
              />
              <span>～</span>
              <Input
                type="time"
                value={timeRange.end}
                onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ローディング状態 */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* エラー状態 */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchFaxDocuments(currentDirection)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </div>
      )}

      {/* メインコンテンツ */}
      {!loading && !error && (
        <>
          <Tabs value={currentDirection} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="inbound">受信FAX</TabsTrigger>
              <TabsTrigger value="outbound">送信FAX</TabsTrigger>
            </TabsList>

            <TabsContent value="inbound">
              <Card>
                <CardHeader>
                  <CardTitle>受信FAX一覧</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderInboundFaxTable(filteredDocuments)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outbound">
              <Card>
                <CardHeader>
                  <CardTitle>送信FAX一覧</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderOutboundFaxTable(filteredDocuments)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ページネーション */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {faxDocuments.length > 0
                ? `${currentPage * ITEMS_PER_PAGE + 1} - ${currentPage * ITEMS_PER_PAGE + faxDocuments.length}件を表示`
                : '0件'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                前へ
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMorePages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                次へ
              </Button>
            </div>
          </div>
        </>
      )}

      {/* プレビューダイアログ */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>FAXプレビュー</DialogTitle>
          </DialogHeader>
          <div className="aspect-[1/1.4] bg-muted rounded-lg">
            {selectedFax && selectedFax.preview_url && (
              <iframe
                src={selectedFax.preview_url}
                className="w-full h-full rounded-lg"
                title="FAX Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCRテキストダイアログ */}
      <Dialog open={isOcrDialogOpen} onOpenChange={setIsOcrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OCRテキスト</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {selectedFax?.ocr_text}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOcrDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
