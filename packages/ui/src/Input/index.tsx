import clsx from 'clsx';
import React from 'react';

/**
 * Input component
 *
 * Styled text input with optional label and error helper text.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-slate-200"
          >
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            'block w-full rounded-md border bg-slate-900/70 text-slate-100 placeholder-slate-500',
            'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 focus:outline-none',
            'px-3 py-2 shadow-inner shadow-black/20',
            error && 'border-rose-500 focus:ring-rose-400',
            className
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
