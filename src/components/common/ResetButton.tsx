'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useReadinessStore } from '@/store/readiness/readiness.store';

interface ResetButtonProps {
  className?: string;
  label?: string;
  variant?: 'sidebar' | 'results';
}

export function ResetButton({ className = '', label = 'Reset Assessment', variant = 'results' }: ResetButtonProps) {
  const router = useRouter();
  const clearAllData = useReadinessStore((state) => state.clearAllData);

  const handleReset = () => {
    // Basic confirm - could use a nicer dialog later
    if (window.confirm('Are you sure you want to reset your assessment? All progress will be lost.')) {
      clearAllData();
      router.push('/survey');
    }
  };

  const baseClasses = "text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";
  
  const variantClasses = variant === 'sidebar' 
    ? "text-gray-400 hover:text-red-600 block text-center py-2" // Sidebar specific
    : "text-gray-400 hover:text-red-600 px-4 py-2 rounded-md hover:bg-red-50"; // Results specific

  return (
    <button
      onClick={handleReset}
      className={`${baseClasses} ${variantClasses} ${className}`}
      type="button"
    >
      {label}
    </button>
  );
}
