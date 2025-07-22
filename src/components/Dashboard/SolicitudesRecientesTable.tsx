import React from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '../../utils/formatters';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { EstatusSolicitud } from '../../types';

interface SolicitudesRecientesTableProps {
  solicitudes?: SolicitudCompleta[];
  loading?: boolean;
  onVerSolicitud?: (solicitud: SolicitudCompleta) => void;
  onEditarSolicitud?: (solicitud: SolicitudCompleta) => void;
  maxItems?: number;
  showActions?: boolean;
}

export const SolicitudesRecientesTable: React.FC<SolicitudesRecientesTableProps> = ({
  solicitudes = [],
  loading = false,
  onVerSolicitud,
  onEditarSolicitud,
  maxItems = 5,
  showActions = true
}) => {
  const getEstatusIcon = (estatus: EstatusSolicitud) => {
    switch (estatus) {
      case 'aprobada':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'rechazada':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'en_revision':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'cancelada':
        return <XCircleIcon className="w-4 h-4 text-gray-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEstatusColor = (estatus: EstatusSolicitud) => {
    switch (estatus) {
      case 'aprobada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en_revision':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEstatusTexto = (estatus: EstatusSolicitud) => {
    switch (estatus) {
      case 'iniciada':
        return 'Iniciada';
      case 'en_revision':
        return 'En Revisión';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estatus;
    }
  };

  const calcularMontoTotal = (solicitud: SolicitudCompleta): number => {
    return solicitud.productos?.reduce((total, producto) => {
      return total + (producto.monto || 0);
    }, 0) || 0;
  };

  const solicitudesLimitadas = solicitudes.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Solicitudes Recientes</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse flex space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Solicitudes Recientes</h3>
        <span className="text-sm text-gray-500">
          Últimas {solicitudesLimitadas.length} solicitudes
        </span>
      </div>

      {solicitudesLimitadas.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hay solicitudes recientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudesLimitadas.map((solicitud) => {
            const montoTotal = calcularMontoTotal(solicitud);
            const nombreCliente = solicitud.cliente 
              ? `${solicitud.cliente.nombre || ''} ${solicitud.cliente.apellido_paterno || ''}`.trim() || solicitud.cliente.razon_social || 'Cliente sin nombre'
              : 'Cliente no disponible';

            return (
              <div
                key={solicitud.solicitud_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getEstatusIcon(solicitud.estatus)}
                    <span className="text-sm font-medium text-gray-900">
                      #{solicitud.solicitud_id}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nombreCliente}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatearFecha(solicitud.fecha_creacion)}
                      </span>
                      {solicitud.productos && solicitud.productos.length > 0 && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {solicitud.productos.length} producto{solicitud.productos.length !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {montoTotal > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatearMoneda(montoTotal)}
                      </p>
                    </div>
                  )}

                  <div className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                    ${getEstatusColor(solicitud.estatus)}
                  `}>
                    {getEstatusTexto(solicitud.estatus)}
                  </div>

                  {showActions && (
                    <div className="flex items-center space-x-2">
                      {onVerSolicitud && (
                        <button
                          onClick={() => onVerSolicitud(solicitud)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver solicitud"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      {onEditarSolicitud && (solicitud.estatus === 'iniciada' || solicitud.estatus === 'en_revision') && (
                        <button
                          onClick={() => onEditarSolicitud(solicitud)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Editar solicitud"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitudesRecientesTable;
