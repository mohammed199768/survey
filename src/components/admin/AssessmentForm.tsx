'use client';

import { useState, useEffect } from 'react';
import { AssessmentAdminAPI } from '@/lib/api/adminEndpoints';
import { AssessmentListItem, AssessmentWithDimensions, CreateAssessmentRequest, AssessmentDimension, AssessmentTopic } from '@/lib/api/adminTypes';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';

interface AssessmentFormProps {
  assessment?: AssessmentListItem | AssessmentWithDimensions | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface DimensionFormData {
  id?: string;
  key: string;
  title: string;
  description: string;
  category: string;
  order: number;
  topics: TopicFormData[];
}

interface TopicFormData {
  id?: string;
  key: string;
  label: string;
  prompt: string;
  help_text: string;
  order: number;
}

const CATEGORIES = [
  'Leadership',
  'Strategy',
  'Operations',
  'Marketing',
  'Finance',
  'Technology',
  'People',
  'Culture',
  'Customer',
  'Innovation'
];

export function AssessmentForm({ assessment, onSuccess, onCancel }: AssessmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(!!assessment);
  const [dimensions, setDimensions] = useState<DimensionFormData[]>([]);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    version: 1
  });

  useEffect(() => {
    if (assessment) {
      loadAssessmentDetails(assessment.id);
    }
  }, [assessment]);

  const loadAssessmentDetails = async (id: string) => {
    try {
      setIsLoadingDetails(true);
      const details = await AssessmentAdminAPI.get(id);
      setFormData({
        title: details.title || '',
        description: details.description || '',
        version: details.version || 1
      });
      setDimensions(details.dimensions?.map(dim => ({
        id: dim.id,
        key: dim.key,
        title: dim.title,
        description: dim.description || '',
        category: dim.category,
        order: dim.order,
        topics: dim.topics?.map(topic => ({
          id: topic.id,
          key: topic.key,
          label: topic.label,
          prompt: topic.prompt,
          help_text: topic.help_text || '',
          order: topic.order
        })) || []
      })) || []);
      // Expand all dimensions by default
      setExpandedDimensions(new Set(details.dimensions?.map((_, i) => i) || []));
    } catch (err) {
      console.error('Failed to load assessment details:', err);
      setError('Failed to load assessment details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const payload: CreateAssessmentRequest = {
        title: formData.title,
        description: formData.description,
        version: formData.version,
        dimensions: dimensions.map((dim, index) => ({
          key: dim.key || dim.title.toLowerCase().replace(/\s+/g, '_'),
          title: dim.title,
          description: dim.description,
          category: dim.category,
          order: dim.order || index,
          topics: dim.topics.map((topic, topicIndex) => ({
            key: topic.key || topic.label.toLowerCase().replace(/\s+/g, '_'),
            label: topic.label,
            prompt: topic.prompt,
            help_text: topic.help_text,
            order: topic.order || topicIndex
          }))
        }))
      };

      if (assessment?.id) {
        await AssessmentAdminAPI.update(assessment.id, payload);
      } else {
        await AssessmentAdminAPI.create(payload);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save assessment:', err);
      setError('Failed to save assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addDimension = () => {
    const newDimension: DimensionFormData = {
      key: '',
      title: '',
      description: '',
      category: CATEGORIES[0],
      order: dimensions.length,
      topics: []
    };
    setDimensions([...dimensions, newDimension]);
    setExpandedDimensions(prev => {
      const newSet = new Set(prev);
      newSet.add(dimensions.length);
      return newSet;
    });
  };

  const removeDimension = (index: number) => {
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const updateDimension = (index: number, field: keyof DimensionFormData, value: string | number) => {
    setDimensions(dimensions.map((dim, i) => 
      i === index ? { ...dim, [field]: value } : dim
    ));
  };

  const addTopic = (dimensionIndex: number) => {
    const newTopic: TopicFormData = {
      key: '',
      label: '',
      prompt: '',
      help_text: '',
      order: dimensions[dimensionIndex].topics.length
    };
    setDimensions(dimensions.map((dim, i) => 
      i === dimensionIndex 
        ? { ...dim, topics: [...dim.topics, newTopic] }
        : dim
    ));
  };

  const removeTopic = (dimensionIndex: number, topicIndex: number) => {
    setDimensions(dimensions.map((dim, i) => 
      i === dimensionIndex 
        ? { ...dim, topics: dim.topics.filter((_, j) => j !== topicIndex) }
        : dim
    ));
  };

  const updateTopic = (dimensionIndex: number, topicIndex: number, field: keyof TopicFormData, value: string) => {
    setDimensions(dimensions.map((dim, i) => 
      i === dimensionIndex 
        ? { 
            ...dim, 
            topics: dim.topics.map((topic, j) => 
              j === topicIndex ? { ...topic, [field]: value } : topic
            )
          }
        : dim
    ));
  };

  const toggleDimension = (index: number) => {
    const newExpanded = new Set(expandedDimensions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDimensions(newExpanded);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {assessment ? 'Edit Assessment' : 'Create New Assessment'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Enter assessment title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter assessment description"
                  />
                </div>

                {/* Dimensions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Dimensions</h3>
                    <button
                      type="button"
                      onClick={addDimension}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Dimension
                    </button>
                  </div>

                  {dimensions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">No dimensions added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Dimension" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dimensions.map((dimension, dimensionIndex) => (
                        <div key={dimensionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Dimension Header */}
                          <div 
                            className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                            onClick={() => toggleDimension(dimensionIndex)}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900">
                                Dimension {dimensionIndex + 1}
                              </span>
                              {dimension.title && (
                                <span className="text-sm text-gray-500">
                                  - {dimension.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDimension(dimensionIndex);
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              {expandedDimensions.has(dimensionIndex) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Dimension Content */}
                          {expandedDimensions.has(dimensionIndex) && (
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={dimension.title}
                                    onChange={(e) => updateDimension(dimensionIndex, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="e.g., Leadership & Governance"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                  </label>
                                  <select
                                    value={dimension.category}
                                    onChange={(e) => updateDimension(dimensionIndex, 'category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                  >
                                    {CATEGORIES.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={dimension.description}
                                  onChange={(e) => updateDimension(dimensionIndex, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                  placeholder="Describe what this dimension measures"
                                />
                              </div>

                              {/* Topics */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Topics
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addTopic(dimensionIndex)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 rounded"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Topic
                                  </button>
                                </div>

                                {dimension.topics.length === 0 ? (
                                  <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No topics added</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {dimension.topics.map((topic, topicIndex) => (
                                      <div key={topicIndex} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-500">
                                            Topic {topicIndex + 1}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => removeTopic(dimensionIndex, topicIndex)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <input
                                            type="text"
                                            value={topic.label}
                                            onChange={(e) => updateTopic(dimensionIndex, topicIndex, 'label', e.target.value)}
                                            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Label *"
                                          />
                                          <input
                                            type="text"
                                            value={topic.prompt}
                                            onChange={(e) => updateTopic(dimensionIndex, topicIndex, 'prompt', e.target.value)}
                                            className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                            placeholder="Prompt"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          value={topic.help_text}
                                          onChange={(e) => updateTopic(dimensionIndex, topicIndex, 'help_text', e.target.value)}
                                          className="w-full mt-2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                                          placeholder="Help text (optional)"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || isLoadingDetails}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {assessment ? 'Update Assessment' : 'Create Assessment'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
