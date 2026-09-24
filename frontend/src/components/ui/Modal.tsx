import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalVariant = 'drawer' | 'center';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Texto secundario bajo el título. */
  subtitle?: string;
  size?: ModalSize;
  /** 'drawer' (panel lateral, por defecto) o 'center' (diálogo centrado). */
  variant?: ModalVariant;
  children: ReactNode;
  footer?: ReactNode;
}

const WIDTH: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
};

/**
 * Contenedor de diálogos sobre Radix Dialog (accesible: foco atrapado, Escape,
 * bloqueo de scroll, aria). Por defecto se presenta como un DRAWER lateral que
 * entra desde la derecha (ideal para formularios de crear/editar); usa
 * `variant="center"` para confirmaciones y asistentes que van centrados.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  variant = 'drawer',
  children,
  footer,
}: ModalProps) {
  const isDrawer = variant === 'drawer';

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl focus:outline-none dark:bg-gray-900',
            isDrawer
              ? cn(
                  'inset-y-0 right-0 h-full w-full border-l border-gray-200 dark:border-gray-800',
                  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right data-[state=open]:duration-300 data-[state=closed]:duration-200',
                  WIDTH[size],
                )
              : cn(
                  'left-1/2 top-1/2 max-h-[92vh] w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 dark:border-gray-800',
                  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                  WIDTH[size],
                ),
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div className="min-w-0">
              <Dialog.Title className={cn('truncate text-base font-semibold text-gray-900 dark:text-gray-100', !title && 'sr-only')}>
                {title || 'Diálogo'}
              </Dialog.Title>
              {subtitle && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>

          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
