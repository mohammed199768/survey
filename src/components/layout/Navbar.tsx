'use client';

import Image from 'next/image';
import Link from 'next/link';

interface NavbarProps {
  showBackButton?: boolean;
  backUrl?: string;
}

export function Navbar({ showBackButton = false, backUrl }: NavbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center px-6 md:px-[52px]"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        background: '#1d6996',
        boxShadow: '0 6px 20px rgba(29,105,150,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Link href="/" className="no-underline group">
        <div className="flex items-center">
          <Image
            src="/logo (3).webp"
            alt="Horv\u00E1th"
            width={140}
            height={40}
            priority
            className="object-contain h-10 w-auto"
          />
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-5">
        {showBackButton && backUrl ? (
          <Link
            href={backUrl}
            className="text-white/80 hover:text-white border-b-2 border-transparent hover:border-white transition-colors text-sm font-medium"
          >
            Back
          </Link>
        ) : null}
      </div>
    </header>
  );
}

