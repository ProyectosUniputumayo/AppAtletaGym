import { useTranslation } from 'react-i18next';
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  planType: string;
  durationDays: number;
  sessions?: number | null;
  isActive: boolean;
}

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  disabled: boolean;
  isCurrent: boolean;
  onSelect: (id: string) => void;
}

/**
 * Tarjeta seleccionable de un plan de membresía. Reutilizable en cualquier
 * vista que ofrezca compra/renovación de planes.
 */
export function PlanCard({ plan, selected, disabled, isCurrent, onSelect }: PlanCardProps) {
  const { t, i18n } = useTranslation('gym');
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => !disabled && onSelect(plan.id)}
      className={[
        'group relative flex h-full flex-col rounded-2xl border bg-white/80 p-5 text-left shadow-[var(--app-shadow-md)] backdrop-blur-sm transition-all duration-200',
        'dark:bg-gray-900/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950',
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/30 hover:-translate-y-0.5'
          : 'border-gray-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_0_30px_-8px_rgba(220,38,38,0.3)] dark:border-gray-800',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      ].join(' ')}
    >
      {isCurrent && (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          {t('plan.yourPlan')}
        </span>
      )}
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="bg-gradient-to-r from-black to-brand-600 bg-clip-text text-3xl font-bold tabular-nums text-transparent dark:from-white dark:to-brand-400">
            ${Number(plan.price).toLocaleString(i18n.language)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {plan.planType === 'time'
              ? t('plan.days', { count: plan.durationDays })
              : t('plan.sessions', { count: plan.sessions ?? 0 })}
          </span>
          {plan.planType === 'time' && (
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {t('plan.continuous')}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <span
          className={[
            'inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            selected
              ? 'bg-brand-600 text-white'
              : disabled
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-gray-900 text-white hover:bg-brand-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-brand-500 dark:hover:text-white',
          ].join(' ')}
        >
          {disabled ? t('plan.unavailable') : selected ? t('plan.selected') : t('plan.select')}
        </span>
      </div>
    </button>
  );
}

export default PlanCard;
