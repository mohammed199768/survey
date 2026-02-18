'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { BrandPreloader, FullPagePreloader } from '@/components/common/BrandPreloader';

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
              className="absolute w-[60px] h-[60px] rotate-45 border-[5px] border-[#4D9FE0]"
              style={{ left: `${20 + row * 30}px`, top: `${10 + col * 90 + row * 30}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
        <rect x="14" y="14" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
      </svg>
      <span className="text-[17px] font-bold tracking-[0.2em] text-white uppercase">HORVATH</span>
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
    return <FullPagePreloader label="HORVATH Experience Initializing..." />;
  }

  return (
    <div className="min-h-screen bg-[#0a1e33] text-white overflow-x-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      <DiamondPattern side="left" />
      <DiamondPattern side="right" />

      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(77,159,224,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(77,159,224,0.04)_1px,transparent_1px)] bg-[length:64px_64px]" />
      <div className="fixed left-1/2 top-1/2 z-0 pointer-events-none w-[80vw] h-[80vh] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(77,159,224,0.07)_0%,transparent_65%)]" />

      <header className="fixed top-0 left-0 right-0 z-20 h-[68px] px-6 md:px-10 lg:px-[52px] border-b border-[rgba(77,159,224,0.18)] bg-[rgba(10,30,51,0.8)] backdrop-blur-[20px] flex items-center justify-between">
        <BrandMark />
        <nav className="hidden md:block">
          <ul className="flex items-center gap-9">
            <li><span className="text-[11px] tracking-[0.16em] uppercase text-white/45">Platform</span></li>
            <li><span className="text-[11px] tracking-[0.16em] uppercase text-white/45">Methodology</span></li>
            <li><span className="text-[11px] tracking-[0.16em] uppercase text-white/45">Insights</span></li>
          </ul>
        </nav>
      </header>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-[100px] pb-20">
        <div className="w-full max-w-[680px] text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-3.5 mb-11 text-[10px] tracking-[0.30em] uppercase text-[#4D9FE0]">
            <span className="block w-7 h-px bg-[#4D9FE0]/60" />
            Impact Platform
            <span className="block w-7 h-px bg-[#4D9FE0]/60" />
          </div>

          <h1 className="text-[clamp(64px,11vw,108px)] font-bold tracking-[0.08em] leading-none text-white">
            HORVATH
            <span className="block text-[clamp(12px,1.4vw,16px)] font-normal tracking-[0.45em] uppercase text-[#4D9FE0] mt-1.5">
              Strategic Assessment
            </span>
          </h1>

          <div className="w-px h-10 my-8 bg-[linear-gradient(180deg,#4D9FE0_0%,transparent_100%)]" />

          <p className="text-[clamp(16px,2vw,20px)] leading-[1.5] text-white/65 mb-3">Executive Clarity. Measurable Impact.</p>
          <p className="text-[13px] leading-[1.8] tracking-[0.03em] text-white/35 max-w-[460px] mb-12">
            Measure organizational readiness, surface critical capability gaps, and transform strategic insights into high-impact executive action.
          </p>

          <div className="w-full max-w-[520px] flex mb-12 border border-[rgba(77,159,224,0.18)]">
            <div className="flex-1 px-5 py-3.5 bg-[rgba(77,159,224,0.08)] border-r border-[rgba(77,159,224,0.18)]">
              <span className="block text-[26px] font-bold text-[#4D9FE0] leading-[1.1]">6</span>
              <span className="block text-[9px] tracking-[0.2em] uppercase text-white/35 mt-1">Dimensions</span>
            </div>
            <div className="flex-1 px-5 py-3.5 bg-[rgba(77,159,224,0.08)] border-r border-[rgba(77,159,224,0.18)]">
              <span className="block text-[26px] font-bold text-[#4D9FE0] leading-[1.1]">48</span>
              <span className="block text-[9px] tracking-[0.2em] uppercase text-white/35 mt-1">Topics</span>
            </div>
            <div className="flex-1 px-5 py-3.5 bg-[rgba(77,159,224,0.08)]">
              <span className="block text-[26px] font-bold text-[#4D9FE0] leading-[1.1]">~20</span>
              <span className="block text-[9px] tracking-[0.2em] uppercase text-white/35 mt-1">Minutes</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3.5">
            {isLoading ? (
              <BrandPreloader size={120} label="Loading assessment..." />
            ) : error ? (
              <div className="text-red-300 font-medium">Error: {error}</div>
            ) : (
              <button
                onClick={() => router.push('/survey')}
                className="inline-flex items-center gap-3 px-12 py-4 bg-[#4D9FE0] text-[#0a1e33] text-[11px] font-bold tracking-[0.22em] uppercase hover:shadow-[0_8px_36px_rgba(77,159,224,0.35)] transition-all"
              >
                Begin Assessment
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <button className="text-[10px] tracking-[0.18em] uppercase text-white/30 hover:text-white/65 transition-colors">
              Review previous session
            </button>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-7 left-0 right-0 z-10 text-center text-[10px] tracking-[0.10em] text-white/20 px-4">
        By proceeding you agree to HORVATH&apos;s{' '}
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
