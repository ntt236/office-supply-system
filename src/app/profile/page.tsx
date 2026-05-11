import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { ProfileContent } from '@/components/profile/ProfileContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân | Office Supplies System',
};

export default function ProfilePage() {
  return (
    <DashboardLayoutClient title="Hồ sơ cá nhân">
      <ProfileContent />
    </DashboardLayoutClient>
  );
}
