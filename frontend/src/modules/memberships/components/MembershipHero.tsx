import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, Badge, ProgressBar } from '@/shared';

export interface Membership {
  id: string;
  membershipPlan: {
    id: string;
    name: string;
    description: string;
    price: number;
    planType: string;
    durationDays: number;
    sessions?: number | null;
    isActive: boolean;
  };
  startDate: string;
  endDate: string;
  sessionsRemaining?: number | null;
  paymentStatus: string;
  amountPaid: number;
}

interface MembershipHeroProps {
  membership: Membership;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'green' as const;
    case 'pending':
      return 'amber' as const;
    case 'rejected':
      return 'red' as const;
    default:
      return 'gray' as const;
  }
};

/**
 * Bloque destacado con la membresía activa: métricas + barra de días restantes.
 */
export function MembershipHero({ membership }: MembershipHeroProps) {
  const { t, i18n } = useTranslation('gym');
  const start = new Date(membership.startDate).getTime();
  const end = new Date(membership.endDate).getTime();
  const now = Date.now();
  const total = Math.max(1, end - start);
  const remaining = Math.max(0, end - now);
  const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil(total / (1000 * 60 * 60 * 24));
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  const nearExpiry = daysRemaining <= 7 && daysRemaining >= 0;
  const expired = remaining <= 0;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600/10 via-brand-500/5 to-transparent px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-[0_0_24px_-4px_rgba(220,38,38,0.6)]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {membership.membershipPlan?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {membership.membershipPlan?.description}
              </p>
            </div>
          </div>
          <Badge variant={statusVariant(membership.paymentStatus)}>
            {t(`status.${membership.paymentStatus}`, { defaultValue: membership.paymentStatus })}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label={t('hero.start')} value={new Date(membership.startDate).toLocaleDateString(i18n.language)} />
          <Metric label={t('hero.ends')} value={new Date(membership.endDate).toLocaleDateString(i18n.language)} />
          <Metric
            label={t('hero.sessionsLeft')}
            value={membership.sessionsRemaining != null ? String(membership.sessionsRemaining) : t('hero.unlimited')}
          />
          <Metric label={t('hero.amountPaid')} value={`$${Number(membership.amountPaid).toLocaleString(i18n.language)}`} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {expired
                ? t('hero.expired')
                : t('hero.daysLeft', { days: daysRemaining, total: totalDays })}
            </span>
            <span className="tabular-nums text-gray-500 dark:text-gray-400">
              {Math.round(percent)}%
            </span>
          </div>
          <ProgressBar
            value={percent}
            barClassName={
              expired
                ? 'bg-red-500'
                : nearExpiry
                  ? 'bg-amber-500'
                  : 'bg-brand-600'
            }
          />
          {nearExpiry && !expired && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {t('hero.expiresSoon')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default MembershipHero;
