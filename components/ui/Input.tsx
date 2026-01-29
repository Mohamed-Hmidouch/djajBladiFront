'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full
            px-4 py-3
            text-base
            text-[var(--color-text-body)]
            bg-[var(--color-surface-1)]
            border
            ${error 
              ? 'border-[var(--color-brand)] focus:ring-[var(--color-brand)]' 
              : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]'
            }
            rounded-[var(--radius-md)]
            outline-none
            transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
            focus:ring-2 focus:ring-opacity-20
            placeholder:text-[var(--color-text-muted)]
            disabled:bg-[var(--color-surface-2)] disabled:cursor-not-allowed
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--color-brand)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
