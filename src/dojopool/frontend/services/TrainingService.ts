import api from './api';
import {
  type TrainingSession,
  type Technique,
  type TrainingFeedback,
} from '../../types/training';

export async function getTrainingSessions(
  userId: string
): Promise<TrainingSession[]> {
  const response = await api.get(`/training/sessions/${userId}`);
  return response.data;
}

export async function getTrainingSession(
  sessionId: string
): Promise<TrainingSession> {
  const response = await api.get(`/training/session/${sessionId}`);
  return response.data;
}

export async function createTrainingSession(
  session: Partial<TrainingSession>
): Promise<TrainingSession> {
  const response = await api.post('/training/sessions', session);
  return response.data;
}

export async function updateTrainingSession(
  sessionId: string,
  updates: Partial<TrainingSession>
): Promise<TrainingSession> {
  const response = await api.put(`/training/session/${sessionId}`, updates);
  return response.data;
}

export async function deleteTrainingSession(sessionId: string): Promise<void> {
  await api.delete(`/training/session/${sessionId}`);
}

export async function getTechniques(filters?: {
  style?: string;
  difficulty?: number;
  search?: string;
}): Promise<Technique[]> {
  const response = await api.get('/training/techniques', { params: filters });
  return response.data;
}

export async function submitFeedback(
  sessionId: string,
  feedback: Partial<TrainingFeedback>
): Promise<TrainingFeedback> {
  const response = await api.post(
    `/training/session/${sessionId}/feedback`,
    feedback
  );
  return response.data;
}

export async function syncOfflineTraining(offlineData: any[]): Promise<void> {
  await api.post('/training/sync', { sessions: offlineData });
}

export async function getRecommendedTechniques(
  userId: string
): Promise<Technique[]> {
  const response = await api.get(`/training/recommendations/${userId}`);
  return response.data;
}

export async function startTrainingSession(sessionId: string): Promise<void> {
  await api.post(`/training/session/${sessionId}/start`);
}

export async function completeTrainingSession(
  sessionId: string,
  metrics: any
): Promise<void> {
  await api.post(`/training/session/${sessionId}/complete`, metrics);
}

export async function pauseTrainingSession(sessionId: string): Promise<void> {
  await api.post(`/training/session/${sessionId}/pause`);
}

export async function resumeTrainingSession(sessionId: string): Promise<void> {
  await api.post(`/training/session/${sessionId}/resume`);
}
