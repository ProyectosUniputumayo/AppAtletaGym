import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Globe, Languages } from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useToast } from './ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { FormSection } from './ui/FormSection';
import Select from './ui/Select';
import { SkeletonForm } from './ui/Skeleton';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../i18n';
import { COMMON_TIMEZONES, timezoneLabel } from '../lib/timezone';

interface Preferences {
  language: string;
  timezone: string | null;
  effectiveTimezone: string;
  companyTimezone: string | null;
  availableTimezones: string[];
}

/** Preferencias regionales del usuario: idioma y zona horaria (usuario → sede → organización). */
export function PreferencesCard() {
  const { t } = useTranslation('common');
  const toast = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['me-preferences'],
    queryFn: async () => (await api.get<Preferences>('/me/preferences')).data,
  });

  const mutation = useMutation({
    mutationFn: async (patch: { language?: string; timezone?: string }) =>
      (await api.patch<Preferences>('/me/preferences', patch)).data,
    onSuccess: (data, patch) => {
      queryClient.setQueryData(['me-preferences'], data);
      if (patch.language) changeLanguage(patch.language);
      toast.success('Preferencias actualizadas');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const prefs = query.data;
  const tzOptions = Array.from(new Set([...(prefs?.availableTimezones ?? COMMON_TIMEZONES)]));

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<Globe className="h-4 w-4" />}>Preferencias regionales</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isLoading || !prefs ? (
          <SkeletonForm fields={4} />
        ) : (
          <div className="max-w-2xl space-y-4">
            <FormSection
              icon={<Languages className="h-4 w-4" />}
              title="Idioma"
              description="Idioma en el que se muestra la interfaz."
            >
              <Select
                label={t('language')}
                value={prefs.language}
                onChange={(e) => mutation.mutate({ language: e.target.value })}
                disabled={mutation.isPending}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </Select>
            </FormSection>

            <FormSection
              icon={<Clock className="h-4 w-4" />}
              title="Zona horaria"
              description="Formato y referencia horaria de fechas y horas."
              tone="violet"
            >
              <Select
                label={t('timezone')}
                value={prefs.timezone ?? ''}
                onChange={(e) => mutation.mutate({ timezone: e.target.value })}
                disabled={mutation.isPending}
              >
                <option value="">
                  Automática ({timezoneLabel(prefs.effectiveTimezone)})
                </option>
                {tzOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {timezoneLabel(tz)}
                  </option>
                ))}
              </Select>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Zona horaria efectiva: <strong>{timezoneLabel(prefs.effectiveTimezone)}</strong>. Si eliges «Automática»,
                se usa la de tu sede u organización. Las fechas y horas se muestran en esta zona.
              </p>
            </FormSection>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PreferencesCard;
