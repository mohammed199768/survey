import { Suspense } from 'react';
import { DimensionContent } from "@/components/survey/DimensionContent";
import { FullPagePreloader } from '@/components/common/BrandPreloader';

type PageProps = {
  params: Promise<{ dimensionId: string }>;
};

export default async function DimensionPage({ params }: PageProps) {
  const { dimensionId } = await params;

  return (
    <Suspense fallback={<FullPagePreloader label="Loading survey..." />}>
      <DimensionContent dimensionId={dimensionId} />
    </Suspense>
  );
}
