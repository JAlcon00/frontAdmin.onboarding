import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'discord';
}

export function ThemeToggle({ 
  className = '', 
  size = 'md', 
  variant = 'discord' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    default: `
      rounded-lg border border-gray-300 dark:border-gray-600
      bg-white dark:bg-gray-800
      hover:bg-gray-50 dark:hover:bg-gray-700
    `,
    minimal: `
      rounded-lg
      bg-transparent
      hover:bg-gray-100 dark:hover:bg-gray-800
    `,
    discord: `
      rounded-lg
      bg-gray-100 dark:bg-gray-800
      hover:bg-gray-200 dark:hover:bg-gray-700
      border border-gray-200 dark:border-gray-700
      shadow-sm
    `
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        flex items-center justify-center
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        transform hover:scale-105 active:scale-95
        ${className}
      `}
      title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
      aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <MoonIcon className={`${iconSizes[size]} text-gray-600 dark:text-gray-300`} />
      ) : (
        <SunIcon className={`${iconSizes[size]} text-yellow-500 dark:text-yellow-400`} />
      )}
    </button>
  );
}

export default ThemeToggle;
