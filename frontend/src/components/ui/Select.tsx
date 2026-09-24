import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-9 text-sm text-gray-900 shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
            'dark:bg-gray-900 dark:text-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-400',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-700',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
