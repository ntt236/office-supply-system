import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | Office Supplies System',
  description: 'Đăng nhập vào hệ thống quản lý văn phòng phẩm',
};

export default function LoginPage() {
  return <LoginForm />;
}
