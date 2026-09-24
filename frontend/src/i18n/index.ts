import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

/**
 * Idiomas soportados. Los BASE traen traducciones propias; las VARIANTES
 * (es-CO, es-MX, es-GT…) reutilizan la traducción base por `nonExplicitSupportedLngs`
 * y solo cambian el formato de fecha/número (locale de Intl). Añadir una variante
 * nueva = agregar una entrada aquí (y, si se quiere, overrides en un JSON propio).
 */
export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🌎' },
  { code: 'es-CO', label: 'Español (Colombia)', flag: '🇨🇴' },
  { code: 'es-MX', label: 'Español (México)', flag: '🇲🇽' },
  { code: 'es-GT', label: 'Español (Guatemala)', flag: '🇬🇹' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const resources = {
  es: { common: es.common, layout: es.layout, auth: es.auth },
  en: { common: en.common, layout: en.layout, auth: en.auth },
  fr: { common: fr.common, layout: fr.layout, auth: fr.auth },
  pt: { common: pt.common, layout: pt.layout, auth: pt.auth },
};

export const NAMESPACES = ['common', 'layout', 'auth'] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    // Variantes (es-CO) caen a la base (es) si no tienen recursos propios.
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'talentos.lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  });

/** Cambia el idioma y lo persiste (para el header <html lang>). */
export function changeLanguage(code: string): void {
  void i18n.changeLanguage(code);
  document.documentElement.lang = code;
}

export default i18n;
