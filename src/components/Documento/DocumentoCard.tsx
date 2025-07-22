import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import type { Documento } from '../../types/documento.types';

interface DocumentoCardProps {
  documento: Documento;
  showActions?: boolean;
  onView?: (documento: Documento) => void;
  onEdit?: (documento: Documento) => void;
  onDelete?: (documentoId: number) => void;
  onDownload?: (documento: Documento) => void;
}

export function DocumentoCard({
  documento,
  showActions = true,
  onView,
  onEdit,
  onDelete,
  onDownload
}: DocumentoCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobado':
        return CheckCircleIcon;
      case 'rechazado':
        return XCircleIcon;
      case 'pendiente':
        return ClockIcon;
      case 'revision':
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado':
        return 'text-green-600 bg-green-100';
      case 'rechazado':
        return 'text-red-600 bg-red-100';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100';
      case 'revision':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'pendiente':
        return 'Pendiente';
      case 'revision':
        return 'En Revisión';
      default:
        return 'Desconocido';
    }
  };

  const StatusIcon = getStatusIcon(documento.estatus);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {documento.documento_tipo?.nombre || 'Documento'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">
                  {documento.archivo_url.split('/').pop() || 'archivo.pdf'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(documento.estatus)}`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {getStatusLabel(documento.estatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Cliente:</span>
                <span className="ml-2 text-gray-900">{documento.cliente?.nombre || documento.cliente?.razon_social || 'No asignado'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Tipo:</span>
                <span className="ml-2 text-gray-900">{documento.documento_tipo?.nombre || 'No especificado'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Subido:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(documento.fecha_subida).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {documento.fecha_expiracion && (
              <div className="flex items-center space-x-3 text-sm">
                <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Vencimiento:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(documento.fecha_expiracion).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 text-sm">
              <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Fecha documento:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(documento.fecha_documento).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900">
                  {documento.documento_id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comentarios */}
        {documento.comentario_revisor && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Comentarios del revisor</h4>
            <p className="text-sm text-gray-700">{documento.comentario_revisor}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
          {onView && (
            <button
              onClick={() => onView(documento)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Ver Detalles
            </button>
          )}

          {onDownload && (
            <button
              onClick={() => onDownload(documento)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Descargar
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(documento)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
                  onDelete(documento.documento_id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
