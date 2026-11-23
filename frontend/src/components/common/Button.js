import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white shadow-sm border border-transparent focus:ring-neighbor-500',
    secondary:
      'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 border border-transparent focus:ring-gray-400',
    outline:
      'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 shadow-sm focus:ring-neighbor-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm border border-transparent focus:ring-rose-500',
    ghost:
      'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-transparent focus:ring-gray-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4.5 py-2.5 text-sm sm:text-base font-semibold rounded-lg gap-2',
    lg: 'px-6 py-3.5 text-base sm:text-lg font-bold rounded-xl gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 select-none ${
        fullWidth ? 'w-full' : ''
      } ${variantStyles[variant] || variantStyles.primary} ${
        sizeStyles[size] || sizeStyles.md
      } ${
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.98]'
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size] || iconSizes.md} animate-spin shrink-0`} />
      ) : Icon ? (
        <Icon className={`${iconSizes[size] || iconSizes.md} shrink-0`} />
      ) : null}

      {children && <span>{children}</span>}

      {!isLoading && RightIcon ? (
        <RightIcon className={`${iconSizes[size] || iconSizes.md} shrink-0`} />
      ) : null}
    </button>
  );
};

export default Button;
