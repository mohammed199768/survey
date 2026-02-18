import { validateAssessmentDefinition } from './src/lib/assessment/validate';
import * as fs from 'fs';
import * as path from 'path';

try {
  const questionsPath = path.join(process.cwd(), 'src/constants/questions.json');
  const rawData = fs.readFileSync(questionsPath, 'utf-8');
  const json = JSON.parse(rawData);

  const valid = validateAssessmentDefinition(json);
  console.log('Validation SUCCESS:', JSON.stringify(valid, null, 2));
} catch (error) {
  console.error('Validation FAILED:', error);
  process.exit(1);
}
