import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { ItemCRUD } from '@/components/admin/ItemCRUD';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý mặt hàng | Office Supplies System',
};

export default function ItemsPage() {
  return (
    <DashboardLayoutClient title="Quản lý mặt hàng" adminOnly>
      <ItemCRUD />
    </DashboardLayoutClient>
  );
}
