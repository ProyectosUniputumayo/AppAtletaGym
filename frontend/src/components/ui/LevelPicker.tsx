import { cn } from '../../lib/utils';

export interface LevelPickerProps {
  /** Selected level (1-5) or null/0 when unset. */
  value: number | null;
  onChange?: (level: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const LEVELS = [1, 2, 3, 4, 5];

/**
 * 1-5 level selector rendered as numbered buttons. Levels up to the selected
 * one are highlighted so it reads as a scale.
 */
export function LevelPicker({
  value,
  onChange,
  disabled = false,
  size = 'md',
  className,
}: LevelPickerProps) {
  const current = value ?? 0;
  const boxSize = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';

  return (
    <div className={cn('inline-flex items-center gap-1', className)} role="group" aria-label="Nivel">
      {LEVELS.map((level) => {
        const active = level <= current;
        const isExact = level === current;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled || !onChange}
            onClick={() => onChange?.(level)}
            aria-label={`Nivel ${level}`}
            aria-pressed={isExact}
            className={cn(
              'flex items-center justify-center rounded-lg border font-semibold transition-colors',
              boxSize,
              active
                ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                : 'border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
              isExact && 'ring-2 ring-brand-300 dark:ring-brand-700',
              !disabled && onChange && !active && 'hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300',
              (disabled || !onChange) && 'cursor-default opacity-70',
            )}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

export default LevelPicker;
