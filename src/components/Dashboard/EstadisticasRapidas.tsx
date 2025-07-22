import React from 'react';
import { 
  PlusIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface AccionRapida {
  id: string;
  titulo: string;
  descripcion: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
}

interface EstadisticasRapidasProps {
  onNuevoCliente?: () => void;
  onNuevoDocumento?: () => void;
  onNuevaSolicitud?: () => void;
  onVerClientes?: () => void;
  onVerReportes?: () => void;
  onConfiguracion?: () => void;
  badges?: {
    clientesPendientes?: number;
    documentosPendientes?: number;
    solicitudesPendientes?: number;
  };
  permisos?: {
    crearCliente?: boolean;
    subirDocumento?: boolean;
    crearSolicitud?: boolean;
    verReportes?: boolean;
    configuracion?: boolean;
  };
}

export const EstadisticasRapidas: React.FC<EstadisticasRapidasProps> = ({
  onNuevoCliente,
  onNuevoDocumento,
  onNuevaSolicitud,
  onVerClientes,
  onVerReportes,
  onConfiguracion,
  badges = {},
  permisos = {}
}) => {
  const {
    crearCliente = true,
    subirDocumento = true,
    crearSolicitud = true,
    verReportes = true,
    configuracion = false
  } = permisos;

  const acciones: AccionRapida[] = [
    {
      id: 'nuevo-cliente',
      titulo: 'Nuevo Cliente',
      descripcion: 'Registrar cliente PF/PM',
      icon: PlusIcon,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      onClick: () => onNuevoCliente?.(),
      disabled: !crearCliente
    },
    {
      id: 'subir-documento',
      titulo: 'Subir Documento',
      descripcion: 'Cargar documentación',
      icon: DocumentPlusIcon,
      color: 'text-green-700',
      bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
      onClick: () => onNuevoDocumento?.(),
      badge: badges.documentosPendientes,
      disabled: !subirDocumento
    },
    {
      id: 'nueva-solicitud',
      titulo: 'Nueva Solicitud',
      descripcion: 'Crear solicitud de producto',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      onClick: () => onNuevaSolicitud?.(),
      badge: badges.solicitudesPendientes,
      disabled: !crearSolicitud
    },
    {
      id: 'ver-clientes',
      titulo: 'Ver Clientes',
      descripcion: 'Gestionar clientes',
      icon: UserGroupIcon,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      onClick: () => onVerClientes?.(),
      badge: badges.clientesPendientes
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      descripcion: 'Análisis y métricas',
      icon: ChartBarIcon,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      onClick: () => onVerReportes?.(),
      disabled: !verReportes
    },
    {
      id: 'configuracion',
      titulo: 'Configuración',
      descripcion: 'Ajustes del sistema',
      icon: Cog6ToothIcon,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
      onClick: () => onConfiguracion?.(),
      disabled: !configuracion
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        <p className="text-sm text-gray-600 mt-1">
          Herramientas más utilizadas del sistema
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {acciones.map((accion) => (
          <AccionCard key={accion.id} {...accion} />
        ))}
      </div>
    </div>
  );
};

interface AccionCardProps extends AccionRapida {}

const AccionCard: React.FC<AccionCardProps> = ({
  titulo,
  descripcion,
  icon: Icon,
  color,
  bgColor,
  onClick,
  badge,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${disabled 
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50' 
          : `${bgColor} cursor-pointer transform hover:scale-105 hover:shadow-md`
        }
      `}
    >
      {badge && badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
      
      <div className="flex flex-col items-center text-center space-y-2">
        <div className={`p-2 rounded-full ${disabled ? 'bg-gray-200' : 'bg-white/50'}`}>
          <Icon className={`w-6 h-6 ${disabled ? 'text-gray-400' : color}`} />
        </div>
        
        <div>
          <h4 className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {titulo}
          </h4>
          <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            {descripcion}
          </p>
        </div>
      </div>
    </button>
  );
};

export default EstadisticasRapidas;
