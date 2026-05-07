'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import type { Department } from '@/types';

export function DepartmentCRUD() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (!error) {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
    } else {
      setEditingDept(null);
      setName('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    
    try {
      if (editingDept) {
        const { error } = await supabase.from('departments').update({ name }).eq('id', editingDept.id);
        if (error) throw error;
        toast.success('Cập nhật phòng ban thành công');
      } else {
        const { error } = await supabase.from('departments').insert({ name });
        if (error) throw error;
        toast.success('Thêm phòng ban thành công');
      }
      setIsDialogOpen(false);
      fetchDepartments();
    } catch (err: unknown) {
      toast.error('Có lỗi xảy ra khi lưu phòng ban');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) {
         if (error.code === '23503') throw new Error('Không thể xóa vì phòng ban đang có người dùng hoặc yêu cầu.');
         throw error;
      }
      toast.success('Xóa phòng ban thành công');
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa phòng ban');
    }
  };

  return (
    <div className="space-y-4 w-full">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-slate-900 text-base">Quản lý phòng ban</CardTitle>
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
                  <TableHead className="text-slate-500">Tên phòng ban</TableHead>
                  <TableHead className="text-slate-500 text-right pr-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d, idx) => (
                  <TableRow key={d.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-500 pl-4">{idx + 1}</TableCell>
                    <TableCell className="text-slate-900 font-medium">{d.name}</TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(d)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">Chưa có phòng ban nào</TableCell>
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
            <DialogTitle className="text-slate-900">{editingDept ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-slate-600 mb-1.5 block">Tên phòng ban</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên..."
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500 hover:text-slate-900">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
