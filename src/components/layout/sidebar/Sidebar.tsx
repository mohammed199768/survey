'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';
import { AssessmentGateDialog } from '@/components/survey/AssessmentGateDialog';
import { MissingItem } from '@/lib/assessment/progress';
import { ResetButton } from '@/components/common/ResetButton';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTopicKey = searchParams.get('topic');
  const isLocked = pathname === '/survey';
  const assessment = useReadinessStore((state) => state.assessment);
  const responses = useReadinessStore((state) => state.responses);
  const loadAssessment = useReadinessStore((state) => state.loadAssessment);
  const topicRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});

  const [showGate, setShowGate] = React.useState(false);
  const [missingItems, setMissingItems] = React.useState<MissingItem[]>([]);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!assessment) {
      loadAssessment();
    }
  }, [assessment, loadAssessment]);

  React.useEffect(() => {
    if (!assessment || isLocked || !activeTopicKey) return;
    const activeEl = topicRefs.current[activeTopicKey];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeTopicKey, assessment, isLocked, pathname]);

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, activeTopicKey]);

  if (!assessment) return null;

  const handleSubmit = () => {
    if (isLocked) return;

    const missing: MissingItem[] = [];
    assessment.dimensions.forEach((dim) => {
      dim.topics.forEach((topic) => {
        if (!responses[topic.id]) {
          missing.push({
            dimensionId: dim.dimensionKey,
            dimensionTitle: dim.title,
            topicId: topic.id,
            topicLabel: topic.label,
            topicKey: topic.topicKey,
          });
        }
      });
    });

    setMissingItems(missing);
    setShowGate(true);
  };

  const isTopicCompleted = (topicId: string): boolean => {
    return !!responses[topicId];
  };

  const isActive = (dimensionKey: string, topicKey: string): boolean => {
    if (!pathname.includes(`/survey/${dimensionKey}`)) return false;
    return activeTopicKey ? activeTopicKey === topicKey : false;
  };

  return (
    <>
      <button
        type="button"
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="lg:hidden fixed top-20 left-4 z-50 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center"
      >
        {isMobileOpen ? (
          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setIsMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed z-40 left-0 top-16 h-[calc(100vh-4rem)] w-[86vw] max-w-[320px] bg-[#1d6996] rounded-r-2xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out lg:left-6 lg:top-24 lg:w-[300px] lg:max-w-none lg:h-[calc(100vh-7rem)] lg:rounded-2xl lg:shadow-xl ${
          isLocked ? 'opacity-90 lg:opacity-80' : ''
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <nav className={`flex-1 overflow-y-auto px-5 lg:px-6 py-5 lg:py-6 ${isLocked ? 'pointer-events-none select-none' : ''}`}>
          <div className="space-y-0">
            {assessment.dimensions.map((dimension, dimIdx) => (
              <div key={dimension.id} className="mb-6">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#7fbadc] mb-2 px-2">
                  {dimIdx + 1}. {dimension.title}
                </h3>

                <div className="space-y-0.5">
                  {dimension.topics.map((topic) => {
                    const completed = isTopicCompleted(topic.id);
                    const active = isActive(dimension.dimensionKey, topic.topicKey);

                    let itemClass = '';
                    let icon = null;
                    let textClass = '';

                    if (active) {
                      itemClass = 'flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-lg bg-[#3a92c6] transition-colors';
                      icon = (
                        <span className="text-white">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 4l8 6-8 6V4z" />
                          </svg>
                        </span>
                      );
                      textClass = 'text-white font-medium text-[15px]';
                    } else if (completed) {
                      itemClass = 'flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-lg hover:bg-[rgba(255,255,255,0.10)] transition-colors';
                      icon = (
                        <span className="text-white">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7.8 14.2L3.6 10l1.4-1.4 2.8 2.8L15 4.2 16.4 5.6 7.8 14.2z" />
                          </svg>
                        </span>
                      );
                      textClass = 'text-white font-normal text-[15px]';
                    } else {
                      itemClass = 'block px-3 py-2.5 mb-0.5 rounded-lg hover:bg-[rgba(255,255,255,0.10)] transition-colors';
                      textClass = 'text-white/80 italic text-[15px] font-normal';
                    }

                    return (
                      <Link
                        key={topic.id}
                        href={`/survey/${dimension.dimensionKey}?topic=${topic.topicKey}`}
                        ref={(el) => {
                          topicRefs.current[topic.topicKey] = el;
                        }}
                        onClick={() => setIsMobileOpen(false)}
                        className={itemClass}
                      >
                        {!!icon && icon}
                        <span className={textClass}>{topic.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="shrink-0 px-5 lg:px-6 py-4 lg:py-5 bg-[#1d6996] border-t border-[rgba(255,255,255,0.12)] space-y-3">
          <button
            onClick={() => {
              handleSubmit();
              setIsMobileOpen(false);
            }}
            className="block w-full px-6 py-3.5 bg-[#3a92c6] text-white rounded-full text-base font-semibold text-center cursor-pointer transition-all duration-300 hover:bg-[#54a5d5] focus:ring-2 focus:ring-[#3a92c6] focus:ring-offset-2 focus:ring-offset-[#1d6996] shadow-md hover:shadow-lg"
          >
            Submit
          </button>

          <ResetButton variant="sidebar" />
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-30 rounded-r-2xl lg:rounded-2xl bg-[#1d6996]/65 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm font-semibold text-white">Sidebar Locked</p>
              <p className="text-xs text-white/85 mt-1">
                Complete the intake form and click Begin Assessment to unlock navigation.
              </p>
            </div>
          </div>
        )}
      </aside>

      <AssessmentGateDialog
        open={showGate}
        onClose={() => setShowGate(false)}
        missing={missingItems}
      />
    </>
  );
}
