import type { ComponentType } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  Megaphone,
  MessageSquare,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../lib/api';
import { useToast } from './ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { FormSection } from './ui/FormSection';
import Select from './ui/Select';
import { SkeletonList } from './ui/Skeleton';
import type { MePreferencesResponse, UserNotificationPreferences } from '../types';

type IconType = ComponentType<{ className?: string }>;

/** Parche parcial (por sección) de las preferencias — se fusiona en el backend. */
type PreferencesPatch = {
  notificationChannels?: Partial<UserNotificationPreferences['notificationChannels']>;
  notificationTypes?: Record<string, boolean>;
  summaryFrequency?: UserNotificationPreferences['summaryFrequency'];
  privacy?: Partial<UserNotificationPreferences['privacy']>;
  quietHours?: Partial<UserNotificationPreferences['quietHours']>;
};

const CHANNEL_META: { key: 'email' | 'whatsapp' | 'push'; label: string; icon: IconType }[] = [
  { key: 'email', label: 'Correo electrónico', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { key: 'push', label: 'Notificaciones push', icon: Bell },
];

const TYPE_META: Record<string, { label: string; icon: IconType }> = {
  evaluations: { label: 'Evaluaciones', icon: ClipboardCheck },
  learning: { label: 'Aprendizaje', icon: GraduationCap },
  recruitment: { label: 'Reclutamiento', icon: Briefcase },
  leaves: { label: 'Ausencias', icon: CalendarDays },
  recognitions: { label: 'Reconocimientos', icon: Award },
  announcements: { label: 'Comunicados', icon: Megaphone },
  documents: { label: 'Documentos', icon: FileText },
};

const FREQUENCY_LABELS: Record<UserNotificationPreferences['summaryFrequency'], string> = {
  immediate: 'Inmediato',
  daily: 'Resumen diario',
  weekly: 'Resumen semanal',
};

/** Fila con icono + etiqueta a la izquierda y un interruptor (checkbox) a la derecha. */
function ToggleRow({
  icon: Icon,
  label,
  checked,
  disabled,
  onChange,
}: {
  icon: IconType;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
      />
    </label>
  );
}

/**
 * Preferencias de notificaciones y privacidad ("Mis preferencias"): canales de
 * aviso, qué tipos de notificación recibir, frecuencia de resumen y controles de
 * privacidad de la información. Guarda automáticamente cada cambio.
 */
export function NotificationPreferencesCard() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['me-preferences'],
    queryFn: async () => (await api.get<MePreferencesResponse>('/me/preferences')).data,
  });

  const mutation = useMutation({
    mutationFn: async (patch: PreferencesPatch) =>
      (await api.patch<MePreferencesResponse>('/me/preferences', patch)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['me-preferences'], data);
      toast.success('Preferencias actualizadas');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const prefs = query.data?.preferences;
  const types = query.data?.notificationTypes ?? [];
  const busy = mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<Bell className="h-4 w-4" />}>Mis preferencias</CardTitle>
      </CardHeader>
      <CardContent>
        {query.isLoading || !prefs ? (
          <SkeletonList rows={6} />
        ) : (
          <div className="space-y-4">
            {/* Canales de notificación */}
            <FormSection
              icon={<Radio className="h-4 w-4" />}
              title="Canales de notificación"
              description="Por dónde quieres que te lleguen los avisos."
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {CHANNEL_META.map((ch) => (
                  <ToggleRow
                    key={ch.key}
                    icon={ch.icon}
                    label={ch.label}
                    checked={prefs.notificationChannels[ch.key]}
                    disabled={busy}
                    onChange={(value) =>
                      mutation.mutate({ notificationChannels: { [ch.key]: value } })
                    }
                  />
                ))}
              </div>
            </FormSection>

            {/* Qué quieres recibir */}
            <FormSection
              icon={<Megaphone className="h-4 w-4" />}
              title="Qué quieres recibir"
              description="Tipos de notificación y periodicidad del resumen."
              tone="violet"
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {types.map((type) => {
                  const meta = TYPE_META[type] ?? { label: type, icon: Bell };
                  return (
                    <ToggleRow
                      key={type}
                      icon={meta.icon}
                      label={meta.label}
                      checked={prefs.notificationTypes[type] ?? true}
                      disabled={busy}
                      onChange={(value) =>
                        mutation.mutate({ notificationTypes: { [type]: value } })
                      }
                    />
                  );
                })}
              </div>
              <div className="max-w-xs px-3">
                <Select
                  label="Frecuencia de resumen"
                  value={prefs.summaryFrequency}
                  disabled={busy}
                  onChange={(e) =>
                    mutation.mutate({
                      summaryFrequency: e.target
                        .value as UserNotificationPreferences['summaryFrequency'],
                    })
                  }
                >
                  {(['immediate', 'daily', 'weekly'] as const).map((f) => (
                    <option key={f} value={f}>
                      {FREQUENCY_LABELS[f]}
                    </option>
                  ))}
                </Select>
              </div>
            </FormSection>

            {/* Privacidad */}
            <FormSection
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Privacidad"
              description="Controla qué información tuya es visible para otras personas."
              tone="emerald"
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <ToggleRow
                  icon={Users}
                  label="Aparecer en listas / convocatorias"
                  checked={prefs.privacy.appearInLists}
                  disabled={busy}
                  onChange={(value) => mutation.mutate({ privacy: { appearInLists: value } })}
                />
                <ToggleRow
                  icon={Eye}
                  label="Mostrar mis estadísticas públicamente"
                  checked={prefs.privacy.showStatsPublicly}
                  disabled={busy}
                  onChange={(value) => mutation.mutate({ privacy: { showStatsPublicly: value } })}
                />
              </div>
            </FormSection>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationPreferencesCard;
