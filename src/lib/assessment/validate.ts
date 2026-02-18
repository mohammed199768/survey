import { z } from 'zod';

// Schema for validating API response - uses orderIndex to match backend
// Note: This is used for internal validation, the API types are in @/lib/api/types

export const TopicSchema = z.object({
  id: z.string().min(1),
  topicKey: z.string().optional(),
  label: z.string().min(1),
  prompt: z.string().min(1),
  orderIndex: z.number().int().positive().optional(),
  helpText: z.string().optional(),
  anchors: z.object({
    "1": z.string().min(1),
    "2": z.string().min(1),
    "3": z.string().min(1),
    "4": z.string().min(1),
    "5": z.string().min(1),
  }).strict().optional(),
});

export const DimensionSchema = z.object({
  id: z.string().min(1),
  dimensionKey: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  orderIndex: z.number().int().positive().optional(),
  topics: z.array(TopicSchema),
});

export const AssessmentSchema = z.object({
  version: z.number().int().positive().optional(),
  dimensions: z.array(DimensionSchema),
});

export type TopicDefinition = z.infer<typeof TopicSchema>;
export type DimensionDefinition = z.infer<typeof DimensionSchema>;
export type AssessmentDefinition = z.infer<typeof AssessmentSchema>;

// Compatibility aliases
export type AssessmentTopic = TopicDefinition;
export type AssessmentDimension = DimensionDefinition;

export const validateAssessmentDefinition = (data: unknown): AssessmentDefinition => {
  return AssessmentSchema.parse(data);
};
