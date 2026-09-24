import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, rightElement, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
            'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
            'dark:disabled:bg-gray-800 dark:disabled:text-gray-400',
            icon ? 'pl-10' : undefined,
            rightElement ? 'pr-10' : undefined,
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-700',
            className,
          )}
          {...rest}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-2 flex items-center">{rightElement}</span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
