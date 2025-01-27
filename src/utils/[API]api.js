import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
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

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const api = {
    training: {
        getRecommendations: () => apiClient.get('/training/recommendations'),
        submitProgress: (data) => apiClient.post('/training/progress', data)
    },
    gameAnalysis: {
        analyze: (data) => apiClient.post('/game-analysis', data),
        getHistory: () => apiClient.get('/game-analysis/history')
    },
    tournaments: {
        list: () => apiClient.get('/tournaments'),
        join: (id) => apiClient.post(`/tournaments/${id}/join`),
        getDetails: (id) => apiClient.get(`/tournaments/${id}`)
    },
    social: {
        getFriends: () => apiClient.get('/social/friends'),
        sendRequest: (userId) => apiClient.post('/social/friends/request', { userId })
    }
}; 