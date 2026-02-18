import type { Metadata } from 'next';
import { RecommendationsPageClient } from '@/components/results/RecommendationsPageClient';

export const metadata: Metadata = {
  title: 'Recommendations | HORVATH',
  description: 'Strategic recommendations by HORVATH',
};

interface RecommendationsPageProps {
  searchParams?: Promise<{ responseId?: string }>;
}

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const responseId = resolvedParams.responseId ?? null;

  return <RecommendationsPageClient initialResults={null} responseIdFromQuery={responseId} />;
}
