import axios from "axios";
import { auth } from "../../config/firebase"; // Import Firebase auth instance

// Determine the base URL for the API
// TODO: Use environment variables for different environments (dev, prod)
const API_BASE_URL = "http://localhost:8000/api/v1"; // Placeholder: Assume backend runs on port 8000

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
        // Optionally handle the error, e.g., redirect to login
      }
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  },
);

// Optional: Add response interceptor for global error handling (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error("Unauthorized request - potentially expired token?");
      // Example: window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
