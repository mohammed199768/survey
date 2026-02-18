import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { Suspense } from 'react';

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
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
