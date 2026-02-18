'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AssessmentAdminAPI } from '@/lib/api/adminEndpoints';
import { AssessmentListItem } from '@/lib/api/adminTypes';
import { AssessmentForm } from '@/components/admin/AssessmentForm';
import { AssessmentImporter } from '@/components/admin/AssessmentImporter';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  UploadCloud, 
  XCircle,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentListItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await AssessmentAdminAPI.list();
      setAssessments(data);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      setError('Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getApiErrorMessage = (err: unknown, fallback: string): string => {
    if (!(err instanceof Error)) {
      return fallback;
    }

    const text = err.message;
    const marker = text.indexOf(' - ');
    if (marker >= 0) {
      const payload = text.slice(marker + 3).trim();
      try {
        const parsed = JSON.parse(payload) as { error?: string; response_count?: string | number };
        if (parsed.error === 'Cannot delete assessment with existing responses') {
          const count = parsed.response_count ?? '?';
          return `Cannot delete this assessment because it has ${count} existing response(s).`;
        }
        if (parsed.error) {
          return parsed.error;
        }
      } catch {
        // Ignore JSON parse issues and use fallback below.
      }
    }

    return fallback;
  };

  const handlePublish = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoading(id);
      await AssessmentAdminAPI.publish(id, !currentStatus);
      showToast(!currentStatus ? 'Assessment published successfully' : 'Assessment unpublished', 'success');
      fetchAssessments();
    } catch (err) {
      console.error('Failed to publish/unpublish:', err);
      showToast('Failed to update publish status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await AssessmentAdminAPI.delete(id);
      showToast('Assessment deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchAssessments();
    } catch (err) {      showToast(getApiErrorMessage(err, 'Failed to delete assessment'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAssessment(null);
    fetchAssessments();
    showToast(editingAssessment ? 'Assessment updated successfully' : 'Assessment created successfully', 'success');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500 mt-1">Manage your surveys and assessments</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => setShowImporter(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            📁 Import from JSON
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Assessment
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-500 mb-4">Create your first assessment to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Assessment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensions / Topics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                          {assessment.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {assessment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        v{assessment.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assessment.is_published ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(assessment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assessment.dimension_count} / {assessment.topic_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assessment.response_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Button */}
                        <Link
                          href={`/admin/assessments/${assessment.id}`}
                          className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingAssessment(assessment);
                            setShowForm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Publish/Unpublish Button */}
                        <button
                          onClick={() => handlePublish(assessment.id, assessment.is_published)}
                          disabled={actionLoading === assessment.id}
                          className={`p-2 rounded-lg transition-colors ${
                            assessment.is_published
                              ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title={assessment.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {actionLoading === assessment.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : assessment.is_published ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <UploadCloud className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete Button */}
                        {deleteConfirm === assessment.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDelete(assessment.id)}
                              disabled={actionLoading === assessment.id}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === assessment.id ? '...' : 'Confirm'}
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
                            onClick={() => setDeleteConfirm(assessment.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assessment Form Modal */}
      {showForm && (
        <AssessmentForm
          assessment={editingAssessment}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAssessment(null);
          }}
        />
      )}

      {showImporter && (
        <AssessmentImporter
          onClose={() => setShowImporter(false)}
          onSuccess={(assessmentId) => {
            setShowImporter(false);
            router.push(`/admin/assessments/${assessmentId}`);
          }}
        />
      )}
    </div>
  );
}

