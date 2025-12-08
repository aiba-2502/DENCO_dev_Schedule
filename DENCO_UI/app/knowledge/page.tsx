import { Metadata } from 'next';
import KnowledgeDatabase from '@/components/knowledge/knowledge-database';

export const metadata: Metadata = {
  title: 'Knowledge Database | Voice AI Call System',
  description: 'Manage knowledge articles and customer inquiries',
};

export default function KnowledgeDatabasePage() {
  return <KnowledgeDatabase />;
}