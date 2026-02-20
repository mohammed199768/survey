'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { Navbar } from '@/components/layout/Navbar';
import { BrandPreloader } from '@/components/common/BrandPreloader';
import Link from 'next/link';

export default function SurveyPage() {
  const router = useRouter();
  const registerParticipant = useReadinessStore((state) => state.registerParticipant);
  const startAssessment = useReadinessStore((state) => state.startAssessment);
  const clearSessionState = useReadinessStore((state) => state.clearSessionState);
  const assessment = useReadinessStore((state) => state.assessment);
  const isLoading = useReadinessStore((state) => state.isLoading);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    companyName: '',
    jobTitle: '',
    consentGiven: false,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearSessionState();
  }, [clearSessionState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.consentGiven) {
      setError('Please agree to the terms to continue.');
      return;
    }

    try {
      // 1. Register participant
      await registerParticipant(formData);
      
      // 2. Start assessment response
      await startAssessment();
      
      // 3. Navigate to first dimension
      // Re-fetch assessment from store to ensure we have the latest data if needed, 
      // but 'assessment' from hook should be sufficient if loaded on Home page.
      // If assessment is null, we might need to handle that, but Home page checks it.
      const firstDimension = assessment?.dimensions[0]?.dimensionKey;
      const firstTopic = assessment?.dimensions[0]?.topics[0]?.topicKey;

      if (firstDimension) { 
        router.push(`/survey/${firstDimension}${firstTopic ? `?topic=${firstTopic}` : ''}`);
      } else {
         setError('Assessment structure not found. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to start assessment:', err);
      const message = err instanceof Error ? err.message : 'Failed to start assessment. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      <Navbar />
      
      <main className="pt-24 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[32rem] h-[32rem] bg-gradient-to-br from-horvath-900 to-slate-100/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-tl from-slate-200/50 to-horvath-700 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="rounded-3xl border border-white/80 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur p-8 md:p-10 relative">
            {isLoading && (
              <div className="absolute inset-0 z-20 rounded-3xl bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                <BrandPreloader size={120} label="Starting assessment..." />
              </div>
            )}
            <div className="text-center mb-8 md:mb-10">
              <span className="inline-flex items-center rounded-full border border-horvath-100 bg-horvath-50 px-4 py-1.5 text-[11px] tracking-[0.18em] font-semibold text-horvath-900 uppercase">
                Confidential Executive Intake
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
                Start Your Assessment
              </h1>
              <p className="text-slate-600 mt-3 text-sm md:text-base max-w-2xl mx-auto">
                Provide your professional details to launch a personalized HORVÁTH readiness assessment.
              </p>
            </div>
          
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-horvath-700/20 focus:border-horvath-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-horvath-700/20 focus:border-horvath-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-horvath-700/20 focus:border-horvath-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-horvath-700/20 focus:border-horvath-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <input
                  type="checkbox"
                  id="consent"
                  className="mt-0.5 w-5 h-5 text-horvath-700 rounded focus:ring-horvath-700 border-slate-300"
                  checked={formData.consentGiven}
                  onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                />
                <label htmlFor="consent" className="text-sm text-slate-700 leading-relaxed">
                  I agree to the processing of my personal data for the purpose of this assessment and accept the{' '}
                  <Link href="/terms" className="text-horvath-700 underline hover:text-horvath-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-horvath-700 underline hover:text-horvath-500">
                    Privacy Policy
                  </Link>.
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#3a92c6] text-white rounded-xl font-semibold text-lg hover:bg-[#54a5d5] focus:ring-2 focus:ring-[#3a92c6] focus:ring-offset-2 disabled:bg-[#b6d5eb] disabled:opacity-100 disabled:cursor-not-allowed transition-all shadow-[0_8px_24px_rgba(29,105,150,0.25)]"
              >
                {isLoading ? 'Starting Assessment...' : 'Begin Assessment'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
