import { isValidElement, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-soft transition-all',
        'dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('border-b border-gray-200 px-5 py-4 dark:border-gray-800', className)} {...rest}>
      {children}
    </div>
  );
}

/** Tonos del recuadro que enmarca el icono del título. */
export type CardIconTone = 'brand' | 'emerald' | 'amber' | 'red' | 'violet' | 'gray';

const TONE_CLASSES: Record<CardIconTone, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Admite tanto un COMPONENTE de icono (`icon={Users}` de lucide) como un nodo ya
 * construido (`icon={<Users className="h-4 w-4" />}`), para no obligar a cambiar
 * las llamadas existentes.
 */
export function renderCardIcon(icon: ElementType | ReactNode | undefined): ReactNode {
  if (!icon) return null;
  // 1) Nodo ya construido: `icon={<Users className="h-4 w-4" />}` → se usa tal cual.
  if (isValidElement(icon)) return icon;
  // 2) Componente: `icon={Users}`. OJO: lucide-react exporta sus iconos con
  //    forwardRef, cuyo typeof es 'object' (no 'function'); comprobar solo
  //    'function' hacía que el objeto se pasara como hijo de React y reventara
  //    en runtime con "Objects are not valid as a React child" (tsc NO lo
  //    detecta, porque ElementType admite forwardRef). No simplificar esto.
  if (typeof icon === 'function' || typeof icon === 'object') {
    const IconComp = icon as ElementType;
    return <IconComp className="h-4 w-4" />;
  }
  return null;
}

export interface CardTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'title'> {
  children: ReactNode;
  /** Icono de referencia a la izquierda del título (da contexto visual). */
  icon?: ElementType | ReactNode;
  /** Color del recuadro del icono. */
  tone?: CardIconTone;
}

export function CardTitle({ className, children, icon, tone = 'brand', ...rest }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'flex items-center gap-2.5 text-base font-semibold text-gray-900 dark:text-gray-100',
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            TONE_CLASSES[tone],
          )}
        >
          {renderCardIcon(icon)}
        </span>
      ) : null}
      <span className="min-w-0">{children}</span>
    </h3>
  );
}

export function CardContent({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      {children}
    </div>
  );
}

export default Card;
