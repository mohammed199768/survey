import type { Metadata } from 'next';
import ResultsClient from '@/components/results/ResultsClient';

export const metadata: Metadata = {
  title: 'Results | HORVATH',
  description: 'Assessment results by HORVATH',
};

interface ResultsPageProps {
  searchParams?: Promise<{ responseId?: string }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const responseId = resolvedParams.responseId ?? null;

  return (
    <ResultsClient
      initialResults={null}
      initialError={null}
      responseIdFromQuery={responseId}
    />
  );
}
