'use client';

import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div className="brand-theme min-h-screen bg-[radial-gradient(1200px_500px_at_78%_-140px,#eaf4ff_0%,#f5f7fa_55%,#f2f4f8_100%)] flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl rounded-[28px] bg-white/95 border border-[#b6d5eb] shadow-[0_24px_60px_rgba(15,23,42,0.12)] px-6 py-10 sm:px-10 sm:py-12 text-center">
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold text-[#3a92c6]">System Error</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0F3F52]">Application Error</h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              A critical error occurred while loading the app shell.
            </p>
            {error?.digest ? (
              <p className="mt-2 text-xs text-slate-500">Reference: {error.digest}</p>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button onClick={reset} className="brand-btn w-full sm:w-auto px-8 py-3 text-sm">
                Reload
              </button>
              <a href="/" className="brand-btn-outline w-full sm:w-auto px-8 py-3 text-sm">
                Return Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
