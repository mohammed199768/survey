'use client';

import { useEffect, useState } from 'react';
import { AnalyticsAPI, DashboardAPI } from '@/lib/api/adminEndpoints';
import { AnalyticsDimensionBreakdown, DashboardStats } from '@/lib/api/adminTypes';
import { StatCard } from '@/components/admin/StatCard';
import { BrandPreloader } from '@/components/common/BrandPreloader';
import { AlertCircle, ClipboardList, Target, TrendingUp, Users } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [dimensionBreakdown, setDimensionBreakdown] = useState<AnalyticsDimensionBreakdown[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDimensionBreakdown = async () => {
      try {
        setIsLoadingDimensions(true);
        const data = await AnalyticsAPI.getDimensionBreakdown();
        setDimensionBreakdown(data);
      } catch (err) {
        console.error('Failed to fetch dimension breakdown:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoadingDimensions(false);
      }
    };

    const fetchDashboardStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await DashboardAPI.getStats('all');
        setDashboardStats(data.overview);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDimensionBreakdown();
    fetchDashboardStats();
  }, []);

  const stats = dashboardStats;
  const totalResponses = stats?.total_responses ?? 0;
  const completionRate = stats?.completion_rate ?? 0;
  const avgScore = stats?.avg_overall_score ?? 0;
  const avgGap = stats?.avg_overall_gap ?? 0;

  const fmtNum = (v: unknown): string => {
    const n = v === null || v === undefined ? NaN : Number(v);
    return Number.isFinite(n) ? n.toFixed(1) : '0.0';
  };

  const topGaps = [...dimensionBreakdown]
    .sort((a, b) => Number(b.avg_gap) - Number(a.avg_gap))
    .slice(0, 10);

  if (isLoadingStats && isLoadingDimensions && !dashboardStats && dimensionBreakdown.length === 0) {
    return (
      <div className="p-6 lg:p-8 min-h-[60vh] flex items-center justify-center">
        <BrandPreloader size={130} label="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Management overview of assessment performance</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard icon={ClipboardList} label="Total Responses" value={totalResponses} iconColor="text-blue-600" />
        <StatCard icon={Users} label="Completion Rate" value={`${fmtNum(completionRate)}%`} iconColor="text-green-600" />
        <StatCard icon={TrendingUp} label="Average Score" value={fmtNum(avgScore)} iconColor="text-purple-600" />
        <StatCard icon={Target} label="Average Gap" value={fmtNum(avgGap)} iconColor="text-orange-600" />
      </div>

      {isLoadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Top Priority Gaps</h3>
        </div>

        {isLoadingDimensions ? (
          <div className="animate-pulse space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : topGaps.length > 0 ? (
          <div className="space-y-3">
            {topGaps.map((gap, index) => (
              <div key={`${gap.title}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{gap.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Avg Score</span>
                    <p className="text-sm font-semibold text-gray-900">{fmtNum(gap.avg_score)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Gap</span>
                    <p className="text-sm font-semibold text-red-600">-{fmtNum(gap.avg_gap)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No gap data available</div>
        )}
      </div>
    </div>
  );
}
