'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MissingItem } from '@/lib/assessment/progress';

interface AssessmentGateDialogProps {
  open: boolean;
  onClose: () => void;
  missing: MissingItem[];
}

export function AssessmentGateDialog({ open, onClose, missing }: AssessmentGateDialogProps) {
  const router = useRouter();

  if (!open) return null;

  const isComplete = missing.length === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
        
        {isComplete ? (
          <>
            {/* Success Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#1d6996] to-horvath-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Assessment Complete!
            </h2>
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              You've successfully completed all assessment questions. 
              Would you like to view your results now?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/results')}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#1d6996] to-horvath-700 text-white font-semibold rounded-xl hover:from-[#1d6996] hover:to-horvath-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                View Results
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Review My Answers
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Incomplete Icon */}
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Almost there!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              You have {missing.length} unanswered question{missing.length === 1 ? '' : 's'}. 
              Please complete them to view your results.
            </p>

            {/* Missing Items List (Limited) */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-[200px] overflow-y-auto border border-gray-100">
              <div className="space-y-2">
                {missing.slice(0, 6).map((item) => (
                  <div key={`${item.dimensionId}-${item.topicId}`} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>
                      <span className="font-medium">{item.dimensionTitle}:</span> {item.topicLabel}
                    </span>
                  </div>
                ))}
                {missing.length > 6 && (
                  <div className="text-xs text-gray-400 italic text-center pt-2">
                    ...and {missing.length - 6} more
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const first = missing[0];
                  const topicParam = (first as MissingItem & { topicKey?: string }).topicKey ?? first.topicId;
                  router.push(`/survey/${first.dimensionId}?topic=${topicParam}`);
                  onClose();
                }}
                className="w-full px-6 py-4 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-all shadow-md"
              >
                Go to first unanswered
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Review My Answers
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
