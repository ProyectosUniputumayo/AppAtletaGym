import type { LucideIcon } from 'lucide-react';
import Card, { CardContent } from './Card';
import { cn } from '../../lib/utils';

export interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Clases de color del icono (fondo + texto). */
  iconClassName?: string;
  /** Texto secundario opcional bajo el valor. */
  hint?: string;
}

interface StatCardProps extends StatItem {}

/** Tarjeta KPI individual (icono + etiqueta + valor). */
export function StatCard({ label, value, icon: Icon, iconClassName, hint }: StatCardProps) {
  return (
    <Card className="hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-800">
      <CardContent className="flex items-center gap-4 px-5 py-5">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconClassName ?? 'bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {hint && <p className="truncate text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardsProps {
  items: StatItem[];
  /** Nº de columnas en desktop (default: se adapta al número de items). */
  columns?: 2 | 3 | 4 | 5;
  loading?: boolean;
  className?: string;
}

const COL_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
};

/** Franja de KPIs para las cabeceras de listas/CRUDs. */
export function StatCards({ items, columns, loading, className }: StatCardsProps) {
  const cols = columns ?? (Math.min(Math.max(items.length, 2), 5) as 2 | 3 | 4 | 5);
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 gap-4', COL_CLASS[cols], className)}>
        {Array.from({ length: cols }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 px-5 py-5">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className={cn('grid grid-cols-2 gap-4', COL_CLASS[cols], className)}>
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

export default StatCards;
