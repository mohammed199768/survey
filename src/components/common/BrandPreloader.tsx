import React from 'react';
import Image from 'next/image';

type BrandPreloaderProps = {
  size?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
};

const STROKE = '#3a92c6';

function HorvathSymbol({ size = 180 }: { size?: number }) {
  const squares = [
    { x: 62, y: 30, s: 66 },
    { x: 110, y: 68, s: 66 },
    { x: 158, y: 106, s: 66 },
    { x: 62, y: 126, s: 66 },
    { x: 110, y: 164, s: 66 },
    { x: 206, y: 106, s: 52 },
    { x: 94, y: 62, s: 34 },
    { x: 142, y: 100, s: 34 },
    { x: 94, y: 158, s: 34 },
    { x: 190, y: 100, s: 34 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 280"
      fill="none"
      role="img"
      aria-label="Horv\u00E1th loading mark"
      className="overflow-visible"
    >
      <g className="origin-center animate-[spin_22s_linear_infinite]">
        {squares.map((sq, idx) => {
          const cx = sq.x + sq.s / 2;
          const cy = sq.y + sq.s / 2;
          return (
            <rect
              key={`${sq.x}-${sq.y}-${sq.s}`}
              x={sq.x}
              y={sq.y}
              width={sq.s}
              height={sq.s}
              rx={2}
              transform={`rotate(45 ${cx} ${cy})`}
              stroke={STROKE}
              strokeWidth={idx < 5 ? 5 : 4}
              strokeOpacity={idx < 5 ? 0.95 : 0.85}
              className="animate-pulse"
              style={{ animationDuration: `${1.8 + (idx % 4) * 0.5}s` }}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function BrandPreloader({
  size = 180,
  showLabel = true,
  label = 'Loading...',
  className = '',
}: BrandPreloaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="animate-[pulse_2.6s_ease-in-out_infinite]">
        <HorvathSymbol size={size} />
      </div>
      {showLabel && (
        <div className="text-center">
          <div className="flex justify-center">
            <Image
              src="/logo (3).webp"
              alt="Horv\u00E1th"
              width={180}
              height={52}
              priority
              className="object-contain h-12 w-auto"
            />
          </div>
          <p className="text-[11px] tracking-[0.24em] font-semibold text-slate-500 uppercase mt-2">
            Impact Platform
          </p>
          <p className="text-sm text-slate-500 mt-2">{label}</p>
        </div>
      )}
    </div>
  );
}

type FullPagePreloaderProps = {
  label?: string;
};

export function FullPagePreloader({ label = 'Preparing your experience...' }: FullPagePreloaderProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f6f8]">
      <BrandPreloader label={label} />
    </div>
  );
}

