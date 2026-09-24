import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  /** Progress percentage 0-100. */
  value: number;
  size?: 'sm' | 'md';
  className?: string;
  barClassName?: string;
}

/** Horizontal progress bar (0-100) with brand color by default. */
export function ProgressBar({ value, size = 'md', className, barClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-all dark:bg-brand-500', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
