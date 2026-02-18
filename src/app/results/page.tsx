import type { Metadata } from 'next';
import { z } from 'zod';
import ResultsClient from '@/components/results/ResultsClient';
import { ResultsDataSchema } from '@/lib/api/schemas';
import { API_BASE_URL } from '@/config/api';

export const metadata: Metadata = {
  title: 'Results | HORVATH',
  description: 'Assessment results by HORVATH',
};

const WrappedResultsSchema = z.object({
  success: z.boolean(),
  data: ResultsDataSchema.optional(),
  error: z.string().optional(),
});

interface ResultsPageProps {
  searchParams?: Promise<{ responseId?: string }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedParams = (await searchParams) ?? {};
  const responseId = resolvedParams.responseId ?? null;

  let initialResults = null;
  let initialError: string | null = null;

  if (responseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/public/responses/${responseId}/results`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        initialError = `Failed to load results (${response.status})`;
      } else {
        const json = (await response.json()) as unknown;
        const parsed = WrappedResultsSchema.parse(json);
        if (parsed.success && parsed.data) {
          initialResults = parsed.data;
        } else {
          initialError = parsed.error || 'No results returned from API';
        }
      }
    } catch (error: unknown) {
      initialError = error instanceof Error ? error.message : 'Failed to load results';
    }
  }

  return (
    <ResultsClient
      initialResults={initialResults}
      initialError={initialError}
      responseIdFromQuery={responseId}
    />
  );
}
