'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { useRequests } from '@/hooks/useRequests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const { items, loading: itemsLoading } = useItems();
  const { createRequest } = useRequests();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<RequestItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize rows when items load
  useEffect(() => {
    if (items.length > 0) {
      setRows(items.map(item => ({
        item,
        stock: 0,
        requested: 0,
        purchase: 0,
        status: 'OK',
      })));
    }
  }, [items]);

  const updateRow = (itemId: string, field: 'stock' | 'requested', value: number) => {
    setRows(prev => prev.map(row => {
      if (row.item.id !== itemId) return row;
      const updated = { ...row, [field]: Math.max(0, value) };
      updated.purchase = updated.requested;
      updated.status = (
        updated.item.default_limit !== null &&
        updated.requested > (updated.item.default_limit || 0)
      ) ? 'EXCEED' : 'OK';
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

    setSaving(true);
    setError('');

    try {
      await createRequest(
        user.id,
        user.department_id,
        month,
        changedRows.map(r => ({
          item_id: r.item.id,
          stock: r.stock,
          requested: r.requested,
          purchase: r.purchase,
        }))
      );
      toast.success('Tạo yêu cầu thành công!');
      // Reset form
      setRows(prev => prev.map(r => ({ ...r, stock: 0, requested: 0, purchase: 0, status: 'OK' })));
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
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1.5 block">Tháng yêu cầu</label>
              <Input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-48 bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div className="flex gap-3 mt-5">
              {exceededCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {exceededCount} mặt hàng vượt mức
                </div>
              )}
              {hasChanges && exceededCount === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Tất cả trong giới hạn
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Nhập số lượng tồn kho (<strong>Tồn</strong>) và số lượng yêu cầu (<strong>Yêu cầu</strong>). Hệ thống sẽ tự tính số lượng mua.</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Items table */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 pl-4">STT</TableHead>
                <TableHead className="text-slate-500">Tên mặt hàng</TableHead>
                <TableHead className="text-slate-500">Mã</TableHead>
                <TableHead className="text-slate-500">ĐVT</TableHead>
                <TableHead className="text-slate-500">Định mức</TableHead>
                <TableHead className="text-slate-500">Tồn kho</TableHead>
                <TableHead className="text-slate-500">Yêu cầu</TableHead>
                <TableHead className="text-slate-500">Mua</TableHead>
                <TableHead className="text-slate-500">TT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.item.id}
                  className={cn(
                    'border-slate-200 transition-colors',
                    row.status === 'EXCEED'
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <TableCell className="text-slate-500 pl-4 text-sm">{idx + 1}</TableCell>
                  <TableCell className="text-slate-900 font-medium">{row.item.name}</TableCell>
                  <TableCell className="text-slate-500 text-sm font-mono">{row.item.code}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{row.item.unit || '—'}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {row.item.default_limit ?? '—'}
                  </TableCell>
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
                        row.status === 'EXCEED'
                          ? 'border-red-300 bg-red-50'
                          : 'bg-white border-slate-200'
                      )}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="text-slate-700 font-medium text-sm">{row.purchase}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        row.status === 'EXCEED'
                          ? 'border-red-200 text-red-600 bg-red-50'
                          : 'border-emerald-200 text-emerald-600 bg-emerald-50'
                      )}
                    >
                      {row.status === 'EXCEED' ? 'Vượt' : 'OK'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu yêu cầu
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
