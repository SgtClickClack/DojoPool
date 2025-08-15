import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const getEnv = (): Record<string, any> => (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {}));
const env = getEnv();
const API_URL: string = env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token: string | null = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any): Promise<any> => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<any> => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Consider using a router instance for navigation if this util is used in a context where window.location is not ideal
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Define types for API data if known, e.g.:
// interface RecommendationData { /* ... */ }
// interface ProgressData { /* ... */ }
// interface AnalysisData { /* ... */ }

export const api = {
  training: {
    getRecommendations: (): Promise<AxiosResponse<any>> => apiClient.get('/training/recommendations'),
    submitProgress: (data: any): Promise<AxiosResponse<any>> => apiClient.post('/training/progress', data),
  },
  gameAnalysis: {
    analyze: (data: any): Promise<AxiosResponse<any>> => apiClient.post('/game-analysis', data),
    getHistory: (): Promise<AxiosResponse<any>> => apiClient.get('/game-analysis/history'),
  },
  tournaments: {
    list: (): Promise<AxiosResponse<any>> => apiClient.get('/tournaments'),
    join: (id: string | number): Promise<AxiosResponse<any>> => apiClient.post(`/tournaments/${id}/join`),
    getDetails: (id: string | number): Promise<AxiosResponse<any>> => apiClient.get(`/tournaments/${id}`),
  },
  social: {
    getFriends: (): Promise<AxiosResponse<any>> => apiClient.get('/social/friends'),
    sendRequest: (userId: string | number): Promise<AxiosResponse<any>> =>
      apiClient.post('/social/friends/request', { userId }),
  },
}; 