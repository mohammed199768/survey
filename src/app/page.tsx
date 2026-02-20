'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { BrandPreloader, FullPagePreloader } from '@/components/common/BrandPreloader';
import { Navbar } from '@/components/layout/Navbar';

const BRAND = 'HORV\u00C1TH';

function DiamondPattern({ side }: { side: 'left' | 'right' }) {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed top-1/2 z-0 hidden xl:block ${
        side === 'left' ? 'left-[-60px]' : 'right-[-60px]'
      }`}
      style={{ transform: `translateY(-50%) ${side === 'right' ? 'scaleX(-1)' : ''}` }}
    >
      <div className="relative w-[220px] h-[420px] opacity-[0.12]">
        {items.map((i) => {
          const row = i % 3;
          const col = Math.floor(i / 3);
          return (
            <div
              key={`${side}-${i}`}
              className="absolute w-[60px] h-[60px] rotate-45 border-[5px] border-[#3a92c6]"
              style={{ left: `${20 + row * 30}px`, top: `${10 + col * 90 + row * 30}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}

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
    return <FullPagePreloader label={`${BRAND} Experience Initializing...`} />;
  }

  return (
    <div className="min-h-screen bg-[#0a1e33] text-white overflow-x-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      <Navbar />
      <DiamondPattern side="left" />
      <DiamondPattern side="right" />

      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(58,146,198,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(58,146,198,0.04)_1px,transparent_1px)] bg-[length:64px_64px]" />
      <div className="fixed left-1/2 top-1/2 z-0 pointer-events-none w-[80vw] h-[80vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(58,146,198,0.07)_0%,transparent_65%)]" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-[110px] pb-20">
        <div className="w-full max-w-[740px] text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-3.5 mb-10 text-[10px] tracking-[0.30em] uppercase text-[#3a92c6]">
            <span className="block w-7 h-px bg-[#3a92c6]/60" />
            Impact Platform
            <span className="block w-7 h-px bg-[#3a92c6]/60" />
          </div>

          <h1 className="text-[clamp(64px,11vw,108px)] font-bold tracking-[0.08em] leading-none text-white">{BRAND}</h1>

          <div className="w-px h-10 my-8 bg-[linear-gradient(180deg,#3a92c6_0%,transparent_100%)]" />

          <p className="text-[clamp(16px,2vw,20px)] leading-[1.5] text-white/70 mb-10">Strategic Assessment. Executive Clarity.</p>

          <div className="max-w-md mx-auto space-y-4 mb-6 w-full">
            {isLoading ? (
              <BrandPreloader size={120} label="Loading assessment..." />
            ) : error ? (
              <div className="text-red-300 font-medium">Error: {error}</div>
            ) : (
              <button
                onClick={() => router.push('/survey')}
                className="w-full inline-flex items-center justify-center gap-3 px-14 py-5 bg-[#3a92c6] text-[#0a1e33] text-[12px] md:text-[13px] font-bold tracking-[0.24em] uppercase rounded-[2px] hover:shadow-[0_10px_40px_rgba(58,146,198,0.35)] transition-all"
              >
                Begin Assessment
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-7 left-0 right-0 z-10 text-center text-[10px] tracking-[0.10em] text-white/20 px-4">
        By clicking get started button, you agree to {BRAND}&apos;s{' '}
        <Link href="/terms" className="underline underline-offset-[3px]">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-[3px]">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
