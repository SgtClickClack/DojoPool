import { getErrorMessage } from '../utils/errorHandling';
import { apiClient as api } from './api';

// Mock interfaces for development
interface TrainingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  techniques: string[];
  duration: number;
  skillLevel: number;
}

interface UserProfile {
  id: string;
  name: string;
  skillLevel: number;
  achievements: Array<{ title: string; description: string }>;
  preferences: Record<string, any>;
}

// Mock AI prompt functions for development
const generateStoryPrompt = (
  templateKey: string,
  context: any,
  additionalContext?: any
): string => {
  return `Generate a training story for ${context.userProfile.name} at skill level ${context.userProfile.skillLevel}`;
};

const sanitizePrompt = (prompt: string): string => {
  return prompt.replace(/[<>]/g, '');
};

const validatePrompt = (prompt: string): boolean => {
  return prompt.length > 0 && prompt.length < 1000;
};

interface StoryGenerationRequest {
  userProfile: UserProfile;
  trainingSession: TrainingSession;
  templateKey: string;
  additionalContext?: Record<string, any>;
}

interface StoryResponse {
  story: string;
  metadata: {
    templateUsed: string;
    skillLevel: string;
    style: string;
    timestamp: string;
  };
}

interface RecommendationRequest {
  userId: string;
  currentSkillLevel: number;
  recentTechniques: string[];
  preferredStyle?: string;
  trainingGoals?: string[];
}

interface TechniqueRecommendation {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  reason: string;
  prerequisites: string[];
  estimatedTimeToMaster: number;
}

export async function generateTrainingStory(
  request: StoryGenerationRequest
): Promise<StoryResponse> {
  try {
    const prompt = generateStoryPrompt(
      request.templateKey as any,
      {
        userProfile: request.userProfile,
        trainingSession: request.trainingSession,
        currentSkillLevel: request.userProfile.skillLevel,
        previousAchievements: request.userProfile.achievements.map(
          (a) => a.title
        ),
      },
      request.additionalContext
    );

    if (!validatePrompt(prompt)) {
      throw new Error('Invalid prompt generated');
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    const response = await api.post('/ai/generate-story', {
      prompt: sanitizedPrompt,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate training story:', getErrorMessage(error));
    throw new Error(
      `Failed to generate training story: ${getErrorMessage(error)}`
    );
  }
}

export async function getPersonalizedRecommendations(
  request: RecommendationRequest
): Promise<TechniqueRecommendation[]> {
  try {
    const response = await api.post('/ai/recommendations', request);
    return response.data;
  } catch (error) {
    console.error(
      'Failed to get personalized recommendations:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to get personalized recommendations: ${getErrorMessage(error)}`
    );
  }
}

export async function generateTrainingPlan(
  userId: string,
  duration: number
): Promise<any> {
  try {
    const response = await api.post('/ai/training-plan', {
      userId,
      durationDays: duration,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate training plan:', getErrorMessage(error));
    throw new Error(
      `Failed to generate training plan: ${getErrorMessage(error)}`
    );
  }
}

export async function generateFeedback(sessionId: string): Promise<string> {
  try {
    const response = await api.post(`/ai/feedback/${sessionId}`);
    return response.data.feedback;
  } catch (error) {
    console.error('Failed to generate feedback:', getErrorMessage(error));
    throw new Error(`Failed to generate feedback: ${getErrorMessage(error)}`);
  }
}

export async function analyzeTrainingProgress(userId: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  try {
    const response = await api.get(`/ai/progress-analysis/${userId}`);
    return response.data;
  } catch (error) {
    console.error(
      'Failed to analyze training progress:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to analyze training progress: ${getErrorMessage(error)}`
    );
  }
}

export async function generateMotivationalMessage(context: {
  userId: string;
  recentProgress?: string;
  upcomingMilestone?: string;
}): Promise<string> {
  try {
    const response = await api.post('/ai/motivate', context);
    return response.data.message;
  } catch (error) {
    console.error(
      'Failed to generate motivational message:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to generate motivational message: ${getErrorMessage(error)}`
    );
  }
}

export async function getAdaptiveDifficulty(userId: string): Promise<{
  recommendedDifficulty: number;
  explanation: string;
}> {
  try {
    const response = await api.get(`/ai/adaptive-difficulty/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get adaptive difficulty:', getErrorMessage(error));
    throw new Error(
      `Failed to get adaptive difficulty: ${getErrorMessage(error)}`
    );
  }
}

export async function generateTechniqueDescription(
  techniqueId: string,
  skillLevel: string
): Promise<{
  description: string;
  keyPoints: string[];
  commonMistakes: string[];
}> {
  try {
    const response = await api.get(`/ai/technique-description/${techniqueId}`, {
      params: { skillLevel },
    });
    return response.data;
  } catch (error) {
    console.error(
      'Failed to generate technique description:',
      getErrorMessage(error)
    );
    throw new Error(
      `Failed to generate technique description: ${getErrorMessage(error)}`
    );
  }
}
