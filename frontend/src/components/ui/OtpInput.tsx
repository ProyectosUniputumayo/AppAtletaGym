import { cn } from '../../lib/utils';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** Large single input for 6-digit verification codes (numeric keyboard on mobile). */
export function OtpInput({
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Código de verificación',
}: OtpInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-label={ariaLabel}
      placeholder="••••••"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
      className={cn(
        'h-14 w-full rounded-xl border border-gray-300 bg-white text-center font-mono text-2xl font-semibold tracking-[0.5em] text-gray-900 shadow-sm transition-colors',
        'placeholder:tracking-[0.5em] placeholder:text-gray-300',
        'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500',
        'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
        'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600',
        'dark:disabled:bg-gray-800 dark:disabled:text-gray-400',
        className,
      )}
    />
  );
}

export default OtpInput;
