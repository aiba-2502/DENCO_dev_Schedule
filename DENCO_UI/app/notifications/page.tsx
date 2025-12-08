import { Metadata } from 'next';
import NotificationSettings from '@/components/notifications/notification-settings';

export const metadata: Metadata = {
  title: 'Notification Settings | Voice AI Call System',
  description: 'Configure notification preferences and delivery methods',
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}