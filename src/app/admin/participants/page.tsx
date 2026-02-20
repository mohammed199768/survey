'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ParticipantAdminAPI } from '@/lib/api/adminEndpoints';
import { AdminParticipant, PaginationInfo } from '@/lib/api/adminTypes';

export default function ParticipantsPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ParticipantAdminAPI.list(currentPage, 20);
      setParticipants(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setError('Failed to load participants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleViewResponses = (participantId: string) => {
    router.push(`/admin/responses?participant_id=${participantId}`);
  };

  const handleDelete = async (participantId: string) => {
    const previousParticipants = participants;
    const previousPagination = pagination;

    setActionLoading(participantId);
    setDeleteConfirm(null);

    const nextParticipants = previousParticipants.filter((participant) => participant.id !== participantId);
    const nextTotal = Math.max(0, previousPagination.total - 1);

    setParticipants(nextParticipants);
    setPagination((prev) => ({
      ...prev,
      total: nextTotal,
      pages: Math.max(1, Math.ceil(nextTotal / prev.limit)),
    }));

    try {
      await ParticipantAdminAPI.delete(participantId);
      if (nextParticipants.length === 0 && currentPage > 1) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
    } catch (err) {
      console.error('Failed to delete participant:', err);
      setParticipants(previousParticipants);
      setPagination(previousPagination);
      setError('Failed to delete participant. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {getPageNumbers().map((num, idx) =>
              num === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-400">
                  ...
                </span>
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
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all participants</p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          <span className="font-medium">Error!</span> {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-gray-500">Loading participants...</span>
                    </div>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No participants found.
                  </td>
                </tr>
              ) : (
                participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewResponses(participant.id)}
                        className="text-sm font-medium text-primary hover:text-primary-hover"
                      >
                        {participant.full_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.response_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(participant.last_activity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleViewResponses(participant.id)}
                          className="text-primary hover:text-primary-hover font-medium"
                        >
                          View Responses
                        </button>
                        {deleteConfirm === participant.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDelete(participant.id)}
                              disabled={actionLoading === participant.id}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(participant.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>
    </div>
  );
}
