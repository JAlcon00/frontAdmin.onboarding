import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface ValidationAlertProps {
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  details?: string[];
  onClose?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({ 
  type, 
  message, 
  details, 
  onClose,
  className = '',
  size = 'md',
  dismissible = true
}) => {
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const typeStyles = {
    error: {
      container: 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-400 dark:text-red-300',
      title: 'text-red-800 dark:text-red-200',
      text: 'text-red-700 dark:text-red-300',
      button: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
    },
    warning: {
      container: 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-400 dark:text-yellow-300',
      title: 'text-yellow-800 dark:text-yellow-200',
      text: 'text-yellow-700 dark:text-yellow-300',
      button: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
    },
    success: {
      container: 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800',
      icon: 'text-green-400 dark:text-green-300',
      title: 'text-green-800 dark:text-green-200',
      text: 'text-green-700 dark:text-green-300',
      button: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
    },
    info: {
      container: 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-400 dark:text-blue-300',
      title: 'text-blue-800 dark:text-blue-200',
      text: 'text-blue-700 dark:text-blue-300',
      button: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircleIcon className={`${iconSizes[size]} ${typeStyles[type].icon}`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconSizes[size]} ${typeStyles[type].icon}`} />;
      case 'success':
        return <CheckCircleIcon className={`${iconSizes[size]} ${typeStyles[type].icon}`} />;
      case 'info':
        return <InformationCircleIcon className={`${iconSizes[size]} ${typeStyles[type].icon}`} />;
      default:
        return <InformationCircleIcon className={`${iconSizes[size]} ${typeStyles.info.icon}`} />;
    }
  };

  const styles = typeStyles[type];
  
  return (
    <div className={`rounded-lg shadow-sm ${sizeClasses[size]} ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {message}
          </h3>
          {details && details.length > 0 && (
            <div className="mt-2">
              <ul className={`text-xs space-y-1 ${styles.text}`}>
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {dismissible && onClose && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.button}`}
              aria-label="Cerrar alerta"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationAlert;
