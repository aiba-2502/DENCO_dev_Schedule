import { Metadata } from 'next';
import CustomerManagement from '@/components/users/customer-management';

export const metadata: Metadata = {
  title: 'Customer Management | Voice AI Call System',
  description: 'Manage customer information and contacts',
};

export default function CustomerManagementPage() {
  return <CustomerManagement />;
}