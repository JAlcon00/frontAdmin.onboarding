import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  rounded = 'lg',
  hover = false,
  clickable = false,
  onClick
}) => {
  const baseClasses = [
    'bg-white dark:bg-gray-800',
    'transition-all duration-200'
  ];

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  const borderClasses = border ? 'border border-gray-200 dark:border-gray-700' : '';

  const interactiveClasses = [
    hover && 'hover:shadow-md',
    clickable && 'cursor-pointer hover:shadow-md transform hover:scale-105'
  ].filter(Boolean);

  const combinedClasses = [
    ...baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    borderClasses,
    ...interactiveClasses,
    className
  ].filter(Boolean).join(' ');

  const CardComponent = clickable || onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={combinedClasses}
      onClick={onClick}
      type={clickable ? 'button' : undefined}
    >
      {children}
    </CardComponent>
  );
};

// Card con header y footer
export const CardWithHeader: React.FC<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  contentClassName?: string;
}> = ({
  header,
  footer,
  children,
  className = '',
  headerClassName = '',
  footerClassName = '',
  contentClassName = ''
}) => {
  return (
    <Card className={className} padding="none">
      {header && (
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${headerClassName}`}>
          {header}
        </div>
      )}
      
      <div className={`px-6 py-4 ${contentClassName}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </Card>
  );
};

// Card de estadística
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  return (
    <Card className={`hover:shadow-md ${className}`} hover>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          
          <div className="flex items-center space-x-2">
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            
            {trend && (
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]} flex-shrink-0 ml-4`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

// Card para contenido vacío/placeholder
export const EmptyCard: React.FC<{
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <Card className={`text-center py-8 ${className}`}>
      {Icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          <Icon className="w-full h-full" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-500 mb-4">{description}</p>
      )}
      
      {action && action}
    </Card>
  );
};

export default Card;
