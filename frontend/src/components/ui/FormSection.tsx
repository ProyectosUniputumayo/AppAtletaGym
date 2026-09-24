import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { renderCardIcon, type CardIconTone } from './Card';

const TONE_CLASSES: Record<CardIconTone, string> = {
  brand: 'text-brand-600 dark:text-brand-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  red: 'text-red-600 dark:text-red-300',
  violet: 'text-violet-600 dark:text-violet-300',
  gray: 'text-gray-500 dark:text-gray-400',
};

export interface SectionHeadingProps {
  /** Icono de referencia a la izquierda (componente lucide o nodo). */
  icon?: ElementType | ReactNode;
  title: ReactNode;
  /** Texto de apoyo bajo el título. */
  description?: ReactNode;
  tone?: CardIconTone;
  /** Acción alineada a la derecha (botón, badge…). */
  action?: ReactNode;
  className?: string;
}

/** Encabezado de sub-bloque: icono + título + descripción (sin contenedor). */
export function SectionHeading({
  icon,
  title,
  description,
  tone = 'brand',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {icon ? <span className={cn('shrink-0', TONE_CLASSES[tone])}>{renderCardIcon(icon)}</span> : null}
          <span className="min-w-0 truncate">{title}</span>
        </p>
        {description ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export interface FormSectionProps extends SectionHeadingProps {
  children: ReactNode;
}

/**
 * Bloque de parametrización: contenedor con borde suave, encabezado con icono y
 * descripción, y los campos debajo. Da estructura visual a los formularios
 * largos (p. ej. Conversacional / Embeddings / Imágenes en el modelo de IA).
 */
export function FormSection({ children, className, ...heading }: FormSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200 bg-gray-50/60 p-4',
        'dark:border-gray-800 dark:bg-gray-900/40',
        className,
      )}
    >
      <SectionHeading {...heading} />
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default FormSection;
