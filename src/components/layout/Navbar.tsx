'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
  showBackButton?: boolean;
  backUrl?: string;
}

export function Navbar({ showBackButton = false, backUrl }: NavbarProps) {
  const router = useRouter();
  
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 border-2 border-black rounded-md transform rotate-45" />
        <div>
          <span className="font-semibold text-lg">HORVÁTH</span>
          <span className="text-gray-600 text-sm ml-2">| IMPACT PLATFORM</span>
        </div>
      </div>
      
      {/* Right side */}
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
