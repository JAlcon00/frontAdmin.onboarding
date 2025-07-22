import { useState } from 'react';
import {
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import type { Cliente, ClienteCompletitud } from '../../types/cliente.types';
import { TIPOS_PERSONA, COLORES_ESTATUS } from '../../constants';
import { ClienteOnboarding } from './ClienteOnboarding';
import { ClienteValidaciones } from './ClienteValidaciones';

interface ClienteDetailProps {
  cliente: Cliente;
  completitud?: ClienteCompletitud;
  loading?: boolean;
  error?: string | null;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: number) => void;
  onClose?: () => void;
}

interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'informacion', label: 'Información General' },
  { id: 'completitud', label: 'Completitud' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'validaciones', label: 'Validaciones' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'actividad', label: 'Actividad' }
];

function TabNavigation({ activeTab, onTabChange }: TabProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function ClienteDetail({
  cliente,
  completitud,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onClose
}: ClienteDetailProps) {
  const [activeTab, setActiveTab] = useState('informacion');

  const getIconForTipoPersona = (tipo: string) => {
    switch (tipo) {
      case 'PF': return UserIcon;
      case 'PF_AE': return UserGroupIcon;
      case 'PM': return BuildingOfficeIcon;
      default: return UserIcon;
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
      cliente.numero_interior,
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
        <div className="p-6 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-6">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const IconComponent = getIconForTipoPersona(cliente.tipo_persona);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${COLORES_ESTATUS.tipoPersona[cliente.tipo_persona]}`}>
              <IconComponent className="w-8 h-8" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getNombreCompleto(cliente)}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${COLORES_ESTATUS.tipoPersona[cliente.tipo_persona]}`}>
                  {TIPOS_PERSONA[cliente.tipo_persona]}
                </span>
                {cliente.tipo_persona === 'PM' && cliente.representante_legal && (
                  <span className="text-sm text-gray-500">
                    Rep. Legal: {cliente.representante_legal}
                  </span>
                )}
                {completitud && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCompletitudColor(completitud.porcentaje_completitud)}`}>
                    {completitud.puede_proceder_onboarding ? (
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    )}
                    {completitud.porcentaje_completitud}% Completo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={() => onEdit(cliente)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Eliminar
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="p-6">
        {activeTab === 'informacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información Personal/Empresarial */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {cliente.tipo_persona === 'PM' ? 'Información Empresarial' : 'Información Personal'}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">RFC:</span>
                      <span className="ml-2 font-mono text-gray-900">{cliente.rfc}</span>
                    </div>
                  </div>

                  {cliente.curp && (
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">CURP:</span>
                        <span className="ml-2 font-mono text-gray-900">{cliente.curp}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">
                        {cliente.tipo_persona === 'PM' ? 'Fecha de Constitución:' : 'Fecha de Nacimiento:'}
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

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Fecha de Registro:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{cliente.correo}</span>
                    </div>
                  </div>

                  {cliente.telefono && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Teléfono:</span>
                        <span className="ml-2 text-gray-900">{cliente.telefono}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-gray-900 leading-relaxed">
                      {getDireccionCompleta(cliente)}
                    </p>
                    
                    {cliente.pais && (
                      <p className="text-sm text-gray-500 mt-2">
                        País: {cliente.pais}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'completitud' && completitud && (
          <div className="space-y-6">
            {/* Resumen de completitud */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getCompletitudColor(completitud.porcentaje_completitud)}`}>
                  {completitud.porcentaje_completitud}%
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Completitud General</h3>
                <p className="text-sm text-gray-500">Datos completos del cliente</p>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  completitud.puede_proceder_onboarding ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {completitud.puede_proceder_onboarding ? (
                    <CheckCircleIcon className="w-8 h-8" />
                  ) : (
                    <XCircleIcon className="w-8 h-8" />
                  )}
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Onboarding</h3>
                <p className="text-sm text-gray-500">
                  {completitud.puede_proceder_onboarding ? 'Puede proceder' : 'No puede proceder'}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">
                  {completitud.campos_faltantes?.length || 0}
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Campos Faltantes</h3>
                <p className="text-sm text-gray-500">Datos por completar</p>
              </div>
            </div>

            {/* Estado de secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                completitud.datos_basicos_completos 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center space-x-3">
                  {completitud.datos_basicos_completos ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">Datos Básicos</h4>
                    <p className="text-sm text-gray-600">
                      {completitud.datos_basicos_completos ? 'Completos' : 'Incompletos'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                completitud.direccion_completa 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center space-x-3">
                  {completitud.direccion_completa ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">Dirección</h4>
                    <p className="text-sm text-gray-600">
                      {completitud.direccion_completa ? 'Completa' : 'Incompleta'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos faltantes */}
            {completitud.campos_faltantes && completitud.campos_faltantes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-medium text-yellow-800 mb-3">Campos Faltantes</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {completitud.campos_faltantes.map((campo, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                    >
                      {campo}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Documentos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta sección estará disponible próximamente
            </p>
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Solicitudes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta sección estará disponible próximamente
            </p>
          </div>
        )}

        {activeTab === 'onboarding' && (
          <ClienteOnboarding clienteId={cliente.cliente_id.toString()} />
        )}

        {activeTab === 'validaciones' && (
          <ClienteValidaciones clienteId={cliente.cliente_id.toString()} />
        )}

        {activeTab === 'actividad' && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Actividad</h3>
            <p className="mt-1 text-sm text-gray-500">
              Esta sección estará disponible próximamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
