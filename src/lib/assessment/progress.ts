
import { AssessmentDefinition } from './validate';
import { ReadinessState } from '../../store/readiness/types';

export type MissingItem = {
  dimensionId: string;
  dimensionTitle: string;
  topicId: string;
  topicKey?: string;
  topicLabel: string;
};

/**
 * Computes list of missing (untouched) topics based on definition and store state.
 */
export function getMissingItems(
  definition: AssessmentDefinition,
  touched: ReadinessState['touched']
): MissingItem[] {
  const missing: MissingItem[] = [];

  definition.dimensions.forEach((dim) => {
    const dimTouched = touched[dim.id] || {};
    
    dim.topics.forEach((topic) => {
      // "Answered" means touched is true
      if (!dimTouched[topic.id]) {
        missing.push({
          dimensionId: dim.id,
          dimensionTitle: dim.title,
          topicId: topic.id,
          topicLabel: topic.label,
        });
      }
    });
  });

  return missing;
}
