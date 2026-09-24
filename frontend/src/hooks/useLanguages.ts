import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { SUPPORTED_LANGUAGES } from '../i18n';

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
export function useLanguages() {
  const query = useQuery({
    queryKey: ['languages'],
    queryFn: async () => (await api.get<LanguagesConfig>('/platform/languages')).data,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { ...query, config: query.data ?? FALLBACK };
}
