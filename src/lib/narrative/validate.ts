import { z } from 'zod';

export const NarrativeDefinitionSchema = z.object({
  version: z.number(),
  themeMap: z.record(z.string(), z.string()),
  headlines: z.object({
    lowConfidencePrefix: z.string(),
    byStageId: z.record(z.string(), z.string()),
  }),
  executiveSummary: z.object({
    sentence1: z.string(),
    sentence2: z.string(),
    sentence3: z.string(),
  }),
  stageRationale: z.string().optional(),
  priorityWhyTemplate: z.string().optional(),
  notes: z.record(z.string(), z.string()),
  maturityThresholds: z.object({
    leading: z.number(),
    advanced: z.number(),
    ready: z.number(),
    exploring: z.number(),
  }),
  executiveTemplates: z.object({
    maturityLevel: z.record(z.string(), z.string()),
    gapAnalysis: z.object({
      large: z.string(),
      moderate: z.string(),
      minimal: z.string(),
    }),
    strengths: z.object({
      multiple: z.string(),
      single: z.string(),
    }),
    priorities: z.object({
      high: z.string(),
      balanced: z.string(),
    }),
  }),
});

export type NarrativeDefinition = z.infer<typeof NarrativeDefinitionSchema>;

export function validateNarrativeDefinition(data: unknown): NarrativeDefinition {
  return NarrativeDefinitionSchema.parse(data);
}
