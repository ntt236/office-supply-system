'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, Building, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function ProfileContent() {
  const { user } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);
    
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
        toast.error('Lỗi: Không thể đổi mật khẩu');
        setLoading(false);
        return;
      }

      toast.success('Đổi mật khẩu thành công!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Lỗi ngoại lệ:', err);
      setError('Đã có lỗi hệ thống xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Thông tin hồ sơ */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Hồ sơ cá nhân</CardTitle>
          <CardDescription className="text-slate-500">
            Thông tin tài khoản và quyền hạn của bạn trong hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-500">Email đăng nhập</p>
              <p className="text-slate-900 font-semibold">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">Vai trò (Role)</p>
                <p className="text-slate-900 capitalize font-medium">{user.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Building className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">Phòng ban</p>
                <p className="text-slate-900 font-medium">{user.department?.name || 'Chưa phân công'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Đổi mật khẩu */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-slate-700" />
            <CardTitle className="text-xl text-slate-900">Đổi mật khẩu</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Cập nhật mật khẩu mới cho tài khoản của bạn để đảm bảo an toàn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận lại mật khẩu..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
