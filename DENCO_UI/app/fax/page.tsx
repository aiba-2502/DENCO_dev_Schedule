import { Metadata } from 'next';
import FaxManagement from '@/components/fax/fax-management';

export const metadata: Metadata = {
  title: 'FAX Management | Voice AI Call System',
  description: 'Manage inbound and outbound FAX documents',
};

export default function FaxManagementPage() {
  return <FaxManagement />;
}
