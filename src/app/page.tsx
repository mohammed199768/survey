'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { motion } from 'framer-motion';
import { BrandPreloader, FullPagePreloader } from '@/components/common/BrandPreloader';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const loadAssessment = useReadinessStore((state) => state.loadAssessment);
  const loadDefinitions = useReadinessStore((state) => state.loadDefinitions);
  const resumeSession = useReadinessStore((state) => state.resumeSession);
  const sessionToken = useReadinessStore((state) => state.sessionToken);
  const isLoading = useReadinessStore((state) => state.isLoading);
  const error = useReadinessStore((state) => state.error);
  const [showIntroLoader, setShowIntroLoader] = useState(true);

  useEffect(() => {
    loadAssessment();
    loadDefinitions();
  }, [loadAssessment, loadDefinitions]);

  useEffect(() => {
    if (sessionToken) {
      resumeSession(sessionToken);
    }
  }, [resumeSession, sessionToken]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntroLoader(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showIntroLoader) {
    return <FullPagePreloader label="HORVÁTH Experience Initializing..." />;
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(30,64,175,0.08),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(15,23,42,0.10),transparent_40%)]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-slate-100 rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-slate-100 to-blue-100 rounded-full blur-3xl opacity-40 translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-200 bg-white/90 text-xs md:text-sm tracking-[0.16em] text-blue-800 font-semibold mb-6"
          >
            HORVÁTH IMPACT PLATFORM
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-[0.95]"
          >
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent">
              HORVÁTH
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="space-y-4 mb-10 text-gray-700 max-w-2xl mx-auto"
          >
            <p className="text-xl md:text-2xl font-medium text-slate-800">
              Strategic Assessment. Executive Clarity.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-slate-600">
              Measure organizational readiness, surface critical capability gaps, and turn insights into high-impact action.
            </p>
          </motion.div>

          <div className="max-w-md mx-auto space-y-4 mb-6">
            {isLoading ? (
              <BrandPreloader size={120} label="Loading assessment..." />
            ) : error ? (
              <div className="text-red-500 font-medium">Error: {error}</div>
            ) : (
              <button
                onClick={() => router.push('/survey')}
                className="w-full px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                Start Assessment
                <span>{'->'}</span>
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            By clicking get started button, you agree to HORVATH&apos;s{' '}
            <Link href="/terms" className="text-blue-600 underline hover:text-blue-700">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

    </div>
  );
}
