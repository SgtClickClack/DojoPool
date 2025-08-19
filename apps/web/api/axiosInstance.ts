import axios from 'axios';
import { env } from '../config/environment';
import { auth } from '../firebase/firebase'; // Import Firebase auth instance

const getEnvVar = (key: string, fallback: string = ''): string => {
  if (
    typeof process !== 'undefined' &&
    process.env &&
    process.env[key] !== undefined
  ) {
    return process.env[key] as string;
  }
  return fallback;
};

// Use environment variables with fallback for different environments
const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: '/api', // Use Vite proxy to forward to backend
  withCredentials: true, // Always send cookies for cross-origin auth
});

// Add a request interceptor to include the Firebase auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    if (auth) {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response interceptor for global error handling (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - potentially expired token?');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
