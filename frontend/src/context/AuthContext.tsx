import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../lib/api';
import type { AuthUser, LoginResponse, LoginResult, OtpChallenge } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /**
   * Attempts to sign in. When the account has 2FA enabled no session is
   * created and the pending OTP challenge is returned instead.
   */
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Completes a 2FA login: verifies the code, stores tokens and the user. */
  verifyOtp: (challengeId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetches the current user from /auth/me (e.g. after changing the avatar). */
  refreshUser: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getAccessToken()));

  // On mount: if a token exists, fetch the current user.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data } = await api.post<LoginResponse | OtpChallenge>('/auth/login', {
      email,
      password,
    });
    if ('requiresOtp' in data && data.requiresOtp) {
      // 2FA pending: no tokens yet, the caller must complete the OTP step.
      return data;
    }
    const session = data as LoginResponse;
    saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    setUser(session.user);
    return { requiresOtp: false };
  }, []);

  const verifyOtp = useCallback(async (challengeId: string, code: string) => {
    const { data } = await api.post<LoginResponse>('/auth/otp/verify', { challengeId, code });
    saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<AuthUser>('/auth/me');
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network/server errors on logout: the session is cleared locally anyway.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user],
  );

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      // Super admin sees everything.
      if (user.roles?.includes('admin')) return true;
      const permissions = user.permissions ?? [];
      if (permissions.includes('*') || permissions.includes(perm)) return true;
      // Support module-level wildcards, e.g. "employees:*".
      const [module] = perm.split(':');
      return permissions.includes(`${module}:*`);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, verifyOtp, logout, refreshUser, hasPermission, hasRole }),
    [user, isLoading, login, verifyOtp, logout, refreshUser, hasPermission, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
