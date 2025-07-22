interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-card border-t border-card px-6 py-4 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        
        {/* Información de copyright */}
        <div className="text-sm text-secondary">
          <p>
            © {currentYear} Onboarding Digital. Todos los derechos reservados.
          </p>
        </div>

        {/* Links útiles */}
        <div className="flex items-center space-x-6 text-sm">
          <a 
            href="#privacy" 
            className="text-secondary hover:text-primary transition-colors"
          >
            Privacidad
          </a>
          <a 
            href="#terms" 
            className="text-secondary hover:text-primary transition-colors"
          >
            Términos
          </a>
          <a 
            href="#support" 
            className="text-secondary hover:text-primary transition-colors"
          >
            Soporte
          </a>
          <a 
            href="#docs" 
            className="text-secondary hover:text-primary transition-colors"
          >
            Documentación
          </a>
        </div>

        {/* Información del sistema */}
        <div className="text-xs text-muted">
          v1.0.0 | Build #2025.01.15
        </div>
      </div>
    </footer>
  );
}
