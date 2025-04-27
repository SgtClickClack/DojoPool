import axios from "axios";
import { auth } from "../../config/firebase"; // Import Firebase auth instance

<<<<<<< HEAD
// Correct API base URL for local backend
const API_BASE_URL = "http://localhost:3001";
=======
// Updated relative URL for proxy
const API_BASE_URL = "/api/v1";
>>>>>>> 9503c319 (Comprehensive codebase cleanup: consolidated utilities, pruned static assets, resolved TypeScript lints, and organized test files/documentation.)

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the Firebase auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error getting Firebase token:", error);
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
