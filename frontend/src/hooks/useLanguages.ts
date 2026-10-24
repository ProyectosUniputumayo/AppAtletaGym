import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  enabled: boolean;
  isVariant?: boolean;
}

export interface LanguagesConfig {
  defaultLanguage: string;
  languages: LanguageOption[];
}

const FALLBACK: LanguagesConfig = {
  defaultLanguage: 'es',
  languages: SUPPORTED_LANGUAGES.map((l) => ({ ...l, enabled: true })),
};

/**
 * Configuración de idiomas de la plataforma (GET /platform/languages, público).
 * Fallback a la lista incorporada si el backend no responde.
 */
function isLanguagesConfig(data: unknown): data is LanguagesConfig {
  if (!data || typeof data !== 'object') return false;
  const languages = (data as { languages?: unknown }).languages;
  return Array.isArray(languages);
}

export function useLanguages() {
  const query = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const data: unknown = (await api.get('/platform/languages')).data;
      // En dev, rutas sin proxy devuelven el index.html con HTTP 200: se rechaza
      // para que `config` caiga a FALLBACK en lugar de recibir un string HTML.
      if (!isLanguagesConfig(data)) {
        throw new Error('Configuración de idiomas inválida');
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { ...query, config: query.data ?? FALLBACK };
}




