export function buildConditionPreview(rec: {
  score_min?: number | null;
  score_max?: number | null;
  target_min?: number | null;
  target_max?: number | null;
  gap_min?: number | null;
  gap_max?: number | null;
}): string {
  const parts: string[] = [];

  if (rec.score_min != null && rec.score_max != null) {
    parts.push(`score between ${rec.score_min}-${rec.score_max}`);
  } else if (rec.score_max != null) {
    parts.push(`score <= ${rec.score_max}`);
  } else if (rec.score_min != null) {
    parts.push(`score >= ${rec.score_min}`);
  }

  if (rec.target_min != null && rec.target_max != null) {
    parts.push(`target between ${rec.target_min}-${rec.target_max}`);
  } else if (rec.target_min != null) {
    parts.push(`target >= ${rec.target_min}`);
  } else if (rec.target_max != null) {
    parts.push(`target <= ${rec.target_max}`);
  }

  if (rec.gap_min != null && rec.gap_max != null) {
    parts.push(`gap between ${rec.gap_min}-${rec.gap_max}`);
  } else if (rec.gap_min != null) {
    parts.push(`gap >= ${rec.gap_min}`);
  } else if (rec.gap_max != null) {
    parts.push(`gap <= ${rec.gap_max}`);
  }

  if (parts.length === 0) return 'Always shows';
  return 'Shows when: ' + parts.join(' AND ');
}
