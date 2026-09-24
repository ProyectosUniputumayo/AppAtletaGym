import { cn } from '../../lib/utils';

/**
 * Bloque base de esqueleto de carga (placeholder animado). Se compone con las
 * utilidades de Tailwind (alto/ancho/forma). Para casos comunes usa las
 * primitivas de abajo (SkeletonText, SkeletonTable, SkeletonList, SkeletonCards,
 * SkeletonForm).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)}
    />
  );
}

/** Varias líneas de texto; la última es más corta. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Grid de tarjetas (para listados en tarjetas). */
export function SkeletonCards({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const cols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  };
  return (
    <div className={cn('grid gap-4', cols[columns], className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Tabla con cabecera + filas. */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-3.5 flex-1', c === 0 && 'max-w-[40%]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lista de filas (icono + dos líneas). */
export function SkeletonList({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800',
        className,
      )}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Formulario (etiqueta + campo) para precarga de detalles/edición. */
export function SkeletonForm({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)} aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
