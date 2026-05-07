import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tổng quan | Office Supplies System',
};

export default function DashboardPage() {
  return (
    <DashboardLayoutClient title="Tổng quan" adminOnly>
      <DashboardContent />
    </DashboardLayoutClient>
  );
}
