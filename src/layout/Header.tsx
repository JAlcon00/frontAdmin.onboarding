import { useState } from 'react';
import { 
  BellIcon, 
  ChevronDownIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '../components/shared/ThemeToggle';

interface HeaderProps {
  onToggleSidebar?: () => void;
  user?: {
    nombre: string;
    rol: string;
    avatar?: string;
  };
}

export function Header({ onToggleSidebar, user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Datos de ejemplo del usuario
  const userData = user || {
    nombre: 'Administrador',
    rol: 'Super Usuario',
    avatar: undefined
  };

  const notifications = [
    { id: 1, message: 'Nueva solicitud de crédito pendiente', time: '5 min' },
    { id: 2, message: 'Documento vencido para cliente ABC123', time: '1 hr' },
    { id: 3, message: 'Aprobación requerida para solicitud #456', time: '2 hrs' },
  ];

  return (
    <header className="bg-header-bg border-b border-header-border px-4 sm:px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        
        {/* Logo y título */}
        <div className="flex items-center space-x-4">
          {/* Botón hamburger para móvil */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-surface-hover text-header-text"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-header-text">
                Olson Capital
              </h1>
              <p className="text-xs text-secondary">
                Panel de Administración del onboarding digital
              </p>
            </div>
          </div>
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center space-x-4">
          
          {/* Toggle de tema */}
          <ThemeToggle size="sm" />

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-surface-hover text-header-text transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {/* Badge de notificaciones */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </button>

            {/* Dropdown de notificaciones */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-card rounded-lg shadow-card py-2 z-50">
                <div className="px-4 py-2 border-b border-card">
                  <h3 className="text-sm font-medium text-primary">Notificaciones</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-surface-hover cursor-pointer">
                      <p className="text-sm text-primary">{notification.message}</p>
                      <p className="text-xs text-muted mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-card">
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-surface-hover text-header-text transition-colors"
            >
              {userData.avatar ? (
                <img 
                  src={userData.avatar} 
                  alt={userData.nombre}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8" />
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{userData.nombre}</p>
                <p className="text-xs text-secondary">{userData.rol}</p>
              </div>
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {/* Dropdown de usuario */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-card rounded-lg shadow-card py-2 z-50">
                <div className="px-4 py-2 border-b border-card">
                  <p className="text-sm font-medium text-primary">{userData.nombre}</p>
                  <p className="text-xs text-secondary">{userData.rol}</p>
                </div>
                
                <a
                  href="#profile"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-primary hover:bg-surface-hover"
                >
                  <UserCircleIcon className="w-4 h-4" />
                  <span>Mi Perfil</span>
                </a>
                
                <a
                  href="#settings"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-primary hover:bg-surface-hover"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>Configuración</span>
                </a>
                
                <div className="border-t border-card my-2"></div>
                
                <button
                  onClick={() => {
                    // Aquí iría la lógica de logout
                    console.log('Cerrando sesión...');
                  }}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
