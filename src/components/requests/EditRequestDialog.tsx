'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader2, Save, Info } from 'lucide-react';
import type { Request, RequestItemRow } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDepartmentItems } from '@/hooks/useDepartmentItems';
import { useAuth } from '@/hooks/useAuth';

interface EditRequestDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditRequest: (requestId: string, items: Array<{ item_id: string; stock: number; requested: number; purchase: number; note: string | null }>) => Promise<void>;
}

export function EditRequestDialog({ request, open, onOpenChange, onEditRequest }: EditRequestDialogProps) {
  const { user } = useAuth();
  const { mappedItems, loading: itemsLoading } = useDepartmentItems(user?.department_id || undefined);
  
  const [rows, setRows] = useState<RequestItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize rows when items load and request changes
  useEffect(() => {
    if (!request || itemsLoading) return;

    // Merge mappedItems with existing request items
    // This ensures that even if an item is no longer assigned to a department, 
    // it still shows up if it was part of the original request.
    const requestItemIds = new Set(request.request_items?.map(ri => ri.item_id) || []);
    
    // Combine items from the department and items already in the request
    const allRelevantItems = [...mappedItems];
    
    // Add items that are in the request but not in current department mapping (if any)
    request.request_items?.forEach(ri => {
      if (ri.item && !allRelevantItems.find(i => i.id === ri.item_id)) {
        allRelevantItems.push(ri.item);
      }
    });

    const initialRows = allRelevantItems.map(item => {
      const existingReqItem = request.request_items?.find(ri => ri.item_id === item.id);
      
      const stock = existingReqItem?.stock || 0;
      const requested = existingReqItem?.requested || 0;
      const purchase = existingReqItem?.purchase || 0;
      const note = existingReqItem?.note || '';
      
      const status: 'OK' | 'EXCEED' = (item.default_limit !== null && requested > (item.default_limit || 0)) ? 'EXCEED' : 'OK';

      return {
        item,
        stock,
        requested,
        purchase,
        note,
        status,
      };
    });

    setRows(initialRows);
    setError('');
  }, [mappedItems, request, open, itemsLoading]);

  if (!request) return null;

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
      await onEditRequest(
        request.id,
        changedRows.map(r => ({
          item_id: r.item.id,
          stock: r.stock,
          requested: r.requested,
          purchase: r.purchase,
          note: r.note.trim() || null
        }))
      );
      toast.success('Đã sửa và gửi lại yêu cầu thành công!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi sửa yêu cầu';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const exceededCount = rows.filter(r => r.status === 'EXCEED').length;
  const hasChanges = rows.some(r => r.stock > 0 || r.requested > 0);

  const officeSupplies = rows.filter(r => r.item.category === 'office_supply' || !r.item.category);
  const janitorial = rows.filter(r => r.item.category === 'janitorial');

  const renderTable = (tableRows: RequestItemRow[]) => {
    if (tableRows.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500">
          Chưa có mặt hàng nào được phân bổ trong danh mục này.
        </div>
      );
    }
    return (
      <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
              <TableHead className="text-slate-500 min-w-[150px]">Tên mặt hàng</TableHead>
              <TableHead className="text-slate-500">ĐVT</TableHead>
              <TableHead className="text-slate-500 text-right">Định mức</TableHead>
              <TableHead className="text-slate-500 text-right">Tồn kho</TableHead>
              <TableHead className="text-slate-500 text-right">Yêu cầu</TableHead>
              <TableHead className="text-slate-500 text-right">Cần mua</TableHead>
              <TableHead className="text-slate-500 min-w-[150px]">Ghi chú (Bắt buộc nếu vượt)</TableHead>
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
                <TableCell className="text-slate-500 text-sm text-right">{row.item.default_limit ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min="0"
                    value={row.stock || ''}
                    onChange={e => updateRow(row.item.id, 'stock', parseInt(e.target.value) || 0)}
                    className="w-20 h-8 bg-white border-slate-200 text-slate-900 text-sm text-center inline-block"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min="0"
                    value={row.requested || ''}
                    onChange={e => updateRow(row.item.id, 'requested', parseInt(e.target.value) || 0)}
                    className={cn(
                      'w-20 h-8 text-slate-900 text-sm text-center inline-block',
                      row.status === 'EXCEED' ? 'border-red-300 bg-red-50' : 'bg-white border-slate-200'
                    )}
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-slate-700 font-bold text-sm text-right">{row.purchase}</TableCell>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] bg-white border-slate-200 text-slate-900 p-6 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-slate-900 text-2xl font-bold">Sửa yêu cầu tháng {request.month}</DialogTitle>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
            <span>Phòng ban: </span>
            <span className="text-slate-900 font-semibold">{request.department?.name || 'Chưa phân'}</span>
          </div>
        </DialogHeader>

        {/* Cảnh báo và Lý do từ chối - Đưa ra ngoài Header để tránh vỡ layout */}
        <div className="space-y-3 mb-4">
          {request.reject_reason && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm shadow-sm flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-bold block mb-0.5">Lý do từ chối trước đó:</span>
                {request.reject_reason}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
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

        {itemsLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="border border-slate-200 rounded-md bg-white overflow-hidden flex-1 flex flex-col min-h-0">
              <Tabs defaultValue="office_supply" className="w-full">
                <div className="p-2 border-b border-slate-200 bg-slate-50">
                  <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="office_supply">Văn phòng phẩm</TabsTrigger>
                    <TabsTrigger value="janitorial">Tạp phẩm</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="office_supply" className="m-0 border-none p-0 outline-none">
                  {renderTable(officeSupplies)}
                </TabsContent>
                <TabsContent value="janitorial" className="m-0 border-none p-0 outline-none">
                  {renderTable(janitorial)}
                </TabsContent>
              </Tabs>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Gửi lại yêu cầu
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
