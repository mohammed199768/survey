'use client';

import React, { useEffect, useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type BrandPreloaderProps = {
  label?: string;
  className?: string;
};

type FullPagePreloaderProps = {
  label?: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#3a92c6';

const MILESTONES: { at: number; label: string }[] = [
  { at: 0,  label: 'Preparing your experience' },
  { at: 30, label: 'Loading resources' },
  { at: 60, label: 'Connecting services' },
  { at: 85, label: 'Almost ready' },
];

// Matches the CSS progress animation curve
const COUNTER_STEPS: [number, number][] = [
  [200,  2], [300,  3], [200,  5], [300,  8],
  [200, 12], [300, 18], [200, 24], [300, 32],
  [400, 40], [300, 48], [400, 56], [300, 63],
  [500, 70], [400, 76], [500, 82], [600, 88],
  [800, 91],
];

// ── Injected keyframes (once per app) ────────────────────────────────────────

const KEYFRAMES = `
@keyframes hv-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes hv-breathe {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1;   }
}
@keyframes hv-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hv-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes hv-progress {
  0%   { transform: scaleX(0);    }
  20%  { transform: scaleX(0.1);  }
  60%  { transform: scaleX(0.55); }
  85%  { transform: scaleX(0.82); }
  100% { transform: scaleX(0.91); }
}
@keyframes hv-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ── HorvathSymbol ────────────────────────────────────────────────────────────

function HorvathSymbol() {
  // Five diamonds: [cx, cy, half, strokeW, strokeOpacity, duration, delay, breatheDelay]
  const diamonds: [number, number, number, number, number, number, number, number, number][] = [
    // Large center
    [60, 56, 30, 1.3, 1.00, 240, 1.0, 0.0, 1.2],
    // Medium top-right
    [96, 24, 18, 1.0, 0.65, 144, 0.8, 0.3, 1.5],
    // Medium bottom-left
    [24, 88, 18, 1.0, 0.65, 144, 0.8, 0.5, 1.8],
    // Small bottom-right
    [96, 88, 10, 0.8, 0.35,  80, 0.6, 0.7, 2.0],
    // Small top-left
    [24, 24, 10, 0.8, 0.35,  80, 0.6, 0.85, 2.2],
  ];

  return (
    <svg
      width={120}
      height={112}
      viewBox="0 0 120 112"
      fill="none"
      role="img"
      aria-label="Horváth loading mark"
      style={{ overflow: 'visible' }}
    >
      {/* Diamonds */}
      {diamonds.map(([cx, cy, half, sw, so, perim, dur, delay, bd], i) => (
        <g key={i}>
          {/* Fill pulse (large only) */}
          {i === 0 && (
            <rect
              x={cx - half}
              y={cy - half}
              width={half * 2}
              height={half * 2}
              fill={`rgba(58,146,198,0.05)`}
              style={{
                transform: `rotate(45deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                animation: `hv-breathe 3s ease-in-out ${bd}s infinite`,
              }}
            />
          )}
          {/* Stroke — drawn on load */}
          <rect
            x={cx - half}
            y={cy - half}
            width={half * 2}
            height={half * 2}
            stroke={BLUE}
            strokeWidth={sw}
            strokeOpacity={so}
            strokeDasharray={perim}
            strokeDashoffset={perim}
            style={{
              transform: `rotate(45deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              animation: `hv-draw ${dur}s cubic-bezier(0.4,0,0.2,1) ${delay}s both,
                          hv-breathe 3s ease-in-out ${bd}s infinite`,
            }}
          />
        </g>
      ))}

      {/* Connector lines */}
      {[
        [60, 56, 96, 24, 1.1],
        [60, 56, 24, 88, 1.2],
      ].map(([x1, y1, x2, y2, d], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={BLUE}
          strokeWidth={0.6}
          strokeOpacity={0.18}
          strokeDasharray="3 5"
          style={{ animation: `hv-fade-in 0.5s ease ${d}s both` }}
        />
      ))}

      {/* Centre pip */}
      <circle
        cx={60} cy={56} r={1.8}
        fill={BLUE}
        style={{ animation: 'hv-fade-in 0.4s ease 1s both' }}
      />
    </svg>
  );
}

// ── BrandPreloader ────────────────────────────────────────────────────────────

export function BrandPreloader({ label, className = '' }: BrandPreloaderProps) {
  const [pct, setPct] = useState(0);
  const [statusLabel, setStatusLabel] = useState(MILESTONES[0].label);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    injectStyles();

    let accumulated = 1800; // start delay
    COUNTER_STEPS.forEach(([delay, val]) => {
      accumulated += delay;
      const t = setTimeout(() => {
        setPct(val);
        const m = MILESTONES.filter(m => m.at <= val).pop();
        if (m) setStatusLabel(m.label);
      }, accumulated);
      timerRefs.current.push(t);
    });

    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  const displayLabel = label ?? statusLabel;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Symbol */}
      <HorvathSymbol />

      {/* Wordmark */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'hv-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 1s both',
          fontFamily: "'Barlow', sans-serif",
        }}
      >
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          <span style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 200,
            fontSize: 42,
            letterSpacing: '0.16em',
            color: '#1a2636',
            textTransform: 'uppercase',
          }}>
            Horv
          </span>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 50,
            color: BLUE,
            letterSpacing: 0,
            lineHeight: 1,
            margin: '0 2px',
          }}>
            Á
          </span>
          <span style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 200,
            fontSize: 42,
            letterSpacing: '0.16em',
            color: '#1a2636',
            textTransform: 'uppercase',
          }}>
            th
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            animation: 'hv-fade-in 0.6s ease 1.4s both',
          }}
        >
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(58,146,198,0.3) 80%)',
          }} />
          <div style={{
            width: 3, height: 3,
            background: BLUE,
            opacity: 0.6,
            transform: 'rotate(45deg)',
            flexShrink: 0,
          }} />
          <div style={{
            flex: 1, height: 1,
            background: 'linear-gradient(90deg, rgba(58,146,198,0.3) 20%, transparent)',
          }} />
        </div>

        {/* Tagline */}
        <p style={{
          marginTop: 8,
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 300,
          fontSize: 9,
          letterSpacing: '0.38em',
          color: '#8a96a8',
          textTransform: 'uppercase',
          animation: 'hv-fade-in 0.6s ease 1.5s both',
        }}>
          Impact Platform
        </p>
      </div>

      {/* Progress */}
      <div
        style={{
          marginTop: 28,
          width: 260,
          animation: 'hv-fade-up 0.7s ease 1.6s both',
        }}
      >
        {/* Track */}
        <div style={{
          width: '100%',
          height: 1,
          background: 'rgba(58,146,198,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent, ${BLUE} 60%, rgba(58,146,198,0.4))`,
            transformOrigin: 'left',
            animation: 'hv-progress 4.5s cubic-bezier(0.4,0,0.2,1) 1.8s both',
          }} />
        </div>

        {/* Meta row */}
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 300,
            fontSize: 10,
            letterSpacing: '0.14em',
            color: '#a0aab6',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span>{displayLabel}</span>
            <span style={{
              display: 'inline-block',
              width: 4,
              height: 1,
              background: BLUE,
              animation: 'hv-blink 1.1s step-end infinite 2s',
            }} />
          </div>

          <span style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 200,
            fontSize: 10,
            letterSpacing: '0.08em',
            color: BLUE,
            opacity: 0.7,
          }}>
            {String(pct).padStart(2, '0')}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── FullPagePreloader ─────────────────────────────────────────────────────────

export function FullPagePreloader({ label }: FullPagePreloaderProps) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f6f8',
    }}>
      <BrandPreloader label={label} />
    </div>
  );
}