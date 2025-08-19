// Mock types for development
interface TrainingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  techniques: string[];
  duration: number;
  skillLevel: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  metrics?: Record<string, any>;
}

// Mock API client for development
const apiClient = {
  get: async (url: string, options?: any) => {
    console.log('Mock API GET:', url, options);
    return { data: null };
  },
  post: async (url: string, data: any) => {
    console.log('Mock API POST:', url, data);
    return { data: null };
  },
  put: async (url: string, data: any) => {
    console.log('Mock API PUT:', url, data);
    return { data: null };
  },
  delete: async (url: string) => {
    console.log('Mock API DELETE:', url);
    return { data: null };
  },
};

// Define missing types locally for now
interface Technique {
  id: string;
  name: string;
  style: string;
  difficulty: number;
  description: string;
}

interface TrainingFeedback {
  id: string;
  sessionId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export async function getTrainingSessions(
  userId: string
): Promise<TrainingSession[]> {
  const response = await apiClient.get(`/training/sessions/${userId}`);
  return response.data;
}

export async function getTrainingSession(
  sessionId: string
): Promise<TrainingSession> {
  const response = await apiClient.get(`/training/session/${sessionId}`);
  return response.data;
}

export async function createTrainingSession(
  session: Partial<TrainingSession>
): Promise<TrainingSession> {
  const response = await apiClient.post('/training/sessions', session);
  return response.data;
}

export async function updateTrainingSession(
  sessionId: string,
  updates: Partial<TrainingSession>
): Promise<TrainingSession> {
  const response = await apiClient.put(
    `/training/session/${sessionId}`,
    updates
  );
  return response.data;
}

export async function deleteTrainingSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/training/session/${sessionId}`);
}

export async function getTechniques(filters?: {
  style?: string;
  difficulty?: number;
  search?: string;
}): Promise<Technique[]> {
  const response = await apiClient.get('/training/techniques', {
    params: filters,
  });
  return response.data;
}

export async function submitFeedback(
  sessionId: string,
  feedback: Partial<TrainingFeedback>
): Promise<TrainingFeedback> {
  const response = await apiClient.post(
    `/training/session/${sessionId}/feedback`,
    feedback
  );
  return response.data;
}

export async function syncOfflineTraining(offlineData: any[]): Promise<void> {
  await apiClient.post('/training/sync', { sessions: offlineData });
}

export async function getRecommendedTechniques(
  userId: string
): Promise<Technique[]> {
  const response = await apiClient.get(`/training/recommendations/${userId}`);
  return response.data;
}

export async function startTrainingSession(sessionId: string): Promise<void> {
  await apiClient.post(`/training/session/${sessionId}/start`, {});
}

export async function completeTrainingSession(
  sessionId: string,
  metrics: any
): Promise<void> {
  await apiClient.post(`/training/session/${sessionId}/complete`, metrics);
}

export async function pauseTrainingSession(sessionId: string): Promise<void> {
  await apiClient.post(`/training/session/${sessionId}/pause`, {});
}

export async function resumeTrainingSession(sessionId: string): Promise<void> {
  await apiClient.post(`/training/session/${sessionId}/resume`, {});
}
