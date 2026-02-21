'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AssessmentAdminAPI, getTopicRecommendations } from '@/lib/api/adminEndpoints';
import { AssessmentWithDimensions } from '@/lib/api/adminTypes';
import { AssessmentForm } from '@/components/admin/AssessmentForm';
import { TopicLevelEditor } from '@/components/admin/TopicLevelEditor';
import { TopicRecommendationEditor } from '@/components/admin/TopicRecommendationEditor';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  UploadCloud, 
  XCircle,
  CheckCircle,
  FileText,
  FolderOpen,
  MessageSquare,
  Loader2,
  AlertCircle,
  Settings
} from 'lucide-react';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<AssessmentWithDimensions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [topicTabs, setTopicTabs] = useState<Record<string, 'question' | 'levels' | 'recommendations'>>({});
  const [topicRecCounts, setTopicRecCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      setIsLoading(true);
      const data = await AssessmentAdminAPI.get(assessmentId);
      setAssessment(data);
      const allTopics = data.dimensions?.flatMap((dim) => dim.topics || []) || [];
      const countEntries = await Promise.all(
        allTopics.map(async (topic) => {
          try {
            const recs = await getTopicRecommendations(topic.id);
            return [topic.id, recs.length] as const;
          } catch {
            return [topic.id, 0] as const;
          }
        })
      );
      setTopicRecCounts(Object.fromEntries(countEntries));
    } catch (err) {
      setError('Failed to load assessment details');
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

  const handlePublish = async () => {
    if (!assessment) return;
    try {
      setIsPublishing(true);
      await AssessmentAdminAPI.publish(assessment.id, !assessment.is_published);
      showToast(
        assessment.is_published ? 'Assessment unpublished successfully' : 'Assessment published successfully',
        'success'
      );
      fetchAssessment();
    } catch (err) {
      showToast('Failed to update publish status', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!assessment) return;
    try {
      setIsDeleting(true);
      await AssessmentAdminAPI.delete(assessment.id);
      showToast('Assessment deleted successfully', 'success');
      router.push('/admin/assessments');
    } catch (err) {      showToast(getApiErrorMessage(err, 'Failed to delete assessment'), 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchAssessment();
    showToast('Assessment updated successfully', 'success');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTopicTab = (topicId: string): 'question' | 'levels' | 'recommendations' =>
    topicTabs[topicId] || 'question';

  const setTopicTab = (topicId: string, tab: 'question' | 'levels' | 'recommendations') => {
    setTopicTabs((prev) => ({ ...prev, [topicId]: tab }));
  };

  const isLevelsComplete = (topic: {
    level_1_label?: string | null;
    level_2_label?: string | null;
    level_3_label?: string | null;
    level_4_label?: string | null;
    level_5_label?: string | null;
  }) =>
    Boolean(
      topic.level_1_label &&
      topic.level_2_label &&
      topic.level_3_label &&
      topic.level_4_label &&
      topic.level_5_label
    );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/admin/assessments"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Assessments
          </Link>
        </div>
        <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Assessment</h2>
          <p className="text-gray-500">{error || 'Assessment not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/assessments"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Assessments
        </Link>
      </div>

      {/* Title Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{assessment.title}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                v{assessment.version}
              </span>
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
            </div>
            {assessment.description && (
              <p className="text-gray-600 mt-2">{assessment.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
              <span>Created: {formatDate(assessment.created_at)}</span>
              {assessment.created_by_name && <span>By: {assessment.created_by_name}</span>}
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                assessment.is_published
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
                  : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
              } disabled:opacity-50`}
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : assessment.is_published ? (
                <XCircle className="w-4 h-4 mr-2" />
              ) : (
                <UploadCloud className="w-4 h-4 mr-2" />
              )}
              {assessment.is_published ? 'Unpublish' : 'Publish'}
            </button>
            {deleteConfirm ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dimensions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Dimensions & Topics</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <FolderOpen className="w-4 h-4 mr-1" />
              {assessment.dimensions?.length || 0} Dimensions
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {assessment.dimensions?.reduce((acc, dim) => acc + (dim.topics?.length || 0), 0) || 0} Topics
            </span>
          </div>
        </div>

        {assessment.dimensions && assessment.dimensions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {assessment.dimensions.map((dimension, dimensionIndex) => (
              <div key={dimension.id || dimensionIndex} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-semibold">{dimensionIndex + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{dimension.title}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {dimension.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                {dimension.description && (
                  <p className="text-gray-600 mb-4 ml-13">{dimension.description}</p>
                )}

                {dimension.topics && dimension.topics.length > 0 && (
                  <div className="ml-13">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Topics</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {dimension.topics.map((topic, topicIndex) => (
                        <div
                          key={topic.id || topicIndex}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{topic.label}</span>
                              <p className="text-xs text-gray-500">#{topicIndex + 1}</p>
                            </div>
                            <button
                              type="button"
                              className="text-xs text-horvath-700"
                              onClick={() =>
                                setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id))
                              }
                            >
                              {expandedTopicId === topic.id ? 'Collapse' : 'Expand'}
                            </button>
                          </div>

                          {expandedTopicId === topic.id && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className={`rounded px-2 py-1 text-xs ${getTopicTab(topic.id) === 'question' ? 'bg-horvath-700 text-white' : 'bg-white border'}`}
                                  onClick={() => setTopicTab(topic.id, 'question')}
                                >
                                  Question
                                </button>
                                <button
                                  className={`rounded px-2 py-1 text-xs ${getTopicTab(topic.id) === 'levels' ? 'bg-horvath-700 text-white' : 'bg-white border'}`}
                                  onClick={() => setTopicTab(topic.id, 'levels')}
                                >
                                  Level Labels {isLevelsComplete(topic) ? '✓' : '⚠'}
                                </button>
                                <button
                                  className={`rounded px-2 py-1 text-xs ${getTopicTab(topic.id) === 'recommendations' ? 'bg-horvath-700 text-white' : 'bg-white border'}`}
                                  onClick={() => setTopicTab(topic.id, 'recommendations')}
                                >
                                  Recommendations ({topicRecCounts[topic.id] ?? 0})
                                </button>
                              </div>

                              {getTopicTab(topic.id) === 'question' && (
                                <div className="rounded border bg-white p-3">
                                  {topic.prompt && <p className="text-sm text-gray-600 mb-2">{topic.prompt}</p>}
                                  {topic.help_text && <p className="text-xs text-gray-500 italic">{topic.help_text}</p>}
                                </div>
                              )}

                              {getTopicTab(topic.id) === 'levels' && (
                                <div className="rounded border bg-white p-3">
                                  <TopicLevelEditor topicId={topic.id} topicLabel={topic.label} />
                                </div>
                              )}

                              {getTopicTab(topic.id) === 'recommendations' && (
                                <div className="rounded border bg-white p-3">
                                  <TopicRecommendationEditor topicId={topic.id} />
                                </div>
                              )}
                            </div>
                          )}

                          {expandedTopicId !== topic.id && (
                            <>
                              {topic.prompt && (
                                <p className="text-sm text-gray-600 mb-2">{topic.prompt}</p>
                              )}
                              {topic.help_text && (
                                <p className="text-xs text-gray-500 italic">{topic.help_text}</p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dimensions yet</h3>
            <p className="text-gray-500 mb-4">Add dimensions and topics to this assessment</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Add Content
            </button>
          </div>
        )}
      </div>

      {/* Assessment Form Modal */}
      {showForm && (
        <AssessmentForm
          assessment={assessment}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

