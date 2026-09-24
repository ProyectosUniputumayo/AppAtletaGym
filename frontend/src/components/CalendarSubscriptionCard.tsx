import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CalendarPlus, CalendarRange, Check, Copy, Link2 } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { FormSection } from './ui/FormSection';
import Input from './ui/Input';
import { SkeletonForm } from './ui/Skeleton';
import type { CalendarLinkResponse } from '../types';

/** Fecha ISO (YYYY-MM-DD) desplazada n días desde hoy. */
function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Suscripción de la agenda personal (feed ICS) para Google/Apple/Outlook Calendar.
 * Muestra el enlace del usuario (con rango de fechas opcional) y permite copiarlo
 * o abrir la suscripción directamente.
 */
export function CalendarSubscriptionCard() {
  const toast = useToast();
  const [from, setFrom] = useState(() => isoDaysFromNow(0));
  const [to, setTo] = useState(() => isoDaysFromNow(30));
  const [copied, setCopied] = useState(false);

  const linkQuery = useQuery({
    queryKey: ['me-calendar-link'],
    queryFn: async () => (await api.get<CalendarLinkResponse>('/me/calendar/link')).data,
    staleTime: 10 * 60 * 1000,
  });

  // URL con el rango seleccionado (?from=&to=), sobre la URL base del feed.
  const feedUrl = useMemo(() => {
    const base = linkQuery.data?.url;
    if (!base) return '';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [linkQuery.data?.url, from, to]);

  async function copyLink() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }

  function subscribe() {
    if (!feedUrl) return;
    // webcal:// hace que el SO/navegador ofrezca SUSCRIBIRSE (no una importación única).
    const webcal = feedUrl.replace(/^https?:\/\//, 'webcal://');
    window.open(webcal, '_blank');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<CalendarClock className="h-4 w-4" />}>Suscribir mi agenda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sincroniza tus ausencias, evaluaciones y rutas de aprendizaje con Google, Apple u Outlook
          Calendar. Pega el enlace en tu app de calendario para mantenerla al día automáticamente.
        </p>

        {linkQuery.isLoading ? (
          <SkeletonForm fields={3} />
        ) : linkQuery.isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            No se pudo obtener tu enlace de calendario.
          </p>
        ) : (
          <>
            <FormSection
              icon={<CalendarRange className="h-4 w-4" />}
              title="Rango de fechas"
              description="Periodo de eventos que incluirá el feed de tu calendario."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="date"
                  label="Desde"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <Input
                  type="date"
                  label="Hasta"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  leftIcon={<CalendarPlus className="h-4 w-4" />}
                  onClick={subscribe}
                >
                  Suscribir calendario (ICS)
                </Button>
              </div>
            </FormSection>

            <FormSection
              icon={<Link2 className="h-4 w-4" />}
              title="Enlace de suscripción"
              description="Cópialo y pégalo en tu aplicación de calendario."
              tone="amber"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Tu enlace de calendario (pégalo en Google/Apple Calendar)
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} />
                <Button
                  variant="outline"
                  leftIcon={
                    copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
                  }
                  onClick={copyLink}
                >
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Cualquiera con este enlace puede ver tu agenda. Trátalo como un dato privado.
              </p>
            </FormSection>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarSubscriptionCard;
