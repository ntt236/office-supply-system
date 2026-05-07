'use client';

import { useState } from 'react';
import { useItems } from '@/hooks/useItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Item } from '@/types';

export function ItemCRUD() {
  const { items, loading, createItem, updateItem, deleteItem } = useItems();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', unit: '', default_limit: '' });
  const [saving, setSaving] = useState(false);

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        code: item.code,
        unit: item.unit || '',
        default_limit: item.default_limit?.toString() || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', code: '', unit: '', default_limit: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập tên và mã mặt hàng');
      return;
    }
    
    setSaving(true);
    const itemData = {
      name: formData.name,
      code: formData.code,
      unit: formData.unit || null,
      default_limit: formData.default_limit ? parseInt(formData.default_limit) : null,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        toast.success('Cập nhật mặt hàng thành công');
      } else {
        await createItem(itemData);
        toast.success('Thêm mặt hàng thành công');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('Mã mặt hàng đã tồn tại!');
      } else {
        toast.error('Có lỗi xảy ra khi lưu mặt hàng');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mặt hàng này?')) return;
    try {
      await deleteItem(id);
      toast.success('Xóa mặt hàng thành công');
    } catch (err: any) {
      if (err.code === '23503') {
        toast.error('Không thể xóa vì mặt hàng đang có trong yêu cầu.');
      } else {
        toast.error('Lỗi khi xóa mặt hàng');
      }
    }
  };

  return (
    <div className="space-y-4 w-full">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-slate-900 text-base">Quản lý mặt hàng</CardTitle>
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
                  <TableHead className="text-slate-500">Mã</TableHead>
                  <TableHead className="text-slate-500">Tên mặt hàng</TableHead>
                  <TableHead className="text-slate-500">ĐVT</TableHead>
                  <TableHead className="text-slate-500 text-right">Định mức</TableHead>
                  <TableHead className="text-slate-500 text-right pr-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-500 pl-4">{idx + 1}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="text-slate-900 font-medium">{item.name}</TableCell>
                    <TableCell className="text-slate-500">{item.unit || '—'}</TableCell>
                    <TableCell className="text-slate-700 text-right">{item.default_limit ?? '—'}</TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">Chưa có mặt hàng nào</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingItem ? 'Sửa mặt hàng' : 'Thêm mặt hàng mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Mã mặt hàng *</label>
              <Input
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: P001"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Tên mặt hàng *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên..."
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Đơn vị tính</label>
                <Input
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="VD: Cái, Hộp"
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Định mức</label>
                <Input
                  type="number"
                  value={formData.default_limit}
                  onChange={e => setFormData({ ...formData, default_limit: e.target.value })}
                  placeholder="Để trống nếu không có"
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500 hover:text-slate-900">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
