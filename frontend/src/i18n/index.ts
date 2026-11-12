import i18n from 'i18next';
import type { BackendModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import api from '@/lib/api';

/**
 * Idiomas conocidos por la interfaz (para detección y como respaldo del
 * selector si el backend no responde). Los TEXTOS de la interfaz ya no viven
 * en el frontend: se cargan de la base de datos vía `GET /platform/translations`.
 * Las variantes (es-CO, es-MX…) heredan del idioma base en el backend.
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

export const NAMESPACES = ['gym'] as const;

/** Carga los textos desde el backend (tabla `translations`). */
const apiBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language, namespace, callback) {
    api
      .get<Record<string, string>>(`/platform/translations/${encodeURIComponent(language)}/${encodeURIComponent(namespace)}`)
      .then((res) => {
        const data: unknown = res.data;
        // En dev, rutas sin proxy devuelven index.html con HTTP 200: se descarta.
        if (!data || typeof data !== 'object') throw new Error('Respuesta de traducciones inválida');
        callback(null, data as Record<string, string>);
      })
      .catch((err: unknown) => callback(err as Error, null));
  },
};

void i18n
  .use(apiBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'gym',
    // Las claves del backend son planas ("nav.home"): sin separador de claves.
    keySeparator: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'talentos.lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: true },
  });

/** Cambia el idioma y lo persiste (para el header <html lang>). */
export function changeLanguage(code: string): void {
  void i18n.changeLanguage(code);
  document.documentElement.lang = code;
}

export default i18n;
