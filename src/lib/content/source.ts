import { AssessmentDefinition } from '../assessment/validate';
import { RecommendationsDefinition } from '../recommendations/validate';
import { NarrativeDefinition } from '../narrative/validate';

export interface ContentSource {
  getQuestions(): AssessmentDefinition;
  getRecommendations(): RecommendationsDefinition;
  getNarrative(): NarrativeDefinition;
}
