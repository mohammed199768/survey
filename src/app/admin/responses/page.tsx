'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ResponseAdminAPI } from '@/lib/api/adminEndpoints';
import { 
  ResponseListItem, 
  PaginatedResponse,
  PaginationInfo,
  ResponseListParams
} from '@/lib/api/adminTypes';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
      {status === 'completed' ? 'Completed' : 'In Progress'}
    </span>
  );
}

// Score badge component
function ScoreBadge({ score, gap }: { score: number; gap: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGapColor = (gap: number) => {
    if (gap <= 10) return 'text-green-600';
    if (gap <= 20) return 'text-blue-600';
    if (gap <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(score)}`}>
        {score.toFixed(1)}%
      </span>
      <span className={`text-xs ${getGapColor(gap)}`}>
        Gap: {gap > 0 ? '+' : ''}{gap.toFixed(1)}
      </span>
    </div>
  );
}

// Progress bar component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
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

export default function ResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<ResponseListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchResponses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: ResponseListParams = {
        page: currentPage,
        limit: 20,
        status: status !== 'all' ? status : undefined,
      };
      
      // Add search parameter if provided
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      
      const result = await ResponseAdminAPI.list(params);
      setResponses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
      setError('Failed to load responses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, status, debouncedSearch]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, debouncedSearch]);

  const handleRowClick = (responseId: string) => {
    router.push(`/admin/responses/${responseId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (response: ResponseListItem) => {
    if (response.status === 'completed') return 100;
    // Calculate based on time elapsed if in progress
    const started = new Date(response.started_at);
    const lastUpdated = new Date(response.last_updated_at);
    const hoursElapsed = (lastUpdated.getTime() - started.getTime()) / (1000 * 60 * 60);
    // Assume typical assessment takes about 30 minutes
    const progress = Math.min(Math.round((hoursElapsed / 0.5) * 100), 90);
    return Math.max(progress, 10);
  };

  const renderPagination = () => {
    const { page, pages } = pagination;
    
    if (pages <= 1) return null;

    const getPageNumbers = () => {
      const nums: (number | string)[] = [];
      const showPages = 5;
      
      if (pages <= showPages) {
        for (let i = 1; i <= pages; i++) nums.push(i);
      } else {
        if (page <= 3) {
          for (let i = 1; i <= 4; i++) nums.push(i);
          nums.push('...');
          nums.push(pages);
        } else if (page >= pages - 2) {
          nums.push(1);
          nums.push('...');
          for (let i = pages - 3; i <= pages; i++) nums.push(i);
        } else {
          nums.push(1);
          nums.push('...');
          for (let i = page - 1; i <= page + 1; i++) nums.push(i);
          nums.push('...');
          nums.push(pages);
        }
      }
      
      return nums;
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {getPageNumbers().map((num, idx) => (
              num === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-400">...</span>
              ) : (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num as number)}
                  className={`px-3 py-1 text-sm font-medium border ${
                    page === num 
                      ? 'bg-primary text-white border-primary' 
                      : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              )
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all participant responses
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by email or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-40 py-2 pl-3 pr-10 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="all">All</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Error!</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score / Gap
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-gray-500">Loading responses...</span>
                    </div>
                  </td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No responses found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                responses.map((response) => (
                  <tr 
                    key={response.id} 
                    onClick={() => handleRowClick(response.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {response.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{response.full_name}</div>
                      <div className="text-sm text-gray-500">{response.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {response.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {response.assessment_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={response.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      <ProgressBar progress={calculateProgress(response)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ScoreBadge score={response.overall_score} gap={response.overall_gap} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(response.completed_at || response.last_updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(response.id);
                        }}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
}
