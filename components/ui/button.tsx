import React from 'react';

type ButtonVariant = 'default' | 'salon' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'touch-lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const baseStyles =
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  salon:   'bg-rose-600 hover:bg-rose-700 text-white shadow-md',
  outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost:   'hover:bg-accent hover:text-accent-foreground',
};

const sizes: Record<ButtonSize, string> = {
  'default':  'h-10 py-2 px-4',
  'sm':       'h-9 px-3 rounded-md',
  'lg':       'h-11 px-8 rounded-md',
  'touch-lg': 'h-12 px-8 text-lg rounded-xl',
};

const Button = ({
  children,
  type = 'button',
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };