import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ListBulletIcon, 
  Squares2X2Icon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import SolicitudCard from './SolicitudCard';
import SolicitudFilters from './SolicitudFilters';
import { ValidationAlert } from '../shared/ValidationAlert';
import { obtenerNombreCliente } from '../../utils/validation';
import { useValidacionSolicitudes } from '../../hook/solicitud';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { SolicitudFilter } from '../../types/solicitud.types';
import { ESTATUS_SOLICITUD, PRODUCTOS, COLORES_ESTATUS } from '../../constants';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';

interface SolicitudListProps {
  solicitudes?: SolicitudCompleta[];
  loading?: boolean;
  error?: string | null;
  total?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  initialView?: 'grid' | 'table';
  onSolicitudSelect?: (solicitud: SolicitudCompleta) => void;
  onSolicitudView?: (solicitud: SolicitudCompleta) => void;
  onSolicitudEdit?: (solicitud: SolicitudCompleta) => void;
  onSolicitudDelete?: (solicitudId: number) => void;
  onFiltersChange?: (filters: SolicitudFilter) => void;
  maxItems?: number;
  className?: string;
}

export const SolicitudList: React.FC<SolicitudListProps> = ({
  solicitudes = [],
  loading = false,
  error = null,
  total = 0,
  showFilters = true,
  showSearch = true,
  showViewToggle = true,
  initialView = 'grid',
  onSolicitudSelect,
  onSolicitudView,
  onSolicitudEdit,
  onSolicitudDelete,
  onFiltersChange,
  maxItems,
  className = ''
}) => {
  const [view, setView] = useState<'grid' | 'table'>(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<SolicitudFilter>({});

  // Usar hook de validación
  const { validationErrors, solicitudesValidas, clearErrors } = useValidacionSolicitudes(solicitudes);

  const handleFilterChange = (newFilters: SolicitudFilter) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleDelete = (solicitudId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
      onSolicitudDelete?.(solicitudId);
    }
  };

  const filteredSolicitudes = solicitudesValidas.filter((solicitud: SolicitudCompleta) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const clienteNombre = solicitud.cliente?.nombre?.toLowerCase() || '';
    const clienteRazonSocial = solicitud.cliente?.razon_social?.toLowerCase() || '';
    const solicitudId = solicitud.solicitud_id.toString();
    const estatus = solicitud.estatus.toLowerCase();
    const productos = solicitud.productos?.map(p => PRODUCTOS[p.producto] || p.producto).join(' ').toLowerCase() || '';
    
    return (
      clienteNombre.includes(searchLower) ||
      clienteRazonSocial.includes(searchLower) ||
      solicitudId.includes(searchLower) ||
      estatus.includes(searchLower) ||
      productos.includes(searchLower)
    );
  });

  const displayedSolicitudes = maxItems ? filteredSolicitudes.slice(0, maxItems) : filteredSolicitudes;

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

  const calcularMontoTotal = (solicitud: SolicitudCompleta) => {
    return solicitud.productos?.reduce((total, producto) => total + (producto.monto || 0), 0) || 0;
  };

  const obtenerProductosTexto = (solicitud: SolicitudCompleta) => {
    if (!solicitud.productos || solicitud.productos.length === 0) return 'Sin productos';
    
    const productosUnicos = [...new Set(solicitud.productos.map(p => p.producto))];
    return productosUnicos.map(p => PRODUCTOS[p] || p).join(', ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Error al cargar solicitudes: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Alertas de validación */}
      {validationErrors.length > 0 && (
        <ValidationAlert
          type="error"
          message={`Se encontraron ${validationErrors.length} solicitudes sin cliente válido`}
          details={validationErrors}
          onClose={clearErrors}
        />
      )}

      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Solicitudes ({total || solicitudes.length})
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          {showSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Filtros */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFiltersPanel
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              Filtros
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Toggle de vista */}
          {showViewToggle && (
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  view === 'grid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-r-lg transition-colors ${
                  view === 'table'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && showFiltersPanel && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <SolicitudFilters
            onFiltersChange={handleFilterChange}
            initialFilters={filters}
            onClear={() => {
              setFilters({});
              handleFilterChange({});
            }}
          />
        </div>
      )}

      {/* Lista de solicitudes */}
      {displayedSolicitudes.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'No se encontraron solicitudes con los filtros aplicados'
              : 'Comienza creando una nueva solicitud'
            }
          </p>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedSolicitudes.map((solicitud: SolicitudCompleta) => (
                <SolicitudCard
                  key={solicitud.solicitud_id}
                  solicitud={solicitud}
                  onClick={onSolicitudSelect}
                  onView={onSolicitudView}
                  onEdit={onSolicitudEdit}
                  onDelete={handleDelete}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completitud
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedSolicitudes.map((solicitud: SolicitudCompleta) => (
                      <tr 
                        key={solicitud.solicitud_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSolicitudSelect?.(solicitud)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-6 h-6 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{solicitud.solicitud_id}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {solicitud.solicitud_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {obtenerNombreCliente(solicitud)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {solicitud.cliente_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {obtenerProductosTexto(solicitud)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {solicitud.productos?.length || 0} producto(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatearMoneda(calcularMontoTotal(solicitud))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            COLORES_ESTATUS.solicitud[solicitud.estatus as keyof typeof COLORES_ESTATUS.solicitud] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {getEstatusIcon(solicitud.estatus)}
                            {ESTATUS_SOLICITUD[solicitud.estatus as keyof typeof ESTATUS_SOLICITUD]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatearFecha(solicitud.fecha_creacion)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Act: {formatearFecha(solicitud.fecha_actualizacion)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {solicitud.completitud_documentos !== undefined && (
                            <div className="flex items-center">
                              <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    solicitud.completitud_documentos >= 90 ? 'bg-green-500' :
                                    solicitud.completitud_documentos >= 70 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${solicitud.completitud_documentos}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">
                                {solicitud.completitud_documentos}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {onSolicitudView && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSolicitudView(solicitud);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalles"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                            )}
                            {solicitud.estatus === 'iniciada' && onSolicitudEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSolicitudEdit(solicitud);
                                }}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Editar"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {['iniciada', 'en_revision'].includes(solicitud.estatus) && onSolicitudDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(solicitud.solicitud_id);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SolicitudList;
