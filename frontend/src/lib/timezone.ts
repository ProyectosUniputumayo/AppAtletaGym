// Formateo de fechas/horas en la ZONA HORARIA EFECTIVA del usuario (usuario →
// sede → organización). Usa Intl (sin dependencias) respetando el idioma activo.

import i18n from '../i18n';

/** Zonas horarias comunes de la región (para los selectores). */
export const COMMON_TIMEZONES: string[] = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Guatemala',
  'America/El_Salvador',
  'America/Tegucigalpa',
  'America/Panama',
  'America/Lima',
  'America/Guayaquil',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Asuncion',
  'America/Montevideo',
  'UTC',
];

const DEFAULT_TZ = 'America/Bogota';

function currentLocale(): string {
  return i18n.language || 'es';
}

/** Fecha + hora en la zona dada (o la efectiva pasada por el llamador). */
export function formatDateTimeTZ(
  value: string | number | Date | null | undefined,
  timeZone: string = DEFAULT_TZ,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(currentLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
      ...options,
    }).format(date);
  } catch {
    return date.toLocaleString(currentLocale());
  }
}

/** Solo fecha en la zona dada. */
export function formatDateTZ(
  value: string | number | Date | null | undefined,
  timeZone: string = DEFAULT_TZ,
): string {
  return formatDateTimeTZ(value, timeZone, { dateStyle: 'medium', timeStyle: undefined });
}

/** Solo hora en la zona dada. */
export function formatTimeTZ(
  value: string | number | Date | null | undefined,
  timeZone: string = DEFAULT_TZ,
): string {
  return formatDateTimeTZ(value, timeZone, { dateStyle: undefined, timeStyle: 'short' });
}

/** Etiqueta legible de una zona con su desfase actual, p. ej. "America/Bogota (GMT-5)". */
export function timezoneLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(
      new Date(),
    );
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return `${timeZone.replace(/_/g, ' ')} (${offset})`;
  } catch {
    return timeZone;
  }
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
