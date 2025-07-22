import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { useSolicitudManager } from '../../hook/solicitud';
import type { SolicitudDocumento, Documento } from '../../types';

interface SolicitudDocumentosProps {
  solicitudId: number;  // ID de la solicitud a cargar
  onUpload?: (files: File[], isRequired: boolean) => Promise<void>;
  onView?: (documento: Documento) => void;
  onDownload?: (documento: Documento) => void;
  onDelete?: (documentoId: number) => Promise<void>;
  canEdit?: boolean;
  className?: string;
}

interface DocumentoStats {
  total: number;
  requeridos: number;
  opcionales: number;
  completados: number;
  pendientes: number;
  vencidos: number;
}

interface DocumentoFilter {
  tipo: 'todos' | 'requeridos' | 'opcionales';
  estado: 'todos' | 'completados' | 'pendientes' | 'vencidos';
  busqueda: string;
}

export const SolicitudDocumentos: React.FC<SolicitudDocumentosProps> = ({
  solicitudId,
  onUpload,
  onView,
  onDownload,
  onDelete,
  canEdit = false,
  className = ''
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRequired, setIsRequired] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['requeridos']));
  
  const { state, obtener } = useSolicitudManager();
  const { selectedSolicitud: solicitud, loading, error } = state;

  useEffect(() => {
    if (solicitudId) {
      obtener(solicitudId);
    }
  }, [solicitudId, obtener]);

  // Mostrar loading
  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Error al cargar la solicitud: {error}</span>
        </div>
      </div>
    );
  }

  // Solicitud no encontrada
  if (!solicitud) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-gray-500">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Solicitud no encontrada</span>
        </div>
      </div>
    );
  }

  // Usar documentos reales de la solicitud
  const documentos = solicitud.documentos || [];
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<DocumentoFilter>({
    tipo: 'todos',
    estado: 'todos',
    busqueda: ''
  });

  // Estadísticas de documentos
  const [stats, setStats] = useState<DocumentoStats>({
    total: 0,
    requeridos: 0,
    opcionales: 0,
    completados: 0,
    pendientes: 0,
    vencidos: 0
  });

  // Calcular estadísticas
  useEffect(() => {
    const calcularStats = (): DocumentoStats => {
      const total = documentos.length;
      const requeridos = documentos.filter((d: SolicitudDocumento) => d.requerido).length;
      const opcionales = total - requeridos;
      const completados = documentos.filter((d: SolicitudDocumento) => d.documento?.archivo_url).length;
      const pendientes = total - completados;
      
      // Verificar documentos vencidos usando la propiedad real
      const vencidos = documentos.filter((d: SolicitudDocumento) => {
        // Usar el campo real de vencimiento del documento
        return d.documento?.esta_vencido || false;
      }).length;

      return {
        total,
        requeridos,
        opcionales,
        completados,
        pendientes,
        vencidos
      };
    };

    setStats(calcularStats());
  }, [documentos]);

  // Filtrar documentos
  const documentosFiltrados = documentos.filter((documento: SolicitudDocumento) => {
    // Filtro por tipo
    if (filtros.tipo === 'requeridos' && !documento.requerido) return false;
    if (filtros.tipo === 'opcionales' && documento.requerido) return false;

    // Filtro por estado
    const tieneArchivo = !!documento.documento?.archivo_url;
    if (filtros.estado === 'completados' && !tieneArchivo) return false;
    if (filtros.estado === 'pendientes' && tieneArchivo) return false;
    
    if (filtros.estado === 'vencidos') {
      // Usar el campo real de vencimiento
      if (!documento.documento?.esta_vencido) return false;
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      const nombre = documento.documento?.documento_tipo?.nombre?.toLowerCase() || '';
      const tipo = documento.documento?.documento_tipo?.nombre?.toLowerCase() || '';
      if (!nombre.includes(busqueda) && !tipo.includes(busqueda)) return false;
    }

    return true;
  });

  // Agrupar documentos
  const documentosAgrupados = {
    requeridos: documentosFiltrados.filter((d: SolicitudDocumento) => d.requerido),
    opcionales: documentosFiltrados.filter((d: SolicitudDocumento) => !d.requerido)
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !onUpload) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFiles, isRequired);
      setSelectedFiles([]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error al subir documentos:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Obtener estado del documento usando datos reales
  const getDocumentStatus = (documento: SolicitudDocumento) => {
    if (documento.documento?.archivo_url) {
      return { status: 'completado', color: 'success' as const };
    }
    
    // Verificar si está vencido usando el campo real
    if (documento.documento?.esta_vencido) {
      return { status: 'vencido', color: 'danger' as const };
    }
    
    return { status: 'pendiente', color: 'warning' as const };
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Renderizar grupo de documentos
  const renderDocumentoGroup = (titulo: string, documentos: SolicitudDocumento[], sectionKey: string) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <Card key={sectionKey} className="overflow-hidden">
        <div
          className="px-6 py-4 bg-gray-50 border-b cursor-pointer"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="text-md font-medium text-gray-900">{titulo}</h4>
              <Badge variant="secondary">
                {documentos.length}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                {documentos.filter(d => d.documento?.archivo_url).length} de {documentos.length} completados
              </div>
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6">
            {documentos.length > 0 ? (
              <div className="space-y-4">
                {documentos.map((documento) => {
                  const status = getDocumentStatus(documento);
                  
                  return (
                    <div
                      key={documento.solicitud_documento_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          {status.status === 'completado' ? (
                            <DocumentCheckIcon className="h-8 w-8 text-green-500" />
                          ) : status.status === 'vencido' ? (
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                          ) : (
                            <ClockIcon className="h-8 w-8 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              {documento.documento?.documento_tipo?.nombre || 'Documento sin nombre'}
                            </h5>
                            <Badge variant={status.color}>
                              {status.status}
                            </Badge>
                            {documento.requerido && (
                              <Badge variant="info" size="sm">Requerido</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Tipo: {documento.documento?.documento_tipo?.nombre || 'N/A'}</span>
                            {documento.documento?.archivo_url && (
                              <>
                                <span>Estado: {documento.documento.estatus}</span>
                                <div className="flex items-center space-x-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>
                                    Subido: {new Date(documento.documento.fecha_subida || '').toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {documento.documento?.archivo_url ? (
                          <>
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(documento.documento!)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {onDownload && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDownload(documento.documento!)}
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(documento.documento!.documento_id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Pendiente de subir
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Sin documentos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay documentos {titulo.toLowerCase()} para esta solicitud.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Documentos de la Solicitud
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilterModal(true)}
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filtros
          </Button>
          {canEdit && onUpload && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Subir
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.requeridos}
            </div>
            <div className="text-sm text-gray-500">Requeridos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.opcionales}
            </div>
            <div className="text-sm text-gray-500">Opcionales</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.completados}
            </div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendientes}
            </div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.vencidos}
            </div>
            <div className="text-sm text-gray-500">Vencidos</div>
          </div>
        </Card>
      </div>

      {/* Barra de búsqueda */}
      <Card className="p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Lista de documentos agrupados */}
      <div className="space-y-4">
        {renderDocumentoGroup('Documentos Requeridos', documentosAgrupados.requeridos, 'requeridos')}
        {renderDocumentoGroup('Documentos Opcionales', documentosAgrupados.opcionales, 'opcionales')}
      </div>

      {/* Mensaje cuando no hay documentos */}
      {documentosFiltrados.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin documentos encontrados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron documentos que coincidan con los filtros aplicados.
            </p>
          </div>
        </Card>
      )}

      {/* Modal de subida */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Subir Documentos"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isRequired}
                  onChange={() => setIsRequired(true)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm">Requerido</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isRequired}
                  onChange={() => setIsRequired(false)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm">Opcional</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Archivos
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md p-2"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos permitidos: PDF, DOC, DOCX, JPG, PNG. Máximo 10MB por archivo.
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Archivos Seleccionados ({selectedFiles.length})
              </h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Información</p>
              <p>
                Los documentos subidos serán validados automáticamente. 
                Los documentos requeridos son obligatorios para el proceso de aprobación.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? 'Subiendo...' : `Subir ${selectedFiles.length} archivo${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de filtros */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filtros de Documentos"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value as any }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="requeridos">Solo Requeridos</option>
              <option value="opcionales">Solo Opcionales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value as any }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="completados">Completados</option>
              <option value="pendientes">Pendientes</option>
              <option value="vencidos">Vencidos</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFiltros({ tipo: 'todos', estado: 'todos', busqueda: '' });
                setShowFilterModal(false);
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowFilterModal(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SolicitudDocumentos;
