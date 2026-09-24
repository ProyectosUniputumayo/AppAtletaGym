import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
