'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LoadingSpinner } from './loading-spinner';
import { ErrorDisplay } from './error-boundary';

/**
 * テーブルカラム定義
 */
export interface DataTableColumn<T> {
  /** カラムキー */
  key: string;
  /** カラムヘッダー */
  header: string;
  /** セル描画関数 */
  cell: (row: T) => React.ReactNode;
  /** ソート可能かどうか */
  sortable?: boolean;
  /** 列幅 */
  width?: string;
}

/**
 * ソート設定
 */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * DataTableのプロパティ
 */
interface DataTableProps<T> {
  /** データ配列 */
  data: T[];
  /** カラム定義 */
  columns: DataTableColumn<T>[];
  /** ローディング中フラグ */
  loading?: boolean;
  /** エラー */
  error?: Error | null;
  /** 行選択を有効化 */
  selectable?: boolean;
  /** 選択された行のキー */
  selectedRows?: Set<string>;
  /** 行選択変更ハンドラー */
  onSelectionChange?: (selectedKeys: Set<string>) => void;
  /** 行キー取得関数 */
  getRowKey: (row: T) => string;
  /** ページネーション設定 */
  pagination?: {
    /** 現在のページ（0始まり） */
    currentPage: number;
    /** 1ページあたりのアイテム数 */
    pageSize: number;
    /** 総アイテム数 */
    totalItems: number;
    /** ページ変更ハンドラー */
    onPageChange: (page: number) => void;
  };
  /** ソート設定 */
  sort?: SortConfig;
  /** ソート変更ハンドラー */
  onSortChange?: (sort: SortConfig) => void;
  /** 空データ時のメッセージ */
  emptyMessage?: string;
  /** 行クリック時のハンドラー */
  onRowClick?: (row: T) => void;
}

/**
 * データテーブルコンポーネント
 *
 * ソート、ページネーション、行選択機能を持つテーブル
 *
 * @example
 * ```tsx
 * const columns: DataTableColumn<Customer>[] = [
 *   {
 *     key: 'name',
 *     header: '名前',
 *     cell: (row) => row.name,
 *     sortable: true,
 *   },
 *   {
 *     key: 'email',
 *     header: 'メール',
 *     cell: (row) => row.email,
 *     sortable: true,
 *   },
 *   {
 *     key: 'actions',
 *     header: '操作',
 *     cell: (row) => (
 *       <Button onClick={() => handleEdit(row)}>編集</Button>
 *     ),
 *   },
 * ];
 *
 * <DataTable
 *   data={customers}
 *   columns={columns}
 *   getRowKey={(row) => row.id}
 *   loading={loading}
 *   error={error}
 *   pagination={{
 *     currentPage: page,
 *     pageSize: 20,
 *     totalItems: totalCount,
 *     onPageChange: setPage,
 *   }}
 *   sort={sort}
 *   onSortChange={setSort}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  loading = false,
  error = null,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  getRowKey,
  pagination,
  sort,
  onSortChange,
  emptyMessage = 'データがありません',
  onRowClick,
}: DataTableProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());

  const currentSelectedRows: Set<string> = selectable ? (onSelectionChange ? selectedRows : internalSelectedRows) ?? new Set<string>() : new Set<string>();

  // 全選択/全解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map(getRowKey));
      if (onSelectionChange) {
        onSelectionChange(allKeys);
      } else {
        setInternalSelectedRows(allKeys);
      }
    } else {
      if (onSelectionChange) {
        onSelectionChange(new Set());
      } else {
        setInternalSelectedRows(new Set());
      }
    }
  };

  // 行選択
  const handleSelectRow = (key: string, checked: boolean) => {
    const newSelected = new Set(currentSelectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }

    if (onSelectionChange) {
      onSelectionChange(newSelected);
    } else {
      setInternalSelectedRows(newSelected);
    }
  };

  // ソートアイコン
  const getSortIcon = (columnKey: string) => {
    if (!sort || sort.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  // ソート変更
  const handleSortChange = (columnKey: string) => {
    if (!onSortChange) return;

    const newDirection =
      sort?.key === columnKey && sort.direction === 'asc' ? 'desc' : 'asc';

    onSortChange({ key: columnKey, direction: newDirection });
  };

  // ページネーション情報
  const paginationInfo = pagination
    ? {
        start: pagination.currentPage * pagination.pageSize + 1,
        end: Math.min(
          (pagination.currentPage + 1) * pagination.pageSize,
          pagination.totalItems
        ),
        total: pagination.totalItems,
        totalPages: Math.ceil(pagination.totalItems / pagination.pageSize),
      }
    : null;

  // ローディング表示
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="読み込み中..." />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // 空データ表示
  if (data.length === 0) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const allSelected = data.length > 0 && data.every(row => currentSelectedRows.has(getRowKey(row)));
  const someSelected = data.some(row => currentSelectedRows.has(getRowKey(row))) && !allSelected;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="全て選択"
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} style={{ width: column.width }}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSortChange(column.key)}
                    >
                      <span>{column.header}</span>
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const rowKey = getRowKey(row);
              const isSelected = currentSelectedRows.has(rowKey);

              return (
                <TableRow
                  key={rowKey}
                  data-state={isSelected && 'selected'}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(rowKey, !!checked)}
                        aria-label={`行を選択`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.cell(row)}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pagination && paginationInfo && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {paginationInfo.start} - {paginationInfo.end} / {paginationInfo.total} 件
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <div className="text-sm">
              {pagination.currentPage + 1} / {paginationInfo.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= paginationInfo.totalPages - 1}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
