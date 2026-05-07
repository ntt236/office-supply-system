import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { UserManagement } from '@/components/admin/UserManagement';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý người dùng | Office Supplies System',
};

export default function UsersPage() {
  return (
    <DashboardLayoutClient title="Quản lý người dùng" adminOnly>
      <UserManagement />
    </DashboardLayoutClient>
  );
}
