import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  username: string;
  preferredStyle?: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post('/auth/login', credentials);
  const { token, refreshToken } = response.data;

  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);

  return response.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post('/auth/register', data);
  const { token, refreshToken } = response.data;

  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);

  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

export async function refreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await api.post('/auth/refresh', {
    refresh_token: refreshToken,
  });
  const { token } = response.data;

  localStorage.setItem('auth_token', token);

  return token;
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<void> {
  await api.post('/auth/password-reset-request', data);
}

export async function confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
  await api.post('/auth/password-reset-confirm', data);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

export async function resendVerificationEmail(): Promise<void> {
  await api.post('/auth/resend-verification');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}
