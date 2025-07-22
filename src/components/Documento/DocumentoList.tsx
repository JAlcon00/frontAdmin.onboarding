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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { DocumentoCard } from './DocumentoCard';
import { DocumentoFilters } from './DocumentoFilters';
import type { Documento, DocumentoFilter } from '../../types/documento.types';

interface DocumentoListProps {
  documentos?: Documento[];
  loading?: boolean;
  error?: string | null;
  total?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  initialView?: 'grid' | 'table';
  onDocumentoSelect?: (documento: Documento) => void;
  onDocumentoView?: (documento: Documento) => void;
  onDocumentoEdit?: (documento: Documento) => void;
  onDocumentoDelete?: (documentoId: number) => void;
  onDocumentoDownload?: (documento: Documento) => void;
  onFiltersChange?: (filters: DocumentoFilter) => void;
  maxItems?: number;
  className?: string;
}

export const DocumentoList: React.FC<DocumentoListProps> = ({
  documentos = [],
  loading = false,
  error = null,
  total = 0,
  showFilters = true,
  showSearch = true,
  showViewToggle = true,
  initialView = 'grid',
  onDocumentoSelect,
  onDocumentoView,
  onDocumentoEdit,
  onDocumentoDelete,
  onDocumentoDownload,
  onFiltersChange,
  maxItems,
  className = ''
}) => {
  const [view, setView] = useState<'grid' | 'table'>(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<DocumentoFilter>({});

  const handleFilterChange = (newFilters: DocumentoFilter) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleDelete = (documentoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      onDocumentoDelete?.(documentoId);
    }
  };

  const filteredDocumentos = documentos.filter((documento: Documento) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      documento.documento_tipo?.nombre?.toLowerCase().includes(searchLower) ||
      documento.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      documento.cliente?.razon_social?.toLowerCase().includes(searchLower) ||
      documento.archivo_url.toLowerCase().includes(searchLower) ||
      documento.estatus.toLowerCase().includes(searchLower)
    );
  });

  const displayedDocumentos = maxItems ? filteredDocumentos.slice(0, maxItems) : filteredDocumentos;

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
            <DocumentTextIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Error al cargar documentos: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Documentos ({total || documentos.length})
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          {showSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
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
          <DocumentoFilters
            onFiltersChange={handleFilterChange}
            initialFilters={filters}
          />
        </div>
      )}

      {/* Lista de documentos */}
      {displayedDocumentos.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'No se encontraron documentos con los filtros aplicados'
              : 'Comienza subiendo algunos documentos'
            }
          </p>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDocumentos.map((documento: Documento) => (
                <DocumentoCard
                  key={documento.documento_id}
                  documento={documento}
                  onView={onDocumentoView}
                  onEdit={onDocumentoEdit}
                  onDelete={handleDelete}
                  onDownload={onDocumentoDownload}
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
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha subida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedDocumentos.map((documento: Documento) => (
                      <tr 
                        key={documento.documento_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onDocumentoSelect?.(documento)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-6 h-6 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {documento.documento_tipo?.nombre || 'Tipo no especificado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {documento.archivo_url.split('/').pop() || 'archivo.pdf'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {documento.cliente?.nombre || documento.cliente?.razon_social || 'No asignado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(documento.fecha_subida).toLocaleDateString('es-MX')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            documento.estatus === 'aceptado' ? 'bg-green-100 text-green-800' :
                            documento.estatus === 'rechazado' ? 'bg-red-100 text-red-800' :
                            documento.estatus === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {documento.estatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {onDocumentoView && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDocumentoView(documento);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                            )}
                            {onDocumentoDownload && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDocumentoDownload(documento);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                            )}
                            {onDocumentoEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDocumentoEdit(documento);
                                }}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {onDocumentoDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(documento.documento_id);
                                }}
                                className="text-red-600 hover:text-red-900"
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

export default DocumentoList;
