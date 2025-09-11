import api from './APIService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin?: boolean;
  };
  access_token?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
  role?: string;
}

const login = async (credentials: {
  usernameOrEmail: string;
  password: string;
}) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const signup = async (credentials: {
  email: string;
  password: string;
  username: string;
}) => {
  const response = await api.post('/auth/signup', credentials);
  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

const isAuthenticated = () => {
  return !!localStorage.getItem('user');
};

const setToken = (token: string) => {
  // This is a simplified implementation. In a real app, you'd likely
  // want to store the token and user data separately.
  const user = { access_token: token };
  localStorage.setItem('user', JSON.stringify(user));
};

const authService = {
  login,
  signup,
  logout,
  isAuthenticated,
  getCurrentUser,
  setToken,
};

export default authService;
