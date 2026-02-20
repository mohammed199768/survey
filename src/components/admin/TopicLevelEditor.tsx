'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTopicLevels, updateTopicLevels } from '@/lib/api/adminEndpoints';
import type { UpdateTopicLevels } from '@/lib/api/adminTypes';

type Props = {
  topicId: string;
  topicLabel: string;
};

const initialForm: UpdateTopicLevels = {
  level1Label: '',
  level2Label: '',
  level3Label: '',
  level4Label: '',
  level5Label: '',
};

export function TopicLevelEditor({ topicId, topicLabel }: Props) {
  const [form, setForm] = useState<UpdateTopicLevels>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getTopicLevels(topicId)
      .then((data) => {
        if (!mounted) return;
        setForm({
          level1Label: data.level1Label ?? '',
          level2Label: data.level2Label ?? '',
          level3Label: data.level3Label ?? '',
          level4Label: data.level4Label ?? '',
          level5Label: data.level5Label ?? '',
        });
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to load level labels.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [topicId]);

  const labels = useMemo(
    () => [form.level1Label, form.level2Label, form.level3Label, form.level4Label, form.level5Label],
    [form]
  );

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateTopicLevels(topicId, form);
      setMessage('Saved successfully.');
    } catch {
      setError('Failed to save level labels.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading level labels...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Topic: {topicLabel}</p>
      <div className="grid gap-3">
        <label className="text-sm font-medium text-gray-700">
          Level 1 - Lowest Maturity
          <textarea className="mt-1 w-full rounded border p-2 text-sm" rows={2} value={form.level1Label} onChange={(e) => setForm((p) => ({ ...p, level1Label: e.target.value }))} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Level 2
          <textarea className="mt-1 w-full rounded border p-2 text-sm" rows={2} value={form.level2Label} onChange={(e) => setForm((p) => ({ ...p, level2Label: e.target.value }))} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Level 3 - Middle
          <textarea className="mt-1 w-full rounded border p-2 text-sm" rows={2} value={form.level3Label} onChange={(e) => setForm((p) => ({ ...p, level3Label: e.target.value }))} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Level 4
          <textarea className="mt-1 w-full rounded border p-2 text-sm" rows={2} value={form.level4Label} onChange={(e) => setForm((p) => ({ ...p, level4Label: e.target.value }))} />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Level 5 - Highest Maturity
          <textarea className="mt-1 w-full rounded border p-2 text-sm" rows={2} value={form.level5Label} onChange={(e) => setForm((p) => ({ ...p, level5Label: e.target.value }))} />
        </label>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded bg-horvath-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Labels'}
      </button>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded border bg-gray-50 p-3">
        <p className="mb-3 text-sm font-semibold text-gray-700">Slider Preview (static)</p>
        <div className="grid grid-cols-5 gap-2 text-center text-xs text-gray-600">
          {labels.map((label, idx) => (
            <div key={idx}>{label || `Level ${idx + 1}`}</div>
          ))}
        </div>
        <div className="relative mt-4 h-2 rounded bg-gray-200">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-gray-400"
              style={{ left: `${(idx / 4) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
