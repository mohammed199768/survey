'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createTopicRecommendation,
  deleteTopicRecommendation,
  getTopicRecommendations,
  testTopicRecommendations,
  updateTopicRecommendation,
} from '@/lib/api/adminEndpoints';
import type { CreateTopicRec, TopicRecommendation } from '@/lib/api/adminTypes';
import { buildConditionPreview } from '@/lib/utils/conditionPreview';

type Props = {
  topicId: string;
};

type ImpactLevel = 'High' | 'Medium' | 'Low';
type EffortLevel = 'Low' | 'Medium' | 'High';
type SpeedLevel = 'Fast' | 'Medium' | 'Slow';

const defaultForm: CreateTopicRec = {
  score_min: null,
  score_max: null,
  target_min: null,
  target_max: null,
  gap_min: null,
  gap_max: null,
  title: '',
  description: '',
  why: '',
  what: '',
  how: '',
  action_items: [],
  category: 'Project',
  priority: 50,
  tags: [],
  is_active: true,
  order_index: 0,
};

const parseNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const impactScore: Record<ImpactLevel, number> = {
  High: 5,
  Medium: 3,
  Low: 1,
};

const effortScore: Record<EffortLevel, number> = {
  Low: 5,
  Medium: 3,
  High: 1,
};

const speedScore: Record<SpeedLevel, number> = {
  Fast: 5,
  Medium: 3,
  Slow: 1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const deriveCategory = (
  impact: ImpactLevel,
  effort: EffortLevel,
  speed: SpeedLevel
): NonNullable<CreateTopicRec['category']> => {
  if (impact === 'High' && (effort === 'Low' || effort === 'Medium') && speed === 'Fast') {
    return 'Quick Win';
  }
  if (impact === 'High' && effort === 'High' && speed === 'Slow') {
    return 'Big Bet';
  }
  return 'Project';
};

const derivePriority = (impact: ImpactLevel, effort: EffortLevel, speed: SpeedLevel): number => {
  const raw = impactScore[impact] * 12 + effortScore[effort] * 5 + speedScore[speed] * 3;
  return clamp(Math.round(raw), 0, 100);
};

export function TopicRecommendationEditor({ topicId }: Props) {
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TopicRecommendation | null>(null);
  const [form, setForm] = useState<CreateTopicRec>(defaultForm);
  const [tagsInput, setTagsInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [testScore, setTestScore] = useState(2);
  const [testTarget, setTestTarget] = useState(4);
  const [testResults, setTestResults] = useState<TopicRecommendation[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<ImpactLevel>('Medium');
  const [effort, setEffort] = useState<EffortLevel>('Medium');
  const [speed, setSpeed] = useState<SpeedLevel>('Medium');
  const [autoApplyRule, setAutoApplyRule] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getTopicRecommendations(topicId);
      setRecommendations(rows);
    } catch {
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [topicId]);

  const resetForm = () => {
    setEditing(null);
    setForm(defaultForm);
    setTagsInput('');
    setActionInput('');
    setImpact('Medium');
    setEffort('Medium');
    setSpeed('Medium');
    setAutoApplyRule(true);
  };

  const onEdit = (rec: TopicRecommendation) => {
    setEditing(rec);
    setForm({
      score_min: rec.score_min,
      score_max: rec.score_max,
      target_min: rec.target_min,
      target_max: rec.target_max,
      gap_min: rec.gap_min,
      gap_max: rec.gap_max,
      title: rec.title,
      description: rec.description,
      why: rec.why,
      what: rec.what,
      how: rec.how,
      action_items: rec.action_items,
      category: rec.category,
      priority: rec.priority,
      tags: rec.tags,
      is_active: rec.is_active,
      order_index: rec.order_index,
    });
    setTagsInput(rec.tags.join(', '));
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload: CreateTopicRec = {
        ...form,
        tags: tagsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing) {
        await updateTopicRecommendation(topicId, editing.id, payload);
      } else {
        await createTopicRecommendation(topicId, payload);
      }
      setMessage(editing ? 'Recommendation updated.' : 'Recommendation created.');
      resetForm();
      await load();
    } catch {
      setError('Failed to save recommendation.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (recId: string) => {
    if (!window.confirm('Delete this recommendation?')) return;
    try {
      await deleteTopicRecommendation(topicId, recId);
      await load();
    } catch {
      setError('Failed to delete recommendation.');
    }
  };

  const onTest = async () => {
    try {
      const res = await testTopicRecommendations(topicId, { score: testScore, target: testTarget });
      setTestResults(res.matchedRecommendations);
    } catch {
      setError('Failed to test recommendations.');
    }
  };

  const gap = useMemo(() => Number((testTarget - testScore).toFixed(1)), [testScore, testTarget]);
  const suggestedCategory = useMemo(
    () => deriveCategory(impact, effort, speed),
    [impact, effort, speed]
  );
  const suggestedPriority = useMemo(
    () => derivePriority(impact, effort, speed),
    [impact, effort, speed]
  );

  useEffect(() => {
    if (!autoApplyRule) return;
    setForm((prev) => {
      if (prev.category === suggestedCategory && prev.priority === suggestedPriority) {
        return prev;
      }
      return {
        ...prev,
        category: suggestedCategory,
        priority: suggestedPriority,
      };
    });
  }, [autoApplyRule, suggestedCategory, suggestedPriority]);

  if (loading) return <div className="text-sm text-gray-500">Loading recommendations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Recommendations for this topic</h4>
        <button
          type="button"
          onClick={resetForm}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Add Recommendation
        </button>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div key={rec.id} className="rounded border p-3">
            <p className="text-xs text-gray-500">{buildConditionPreview(rec)}</p>
            <p className="font-medium text-gray-900">{rec.title}</p>
            <div className="mt-2 flex gap-2">
              <button className="rounded border px-2 py-1 text-xs" onClick={() => onEdit(rec)}>Edit</button>
              <button className="rounded border border-red-300 px-2 py-1 text-xs text-red-600" onClick={() => onDelete(rec.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded border bg-gray-50 p-3 space-y-3">
        <h5 className="font-semibold text-gray-800">{editing ? 'Edit Recommendation' : 'New Recommendation'}</h5>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Score Min" className="rounded border p-2 text-sm" value={form.score_min ?? ''} onChange={(e) => setForm((p) => ({ ...p, score_min: parseNumber(e.target.value) }))} />
          <input placeholder="Score Max" className="rounded border p-2 text-sm" value={form.score_max ?? ''} onChange={(e) => setForm((p) => ({ ...p, score_max: parseNumber(e.target.value) }))} />
          <input placeholder="Target Min" className="rounded border p-2 text-sm" value={form.target_min ?? ''} onChange={(e) => setForm((p) => ({ ...p, target_min: parseNumber(e.target.value) }))} />
          <input placeholder="Target Max" className="rounded border p-2 text-sm" value={form.target_max ?? ''} onChange={(e) => setForm((p) => ({ ...p, target_max: parseNumber(e.target.value) }))} />
          <input placeholder="Gap Min" className="rounded border p-2 text-sm" value={form.gap_min ?? ''} onChange={(e) => setForm((p) => ({ ...p, gap_min: parseNumber(e.target.value) }))} />
          <input placeholder="Gap Max" className="rounded border p-2 text-sm" value={form.gap_max ?? ''} onChange={(e) => setForm((p) => ({ ...p, gap_max: parseNumber(e.target.value) }))} />
        </div>
        <p className="text-xs text-gray-600">
          {buildConditionPreview({
            score_min: form.score_min ?? null,
            score_max: form.score_max ?? null,
            target_min: form.target_min ?? null,
            target_max: form.target_max ?? null,
            gap_min: form.gap_min ?? null,
            gap_max: form.gap_max ?? null,
          })}
        </p>

        <input placeholder="Title" className="w-full rounded border p-2 text-sm" value={form.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <textarea placeholder="Description" className="w-full rounded border p-2 text-sm" rows={2} value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <textarea placeholder="Why - Rationale" className="w-full rounded border p-2 text-sm" rows={2} value={form.why ?? ''} onChange={(e) => setForm((p) => ({ ...p, why: e.target.value }))} />
        <textarea placeholder="What - Specific actions" className="w-full rounded border p-2 text-sm" rows={2} value={form.what ?? ''} onChange={(e) => setForm((p) => ({ ...p, what: e.target.value }))} />
        <textarea placeholder="How - Implementation steps" className="w-full rounded border p-2 text-sm" rows={2} value={form.how ?? ''} onChange={(e) => setForm((p) => ({ ...p, how: e.target.value }))} />

        <div className="flex gap-2">
          <input
            placeholder="Add action item"
            className="flex-1 rounded border p-2 text-sm"
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
          />
          <button
            type="button"
            className="rounded border px-3 text-sm"
            onClick={() => {
              const trimmed = actionInput.trim();
              if (!trimmed) return;
              setForm((p) => ({ ...p, action_items: [...(p.action_items ?? []), trimmed] }));
              setActionInput('');
            }}
          >
            Add
          </button>
        </div>
        {(form.action_items ?? []).length > 0 && (
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {(form.action_items ?? []).map((item, idx) => (
              <li key={`${item}-${idx}`}>{item}</li>
            ))}
          </ul>
        )}

        <div className="rounded border bg-white p-3 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Auto Rule (Category + Priority)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="text-xs text-gray-600">
              Impact
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label className="text-xs text-gray-600">
              Effort
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={effort}
                onChange={(e) => setEffort(e.target.value as EffortLevel)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
            <label className="text-xs text-gray-600">
              Time-to-value
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={speed}
                onChange={(e) => setSpeed(e.target.value as SpeedLevel)}
              >
                <option value="Fast">Fast</option>
                <option value="Medium">Medium</option>
                <option value="Slow">Slow</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={autoApplyRule}
                onChange={(e) => setAutoApplyRule(e.target.checked)}
              />
              Auto-apply rule to category/priority
            </label>
            {!autoApplyRule && (
              <button
                type="button"
                className="rounded border px-3 py-1 text-xs"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    category: suggestedCategory,
                    priority: suggestedPriority,
                  }))
                }
              >
                Apply Rule
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Suggested: <span className="font-semibold">{suggestedCategory}</span> | Priority{' '}
            <span className="font-semibold">{suggestedPriority}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select className="rounded border p-2 text-sm" value={form.category ?? 'Project'} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as CreateTopicRec['category'] }))}>
            <option>Quick Win</option>
            <option>Project</option>
            <option>Big Bet</option>
          </select>
          <input
            type="range"
            min={0}
            max={100}
            value={form.priority ?? 50}
            onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
          />
        </div>
        <input placeholder="Tags (comma separated)" className="w-full rounded border p-2 text-sm" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />

        <button className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={onSave}>
          {saving ? 'Saving...' : 'Save Recommendation'}
        </button>
      </div>

      <div className="rounded border p-3">
        <h5 className="mb-2 font-semibold text-gray-800">Live Test</h5>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            Score: {testScore.toFixed(1)}
            <input type="range" min={1} max={5} step={0.5} value={testScore} onChange={(e) => setTestScore(Number(e.target.value))} className="w-full" />
          </label>
          <label className="text-sm text-gray-700">
            Target: {testTarget.toFixed(1)}
            <input type="range" min={1} max={5} step={0.5} value={testTarget} onChange={(e) => setTestTarget(Number(e.target.value))} className="w-full" />
          </label>
        </div>
        <p className="text-sm text-gray-600">Gap: {gap.toFixed(1)}</p>
        <button className="mt-2 rounded border px-3 py-1 text-sm" onClick={onTest}>
          Test
        </button>
        <p className="mt-2 text-sm text-gray-700">{testResults.length} recommendations would trigger:</p>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {testResults.map((rec) => (
            <li key={rec.id}>{rec.title}</li>
          ))}
        </ul>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
