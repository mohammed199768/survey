import type { Metadata } from 'next';
import { z } from 'zod';
import { RecommendationsPageClient } from '@/components/results/RecommendationsPageClient';
import { ResultsDataSchema } from '@/lib/api/schemas';
import { API_BASE_URL } from '@/config/api';

export const metadata: Metadata = {
  title: 'Recommendations | HORVATH',
  description: 'Strategic recommendations by HORVATH',
};

const WrappedResultsSchema = z.object({
  success: z.boolean(),
  data: ResultsDataSchema.optional(),
});

interface RecommendationsPageProps {
  searchParams?: Promise<{ responseId?: string }>;
}

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const responseId = resolvedParams.responseId ?? null;
  let initialResults = null;

  if (responseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/public/responses/${responseId}/results`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const json = (await response.json()) as unknown;
        const parsed = WrappedResultsSchema.parse(json);
        if (parsed.success && parsed.data) {
          initialResults = parsed.data;
        }
      }
    } catch {
      initialResults = null;
    }
  }

  return <RecommendationsPageClient initialResults={initialResults} responseIdFromQuery={responseId} />;
}
