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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import type { User, Department } from '@/types';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ role: 'user', department_id: 'none' });
  const [saving, setSaving] = useState(false);

  // Reset password states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, deptsRes] = await Promise.all([
      supabase.from('users').select('*, department:departments(*)').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name')
    ]);

    if (usersRes.data) setUsers(usersRes.data as User[]);
    if (deptsRes.data) setDepartments(deptsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      department_id: user.department_id || 'none',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: formData.role,
          department_id: formData.department_id === 'none' ? null : formData.department_id,
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      toast.success('Cập nhật người dùng thành công');
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Lỗi cập nhật người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenResetDialog = (user: User) => {
    setResettingUser(user);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resettingUser.id, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');

      toast.success('Đã cấp lại mật khẩu mới thành công!');
      setResetDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi reset mật khẩu');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-900 text-base">Quản lý người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
                  <TableHead className="text-slate-500">Email</TableHead>
                  <TableHead className="text-slate-500">Vai trò</TableHead>
                  <TableHead className="text-slate-500">Phòng ban</TableHead>
                  <TableHead className="text-slate-500">Ngày tham gia</TableHead>
                  <TableHead className="text-slate-500 text-right pr-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, idx) => (
                  <TableRow key={u.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-500 pl-4">{idx + 1}</TableCell>
                    <TableCell className="text-slate-900 font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.role === 'admin' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-slate-200 text-slate-600'}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">{u.department?.name || <span className="text-slate-400 italic">Chưa phân</span>}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right pr-4 space-x-2 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenResetDialog(u)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="Cấp lại mật khẩu">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(u)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Phân quyền
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cập nhật người dùng</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Email</label>
                <Input disabled value={editingUser.email || ''} className="bg-slate-100 border-slate-200 text-slate-500" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Vai trò</label>
                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="user" className="text-slate-700">User</SelectItem>
                    <SelectItem value="admin" className="text-slate-700">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Phòng ban</label>
                <Select value={formData.department_id} onValueChange={v => setFormData({ ...formData, department_id: v })}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="none" className="text-slate-400 italic">Chưa phân phòng ban</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-slate-700">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cấp lại mật khẩu</DialogTitle>
          </DialogHeader>
          {resettingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Mật khẩu mới cho <span className="font-semibold">{resettingUser.email}</span></label>
                <Input
                  type="text"
                  placeholder="Nhập mật khẩu mới..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900"
                />
                <p className="text-xs text-slate-500">Mật khẩu phải có ít nhất 6 ký tự. Hãy copy mật khẩu này và gửi cho nhân viên đăng nhập.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetDialogOpen(false)} className="text-slate-500 hover:text-slate-900">
              Hủy
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting || !newPassword} className="bg-orange-600 hover:bg-orange-700 text-white">
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu mật khẩu mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
