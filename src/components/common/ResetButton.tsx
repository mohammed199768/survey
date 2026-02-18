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

  const baseClasses = 'text-sm transition-all focus:outline-none';
  
  const variantClasses = variant === 'sidebar' 
    ? "text-gray-400 hover:text-red-600 block text-center py-2" // Sidebar specific
    : "brand-btn-outline px-6 py-3"; // Results specific

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
