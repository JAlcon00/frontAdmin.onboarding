import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  outline?: boolean;
  rounded?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  outline = false,
  rounded = false,
  className = ''
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium text-center',
    'transition-all duration-200'
  ];

  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    md: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-1 text-xs',
    lg: dot ? 'w-3 h-3' : 'px-3 py-1.5 text-sm'
  };

  const shapeClasses = rounded || dot ? 'rounded-full' : 'rounded-md';

  const getVariantClasses = (variant: string, outline: boolean) => {
    const variants = {
      default: outline
        ? 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      primary: outline
        ? 'bg-transparent border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300'
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      secondary: outline
        ? 'bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      success: outline
        ? 'bg-transparent border border-green-300 text-green-700 dark:border-green-600 dark:text-green-300'
        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: outline
        ? 'bg-transparent border border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      danger: outline
        ? 'bg-transparent border border-red-300 text-red-700 dark:border-red-600 dark:text-red-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      info: outline
        ? 'bg-transparent border border-cyan-300 text-cyan-700 dark:border-cyan-600 dark:text-cyan-300'
        : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
    };

    return variants[variant as keyof typeof variants] || variants.default;
  };

  const combinedClasses = [
    ...baseClasses,
    sizeClasses[size],
    shapeClasses,
    getVariantClasses(variant, outline),
    className
  ].filter(Boolean).join(' ');

  if (dot) {
    return <span className={combinedClasses} aria-label="Badge indicator" />;
  }

  return (
    <span className={combinedClasses}>
      {children}
    </span>
  );
};

// Badge con contador numérico
export const CountBadge: React.FC<{
  count: number;
  max?: number;
  showZero?: boolean;
  variant?: BadgeProps['variant'];
  size?: BadgeProps['size'];
  className?: string;
}> = ({
  count,
  max = 99,
  showZero = false,
  variant = 'primary',
  size = 'sm',
  className = ''
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant={variant}
      size={size}
      rounded={true}
      className={`min-w-5 ${className}`}
    >
      {displayCount}
    </Badge>
  );
};

// Badge con icono
export const IconBadge: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  variant?: BadgeProps['variant'];
  size?: BadgeProps['size'];
  label?: string;
  className?: string;
}> = ({
  icon: Icon,
  variant = 'default',
  size = 'md',
  label,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Badge
      variant={variant}
      size={size}
      rounded={true}
      className={`p-1 ${className}`}
      aria-label={label}
    >
      <Icon className={iconSizes[size]} />
    </Badge>
  );
};

// Badge de estatus con colores predefinidos
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  size?: BadgeProps['size'];
  outline?: boolean;
  className?: string;
}> = ({ status, size = 'md', outline = false, className = '' }) => {
  const statusConfig = {
    active: { variant: 'success' as const, text: 'Activo' },
    inactive: { variant: 'secondary' as const, text: 'Inactivo' },
    pending: { variant: 'warning' as const, text: 'Pendiente' },
    approved: { variant: 'success' as const, text: 'Aprobado' },
    rejected: { variant: 'danger' as const, text: 'Rechazado' },
    completed: { variant: 'success' as const, text: 'Completado' },
    cancelled: { variant: 'secondary' as const, text: 'Cancelado' }
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      outline={outline}
      className={className}
    >
      {config.text}
    </Badge>
  );
};

export default Badge;
