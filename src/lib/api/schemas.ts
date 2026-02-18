import { z } from 'zod';

const ApiNumber = z.coerce.number();

export const AssessmentResponseSchema = z.object({
  id: z.string().min(1),
  version: z.number(),
  title: z.string().min(1),
  description: z.string().nullish().transform((value) => value ?? ''),
  estimated_duration_minutes: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.number().optional()
  ),
});

export const TopicStructureSchema = z.object({
  id: z.string().min(1),
  topicKey: z.string().min(1),
  label: z.string().min(1),
  prompt: z.string().min(1),
  orderIndex: z.number(),
  helpText: z.string().optional(),
  levelAnchors: z.array(z.string().nullable()).length(5),
});

export const DimensionStructureSchema = z.object({
  id: z.string().min(1),
  dimensionKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  orderIndex: z.number(),
  topics: z.array(TopicStructureSchema),
});

export const AssessmentStructureResponseSchema = z.object({
  assessment: AssessmentResponseSchema,
  dimensions: z.array(DimensionStructureSchema),
});

export const ParticipantResponseDataSchema = z.object({
  participantId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  participantToken: z.string().min(1).optional(),
  message: z.string().optional(),
});

export const StartResponseDataSchema = z.object({
  responseId: z.string().min(1),
  sessionToken: z.string().min(1),
});

export const AnswerResponseDataSchema = z.object({
  topicResponseId: z.string().min(1),
  gap: ApiNumber,
  normalizedGap: ApiNumber,
  progress: ApiNumber,
});

export const SessionDataInnerSchema = z.object({
  responseId: z.string().min(1),
  status: z.string(),
  progress: ApiNumber,
  answeredTopics: z.array(
    z.object({
      topicId: z.string().min(1),
      currentRating: ApiNumber,
      targetRating: ApiNumber,
      gap: ApiNumber,
    })
  ),
});

export const CompleteResponseDataSchema = z.object({
  responseId: z.string().min(1),
  completedAt: z.string().min(1),
  overallScore: z.number(),
  overallGap: z.number(),
});

export const RecommendationRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  conditions: z.object({
    gapMin: z.number().optional(),
    gapMax: z.number().optional(),
    maturityBelow: z.number().optional(),
    maturityAbove: z.number().optional(),
  }),
  why: z.preprocess((value) => (value === null ? undefined : value), z.string().optional()),
  what: z.preprocess((value) => (value === null ? undefined : value), z.string().optional()),
  how: z.preprocess((value) => (value === null ? undefined : value), z.string().optional()),
  priority: z.number(),
  tags: z.array(z.string()),
  impactLevel: z.string().optional(),
  effortLevel: z.string().optional(),
  timeframe: z.string().optional(),
  actionItems: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      category: z.string().optional(),
    })
  ).optional(),
  resources: z.array(
    z.object({
      title: z.string().min(1),
      url: z.string().optional(),
      type: z.string().optional(),
    })
  ).nullish().optional().transform((value) => value ?? []),
  kpis: z.array(z.string()).nullish().optional().transform((value) => value ?? []),
});

export const RecommendationsDefinitionAPISchema = z.object({
  dimensions: z.array(
    z.object({
      dimensionKey: z.string().min(1),
      recommendations: z.array(RecommendationRuleSchema),
    })
  ),
  meta: z.object({
    dimensionColors: z.record(z.string(), z.string()),
    dimensionWeights: z.record(z.string(), z.number()),
    themeMap: z.record(z.string(), z.string()),
    priorityWeights: z.record(z.string(), z.number()).optional(),
    urgencyTags: z.array(z.string()).optional(),
    dimensionOrder: z.array(z.string()).optional(),
    titleTemplates: z.record(z.string(), z.array(z.string())).optional(),
    descriptionTemplate: z.string().optional(),
  }),
});

export const NarrativeDefinitionAPISchema = z.object({
  version: z.number(),
  themeMap: z.record(z.string(), z.string()),
  maturityThresholds: z.record(z.string(), z.number()),
  maturityLabels: z.array(z.string()).optional(),
  gapThresholds: z.object({
    minor: z.number(),
    moderate: z.number(),
    significant: z.number(),
  }).optional(),
  headlines: z.object({
    lowConfidencePrefix: z.string(),
    byStageId: z.record(z.string(), z.string()),
  }).optional(),
  executiveSummary: z.object({
    sentence1: z.string(),
    sentence2: z.string(),
    sentence3: z.string(),
  }).optional(),
  stageRationale: z.string().optional(),
  priorityWhyTemplate: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
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
  dimensionTemplates: z.record(z.string(), z.array(z.string())).optional(),
  gapTemplates: z.record(z.string(), z.array(z.string())).optional(),
});

export const DimensionResultSchema = z.object({
  dimensionKey: z.string().min(1),
  title: z.string().min(1),
  score: z.number(),
  gap: z.number(),
  priorityScore: z.number(),
  recommendations: z.array(
    z
      .object({
        id: z.string().min(1),
        topicId: z.string().min(1).optional(),
        topic_id: z.string().min(1).optional(),
        scoreMin: z.number().nullable().optional(),
        score_min: z.number().nullable().optional(),
        scoreMax: z.number().nullable().optional(),
        score_max: z.number().nullable().optional(),
        targetMin: z.number().nullable().optional(),
        target_min: z.number().nullable().optional(),
        targetMax: z.number().nullable().optional(),
        target_max: z.number().nullable().optional(),
        gapMin: z.number().nullable().optional(),
        gap_min: z.number().nullable().optional(),
        gapMax: z.number().nullable().optional(),
        gap_max: z.number().nullable().optional(),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        why: z.string().nullable().optional(),
        what: z.string().nullable().optional(),
        how: z.string().nullable().optional(),
        actionItems: z.array(z.string()).optional(),
        action_items: z.array(z.string()).optional(),
        category: z.enum(['Quick Win', 'Project', 'Big Bet']),
        priority: z.number(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        is_active: z.boolean().optional(),
        orderIndex: z.number().int().optional(),
        order_index: z.number().int().optional(),
      })
      .transform((rec) => ({
        id: rec.id,
        topicId: rec.topicId ?? rec.topic_id ?? '',
        scoreMin: rec.scoreMin ?? rec.score_min ?? null,
        scoreMax: rec.scoreMax ?? rec.score_max ?? null,
        targetMin: rec.targetMin ?? rec.target_min ?? null,
        targetMax: rec.targetMax ?? rec.target_max ?? null,
        gapMin: rec.gapMin ?? rec.gap_min ?? null,
        gapMax: rec.gapMax ?? rec.gap_max ?? null,
        title: rec.title,
        description: rec.description ?? null,
        why: rec.why ?? null,
        what: rec.what ?? null,
        how: rec.how ?? null,
        actionItems: rec.actionItems ?? rec.action_items ?? [],
        category: rec.category,
        priority: rec.priority,
        tags: rec.tags ?? [],
        isActive: rec.isActive ?? rec.is_active ?? true,
        orderIndex: rec.orderIndex ?? rec.order_index ?? 0,
      }))
  ),
  topics: z.array(z.unknown()),
});

export const TopGapSchema = z.object({
  topicId: z.string().min(1),
  label: z.string().min(1),
  gap: z.number(),
  dimensionTitle: z.string().min(1),
});

export const PrioritySchema = z.object({
  dimensionKey: z.string().min(1),
  title: z.string().min(1),
  priorityScore: z.number(),
  rank: z.number(),
});

export const ResultsDataSchema = z.object({
  overallScore: z.number(),
  overallGap: z.number(),
  maturityLevel: z.string().optional(),
  dimensions: z.array(DimensionResultSchema),
  topGaps: z.array(TopGapSchema),
  priorities: z.array(PrioritySchema),
  topRecommendations: z.array(DimensionResultSchema.shape.recommendations.element),
});

export const RecommendationsDataSchema = z.object({
  recommendations: z.array(
    z.object({
      dimensionKey: z.string().min(1),
      dimensionTitle: z.string().min(1),
      priorityScore: z.number(),
      items: z.array(
        z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          actionItems: z.array(z.string()),
          resources: z.array(
            z.object({
              title: z.string().min(1),
              url: z.string().min(1),
              type: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
});

export const AdminUserSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'super_admin']),
});

export const AdminAuthResponseSchema = z.object({
  success: z.boolean(),
  user: AdminUserSchema.optional(),
  error: z.string().optional(),
});

export const AdminVerifyResponseSchema = z.object({
  valid: z.boolean(),
  user: AdminUserSchema.optional(),
  error: z.string().optional(),
});
