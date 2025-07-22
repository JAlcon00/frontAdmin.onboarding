import React from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  TruckIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import { ESTATUS_SOLICITUD, PRODUCTOS, COLORES_ESTATUS } from '../../constants';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';

interface SolicitudCardProps {
  solicitud: SolicitudCompleta;
  onClick?: (solicitud: SolicitudCompleta) => void;
  onView?: (solicitud: SolicitudCompleta) => void;
  onEdit?: (solicitud: SolicitudCompleta) => void;
  onDelete?: (solicitudId: number) => void;
  showActions?: boolean;
  compact?: boolean;
}

const SolicitudCard: React.FC<SolicitudCardProps> = ({
  solicitud,
  onClick,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  compact = false
}) => {
  const getEstatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'aprobada':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rechazada':
        return <XCircleIcon className="w-4 h-4" />;
      case 'iniciada':
        return <ClockIcon className="w-4 h-4" />;
      case 'en_revision':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'cancelada':
        return <MinusCircleIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getProductoIcon = (producto: string) => {
    switch (producto) {
      case 'CS':
        return <CreditCardIcon className="w-4 h-4" />;
      case 'CC':
        return <BanknotesIcon className="w-4 h-4" />;
      case 'FA':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'AR':
        return <TruckIcon className="w-4 h-4" />;
      default:
        return <CurrencyDollarIcon className="w-4 h-4" />;
    }
  };

  const getEstatusColor = (estatus: string) => {
    return COLORES_ESTATUS.solicitud[estatus as keyof typeof COLORES_ESTATUS.solicitud] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const calcularMontoTotal = () => {
    return solicitud.productos?.reduce((total, producto) => total + (producto.monto || 0), 0) || 0;
  };

  const obtenerProductosTexto = () => {
    if (!solicitud.productos || solicitud.productos.length === 0) return 'Sin productos';
    
    const productosUnicos = [...new Set(solicitud.productos.map(p => p.producto))];
    return productosUnicos.map(p => PRODUCTOS[p] || p).join(', ');
  };

  const obtenerNombreCliente = () => {
    if (!solicitud.cliente) return 'Cliente no especificado';
    
    if (solicitud.cliente.tipo_persona === 'PM') {
      return solicitud.cliente.razon_social || 'Sin razón social';
    }
    
    const nombre = solicitud.cliente.nombre || '';
    const apellidoPaterno = solicitud.cliente.apellido_paterno || '';
    const apellidoMaterno = solicitud.cliente.apellido_materno || '';
    
    return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Sin nombre';
  };

  const isUrgente = () => {
    const diasEnProceso = Math.floor((new Date().getTime() - new Date(solicitud.fecha_creacion).getTime()) / (1000 * 60 * 60 * 24));
    return diasEnProceso > 7 && solicitud.estatus === 'en_revision';
  };

  const completitudBaja = () => {
    return (solicitud.completitud_documentos || 0) < 70;
  };

  if (compact) {
    return (
      <div 
        className={`
          p-3 border rounded-lg cursor-pointer transition-all duration-200
          ${onClick ? 'hover:shadow-md hover:border-blue-300' : ''}
          ${isUrgente() ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white hover:bg-gray-50'}
        `}
        onClick={() => onClick?.(solicitud)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {obtenerNombreCliente()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {obtenerProductosTexto()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstatusColor(solicitud.estatus)}`}>
              {getEstatusIcon(solicitud.estatus)}
              {ESTATUS_SOLICITUD[solicitud.estatus as keyof typeof ESTATUS_SOLICITUD]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        p-6 border rounded-lg transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300' : ''}
        ${isUrgente() ? 'border-orange-200 bg-orange-50' : 
          completitudBaja() ? 'border-yellow-200 bg-yellow-50' : 
          'border-gray-200 bg-white hover:bg-gray-50'}
      `}
      onClick={() => onClick?.(solicitud)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Solicitud #{solicitud.solicitud_id}
            </h3>
            <p className="text-sm text-gray-600">
              {obtenerNombreCliente()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getEstatusColor(solicitud.estatus)}`}>
            {getEstatusIcon(solicitud.estatus)}
            {ESTATUS_SOLICITUD[solicitud.estatus as keyof typeof ESTATUS_SOLICITUD]}
          </span>
          {isUrgente() && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <ExclamationTriangleIcon className="w-3 h-3" />
              Urgente
            </span>
          )}
        </div>
      </div>

      {/* Información del cliente */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="w-4 h-4" />
          <span>Cliente ID: {solicitud.cliente_id}</span>
          {solicitud.cliente?.tipo_persona && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {solicitud.cliente.tipo_persona}
            </span>
          )}
        </div>
      </div>

      {/* Productos y monto */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Productos solicitados</h4>
          <span className="text-lg font-semibold text-green-600">
            {formatearMoneda(calcularMontoTotal())}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {solicitud.productos?.map((producto, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {getProductoIcon(producto.producto)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {PRODUCTOS[producto.producto] || producto.producto}
                </p>
                <p className="text-xs text-gray-500">
                  {formatearMoneda(producto.monto || 0)} - {producto.plazo_meses} meses
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Creada: {formatearFecha(solicitud.fecha_creacion)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Actualizada: {formatearFecha(solicitud.fecha_actualizacion)}</span>
        </div>
      </div>

      {/* Información de completitud */}
      {solicitud.completitud_documentos !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completitud de documentos</span>
            <span className="text-sm font-medium text-gray-900">
              {solicitud.completitud_documentos}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                solicitud.completitud_documentos >= 90 ? 'bg-green-500' :
                solicitud.completitud_documentos >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${solicitud.completitud_documentos}%` }}
            />
          </div>
        </div>
      )}

      {/* Alertas */}
      {completitudBaja() && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Completitud de documentos baja</span>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {solicitud.documentos_pendientes !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DocumentTextIcon className="w-4 h-4" />
            <span>Documentos pendientes: {solicitud.documentos_pendientes}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CurrencyDollarIcon className="w-4 h-4" />
          <span>Productos: {solicitud.productos?.length || 0}</span>
        </div>
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(solicitud);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            Ver detalles
          </button>
          {solicitud.estatus === 'iniciada' && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(solicitud);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Editar
            </button>
          )}
          {['iniciada', 'en_revision'].includes(solicitud.estatus) && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(solicitud.solicitud_id);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SolicitudCard;
