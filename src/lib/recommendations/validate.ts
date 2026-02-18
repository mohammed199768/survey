import { z } from 'zod';

// Conditions schema: min/max constraints on current, target, or gap
const ConditionsSchema = z.object({
  gapMin: z.number().optional(),
  gapMax: z.number().optional(),
  currentMin: z.number().optional(),
  currentMax: z.number().optional(),
  targetMin: z.number().optional(),
  targetMax: z.number().optional(),
});

// Rule schema
export const RecommendationRuleSchema = z.object({
  id: z.string().min(1),
  dimensionId: z.string().min(1),
  topicId: z.string().min(1),
  priority: z.number().min(0).max(100),
  conditions: ConditionsSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  actions: z.array(z.string().min(1)),
  tags: z.array(z.string()).optional(),
  
  // v2 Fields
  appliesTo: z.enum(['topic', 'dimension', 'global']).default('topic').optional(),
  maxPerDimension: z.number().optional(),
  scoreWeights: z
    .object({
      priority: z.number().optional(),
      gap: z.number().optional(),
      lowCurrent: z.number().optional(),
      urgencyTag: z.number().optional(),
    })
    .optional(),
});

// Meta schema (v2)
// Meta schema (v2)
export const RecommendationsMetaSchema = z.object({
  themeMap: z.record(z.string(), z.string()).optional(),
  urgencyTags: z.array(z.string()).optional(),
  dimensionOrder: z.array(z.string()).optional(),
  dimensionWeights: z.record(z.string(), z.number()).optional(),
  dimensionColors: z.record(z.string(), z.string()).optional(),
  titleTemplates: z.record(z.string(), z.array(z.string())).optional(),
  descriptionTemplate: z.string().optional(),
});

// Full definition schema
export const RecommendationsDefinitionSchema = z.object({
  version: z.number(),
  rules: z.array(RecommendationRuleSchema),
  meta: RecommendationsMetaSchema.optional(),
});

export type RecommendationRule = z.infer<typeof RecommendationRuleSchema>;
export type RecommendationsDefinition = z.infer<typeof RecommendationsDefinitionSchema>;

export function validateRecommendationsDefinition(data: unknown): RecommendationsDefinition {
  return RecommendationsDefinitionSchema.parse(data);
}
