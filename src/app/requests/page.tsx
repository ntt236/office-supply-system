import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { RequestList } from '@/components/requests/RequestList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh sách yêu cầu | Office Supplies System',
};

export default function RequestsPage() {
  return (
    <DashboardLayoutClient title="Danh sách yêu cầu">
      <RequestList />
    </DashboardLayoutClient>
  );
}
