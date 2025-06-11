import api from "./api";
import {
  generateStoryPrompt,
  validatePrompt,
  sanitizePrompt,
} from "../../ai/prompts";
import { TrainingSession } from "../../types/training";
import { UserProfile } from "../../types/user";

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
  request: StoryGenerationRequest,
): Promise<StoryResponse> {
  const prompt = generateStoryPrompt(
    request.templateKey as any,
    {
      userProfile: request.userProfile,
      trainingSession: request.trainingSession,
      currentSkillLevel: request.userProfile.skillLevel,
      previousAchievements: request.userProfile.achievements.map(
        (a) => a.title,
      ),
    },
    request.additionalContext,
  );

  if (!validatePrompt(prompt)) {
    throw new Error("Invalid prompt generated");
  }

  const sanitizedPrompt = sanitizePrompt(prompt);
  const response = await api.post("/ai/generate-story", {
    prompt: sanitizedPrompt,
  });
  return response.data;
}

export async function getPersonalizedRecommendations(
  request: RecommendationRequest,
): Promise<TechniqueRecommendation[]> {
  const response = await api.post("/ai/recommendations", request);
  return response.data;
}

export async function generateTrainingPlan(
  userId: string,
  duration: number,
): Promise<any> {
  const response = await api.post("/ai/training-plan", {
    userId,
    durationDays: duration,
  });
  return response.data;
}

export async function generateFeedback(sessionId: string): Promise<string> {
  const response = await api.post(`/ai/feedback/${sessionId}`);
  return response.data.feedback;
}

export async function analyzeTrainingProgress(userId: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const response = await api.get(`/ai/progress-analysis/${userId}`);
  return response.data;
}

export async function generateMotivationalMessage(context: {
  userId: string;
  recentProgress?: string;
  upcomingMilestone?: string;
}): Promise<string> {
  const response = await api.post("/ai/motivate", context);
  return response.data.message;
}

export async function getAdaptiveDifficulty(userId: string): Promise<{
  recommendedDifficulty: number;
  explanation: string;
}> {
  const response = await api.get(`/ai/adaptive-difficulty/${userId}`);
  return response.data;
}

export async function generateTechniqueDescription(
  techniqueId: string,
  skillLevel: string,
): Promise<{
  description: string;
  keyPoints: string[];
  commonMistakes: string[];
}> {
  const response = await api.get(`/ai/technique-description/${techniqueId}`, {
    params: { skillLevel },
  });
  return response.data;
}
