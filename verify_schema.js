const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const TopicSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  prompt: z.string().min(1),
  order: z.number().int().positive(),
});

const DimensionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().positive(),
  topics: z.array(TopicSchema).refine((topics) => {
    const ids = topics.map((t) => t.id);
    return new Set(ids).size === ids.length;
  }, {
    message: "Topic IDs must be unique within a dimension",
  }),
});

const AssessmentSchema = z.object({
  version: z.number().int().positive(),
  dimensions: z.array(DimensionSchema).refine((dimensions) => {
    const ids = dimensions.map((d) => d.id);
    return new Set(ids).size === ids.length;
  }, {
    message: "Dimension IDs must be unique",
  }),
});

try {
  const questionsPath = path.join(process.cwd(), 'src/constants/questions.json');
  console.log('Reading:', questionsPath);
  const rawData = fs.readFileSync(questionsPath, 'utf-8');
  const json = JSON.parse(rawData);

  console.log('Validating...');
  const valid = AssessmentSchema.parse(json);
  console.log('Validation SUCCESS');
} catch (error) {
  console.error('Validation FAILED:', error);
  process.exit(1);
}
