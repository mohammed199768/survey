/**
 * Updated Zustand Store with API Integration
 * 
 * Changes from original:
 * - Removed JSON imports
 * - Added API fetching actions
 * - Added loading/error states
 * - Added session management
 * - Added auto-save functionality
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AssessmentAPI, ParticipantAPI, ResponseAPI } from '@/lib/api/endpoints';
import type { 
  AssessmentStructureResponse,
  ParticipantData,
  RecommendationsDefinitionAPI,
  NarrativeDefinitionAPI
} from '@/lib/api/types';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toScore = (value: unknown, fallback = 1): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(5, value));
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(5, parsed));
  }

  return fallback;
};

let startSessionPromise: Promise<void> | null = null;

interface ReadinessState {
  // API State
  isLoading: boolean;
  isLoadingDefinitions: boolean;
  error: string | null;
  
  // Assessment Data (from API)
  assessment: AssessmentStructureResponse | null;
  recommendationsDefinition: RecommendationsDefinitionAPI | null;
  narrativeDefinition: NarrativeDefinitionAPI | null;
  
  // Participant & Session
  participantInfo: ParticipantData | null;
  participantId: string | null;
  participantToken: string | null;
  responseId: string | null;
  sessionToken: string | null;
  
  // User Responses (local state)
  responses: Record<string, { current: number; target: number }>;
  
  // Progress
  currentDimensionIndex: number;
  progress: number;
  
  // Actions - API Calls
  loadAssessment: () => Promise<void>;
  loadDefinitions: () => Promise<void>;
  registerParticipant: (data: ParticipantData) => Promise<void>;
  startAssessment: () => Promise<void>;
  submitAnswer: (topicId: string, current: number, target: number) => Promise<void>;
  completeAssessment: () => Promise<void>;
  resumeSession: (token: string) => Promise<void>;
  isSubmitting: boolean;
  
  // Actions - Local State
  setResponse: (topicId: string, current: number, target: number) => void;
  nextDimension: () => void;
  previousDimension: () => void;
  clearAllData: () => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useReadinessStore = create<ReadinessState>()(
  persist(
    (set, get) => ({
      // Initial State
      isLoading: false,
      isLoadingDefinitions: false,
      isSubmitting: false,
      error: null,
      assessment: null,
      recommendationsDefinition: null,
      narrativeDefinition: null,
      participantInfo: null,
      participantId: null,
      participantToken: null,
      responseId: null,
      sessionToken: null,
      responses: {},
      currentDimensionIndex: 0,
      progress: 0,

      loadAssessment: async () => {
        set({ isLoading: true, error: null });
        try {
          // 1. Get active assessment
          const active = await AssessmentAPI.getActive();
          // 2. Get structure
          const structure = await AssessmentAPI.getStructure(active.id);
          // 3. Store in state
          set({ assessment: structure, isLoading: false });
          console.log('✅ Assessment loaded from API');
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to load assessment'), isLoading: false });
        }
      },

      loadDefinitions: async () => {
        // Skip if already loaded
        const { recommendationsDefinition, narrativeDefinition } = get();
        if (recommendationsDefinition && narrativeDefinition) {
          console.log('ℹ️ Definitions already loaded');
          return;
        }

        set({ isLoadingDefinitions: true, error: null });
        
        try {
          const [recDef, narDef] = await Promise.all([
            AssessmentAPI.getRecommendationsDefinition(),
            AssessmentAPI.getNarrativeDefinition()
          ]);
          
          set({
            recommendationsDefinition: recDef,
            narrativeDefinition: narDef,
            isLoadingDefinitions: false
          });
          
          console.log('✅ Definitions loaded from API');
          console.log(`   - ${recDef.dimensions.length} dimensions with recommendations`);
          console.log(`   - ${Object.keys(narDef.themeMap).length} narrative themes`);
          
        } catch (error: unknown) {
          console.error('❌ Failed to load definitions:', error);
          set({ 
            error: getErrorMessage(error, 'Failed to load definitions'),
            isLoadingDefinitions: false 
          });
        }
      },

      registerParticipant: async (data: ParticipantData) => {
        set({ isLoading: true, error: null });
        try {
          const existingToken = get().participantToken;
          const response = await ParticipantAPI.register(data, existingToken);
          set({ 
            participantId: response.participantId, 
            participantInfo: data,
            participantToken: response.participantToken ?? existingToken ?? null,
            isLoading: false 
          });
          console.log('✅ Participant registered:', response.participantId);
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to register participant'), isLoading: false });
          throw error; // Re-throw to allow component to handle validation errors if needed
        }
      },

      startAssessment: async () => {
         const { assessment, participantId } = get();
         if (!assessment || !assessment.assessment.id || !participantId) {
             set({ error: 'Missing assessment or participant data' });
             return;
         }

        set({ isLoading: true, error: null });
        try {
          const response = await ResponseAPI.start(assessment.assessment.id, participantId);
          set({ 
            responseId: response.responseId, 
            sessionToken: response.sessionToken,
            isLoading: false 
          });
          
          if (typeof window !== 'undefined') {
              localStorage.setItem('sessionToken', response.sessionToken);
          }
          console.log('✅ Assessment started:', response.responseId);
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to start assessment'), isLoading: false });
          throw error;
        }
      },

      // Simplified submitAnswer - just saves, no debouncing (debouncing moved to component)
      submitAnswer: async (topicId: string, current: number, target: number) => {
        let { responseId } = get();
        if (!responseId) {
          try {
            if (!startSessionPromise) {
              startSessionPromise = get().startAssessment();
            }
            await startSessionPromise;
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Unable to start response session') });
            return;
          } finally {
            startSessionPromise = null;
          }

          responseId = get().responseId;
          if (!responseId) {
            set({ error: 'No active response session' });
            return;
          }
        }

        const currentRating = Math.max(1, Math.min(5, current));
        const targetRating = Math.max(1, Math.min(5, target));

        // Optimistic update (preserve decimal values, including 0.5 increments)
        set((state) => ({
            responses: {
                ...state.responses,
                [topicId]: { current: currentRating, target: targetRating }
            }
        }));

        set({ isSubmitting: true });

        try {
            const response = await ResponseAPI.submitAnswer(responseId, {
                topicId,
                currentRating,
                targetRating
            });
            
            set({ progress: response.progress, isSubmitting: false });
        } catch (error: unknown) {
            console.error('Failed to submit answer:', error);
            set({ isSubmitting: false });
        }
      },

      completeAssessment: async () => {
        const { responseId } = get();
        if (!responseId) return;

        set({ isLoading: true, error: null });
        try {
          await ResponseAPI.complete(responseId);
          set({ isLoading: false });
          console.log('✅ Assessment completed');
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to complete assessment'), isLoading: false });
          throw error;
        }
      },

      resumeSession: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = await ResponseAPI.getSession(token);
          
          // Reconstruct local responses from session data
          const responses: Record<string, { current: number; target: number }> = {};
          session.answeredTopics.forEach(t => {
              responses[t.topicId] = {
                  current: toScore(t.currentRating),
                  target: toScore(t.targetRating)
              };
          });

          set({ 
            responseId: session.responseId,
            sessionToken: token,
            progress: session.progress,
            responses,
            isLoading: false 
          });
          
          // If we don't have assessment loaded, we should load it
           const { assessment } = get();
           if (!assessment) {
               await get().loadAssessment();
           }

        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Failed to resume session'), isLoading: false });
          // safeJSONStorage handles window check internally if implemented well, 
          // or we can wrap it. But since we use persist, better to use the storage engine.
          // However, manual removal:
          if (typeof window !== 'undefined') localStorage.removeItem('sessionToken'); 
        }
      },

      // Local state management
      setResponse: (topicId, current, target) => {
        set((state) => ({
          responses: {
            ...state.responses,
            [topicId]: { current, target }
          }
        }));
      },

      nextDimension: () => {
        set((state) => ({
          currentDimensionIndex: Math.min(
            state.currentDimensionIndex + 1,
            (state.assessment?.dimensions.length || 1) - 1
          )
        }));
      },

      previousDimension: () => {
        set((state) => ({
          currentDimensionIndex: Math.max(state.currentDimensionIndex - 1, 0)
        }));
      },

      clearAllData: () => {
        if (typeof window !== 'undefined') {
             localStorage.removeItem('sessionToken');
             localStorage.removeItem('readiness-storage'); // Also clear persisted store
        }
        set({
          assessment: null,
          recommendationsDefinition: null,
          narrativeDefinition: null,
          participantInfo: null,
          participantId: null,
          participantToken: null,
          responseId: null,
          sessionToken: null,
          responses: {},
          currentDimensionIndex: 0,
          progress: 0,
          error: null
        });
        console.log('🗑️ All data cleared');
      },

      setError: (error) => set({ error, isLoading: false }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'readiness-storage',
      partialize: (state) => ({
        // Only persist essential data
        participantInfo: state.participantInfo,
        participantId: state.participantId,
        participantToken: state.participantToken,
        responseId: state.responseId,
        sessionToken: state.sessionToken,
        responses: state.responses,
        currentDimensionIndex: state.currentDimensionIndex,
        // Persist definitions nicely so we don't refetch every reload if not needed?
        // Actually, let's NOT persist definitions to ensure freshness, or persist them.
        // User request didn't specify, but persisting reduces network load.
        // I will persist them for now as it's static configuration data.
        recommendationsDefinition: state.recommendationsDefinition,
        narrativeDefinition: state.narrativeDefinition,
      }),
    }
  )
);
