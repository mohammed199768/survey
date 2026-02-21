'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponseAdminAPI } from '@/lib/api/adminEndpoints';
import { 
  ResponseDetail, 
  ResponseListItem,
  TopicAnswer,
  PriorityScore,
  PriorityRecommendation 
} from '@/lib/api/adminTypes';
import { FullPagePreloader } from '@/components/common/BrandPreloader';

// Back button component
function BackButton() {
  return (
    <Link 
      href="/admin/responses"
      className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
    >
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Responses
    </Link>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const isCompleted = status === 'completed';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isCompleted 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isCompleted ? (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )}
      {isCompleted ? 'Completed' : 'In Progress'}
    </span>
  );
}

// Score gauge component
function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-horvath-700';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (score: number) => {
    if (score >= 4) return 'bg-green-100';
    if (score >= 3) return 'bg-horvath-50';
    if (score >= 2) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sizes = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl'
  };
  const scorePercent = Math.max(0, Math.min(100, (score / 5) * 100));

  return (
    <div className={`${sizes[size]} relative flex items-center justify-center rounded-full ${getBgColor(score)}`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-200"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className={`${getScoreColor(score)} transition-all duration-1000`}
          strokeDasharray={`${scorePercent}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      <span className={`font-bold ${getScoreColor(score)}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// Progress bar component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Topic answer card component
function TopicAnswerCard({ answer }: { answer: TopicAnswer }) {
  const getGapColor = (gap: number) => {
    if (gap <= 0.5) return 'text-green-600 bg-green-50';
    if (gap <= 1.5) return 'text-horvath-700 bg-horvath-50';
    if (gap <= 2.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-horvath-700';
    if (rating >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{answer.label}</h4>
          <p className="text-xs text-gray-500">{answer.dimension_title}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getGapColor(answer.gap)}`}>
          Gap: {answer.gap > 0 ? '+' : ''}{answer.gap.toFixed(1)}
        </span>
      </div>
      
      <div className="flex items-center gap-4 mt-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Current</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div 
                className="bg-horvath-500 h-2 rounded-full"
                style={{ width: `${(answer.current_rating / 5) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${getRatingColor(answer.current_rating)}`}>
              {answer.current_rating.toFixed(1)}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Target</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${(answer.target_rating / 5) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${getRatingColor(answer.target_rating)}`}>
              {answer.target_rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {answer.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 italic">{answer.notes}</p>
        </div>
      )}
    </div>
  );
}

// Dimension breakdown card
function DimensionBreakdown({ priorities }: { priorities: PriorityScore[] }) {
  // Group by dimension
  const dimensionMap = new Map<string, { score: number; gap: number; title: string }>();
  
  priorities.forEach(p => {
    if (!dimensionMap.has(p.dimension_id)) {
      dimensionMap.set(p.dimension_id, {
        score: p.dimension_score,
        gap: p.dimension_gap,
        title: p.dimension_title
      });
    }
  });

  const dimensions = Array.from(dimensionMap.values());

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-horvath-500';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGapColor = (gap: number) => {
    if (gap <= 5) return 'text-green-600';
    if (gap <= 15) return 'text-horvath-700';
    if (gap <= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dimensions.map((dim, idx) => (
        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">{dim.title}</h4>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Score</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getScoreColor(dim.score)}`}
                    style={{ width: `${Math.max(0, Math.min(100, (dim.score / 5) * 100))}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{dim.score.toFixed(1)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Gap</div>
              <span className={`text-sm font-medium ${getGapColor(dim.gap)}`}>
                {dim.gap > 0 ? '+' : ''}{dim.gap.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Top gaps list
function TopGapsList({ answers }: { answers: TopicAnswer[] }) {
  // Sort by gap (highest first)
  const sortedByGap = [...answers].sort((a, b) => b.gap - a.gap).slice(0, 5);

  const getGapColor = (gap: number) => {
    if (gap <= 0.5) return 'bg-green-100 text-green-800';
    if (gap <= 1.5) return 'bg-horvath-50 text-horvath-900';
    if (gap <= 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-3">
      {sortedByGap.map((answer, idx) => (
        <div key={answer.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
              {idx + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{answer.label}</p>
              <p className="text-xs text-gray-500">{answer.dimension_title}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getGapColor(answer.gap)}`}>
              Gap: {answer.gap > 0 ? '+' : ''}{answer.gap.toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneratedRecommendations({ priorities }: { priorities: PriorityScore[] }) {
  const items = priorities
    .flatMap((priority) =>
      (priority.recommendations || []).map((rec) => ({
        ...rec,
        dimension_title: priority.dimension_title,
      }))
    )
    .sort((a, b) => b.priority - a.priority);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No generated recommendations for this response.
      </div>
    );
  }

  const categoryClasses: Record<PriorityRecommendation['category'], string> = {
    'Quick Win': 'bg-green-100 text-green-800',
    Project: 'bg-horvath-50 text-horvath-900',
    'Big Bet': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-3">
      {items.map((rec, idx) => (
        <div key={`${rec.id}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{rec.dimension_title}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${categoryClasses[rec.category]}`}>
                {rec.category}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                Priority {rec.priority}
              </span>
            </div>
          </div>

          {rec.description && (
            <p className="text-sm text-gray-700 mt-3">{rec.description}</p>
          )}

          {rec.action_items.length > 0 && (
            <ul className="mt-3 space-y-1">
              {rec.action_items.map((item, i) => (
                <li key={`${rec.id}-action-${i}`} className="text-sm text-gray-700">
                  â€¢ {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [responseDetail, setResponseDetail] = useState<ResponseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponseDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await ResponseAdminAPI.get(resolvedParams.id);
        setResponseDetail(data);
      } catch (err) {
        setError('Failed to load response details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponseDetail();
  }, [resolvedParams.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (response: ResponseListItem) => {
    if (response.status === 'completed') return 100;
    const started = new Date(response.started_at);
    const lastUpdated = new Date(response.last_updated_at);
    const hoursElapsed = (lastUpdated.getTime() - started.getTime()) / (1000 * 60 * 60);
    const progress = Math.min(Math.round((hoursElapsed / 0.5) * 100), 90);
    return Math.max(progress, 10);
  };

  if (isLoading) {
    return <FullPagePreloader label="Loading response details..." />;
  }

  if (error || !responseDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Response not found'}</p>
          <Link href="/admin/responses" className="text-primary hover:underline">
            Back to Responses
          </Link>
        </div>
      </div>
    );
  }

  const { response, answers, priorities } = responseDetail;
  const isCompleted = response.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton />
        <StatusBadge status={response.status} />
      </div>

      {/* Response Overview */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Response Details</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participant Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Participant Information
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{response.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{response.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm font-medium text-gray-900">{response.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assessment</p>
                    <p className="text-sm font-medium text-gray-900">{response.assessment_title}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Timeline
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Started</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(response.started_at)}</p>
                  </div>
                  {response.completed_at && (
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(response.completed_at)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(response.last_updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score & Progress */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Overall Score</h3>
              <ScoreGauge score={response.overall_score} size="lg" />
              {isCompleted && (
                <div className="mt-4">
                  <span className={`text-lg font-bold ${
                    response.overall_gap <= 10 ? 'text-green-600' :
                    response.overall_gap <= 20 ? 'text-horvath-700' :
                    response.overall_gap <= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Gap: {response.overall_gap > 0 ? '+' : ''}{response.overall_gap.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <ProgressBar progress={calculateProgress(response)} />
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Breakdown */}
      {isCompleted && priorities.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimension Breakdown</h2>
          <DimensionBreakdown priorities={priorities} />
        </div>
      )}

      {/* Top Gaps */}
      {isCompleted && answers.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Gaps</h2>
          <TopGapsList answers={answers} />
        </div>
      )}

      {isCompleted && priorities.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Recommendations</h2>
          <GeneratedRecommendations priorities={priorities} />
        </div>
      )}

      {/* Topic Responses */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Topic Responses ({answers.length})
        </h2>
        
        {answers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No topic responses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {answers.map((answer) => (
              <TopicAnswerCard key={answer.id} answer={answer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
