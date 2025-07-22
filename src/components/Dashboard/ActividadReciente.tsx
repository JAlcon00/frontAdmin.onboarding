import React from 'react';
import { 
  UserIcon, 
  DocumentIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatearFechaRelativa } from '../../utils/formatters';

interface ActividadItem {
  id: string;
  tipo: 'cliente' | 'documento' | 'solicitud';
  accion: string;
  descripcion: string;
  fecha: Date;
  usuario?: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

interface ActividadRecienteProps {
  actividades?: ActividadItem[];
  loading?: boolean;
  maxItems?: number;
  onVerTodas?: () => void;
}

export const ActividadReciente: React.FC<ActividadRecienteProps> = ({
  actividades = [],
  loading = false,
  maxItems = 8,
  onVerTodas
}) => {
  const getIcon = (tipo: ActividadItem['tipo']) => {
    switch (tipo) {
      case 'cliente':
        return UserIcon;
      case 'documento':
        return DocumentIcon;
      case 'solicitud':
        return ClipboardDocumentListIcon;
      default:
        return ClockIcon;
    }
  };

  const getIconColor = (tipo: ActividadItem['tipo'], prioridad?: string) => {
    if (prioridad === 'alta') return 'text-red-600 bg-red-100';
    
    switch (tipo) {
      case 'cliente':
        return 'text-blue-600 bg-blue-100';
      case 'documento':
        return 'text-green-600 bg-green-100';
      case 'solicitud':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionIcon = (accion: string) => {
    if (accion.includes('aprobad') || accion.includes('complet')) {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }
    if (accion.includes('rechaz') || accion.includes('error')) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    }
    return <ClockIcon className="w-4 h-4 text-yellow-500" />;
  };

  const actividadesLimitadas = actividades.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        {onVerTodas && (
          <button
            onClick={onVerTodas}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Ver todas
          </button>
        )}
      </div>

      {actividadesLimitadas.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hay actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actividadesLimitadas.map((actividad) => {
            const Icon = getIcon(actividad.tipo);
            const iconColors = getIconColor(actividad.tipo, actividad.prioridad);
            
            return (
              <div key={actividad.id} className="flex items-start space-x-3 group">
                <div className={`p-2 rounded-full ${iconColors} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {actividad.accion}
                    </p>
                    {getActionIcon(actividad.accion)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {actividad.descripcion}
                  </p>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span>{formatearFechaRelativa(actividad.fecha)}</span>
                    {actividad.usuario && (
                      <>
                        <span>•</span>
                        <span>{actividad.usuario}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActividadReciente;
