import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { DepartmentItemMapping } from '@/components/admin/DepartmentItemMapping';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phân bổ mặt hàng | Office Supplies System',
};

export default function DepartmentItemsPage() {
  return (
    <DashboardLayoutClient title="Phân bổ mặt hàng" adminOnly>
      <DepartmentItemMapping />
    </DashboardLayoutClient>
  );
}
