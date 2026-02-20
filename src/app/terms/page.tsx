import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#d8e9f5] font-sans">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-700 leading-relaxed mb-4">
            This platform is provided to support readiness assessments and strategic decision-making. By using it, you
            agree to provide accurate information and use the system in a lawful, professional manner.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            Assessment outputs are advisory in nature and should be reviewed with your internal stakeholders before final
            business decisions. HORVATH may update features or content to improve platform quality.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Unauthorized access, misuse, or disruption of the platform is prohibited. Continued use of the platform means
            acceptance of these terms.
          </p>

          <div className="mt-8">
            <Link href="/" className="text-horvath-700 hover:text-horvath-500 underline">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

