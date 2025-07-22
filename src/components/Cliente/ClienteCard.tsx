import {
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { Cliente, TipoPersona } from '../../types/cliente.types';
import { TIPOS_PERSONA, COLORES_ESTATUS } from '../../constants';

interface ClienteCardProps {
  cliente: Cliente;
  showActions?: boolean;
  onView?: (cliente: Cliente) => void;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: number) => void;
  completitudData?: {
    porcentaje: number;
    puede_proceder: boolean;
    documentos_faltantes: string[];
  };
}

export function ClienteCard({
  cliente,
  showActions = true,
  onView,
  onEdit,
  onDelete,
  completitudData
}: ClienteCardProps) {
  const getIconForTipoPersona = (tipo: TipoPersona) => {
    switch (tipo) {
      case 'PF': return UserIcon;
      case 'PF_AE': return UserGroupIcon;
      case 'PM': return BuildingOfficeIcon;
    }
  };

  const getNombreCompleto = (cliente: Cliente) => {
    if (cliente.tipo_persona === 'PM') {
      return cliente.razon_social || 'Sin nombre';
    }
    return `${cliente.nombre || ''} ${cliente.apellido_paterno || ''} ${cliente.apellido_materno || ''}`.trim() || 'Sin nombre';
  };

  const getDireccionCompleta = (cliente: Cliente) => {
    const partes = [
      cliente.calle,
      cliente.numero_exterior,
      cliente.colonia,
      cliente.ciudad,
      cliente.estado,
      cliente.codigo_postal
    ].filter(Boolean);
    
    return partes.length > 0 ? partes.join(', ') : 'Dirección no registrada';
  };

  const getCompletitudColor = (porcentaje: number) => {
    if (porcentaje >= 80) return 'text-green-600 bg-green-100';
    if (porcentaje >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const IconComponent = getIconForTipoPersona(cliente.tipo_persona);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${COLORES_ESTATUS.tipoPersona[cliente.tipo_persona]}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {getNombreCompleto(cliente)}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLORES_ESTATUS.tipoPersona[cliente.tipo_persona]}`}>
                  {TIPOS_PERSONA[cliente.tipo_persona]}
                </span>
                {cliente.tipo_persona === 'PM' && cliente.representante_legal && (
                  <span className="text-sm text-gray-500">
                    Rep. Legal: {cliente.representante_legal}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completitud Badge */}
          {completitudData && (
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCompletitudColor(completitudData.porcentaje)}`}>
                {completitudData.puede_proceder ? (
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                )}
                {completitudData.porcentaje}% Completo
              </div>
              {completitudData.documentos_faltantes.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {completitudData.documentos_faltantes.length} doc(s) faltantes
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">RFC:</span>
                <span className="ml-2 font-mono text-gray-900">{cliente.rfc}</span>
              </div>
            </div>

            {cliente.curp && (
              <div className="flex items-center space-x-3 text-sm">
                <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">CURP:</span>
                  <span className="ml-2 font-mono text-gray-900">{cliente.curp}</span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{cliente.correo}</span>
              </div>
            </div>

            {cliente.telefono && (
              <div className="flex items-center space-x-3 text-sm">
                <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="ml-2 text-gray-900">{cliente.telefono}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 text-sm">
              <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-500">Dirección:</span>
                <p className="ml-2 text-gray-900 leading-relaxed">
                  {getDireccionCompleta(cliente)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">
                  {cliente.tipo_persona === 'PM' ? 'Constitución:' : 'Nacimiento:'}
                </span>
                <span className="ml-2 text-gray-900">
                  {cliente.tipo_persona === 'PM' 
                    ? cliente.fecha_constitucion 
                      ? new Date(cliente.fecha_constitucion).toLocaleDateString('es-MX')
                      : 'No registrada'
                    : cliente.fecha_nacimiento
                      ? new Date(cliente.fecha_nacimiento).toLocaleDateString('es-MX')
                      : 'No registrada'
                  }
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Registrado:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos faltantes */}
        {completitudData && completitudData.documentos_faltantes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              <h4 className="text-sm font-medium text-yellow-800">
                Documentos Faltantes
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {completitudData.documentos_faltantes.map((doc, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
          {onView && (
            <button
              onClick={() => onView(cliente)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Ver Detalles
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(cliente)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                  onDelete(cliente.cliente_id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
