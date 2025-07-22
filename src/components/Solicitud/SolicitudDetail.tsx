import React, { useState } from 'react';
import {
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import type { 
  EstatusSolicitud, 
  ProductoCodigo,
  Moneda
} from '../../types/solicitud.types';

// Usar el tipo definido en el formulario
interface SolicitudFormData {
  cliente_id: number;
  producto_codigo: ProductoCodigo;
  monto_solicitado: number;
  moneda: Moneda;
  plazo_meses: number;
  tasa_interes: number;
  finalidad: string;
  observaciones: string;
  estatus: EstatusSolicitud;
  prioridad: 'alta' | 'media' | 'baja';
  fecha_vencimiento: Date;
  asignado_a?: number;
  requiere_garantia: boolean;
  tipo_garantia?: string;
  valor_garantia?: number;
  documentos_requeridos: string[];
  documentos_recibidos: string[];
  comentarios_internos: string;
  historial_estatus: Array<{
    estatus: EstatusSolicitud;
    fecha: Date;
    comentario?: string;
  }>;
}

interface SolicitudDetailProps {
  solicitud: SolicitudFormData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (newStatus: EstatusSolicitud) => void;
  onClose?: () => void;
  showActions?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const SolicitudDetail: React.FC<SolicitudDetailProps> = ({
  solicitud,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onClose,
  showActions = true,
  isLoading = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basica: true,
    financiera: false,
    garantia: false,
    documentos: false,
    historial: false,
    comentarios: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount: number, currency: Moneda) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'MXN' ? 'MXN' : 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: EstatusSolicitud) => {
    switch (status) {
      case 'iniciada':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'en_revision':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'aprobada':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rechazada':
        return <XMarkIcon className="w-5 h-5 text-red-500" />;
      case 'cancelada':
        return <MinusCircleIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: EstatusSolicitud) => {
    switch (status) {
      case 'iniciada':
        return 'bg-blue-100 text-blue-800';
      case 'en_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: 'alta' | 'media' | 'baja') => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductName = (codigo: ProductoCodigo) => {
    switch (codigo) {
      case 'CS':
        return 'Línea de Crédito';
      case 'CC':
        return 'Cuenta Corriente';
      case 'FA':
        return 'Factoraje';
      case 'AR':
        return 'Arrendamiento';
      default:
        return codigo;
    }
  };

  const completitudDocumentos = solicitud.documentos_requeridos.length > 0 
    ? (solicitud.documentos_recibidos.length / solicitud.documentos_requeridos.length) * 100 
    : 0;

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    sectionKey: string
  ) => (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 py-3 border-t border-gray-200">
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Solicitud #{solicitud.cliente_id.toString().padStart(6, '0')}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(solicitud.estatus)}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(solicitud.estatus)}`}>
                  {solicitud.estatus.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(solicitud.prioridad)}`}>
                  {solicitud.prioridad.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showActions && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    disabled={isLoading}
                    title="Editar"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={onDuplicate}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    disabled={isLoading}
                    title="Duplicar"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={isLoading}
                    title="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                title="Cerrar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Información básica */}
        {renderSection(
          'Información Básica',
          <UserIcon className="w-5 h-5 text-gray-600" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente ID
              </label>
              <p className="text-sm text-gray-900">{solicitud.cliente_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <p className="text-sm text-gray-900">{getProductName(solicitud.producto_codigo)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <p className="text-sm text-gray-900">{formatDate(solicitud.fecha_vencimiento)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignado a
              </label>
              <p className="text-sm text-gray-900">
                {solicitud.asignado_a ? `Usuario #${solicitud.asignado_a}` : 'Sin asignar'}
              </p>
            </div>
          </div>,
          'basica'
        )}

        {/* Información financiera */}
        {renderSection(
          'Información Financiera',
          <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Solicitado
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(solicitud.monto_solicitado, solicitud.moneda)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plazo
              </label>
              <p className="text-sm text-gray-900">{solicitud.plazo_meses} meses</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Interés
              </label>
              <p className="text-sm text-gray-900">{solicitud.tasa_interes}%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <p className="text-sm text-gray-900">{solicitud.moneda}</p>
            </div>
          </div>,
          'financiera'
        )}

        {/* Garantía */}
        {renderSection(
          'Garantía',
          <BanknotesIcon className="w-5 h-5 text-gray-600" />,
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Requiere Garantía:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                solicitud.requiere_garantia ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {solicitud.requiere_garantia ? 'Sí' : 'No'}
              </span>
            </div>
            {solicitud.requiere_garantia && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Garantía
                  </label>
                  <p className="text-sm text-gray-900 capitalize">
                    {solicitud.tipo_garantia || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de la Garantía
                  </label>
                  <p className="text-sm text-gray-900">
                    {solicitud.valor_garantia 
                      ? formatCurrency(solicitud.valor_garantia, solicitud.moneda)
                      : 'No especificado'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>,
          'garantia'
        )}

        {/* Documentos */}
        {renderSection(
          'Documentos',
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-600" />,
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Completitud de Documentos
              </span>
              <span className="text-sm font-medium text-gray-900">
                {completitudDocumentos.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completitudDocumentos}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos Requeridos ({solicitud.documentos_requeridos.length})
                </label>
                <div className="space-y-1">
                  {solicitud.documentos_requeridos.length > 0 ? (
                    solicitud.documentos_requeridos.map((doc: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <ExclamationCircleIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-900">{doc}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sin documentos requeridos</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos Recibidos ({solicitud.documentos_recibidos.length})
                </label>
                <div className="space-y-1">
                  {solicitud.documentos_recibidos.length > 0 ? (
                    solicitud.documentos_recibidos.map((doc: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">{doc}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sin documentos recibidos</p>
                  )}
                </div>
              </div>
            </div>
          </div>,
          'documentos'
        )}

        {/* Historial */}
        {renderSection(
          'Historial de Estatus',
          <ChartBarIcon className="w-5 h-5 text-gray-600" />,
          <div className="space-y-3">
            {solicitud.historial_estatus.length > 0 ? (
              solicitud.historial_estatus.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(item.estatus)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.estatus.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.fecha)}
                      </span>
                    </div>
                    {item.comentario && (
                      <p className="text-sm text-gray-600 mt-1">{item.comentario}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Sin historial de cambios</p>
            )}
          </div>,
          'historial'
        )}

        {/* Comentarios */}
        {renderSection(
          'Comentarios y Observaciones',
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />,
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finalidad
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {solicitud.finalidad || 'Sin especificar'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {solicitud.observaciones || 'Sin observaciones'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios Internos
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {solicitud.comentarios_internos || 'Sin comentarios internos'}
              </p>
            </div>
          </div>,
          'comentarios'
        )}
      </div>

      {/* Footer con cambio de estatus */}
      {showActions && onStatusChange && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Cambiar estatus:
            </span>
            <div className="flex items-center gap-2">
              <select
                value={solicitud.estatus}
                onChange={(e) => onStatusChange(e.target.value as EstatusSolicitud)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="iniciada">Iniciada</option>
                <option value="en_revision">En Revisión</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
                <option value="cancelada">Cancelada</option>
              </select>
              {isLoading && <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudDetail;
