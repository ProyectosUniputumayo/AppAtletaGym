// ---- Auth ----

export type TwoFactorChannel = 'email' | 'whatsapp';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
  twoFactorChannel?: TwoFactorChannel | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

/** Returned by POST /auth/login when the account has 2FA enabled. */
export interface OtpChallenge {
  requiresOtp: true;
  challengeId: string;
  channel: TwoFactorChannel;
  /** Only present in development environments. */
  devCode?: string;
}

/** Result of AuthContext.login: either a completed session or a pending OTP challenge. */
export type LoginResult = { requiresOtp: false } | OtpChallenge;

// ---- CSV imports ----

export type ImportEntity =
  | 'employees'
  | 'competencies'
  | 'skills'
  | 'positions'
  | 'courses'
  | 'organizational-units'
  | 'branches'
  | 'leave-types'
  | 'clients';

export interface ImportColumn {
  key: string;
  required: boolean;
  description: string;
}

export interface ImportSchema {
  entity: ImportEntity;
  columns: ImportColumn[];
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportReport {
  entity: string;
  processed: number;
  created: number;
  updated: number;
  errors: ImportRowError[];
}

// ---- User preferences (Mi Perfil) ----

export interface UserNotificationPreferences {
  notificationChannels: { email: boolean; whatsapp: boolean; push: boolean };
  notificationTypes: Record<string, boolean>;
  summaryFrequency: 'immediate' | 'daily' | 'weekly';
  privacy: { appearInLists: boolean; showStatsPublicly: boolean };
  quietHours: { enabled: boolean; start: string; end: string };
}

export interface MePreferencesResponse {
  language: string;
  timezone: string | null;
  effectiveTimezone: string;
  companyTimezone: string | null;
  availableTimezones: string[];
  preferences: UserNotificationPreferences;
  /** Catálogo de tipos de notificación disponibles (orden de presentación). */
  notificationTypes: string[];
}

export interface CalendarLinkResponse {
  token: string;
  url: string;
}

// ---- Exports with field selection ----

export type ExportEntity = 'employees' | 'competencies' | 'evaluations';
export type ExportFormat = 'csv' | 'xlsx';

export interface ExportField {
  key: string;
  label: string;
}