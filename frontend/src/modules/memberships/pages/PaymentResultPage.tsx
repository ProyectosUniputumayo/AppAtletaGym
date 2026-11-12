import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, CreditCard, Dumbbell, Loader2, Receipt } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/shared';
import type { Membership } from '../components/MembershipHero';

/**
 * Página a la que Wompi redirige tras el pago (/payments/success?id=...).
 * El backend confirma la transacción con Wompi (respaldo del webhook) y la
 * página consulta la membresía hasta que deje de estar pendiente (máx. ~60 s).
 */
const MAX_ATTEMPTS = 20;
const CONFETTI_COLORS = ['#dc2626', '#f59e0b', '#10b981', '#fbbf24'];

export default function PaymentResultPage() {
  const { t, i18n } = useTranslation('gym');
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const transactionId = params.get('id');
  const reduce = useReducedMotion();

  const { data, failureCount } = useQuery<Membership>({
    queryKey: ['my-membership'],
    queryFn: async () => (await api.get('/user-memberships/me')).data,
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      const attempts = query.state.dataUpdateCount;
      return status === 'pending' && attempts < MAX_ATTEMPTS ? 3000 : false;
    },
  });

  const status = data?.paymentStatus;

  // Respaldo del webhook: el backend consulta la transacción a Wompi y actualiza la membresía
  useEffect(() => {
    if (!transactionId) return;
    let tries = 0;
    const run = async () => {
      try {
        await api.post(`/user-memberships/confirm/${encodeURIComponent(transactionId)}`);
        queryClient.invalidateQueries({ queryKey: ['my-membership'] });
      } catch {
        /* se reintenta */
      }
    };
    run();
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 10 || queryClient.getQueryData<Membership>(['my-membership'])?.paymentStatus !== 'pending') {
        clearInterval(timer);
        return;
      }
      run();
    }, 4000);
    return () => clearInterval(timer);
  }, [transactionId, queryClient]);

  useEffect(() => {
    if (status && status !== 'pending') {
      queryClient.invalidateQueries({ queryKey: ['my-membership-history'] });
    }
  }, [status, queryClient]);

  const plan = data?.membershipPlan;
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const tone: 'paid' | 'rejected' | 'pending' =
    status === 'paid' ? 'paid' : status === 'rejected' ? 'rejected' : 'pending';

  const copy = {
    paid: { title: t('pay.paidTitle'), text: t('pay.paidText') },
    rejected: {
      title: t('pay.rejectedTitle'),
      text: t('pay.rejectedText'),
    },
    pending: {
      title: t('pay.pendingTitle'),
      text:
        failureCount > 0
          ? t('pay.errorText')
          : t('pay.pendingText'),
    },
  }[tone];

  const ring = {
    paid: 'from-emerald-500 to-emerald-300',
    rejected: 'from-brand-600 to-brand-400',
    pending: 'from-amber-500 to-amber-300',
  }[tone];
  const glow = {
    paid: 'rgba(16,185,129,0.55)',
    rejected: 'rgba(220,38,38,0.55)',
    pending: 'rgba(245,158,11,0.45)',
  }[tone];

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-8">
      {/* Confeti */}
      {tone === 'paid' && !reduce && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, n) => (
            <motion.span
              key={n}
              className="absolute top-1/4 h-2 w-2 rounded-sm"
              style={{ left: `${(n * 37) % 100}%`, background: CONFETTI_COLORS[n % 4] }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: 420 + (n % 5) * 40, opacity: 0, rotate: 360 + n * 20 }}
              transition={{ duration: 2.2 + (n % 6) * 0.25, delay: (n % 8) * 0.06, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full overflow-hidden rounded-3xl border border-gray-200 bg-white text-center shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className={`h-1.5 w-full bg-gradient-to-r ${ring}`} />
        <div className="space-y-6 px-6 pb-8 pt-10">
          {/* Icono animado */}
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            {tone === 'pending' && !reduce && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-amber-400"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <motion.div
              key={tone}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${ring} text-white`}
              style={{ boxShadow: `0 0 40px -6px ${glow}` }}
            >
              {tone === 'pending' && <Loader2 className="h-10 w-10 animate-spin" aria-hidden="true" />}
              {tone === 'paid' && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                  />
                </svg>
              )}
              {tone === 'rejected' && (
                <motion.svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  aria-hidden="true"
                  animate={reduce ? undefined : { x: [0, -4, 4, -3, 3, 0] }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.path
                    d="M6 6l12 12M18 6L6 18"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  />
                </motion.svg>
              )}
            </motion.div>
          </div>

          <div className="space-y-2" role="status" aria-live="polite">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{copy.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{copy.text}</p>
          </div>

          {/* Pasos mientras se confirma */}
          {tone === 'pending' && (
            <ol className="mx-auto flex max-w-xs items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              {[t('pay.stepSent'), t('pay.stepVerifying'), t('pay.stepActive')].map((label, n) => (
                <li key={label} className="flex flex-col items-center gap-1.5">
                  <motion.span
                    className={`h-2.5 w-2.5 rounded-full ${n < 2 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                    animate={n === 1 && !reduce ? { scale: [1, 1.5, 1] } : undefined}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  {label}
                </li>
              ))}
            </ol>
          )}

          {/* Resumen de la compra */}
          {tone !== 'pending' && plan && (
            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 rounded-2xl bg-gray-50 p-4 text-left text-sm dark:bg-gray-800/60"
            >
              <Row icon={<Dumbbell className="h-4 w-4" />} label={t('pay.plan')} value={plan.name} />
              <Row
                icon={<CreditCard className="h-4 w-4" />}
                label={t('pay.amount')}
                value={`$${Number(data?.amountPaid).toLocaleString(i18n.language)} COP`}
              />
              {tone === 'paid' && (
                <Row icon={<CalendarDays className="h-4 w-4" />} label={t('pay.validUntil')} value={fmtDate(data?.endDate)} />
              )}
              {transactionId && (
                <Row icon={<Receipt className="h-4 w-4" />} label={t('pay.transaction')} value={transactionId} mono />
              )}
            </motion.dl>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/my-membership">
              <Button className="w-full sm:w-auto">
                {tone === 'rejected' ? t('pay.tryAgain') : t('pay.goMembership')}
              </Button>
            </Link>
            {tone === 'paid' && (
              <Link to="/">
                <Button variant="secondary" className="w-full sm:w-auto">
                  {t('pay.goHome')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </dt>
      <dd className={`min-w-0 truncate font-medium text-gray-900 dark:text-gray-100 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
