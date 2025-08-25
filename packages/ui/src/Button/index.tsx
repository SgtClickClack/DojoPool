import clsx from 'clsx';
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component
 *
 * Stateless, accessible button with Tailwind styling, size/variant options,
 * loading state, and optional left/right icons.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseClasses =
  'relative inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-400 ring-offset-slate-900',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 focus:ring-slate-500 ring-offset-slate-900',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-400 ring-offset-slate-900',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-3',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      children,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {leftIcon ? <span className="mr-2 -ml-1">{leftIcon}</span> : null}
        <span className={clsx(isLoading && 'opacity-0')}>{children}</span>
        {rightIcon ? <span className="ml-2 -mr-1">{rightIcon}</span> : null}
        {isLoading ? (
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
