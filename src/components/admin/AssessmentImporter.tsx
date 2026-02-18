'use client';

import { useMemo, useState } from 'react';
import { Loader2, Upload, X, FileJson, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { importExecute, importValidate } from '@/lib/api/adminEndpoints';
import { downloadTemplate } from '@/lib/utils/assessmentTemplate';

type Step = 'upload' | 'validating' | 'preview' | 'importing' | 'success' | 'error';

type ValidationResponse = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    assessmentTitle: string;
    dimensionCount: number;
    topicCount: number;
    recommendationCount: number;
    topicsWithAllLevels: number;
    topicsWithRecommendations: number;
    duplicateExists: boolean;
    existingAssessmentId: string | null;
  };
};

type ImportResponse = {
  success: boolean;
  assessmentId: string;
  imported: {
    dimensions: number;
    topics: number;
    recommendations: number;
  };
};

interface AssessmentImporterProps {
  onClose: () => void;
  onSuccess: (assessmentId: string) => void;
}

const parseApiError = (err: unknown): string => {
  if (!(err instanceof Error)) {
    return 'Unexpected error';
  }

  const marker = err.message.indexOf(' - ');
  if (marker === -1) {
    return err.message;
  }

  const payload = err.message.slice(marker + 3).trim();
  try {
    const parsed = JSON.parse(payload) as { error?: string; errors?: string[] };
    if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
      return parsed.errors.join('\n');
    }
    if (parsed.error) {
      return parsed.error;
    }
  } catch {
    return payload;
  }

  return err.message;
};

const parseValidationFromError = (err: unknown): ValidationResponse | null => {
  if (!(err instanceof Error)) {
    return null;
  }

  const marker = err.message.indexOf(' - ');
  if (marker === -1) {
    return null;
  }

  const payload = err.message.slice(marker + 3).trim();
  try {
    const parsed = JSON.parse(payload) as ValidationResponse;
    if (
      typeof parsed.valid === 'boolean' &&
      Array.isArray(parsed.errors) &&
      Array.isArray(parsed.warnings) &&
      typeof parsed.summary === 'object'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

export function AssessmentImporter({ onClose, onSuccess }: AssessmentImporterProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [importMode, setImportMode] = useState<'create' | 'update'>('create');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadError = useMemo(() => (step === 'upload' ? error : null), [step, error]);

  const resetToUpload = () => {
    setStep('upload');
    setSelectedFile(null);
    setJsonContent(null);
    setValidation(null);
    setResult(null);
    setError(null);
    setImportMode('create');
  };

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a .json file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)');
      return;
    }

    setSelectedFile({ name: file.name, size: file.size });

    try {
      const text = await file.text();
      setJsonContent(text);
      setStep('validating');

      const validateResult = (await importValidate({ json: text })) as ValidationResponse;
      setValidation(validateResult);
      setImportMode(validateResult.summary.duplicateExists ? 'create' : 'create');
      setStep('preview');
    } catch (err) {
      const parsedValidation = parseValidationFromError(err);
      if (parsedValidation) {
        setValidation(parsedValidation);
        setStep('preview');
        return;
      }

      setError(parseApiError(err));
      setStep('error');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleImport = async () => {
    if (!jsonContent) {
      return;
    }

    setStep('importing');
    setError(null);

    try {
      const executeResult = (await importExecute({
        json: jsonContent,
        mode: importMode,
      })) as ImportResponse;
      setResult(executeResult);
      setStep('success');
    } catch (err) {
      setError(parseApiError(err));
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Import Assessment from JSON</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {step === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('assessment-import-file')?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-700 font-medium">Drag & drop a .json file here</p>
                  <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                  <input
                    id="assessment-import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleFile(file);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Download Template
                  </button>
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 whitespace-pre-wrap">
                    {uploadError}
                  </div>
                )}
              </div>
            )}

            {step === 'validating' && (
              <div className="py-10 flex items-center justify-center gap-3 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validating JSON...</span>
              </div>
            )}

            {step === 'preview' && validation && (
              <div className="space-y-5">
                {validation.valid ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Valid JSON</span>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="font-medium text-gray-900 mb-2">What will be imported:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>Assessment: {validation.summary.assessmentTitle}</li>
                        <li>{validation.summary.dimensionCount} Dimensions</li>
                        <li>{validation.summary.topicCount} Topics</li>
                        <li>{validation.summary.recommendationCount} Recommendations</li>
                        <li>
                          Level Labels: {validation.summary.topicsWithAllLevels}/
                          {validation.summary.topicCount} complete
                        </li>
                      </ul>
                    </div>

                    {validation.warnings.length > 0 && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                        {validation.warnings.map((warning, index) => (
                          <div key={`${warning}-${index}`}>{warning}</div>
                        ))}
                      </div>
                    )}

                    {validation.summary.duplicateExists && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-yellow-900">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Assessment already exists</span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="import-mode"
                              value="create"
                              checked={importMode === 'create'}
                              onChange={() => setImportMode('create')}
                            />
                            Create new copy
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="import-mode"
                              value="update"
                              checked={importMode === 'update'}
                              onChange={() => setImportMode('update')}
                            />
                            Update existing
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleImport}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                      >
                        Import Assessment
                      </button>
                      <button
                        onClick={resetToUpload}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        ← Choose different file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-700 font-medium">
                      <X className="w-5 h-5" />
                      <span>Cannot import - fix these errors:</span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                      {validation.errors.map((issue, index) => (
                        <li key={`${issue}-${index}`}>{issue}</li>
                      ))}
                    </ul>
                    <button
                      onClick={resetToUpload}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ← Choose different file
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'importing' && (
              <div className="py-10 flex items-center justify-center gap-3 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Importing assessment...</span>
              </div>
            )}

            {step === 'success' && result && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-green-700 font-semibold text-lg">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Import Successful!</span>
                </div>
                <div className="space-y-2 text-sm text-gray-800">
                  <div>✅ {result.imported.dimensions} Dimensions</div>
                  <div>✅ {result.imported.topics} Topics with level labels</div>
                  <div>✅ {result.imported.recommendations} Recommendations</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSuccess(result.assessmentId)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    View Assessment →
                  </button>
                  <button
                    onClick={resetToUpload}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Import Another
                  </button>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <FileJson className="w-5 h-5" />
                  <span>Import failed</span>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 whitespace-pre-wrap">
                  {error || 'Unknown error'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleImport}
                    disabled={!jsonContent}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={resetToUpload}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Choose different file
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
