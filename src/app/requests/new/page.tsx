import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { RequestForm } from '@/components/requests/RequestForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo yêu cầu mới | Office Supplies System',
};

export default function NewRequestPage() {
  return (
    <DashboardLayoutClient title="Tạo yêu cầu mới">
      <RequestForm />
    </DashboardLayoutClient>
  );
}
