import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#d8e9f5] font-sans">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.08)] p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-700 leading-relaxed mb-4">
            HORVATH collects basic professional information (such as name, email, company, and assessment responses)
            to deliver your assessment experience, generate insights, and improve service quality.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            We process data securely, limit access to authorized personnel, and do not sell your personal data. Data may
            be shared with trusted service providers only when required to operate the platform.
          </p>
          <p className="text-slate-700 leading-relaxed">
            By using this platform, you consent to this processing. For any privacy request (access, correction, or
            deletion), contact the HORVATH support team.
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

