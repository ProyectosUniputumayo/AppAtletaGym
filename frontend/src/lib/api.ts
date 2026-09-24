import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '../types';

export const ACCESS_TOKEN_KEY = 'talentos.access';
export const REFRESH_TOKEN_KEY = 'talentos.refresh';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

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

// ---- Response interceptor: refresh once on 401 ----

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Shared refresh promise so that concurrent 401s trigger a single
 * POST /auth/refresh instead of a stampede.
 */
let refreshPromise: Promise<string> | null = null;

async function refreshTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  // Use a bare axios instance to avoid recursive interceptors.
  const { data } = await axios.post<AuthTokens>(
    `${baseURL.replace(/\/$/, '')}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  saveTokens(data);
  return data.accessToken;
}

function redirectToLogin(): void {
  clearTokens();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/otp/');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
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
