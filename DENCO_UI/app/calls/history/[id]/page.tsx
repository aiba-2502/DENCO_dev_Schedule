'use client';

import dynamicImport from 'next/dynamic';
import { use } from 'react';

const SessionDetail = dynamicImport(
  () => import('@/components/calls/session-detail').then(mod => ({ default: mod.SessionDetail })),
  { ssr: false }
);

// Next.js 16: params is now a Promise, use React.use() to unwrap
export default function CallSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SessionDetail id={id} />;
}
