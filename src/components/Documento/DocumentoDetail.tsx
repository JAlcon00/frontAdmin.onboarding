import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon,
  ChevronLeftIcon,
  CloudArrowDownIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import type { Documento } from '../../types/documento.types';

interface DocumentoDetailProps {
  documento: Documento;
  onClose?: () => void;
  onEdit?: (documento: Documento) => void;
  onDelete?: (documentoId: number) => void;
  onDownload?: (documento: Documento) => void;
  onStatusChange?: (documentoId: number, newStatus: string, comentario?: string) => void;
  showActions?: boolean;
  className?: string;
}

export const DocumentoDetail: React.FC<DocumentoDetailProps> = ({
  documento,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  onStatusChange,
  showActions = true,
  className = ''
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(documento.estatus);
  const [comentario, setComentario] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aceptado':
        return CheckCircleIcon;
      case 'rechazado':
        return XCircleIcon;
      case 'pendiente':
        return ClockIcon;
      case 'vencido':
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptado':
        return 'text-green-600 bg-green-100';
      case 'rechazado':
        return 'text-red-600 bg-red-100';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100';
      case 'vencido':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aceptado':
        return 'Aceptado';
      case 'rechazado':
        return 'Rechazado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return 'Desconocido';
    }
  };

  const handleStatusChange = () => {
    if (onStatusChange) {
      onStatusChange(documento.documento_id, selectedStatus, comentario);
    }
    setShowStatusModal(false);
    setComentario('');
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      onDelete?.(documento.documento_id);
    }
  };

  const getFileSize = () => {
    // Esto es una estimación, idealmente deberías obtener el tamaño real del archivo
    return 'Tamaño desconocido';
  };

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'jpg':
      case 'jpeg':
        return 'JPEG';
      case 'png':
        return 'PNG';
      case 'gif':
        return 'GIF';
      case 'doc':
      case 'docx':
        return 'Word';
      default:
        return 'Archivo';
    }
  };

  const isExpired = documento.fecha_expiracion && new Date(documento.fecha_expiracion) < new Date();
  const isExpiringSoon = documento.fecha_expiracion && 
    new Date(documento.fecha_expiracion) > new Date() && 
    new Date(documento.fecha_expiracion) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const StatusIcon = getStatusIcon(documento.estatus);

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="p-3 rounded-xl bg-blue-100">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {documento.documento_tipo?.nombre || 'Documento'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">
                  ID: {documento.documento_id}
                </span>
                <span className="text-sm text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  {getFileType(documento.archivo_url)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(documento.estatus)}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {getStatusLabel(documento.estatus)}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(isExpired || isExpiringSoon) && (
        <div className="p-4 border-b border-gray-200">
          {isExpired && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Documento vencido</p>
                <p className="text-sm text-red-600">
                  Este documento venció el {new Date(documento.fecha_expiracion!).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          )}
          {isExpiringSoon && !isExpired && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Documento próximo a vencer</p>
                <p className="text-sm text-yellow-600">
                  Este documento vence el {new Date(documento.fecha_expiracion!).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Información del Cliente */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre/Razón Social
              </label>
              <p className="text-sm text-gray-900">
                {documento.cliente?.nombre || documento.cliente?.razon_social || 'No asignado'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Cliente
              </label>
              <p className="text-sm text-gray-900">{documento.cliente_id}</p>
            </div>
            {documento.cliente?.telefono && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <p className="text-sm text-gray-900">{documento.cliente.telefono}</p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Documento */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-gray-600 mr-2" />
            Información del Documento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento
              </label>
              <p className="text-sm text-gray-900">
                {documento.documento_tipo?.nombre || 'No especificado'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo
              </label>
              <p className="text-sm text-gray-900">
                {documento.archivo_url.split('/').pop() || 'archivo.pdf'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Archivo
              </label>
              <p className="text-sm text-gray-900">{getFileType(documento.archivo_url)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño
              </label>
              <p className="text-sm text-gray-900">{getFileSize()}</p>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <CalendarIcon className="w-5 h-5 text-gray-600 mr-2" />
            Fechas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Documento
              </label>
              <p className="text-sm text-gray-900">
                {new Date(documento.fecha_documento).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Subida
              </label>
              <p className="text-sm text-gray-900">
                {new Date(documento.fecha_subida).toLocaleDateString('es-MX')}
              </p>
            </div>
            {documento.fecha_expiracion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <p className={`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {new Date(documento.fecha_expiracion).toLocaleDateString('es-MX')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comentarios del Revisor */}
        {documento.comentario_revisor && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600 mr-2" />
              Comentarios del Revisor
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {documento.comentario_revisor}
              </p>
            </div>
          </div>
        )}

        {/* Información Adicional */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <InformationCircleIcon className="w-5 h-5 text-gray-600 mr-2" />
            Información Adicional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(documento.estatus)}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {getStatusLabel(documento.estatus)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Última Modificación
              </label>
              <p className="text-sm text-gray-900">
                {new Date(documento.fecha_subida).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            {onDownload && (
              <button
                onClick={() => onDownload(documento)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <CloudArrowDownIcon className="w-4 h-4 mr-2" />
                Descargar
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(documento)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Editar
              </button>
            )}

            {onStatusChange && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Cambiar Estado
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cambiar Estado del Documento
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptado">Aceptado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar comentario sobre el cambio de estado..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentoDetail;
