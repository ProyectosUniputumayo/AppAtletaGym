import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { clearTokens, getAccessToken, getStoredUser, saveStoredUser, saveTokens } from '../lib/api';
import type { AuthUser, LoginResult } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  /**
   * Attempts to sign in against POST /auth/login. The backend always answers
   * with a single access token (no 2FA challenge, no refresh token).
   */
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** Re-reads the persisted user (the backend exposes no /auth/me endpoint). */
  refreshUser: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

/** Shape returned by the backend's POST /auth/login. */
interface BackendLoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    roles: string[];
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(raw: BackendLoginResponse['user']): AuthUser {
  return {
    id: String(raw.id),
    email: raw.email,
    firstName: '',
    lastName: '',
    roles: raw.roles ?? [],
    permissions: [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getAccessToken() ? getStoredUser() : null,
  );
  const [isLoading] = useState<boolean>(false);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data } = await api.post<BackendLoginResponse>('/auth/login', {
      email,
      password,
    });
    saveTokens({ accessToken: data.access_token });
    const authUser = toAuthUser(data.user);
    saveStoredUser(authUser);
    setUser(authUser);
    return { requiresOtp: false };
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(getStoredUser());
  }, []);

  const logout = useCallback(async () => {
    // The backend has no /auth/logout endpoint: the session is cleared locally.
    clearTokens();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user],
  );

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      // Admin / SuperAdmin see everything (backend role names are capitalised).
      const roles = user.roles ?? [];
      if (roles.some((role) => role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin')) {
        return true;
      }
      const permissions = user.permissions ?? [];
      if (permissions.includes('*') || permissions.includes(perm)) return true;
      // Support module-level wildcards, e.g. "people:*".
      const [module] = perm.split(':');
      return permissions.includes(`${module}:*`);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser, hasPermission, hasRole }),
    [user, isLoading, login, logout, refreshUser, hasPermission, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
