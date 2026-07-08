import React, { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-2xl';
  const variants = {
    primary: 'bg-forest text-white hover:bg-green-800 shadow-sm',
    secondary: 'bg-orange text-white hover:bg-orange-600 shadow-sm',
    outline: 'border-2 border-forest text-forest hover:bg-green-50',
    ghost: 'text-forest hover:bg-green-50'
  };
  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg font-semibold rounded-3xl',
    icon: 'h-10 w-10 rounded-full'
  };
  return (
    <button
      className={twMerge(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}>
      
      {children}
    </button>);

}