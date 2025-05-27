import axios from "axios";
import { auth } from "../../firebase/firebase"; // Import Firebase auth instance

const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return fallback;
};

// NOTE: Vite will replace import.meta.env.VITE_NEXT_PUBLIC_API_URL with the correct value at build time.
const API_BASE_URL = getEnvVar('VITE_NEXT_PUBLIC_API_URL', '/api/v1');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
      console.error("Unauthorized request - potentially expired token?");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
