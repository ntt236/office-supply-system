import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { DepartmentCRUD } from '@/components/admin/DepartmentCRUD';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý phòng ban | Office Supplies System',
};

export default function DepartmentsPage() {
  return (
    <DashboardLayoutClient title="Quản lý phòng ban" adminOnly>
      <DepartmentCRUD />
    </DashboardLayoutClient>
  );
}
