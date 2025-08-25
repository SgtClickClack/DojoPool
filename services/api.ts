import axios from 'axios';

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
