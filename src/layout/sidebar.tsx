import { useState } from 'react';
import { 
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
  children?: MenuItem[];
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['solicitudes']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      href: '/dashboard'
    },
    {
      id: 'solicitudes',
      label: 'Solicitudes',
      icon: DocumentTextIcon,
      href: '/solicitudes',
      badge: 5,
      children: [
        { id: 'solicitudes-nuevas', label: 'Nuevas', icon: null, href: '/solicitudes/nuevas', badge: 3 },
        { id: 'solicitudes-revision', label: 'En Revisión', icon: null, href: '/solicitudes/revision', badge: 2 },
        { id: 'solicitudes-aprobadas', label: 'Aprobadas', icon: null, href: '/solicitudes/aprobadas' },
        { id: 'solicitudes-rechazadas', label: 'Rechazadas', icon: null, href: '/solicitudes/rechazadas' },
      ]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: UserGroupIcon,
      href: '/clientes',
      children: [
        { id: 'clientes-personas-fisicas', label: 'Personas Físicas', icon: null, href: '/clientes/pf' },
        { id: 'clientes-personas-morales', label: 'Personas Morales', icon: null, href: '/clientes/pm' },
        { id: 'clientes-actividad-empresarial', label: 'Act. Empresarial', icon: null, href: '/clientes/pf-ae' },
      ]
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FolderIcon,
      href: '/documentos',
      badge: 12,
      children: [
        { id: 'documentos-pendientes', label: 'Pendientes', icon: null, href: '/documentos/pendientes', badge: 8 },
        { id: 'documentos-revision', label: 'En Revisión', icon: null, href: '/documentos/revision', badge: 4 },
        { id: 'documentos-aprobados', label: 'Aprobados', icon: null, href: '/documentos/aprobados' },
        { id: 'documentos-vencidos', label: 'Vencidos', icon: null, href: '/documentos/vencidos' },
      ]
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: ChartBarIcon,
      href: '/reportes',
      children: [
        { id: 'reportes-solicitudes', label: 'Solicitudes', icon: null, href: '/reportes/solicitudes' },
        { id: 'reportes-clientes', label: 'Clientes', icon: null, href: '/reportes/clientes' },
        { id: 'reportes-documentos', label: 'Documentos', icon: null, href: '/reportes/documentos' },
        { id: 'reportes-performance', label: 'Performance', icon: null, href: '/reportes/performance' },
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Cog6ToothIcon,
      href: '/configuracion',
      children: [
        { id: 'config-usuarios', label: 'Usuarios', icon: null, href: '/configuracion/usuarios' },
        { id: 'config-roles', label: 'Roles', icon: null, href: '/configuracion/roles' },
        { id: 'config-documentos', label: 'Tipos de Documento', icon: null, href: '/configuracion/documentos' },
        { id: 'config-sistema', label: 'Sistema', icon: null, href: '/configuracion/sistema' },
      ]
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = window.location.pathname === item.href; // En producción usarías React Router

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
            transition-colors duration-200 cursor-pointer
            ${level > 0 ? 'ml-6' : ''}
            ${isActive 
              ? 'bg-sidebar-item-active text-sidebar-text-active' 
              : 'text-sidebar-text hover:bg-sidebar-item-hover hover:text-sidebar-text-active'
            }
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              // Navegar a la ruta
              console.log('Navegando a:', item.href);
            }
          }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          
          {hasChildren && (
            <ChevronRightIcon 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </div>

        {/* Submenú */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar-bg border-r border-sidebar-item-hover
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-item-hover lg:hidden">
          <h2 className="text-lg font-semibold text-sidebar-text-active">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-sidebar-item-hover text-sidebar-text"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-sidebar-item-hover">
          <div className="text-xs text-sidebar-text">
            <p>Onboarding Digital v1.0</p>
            <p className="mt-1 text-sidebar-text opacity-75">
              © 2025 Tu Empresa
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
