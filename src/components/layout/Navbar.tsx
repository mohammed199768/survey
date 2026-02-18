'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  showBackButton?: boolean;
  backUrl?: string;
}

const BRAND = 'HORV\u00C1TH';

export function Navbar({ showBackButton = false, backUrl }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/survey', label: 'Survey' },
    { href: '/results', label: 'Results' },
    { href: '/results/recommendations', label: 'Recommendations' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center justify-between px-6 md:px-8 z-50">
      <Link href="/" className="flex items-center gap-2.5">
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
          <rect x="14" y="14" width="22" height="22" stroke="#4D9FE0" strokeWidth="3" />
        </svg>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-lg tracking-[0.08em]">{BRAND}</span>
          <span className="text-gray-500 text-xs md:text-sm">IMPACT PLATFORM</span>
        </div>
      </Link>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[11px] tracking-[0.16em] uppercase transition-colors ${
                    active ? 'text-[#1b4e94] font-semibold' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-4">
        {showBackButton && backUrl && (
          <button
            onClick={() => router.push(backUrl)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
    </header>
  );
}
