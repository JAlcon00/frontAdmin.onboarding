interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loader({ 
  size = 'md', 
  variant = 'spinner', 
  text, 
  fullScreen = false,
  className = '' 
}: LoaderProps) {
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const SpinnerLoader = () => (
    <div className={`animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClasses[size]}`} />
  );

  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-blue-600 rounded-full animate-pulse ${
            size === 'sm' ? 'w-1 h-1' :
            size === 'md' ? 'w-2 h-2' :
            size === 'lg' ? 'w-3 h-3' :
            'w-4 h-4'
          }`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const PulseLoader = () => (
    <div className={`bg-blue-600 rounded-full animate-pulse ${sizeClasses[size]}`} />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  const LoaderContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {renderLoader()}
      {text && (
        <p className="text-sm text-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-lg shadow-card p-8 max-w-sm mx-4">
          <LoaderContent />
        </div>
      </div>
    );
  }

  return <LoaderContent />;
}

// Loader específico para páginas completas
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader size="xl" variant="spinner" />
        <h2 className="mt-6 text-lg font-medium text-primary">
          {text}
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Por favor espera un momento
        </p>
      </div>
    </div>
  );
}

// Loader para botones
export function ButtonLoader({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <Loader 
      size={size} 
      variant="spinner" 
      className="inline-flex" 
    />
  );
}

// Loader para contenido de cards
export function CardLoader({ text = 'Cargando contenido...' }: { text?: string }) {
  return (
    <div className="p-8 text-center">
      <Loader size="lg" variant="spinner" />
      <p className="mt-4 text-sm text-secondary">
        {text}
      </p>
    </div>
  );
}

// Loader para tablas
export function TableLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 py-4 border-b border-card last:border-b-0">
          <div className="rounded-full bg-surface w-10 h-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface rounded w-3/4"></div>
            <div className="h-3 bg-surface rounded w-1/2"></div>
          </div>
          <div className="w-20 h-4 bg-surface rounded"></div>
        </div>
      ))}
    </div>
  );
}
