'use client';

import Link from 'next/link';

interface NavbarProps {
  showBackButton?: boolean;
  backUrl?: string;
}

const BRAND = 'HORV\u00C1TH';

export function Navbar({ showBackButton = false, backUrl }: NavbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center px-6 md:px-[52px]"
      style={{
        borderBottom: '1px solid rgba(77,159,224,0.18)',
        background:
          'linear-gradient(180deg, rgba(15,45,74,0.94) 0%, rgba(10,30,51,0.90) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 6px 20px rgba(15,45,74,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Link href="/" className="flex items-center gap-[10px] no-underline group">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 shrink-0"
        >
          <rect x="4" y="4" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
          <rect x="14" y="14" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
        </svg>

        <span
          className="font-bold tracking-[0.20em] text-[17px] text-white uppercase"
          style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '0.20em' }}
        >
          {BRAND}
        </span>
      </Link>

      <div className="ml-auto" />
    </header>
  );
}
