import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '@/shared/ui/feedback/Skeleton';
import { EmptyState } from '@/shared/ui/feedback/EmptyState';
import { Button } from '@/shared/ui/primitives/Button';

export interface TableColumn<T> {
  /** Identificador único de la columna. */
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;
  /** Renderizado personalizado de la celda (por defecto, el valor crudo de `key`). */
  render?: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Clave única de cada fila. */
  rowKey: (row: T) => string | number;
  /** Muestra un esqueleto de carga en lugar de las filas. */
  loading?: boolean;
  /** Mensaje de error; si se pasa, se muestra el estado de error con reintento. */
  error?: string | null;
  onRetry?: () => void;
  /** Icono del estado vacío (por defecto `Inbox`). */
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  className?: string;
}

/**
 * Tabla general: columnas configurables con estados de carga, error y vacío.
 * Es la pieza única y reutilizable para todos los listados de la aplicación;
 * las particularidades de cada módulo viven en su página, no aquí.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyIcon = Inbox,
  emptyTitle = 'Sin resultados',
  emptyDescription,
  skeletonRows = 5,
  className,
}: TableProps<T>) {
  const frame = cn(
    'overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
    className,
  );

  if (loading) {
    return <SkeletonTable rows={skeletonRows} cols={columns.length} className={className} />;
  }

  if (error) {
    return (
      <div className={frame}>
        <EmptyState
          icon={AlertTriangle}
          title="No se pudo cargar la información"
          description={error}
          action={
            onRetry && (
              <Button
                variant="outline"
                leftIcon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
                onClick={onRetry}
              >
                Reintentar
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={frame}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', frame)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400',
                  col.headerClassName,
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-5 py-3.5 align-middle text-gray-700 dark:text-gray-300',
                    col.className,
                  )}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as unknown as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;






