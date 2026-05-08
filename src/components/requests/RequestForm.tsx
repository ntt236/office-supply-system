'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDepartmentItems } from '@/hooks/useDepartmentItems';
import { useRequests } from '@/hooks/useRequests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Loader2, Save, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { RequestItemRow } from '@/types';

export function RequestForm() {
  const { user } = useAuth();
  const { mappedItems, loading: itemsLoading } = useDepartmentItems(user?.department_id || undefined);
  const { createRequest } = useRequests();

  // Always use next month — locked per business rule
  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  })();

  // Format for display: e.g. "Tháng 6/2026"
  const nextMonthLabel = (() => {
    const [year, month] = nextMonth.split('-');
    return `Tháng ${parseInt(month)}/${year}`;
  })();

  const [rows, setRows] = useState<RequestItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize rows when items load
  useEffect(() => {
    if (mappedItems.length > 0) {
      setRows(mappedItems.map(item => ({
        item,
        stock: 0,
        requested: 0,
        purchase: 0,
        note: '',
        status: 'OK',
      })));
    }
  }, [mappedItems]);

  const updateRow = (itemId: string, field: 'stock' | 'requested' | 'note', value: string | number) => {
    setRows(prev => prev.map(row => {
      if (row.item.id !== itemId) return row;
      const updated = { ...row, [field]: typeof value === 'number' ? Math.max(0, value) : value };
      if (field === 'stock' || field === 'requested') {
        updated.purchase = Math.max(0, updated.requested - updated.stock);
        updated.status = (
          updated.item.default_limit !== null &&
          updated.requested > (updated.item.default_limit || 0)
        ) ? 'EXCEED' : 'OK';
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!user.department_id) {
      setError('Tài khoản của bạn chưa được gán phòng ban. Vui lòng liên hệ admin.');
      return;
    }

    const changedRows = rows.filter(r => r.stock > 0 || r.requested > 0);
    if (changedRows.length === 0) {
      setError('Vui lòng nhập ít nhất 1 mặt hàng.');
      return;
    }

    const exceedRowsWithoutNote = changedRows.filter(r => r.status === 'EXCEED' && !r.note.trim());
    if (exceedRowsWithoutNote.length > 0) {
      setError('Vui lòng nhập lý do (Ghi chú) cho các mặt hàng vượt định mức.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createRequest(
        user.id,
        user.department_id,
        nextMonth,
        changedRows.map(r => ({
          item_id: r.item.id,
          stock: r.stock,
          requested: r.requested,
          purchase: r.purchase,
          note: r.note.trim() || null
        }))
      );
      toast.success('Tạo yêu cầu thành công!');
      // Reset form
      setRows(prev => prev.map(r => ({ ...r, stock: 0, requested: 0, purchase: 0, note: '', status: 'OK' })));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo yêu cầu';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const exceededCount = rows.filter(r => r.status === 'EXCEED').length;
  const hasChanges = rows.some(r => r.stock > 0 || r.requested > 0);

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const officeSupplies = rows.filter(r => r.item.category === 'office_supply' || !r.item.category);
  const janitorial = rows.filter(r => r.item.category === 'janitorial');

  const renderTable = (tableRows: RequestItemRow[]) => {
    if (tableRows.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500">
          Chưa có mặt hàng nào được phân bổ cho bộ phận của bạn trong danh mục này.
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
              <TableHead className="text-slate-500 min-w-[200px]">Tên mặt hàng</TableHead>
              <TableHead className="text-slate-500">ĐVT</TableHead>
              <TableHead className="text-slate-500">Định mức</TableHead>
              <TableHead className="text-slate-500">Tồn kho</TableHead>
              <TableHead className="text-slate-500">Yêu cầu</TableHead>
              <TableHead className="text-slate-500">Mua</TableHead>
              <TableHead className="text-slate-500 min-w-[200px]">Ghi chú (Bắt buộc nếu vượt)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row, idx) => (
              <TableRow
                key={row.item.id}
                className={cn(
                  'border-slate-200 transition-colors',
                  row.status === 'EXCEED' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
                )}
              >
                <TableCell className="text-slate-500 pl-4 text-sm">{idx + 1}</TableCell>
                <TableCell className="text-slate-900 font-medium">{row.item.name}</TableCell>
                <TableCell className="text-slate-500 text-sm">{row.item.unit || '—'}</TableCell>
                <TableCell className="text-slate-500 text-sm">{row.item.default_limit ?? '—'}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={row.stock || ''}
                    onChange={e => updateRow(row.item.id, 'stock', parseInt(e.target.value) || 0)}
                    className="w-20 h-8 bg-white border-slate-200 text-slate-900 text-sm text-center"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={row.requested || ''}
                    onChange={e => updateRow(row.item.id, 'requested', parseInt(e.target.value) || 0)}
                    className={cn(
                      'w-20 h-8 text-slate-900 text-sm text-center',
                      row.status === 'EXCEED' ? 'border-red-300 bg-red-50' : 'bg-white border-slate-200'
                    )}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-slate-700 font-medium text-sm">{row.purchase}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={row.note || ''}
                    onChange={e => updateRow(row.item.id, 'note', e.target.value)}
                    className={cn(
                      'h-8 text-sm',
                      row.status === 'EXCEED' && !row.note.trim() ? 'border-red-400 bg-white ring-red-100' : 'bg-white border-slate-200'
                    )}
                    placeholder={row.status === 'EXCEED' ? 'Nhập lý do...' : 'Ghi chú thêm...'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* Month selector */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 text-base">Thông tin yêu cầu</CardTitle>
          <CardDescription className="text-slate-500">
            Phòng ban: <span className="text-slate-700 font-medium">{user?.department?.name || 'Chưa phân công'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">Tháng yêu cầu</label>
              <div className="flex items-center gap-2 h-10 px-4 rounded-md border border-slate-200 bg-slate-50">
                <span className="text-slate-900 font-semibold">{nextMonthLabel}</span>
                <Badge className="bg-blue-100 text-blue-700 border-none text-xs ml-1">Tự động</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">Chỉ được tạo yêu cầu cho tháng tiếp theo</p>
            </div>
            <div className="flex gap-3 sm:mt-2">
              {exceededCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {exceededCount} mặt hàng vượt mức
                </div>
              )}
              {hasChanges && exceededCount === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Tất cả trong giới hạn
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Nhập số lượng tồn kho (<strong>Tồn</strong>) và số lượng yêu cầu (<strong>Yêu cầu</strong>). Hệ thống sẽ tự tính số lượng mua. Nếu vượt định mức, bắt buộc phải điền Ghi chú.</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Items table */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue="office_supply" className="w-full">
            <div className="p-2 border-b border-slate-200 bg-slate-50/50">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="office_supply">Văn phòng phẩm</TabsTrigger>
                <TabsTrigger value="janitorial">Dụng cụ vệ sinh</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="office_supply" className="m-0 border-none p-0 outline-none">
              {renderTable(officeSupplies)}
            </TabsContent>
            <TabsContent value="janitorial" className="m-0 border-none p-0 outline-none">
              {renderTable(janitorial)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Gửi yêu cầu
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
