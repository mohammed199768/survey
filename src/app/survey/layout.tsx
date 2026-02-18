import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { Suspense } from 'react';

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="brand-theme flex min-h-screen bg-[radial-gradient(1200px_500px_at_78%_-140px,#eaf4ff_0%,#f5f7fa_55%,#f2f4f8_100%)]">
      <Navbar />

      {/* Floating Sidebar */}
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      {/* Main Content - No margin, content handles its own positioning */}
      <main className="w-full mt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
