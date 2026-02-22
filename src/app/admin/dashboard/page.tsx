'use client';

import { useEffect, useState } from 'react';
import { AssessmentAdminAPI, DashboardAPI } from '@/lib/api/adminEndpoints';
import { DashboardData, DashboardActivityItem } from '@/lib/api/adminTypes';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BrandPreloader } from '@/components/common/BrandPreloader';
import { 
  ClipboardList, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<DashboardActivityItem[]>([]);
  const [publishedSurveyTitle, setPublishedSurveyTitle] = useState('No published survey');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        const [data, assessments] = await Promise.all([
          DashboardAPI.getStats('all'),
          AssessmentAdminAPI.list(),
        ]);
        setDashboardData(data);

        const published = assessments.find((assessment) => assessment.is_published);
        if (published?.title) {
          setPublishedSurveyTitle(published.title);
        } else {
          setPublishedSurveyTitle('No published survey');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchActivityData = async () => {
      try {
        setIsLoadingActivity(true);
        const data = await DashboardAPI.getActivity();
        setActivities(data);
      } catch (err) {
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchDashboardData();
    fetchActivityData();
  }, []);

  const stats = dashboardData?.overview;

  // Calculate key metrics from the API response
  const totalSurveys = stats?.active_assessments ?? 0;
  const totalResponses = stats?.total_responses ?? 0;
  const completionRate = stats?.completion_rate ?? 0;
  const avgScore = stats?.avg_overall_score ?? 0;

  if (isLoadingStats && !dashboardData) {
    return (
      <div className="p-6 lg:p-8 min-h-[60vh] flex items-center justify-center">
        <BrandPreloader label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your assessment platform</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          icon={ClipboardList}
          label="Published Survey"
          value={publishedSurveyTitle}
          iconColor="text-horvath-700"
        />
        <StatCard
          icon={Users}
          label="Total Responses"
          value={totalResponses}
          iconColor="text-purple-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          iconColor="text-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={avgScore.toFixed(1)}
          iconColor="text-orange-600"
        />
      </div>

      {/* Additional Stats Row */}
      {dashboardData && !isLoadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            icon={Activity}
            label="Completed Responses"
            value={stats?.completed_responses ?? 0}
            iconColor="text-teal-600"
          />
          <StatCard
            icon={BarChart3}
            label="In Progress"
            value={stats?.in_progress_responses ?? 0}
            iconColor="text-horvath-900"
          />
          <StatCard
            icon={Users}
            label="Total Participants"
            value={stats?.total_participants ?? 0}
            iconColor="text-pink-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Gap Score"
            value={stats?.avg_overall_gap?.toFixed(1) ?? '0.0'}
            iconColor="text-red-600"
          />
        </div>
      )}

      {/* Loading skeleton for stats */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} isLoading={isLoadingActivity} />
        </div>

        {/* Quick Stats / Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Surveys</span>
              <span className="font-semibold text-gray-900">{totalSurveys}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{stats?.completed_responses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="font-semibold text-horvath-700">{stats?.in_progress_responses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Participants</span>
              <span className="font-semibold text-gray-900">{stats?.active_participants ?? 0}</span>
            </div>
          </div>

          {/* Top Dimensions */}
          {dashboardData?.topDimensions && dashboardData.topDimensions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Top Performing Dimensions</h4>
              <div className="space-y-2">
                {dashboardData.topDimensions.slice(0, 3).map((dim, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">{dim.title}</span>
                    <span className="font-medium text-green-600">{dim.avg_score?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Recent Completions Table */}
      {dashboardData?.recentCompletions && dashboardData.recentCompletions.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Completions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentCompletions.slice(0, 5).map((completion) => (
                  <tr key={completion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {completion.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {completion.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {completion.industry}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        completion.overall_score >= 70 ? 'text-green-600' :
                        completion.overall_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {completion.overall_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
