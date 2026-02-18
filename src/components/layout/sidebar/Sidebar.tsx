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

  React.useEffect(() => {
    if (!assessment) {
      loadAssessment();
    }
  }, [assessment, loadAssessment]);

  // If still loading or failed, show skeleton or nothing? 
  // For sidebar, we might validly have no data yet.
  if (!assessment) return null; // Or a loading state

  const handleSubmit = () => {
    if (isLocked) return;

    // We need to map store data to the expected format for getMissingItems 
    // OR update getMissingItems to use store data. 
    // For now, let's adapt the store data to match what getMissingItems expects if possible,
    // or better, implement a store-aware check here since getMissingItems relies on the old static definition.
    
    // Quick store-based check:
    const missing: MissingItem[] = [];
    assessment.dimensions.forEach(dim => {
        dim.topics.forEach(topic => {
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

  // Check if a topic is completed (present in responses)
  const isTopicCompleted = (topicId: string): boolean => {
    return !!responses[topicId];
  };

  // Check if current path matches this topic (using topic ID)
  // URL: /survey/[dimensionKey]?topic=[topicKey] 
  // The API distinguishes between ID (uuid) and Key (slug). 
  // Stores uses ID for responses. Sidebar links need to use Keys for clean URLs? 
  // Or did we switch to IDs in the URLs too?
  // Let's check `endpoints.ts` and `types.ts`... `TopicStructure` has `id` and `topicKey`.
  // The store uses `id` for responses key.
  // The URL routing in `DimensionContent` uses `topicKey` if we followed the pattern, 
  // BUT `DimensionContent` implementation I wrote uses:
  // `router.push(/survey/${dimension.dimensionKey}?topic=${targetTopic.topicKey});`
  // Wait, I used `topic.topicKey` in `DimensionContent`.
  // AND `TopicCard` uses `topic.id` to look up responses.
  
  // So Sidebar needs to link to keys but check completion by ID.

  const isActive = (dimensionKey: string, topicKey: string): boolean => {
    if (!pathname.includes(`/survey/${dimensionKey}`)) return false;
    return activeTopicKey ? activeTopicKey === topicKey : false;
  };

  React.useEffect(() => {
    if (isLocked || !activeTopicKey) return;
    const activeEl = topicRefs.current[activeTopicKey];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeTopicKey, isLocked, pathname]);

  return (
    <>
      {/* Floating Card Sidebar */}
      <aside
        className={`fixed left-6 top-24 w-[300px] h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden ${
          isLocked ? 'opacity-80' : ''
        }`}
      >
        
        {/* Scrollable Content Area - Dimensions and Topics */}
        <nav className={`flex-1 overflow-y-auto px-6 py-6 ${isLocked ? 'pointer-events-none select-none' : ''}`}>
          <div className="space-y-0">
            {assessment.dimensions.map((dimension, dimIdx) => (
              <div key={dimension.id} className="mb-6">
                {/* Dimension Title - Gray number */}
                <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">
                  {dimIdx + 1}. {dimension.title}
                </h3>

                {/* Topics List */}
                <div className="space-y-0.5">
                  {dimension.topics.map((topic) => {
                    const completed = isTopicCompleted(topic.id);
                    const active = isActive(dimension.dimensionKey, topic.topicKey);
                    
                    // Determine state
                    let itemClass = '';
                    let icon = null;
                    let textClass = '';

                    if (active) {
                      itemClass = 'flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-lg bg-[#E3F2FD] transition-colors';
                      icon = <span className="text-[#0066cc] text-sm font-bold">▶</span>;
                      textClass = 'text-[#0066cc] font-medium text-[15px]';
                    } else if (completed) {
                      itemClass = 'flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-lg hover:bg-gray-50 transition-colors';
                      icon = <span className="text-[#0066cc] text-sm font-bold">✓</span>;
                      textClass = 'text-[#0066cc] font-normal text-[15px]';
                    } else {
                      itemClass = 'block px-3 py-2.5 mb-0.5 rounded-lg';
                      textClass = 'text-gray-400 italic text-[15px] font-normal';
                    }

                    return (
                      <Link
                        key={topic.id}
                        href={`/survey/${dimension.dimensionKey}?topic=${topic.topicKey}`}
                        ref={(el) => {
                          topicRefs.current[topic.topicKey] = el;
                        }}
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

        {/* Fixed Submit Button at Bottom */}
        <div className="shrink-0 px-6 py-5 bg-white space-y-3">
          <button
            onClick={handleSubmit}
            className="block w-full px-6 py-3.5 bg-[#0066cc] text-white rounded-full text-base font-semibold text-center cursor-pointer transition-all duration-300 hover:bg-[#0052a3] shadow-md hover:shadow-lg"
          >
            Submit
          </button>
          
          <ResetButton variant="sidebar" />
        </div>
        {isLocked && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-white/45 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-800">Sidebar Locked</p>
              <p className="text-xs text-slate-600 mt-1">
                Complete the intake form and click Begin Assessment to unlock navigation.
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* CO Badge - Black circle bottom left */}
      <div className="fixed bottom-6 left-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-50">
        CO
      </div>

      <AssessmentGateDialog 
        open={showGate} 
        onClose={() => setShowGate(false)} 
        missing={missingItems} 
      />
    </>
  );
}
