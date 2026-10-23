import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens, AuthUser } from '../types';

export const ACCESS_TOKEN_KEY = 'talentos.access';
export const REFRESH_TOKEN_KEY = 'talentos.refresh';
export const AUTH_USER_KEY = 'talentos.user';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/** The backend exposes no /auth/me, so the logged-in user is kept locally. */
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// The backend serves its routes at the root (POST /auth/login, GET /people, …)
// with no /api prefix, so the dev server proxies them straight to NestJS.
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request interceptor: attach Bearer token ----
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: the backend issues no refresh token, so a 401
// simply means the session is over: clear it and go back to /login. ----

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function redirectToLogin(): void {
  clearTokens();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthEndpoint = url.includes('/auth/login');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a human-readable message from an API error.
 * Backend errors arrive as `{ message }` where message may be a string or an array.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;
    if (Array.isArray(message) && message.length > 0) return message.join('. ');
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
