import React from 'react';

// Simple spinner inline para evitar dependencias circulares
const SimpleSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClass}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transform hover:scale-105 active:scale-95',
  ];

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2.5'
  };

  const variantClasses = {
    primary: [
      'bg-blue-600 text-white',
      'hover:bg-blue-700 focus:ring-blue-500',
      'shadow-sm hover:shadow-md'
    ],
    secondary: [
      'bg-gray-100 text-gray-900 border border-gray-300',
      'hover:bg-gray-50 focus:ring-gray-500',
      'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
      'dark:hover:bg-gray-700'
    ],
    danger: [
      'bg-red-600 text-white',
      'hover:bg-red-700 focus:ring-red-500',
      'shadow-sm hover:shadow-md'
    ],
    success: [
      'bg-green-600 text-white',
      'hover:bg-green-700 focus:ring-green-500',
      'shadow-sm hover:shadow-md'
    ],
    warning: [
      'bg-yellow-500 text-white',
      'hover:bg-yellow-600 focus:ring-yellow-500',
      'shadow-sm hover:shadow-md'
    ],
    ghost: [
      'bg-transparent text-gray-700',
      'hover:bg-gray-100 focus:ring-gray-500',
      'dark:text-gray-300 dark:hover:bg-gray-800'
    ],
    outline: [
      'bg-transparent border border-gray-300 text-gray-700',
      'hover:bg-gray-50 focus:ring-gray-500',
      'dark:border-gray-600 dark:text-gray-300',
      'dark:hover:bg-gray-800'
    ]
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const combinedClasses = [
    ...baseClasses,
    sizeClasses[size],
    ...variantClasses[variant],
    widthClasses,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <button
      className={combinedClasses}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <SimpleSpinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="flex-shrink-0" />}
          <span className="flex-1">{children}</span>
          {RightIcon && <RightIcon className="flex-shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
