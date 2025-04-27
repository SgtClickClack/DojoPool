import axios from 'axios';

// Create an axios instance with default config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
      }
    }
    return Promise.reject(error);
  }
); 