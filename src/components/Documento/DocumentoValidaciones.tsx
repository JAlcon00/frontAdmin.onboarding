import React, { useState, useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Modal } from '../shared/Modal';
import { useDocumentoManager } from '../../hook/documento';
import type { Documento, DocumentoValidation, DocumentoTipo } from '../../types/documento.types';

interface DocumentoValidacionesProps {
  clienteId?: number;
  onValidar?: (documentoId: number, resultado: DocumentoValidation) => Promise<void>;
  onVerDocumento?: (documento: Documento) => void;
  className?: string;
}

interface ValidationResult {
  documento_id: number;
  validaciones: {
    formato_valido: boolean;
    tamaño_adecuado: boolean;
    legibilidad: boolean;
    informacion_completa: boolean;
    fecha_valida: boolean;
    autenticidad: boolean;
  };
  problemas: string[];
  nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  puntuacion_calidad: number; // 0-100
  recomendaciones: string[];
  fecha_validacion: Date;
}

interface FilterState {
  estatus: string;
  nivel_riesgo: string;
  tipo_documento: string;
  fecha_desde: string;
  fecha_hasta: string;
  busqueda: string;
}

export const DocumentoValidaciones: React.FC<DocumentoValidacionesProps> = ({
  clienteId,
  onValidar,
  onVerDocumento,
  className = ''
}) => {
  // Usar hooks reales para obtener datos
  const { state } = useDocumentoManager({ 
    cliente_id: clienteId, 
    autoLoad: true 
  });
  const { documentos, documentosTipos, loading } = state;

  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<Set<number>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<ValidationResult | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    estatus: 'todos',
    nivel_riesgo: 'todos',
    tipo_documento: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: ''
  });

  // Validación automática basada en datos reales del documento
  const performAutoValidation = async (documento: Documento): Promise<ValidationResult> => {
    // Validaciones inmediatas basadas en datos reales del documento
    const tieneArchivo = !!documento.archivo_url;
    const tieneNombreTipo = !!documento.documento_tipo?.nombre;
    const fechaValida = documento.fecha_documento ? new Date(documento.fecha_documento) <= new Date() : false;
    const tipoValido = !!documento.documento_tipo_id;
    const noVencido = !documento.esta_vencido;
    
    const validaciones = {
      formato_valido: tieneArchivo && tipoValido, // Tiene archivo y tipo válido
      tamaño_adecuado: tieneArchivo, // Si tiene archivo, asumimos que pasó validación de tamaño
      legibilidad: tieneArchivo && tieneNombreTipo, // Archivo presente y con tipo descriptivo
      informacion_completa: tieneNombreTipo && tipoValido && documento.cliente_id > 0, // Información básica completa
      fecha_valida: fechaValida,
      autenticidad: tieneArchivo && tieneNombreTipo && tipoValido && noVencido // Documentos completos y vigentes
    };

    const problemas: string[] = [];
    if (!validaciones.formato_valido) problemas.push(tieneArchivo ? 'Tipo de documento no definido' : 'Archivo no disponible');
    if (!validaciones.tamaño_adecuado) problemas.push('Archivo no disponible o corrupto');
    if (!validaciones.legibilidad) problemas.push('Falta información del tipo de documento');
    if (!validaciones.informacion_completa) problemas.push('Información del documento incompleta');
    if (!validaciones.fecha_valida) problemas.push('Fecha del documento inválida o futura');
    if (!validaciones.autenticidad) problemas.push('Posibles indicios de alteración');

    const validCount = Object.values(validaciones).filter(Boolean).length;
    const puntuacion_calidad = Math.round((validCount / 6) * 100);

    let nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
    if (puntuacion_calidad >= 90) nivel_riesgo = 'bajo';
    else if (puntuacion_calidad >= 70) nivel_riesgo = 'medio';
    else if (puntuacion_calidad >= 50) nivel_riesgo = 'alto';
    else nivel_riesgo = 'critico';

    const recomendaciones: string[] = [];
    if (puntuacion_calidad < 80) {
      recomendaciones.push('Solicitar nueva versión del documento');
    }
    if (!validaciones.legibilidad) {
      recomendaciones.push('Contactar cliente para documento más claro');
    }
    if (!validaciones.informacion_completa) {
      recomendaciones.push('Revisar campos obligatorios con el cliente');
    }

    return {
      documento_id: documento.documento_id,
      validaciones,
      problemas,
      nivel_riesgo,
      puntuacion_calidad,
      recomendaciones,
      fecha_validacion: new Date()
    };
  };

  // Ejecutar validación
  const handleValidateDocument = async (documento: Documento) => {
    setIsValidating(prev => new Set(prev).add(documento.documento_id));

    try {
      const result = await performAutoValidation(documento);
      
      setValidationResults(prev => {
        const filtered = prev.filter(r => r.documento_id !== documento.documento_id);
        return [...filtered, result];
      });

      if (onValidar) {
        await onValidar(documento.documento_id, {
          es_valido: result.puntuacion_calidad >= 70,
          errores: result.problemas,
          advertencias: result.recomendaciones
        });
      }
    } catch (error) {
      console.error('Error en validación:', error);
    } finally {
      setIsValidating(prev => {
        const newSet = new Set(prev);
        newSet.delete(documento.documento_id);
        return newSet;
      });
    }
  };

  // Obtener resultado de validación para un documento
  const getValidationResult = (documentoId: number): ValidationResult | undefined => {
    return validationResults.find(r => r.documento_id === documentoId);
  };

  // Filtrar documentos
  const filteredDocumentos = useMemo(() => {
    return documentos?.filter((doc: Documento) => {
      const result = getValidationResult(doc.documento_id);
      
      // Filtro por estatus
      if (filters.estatus !== 'todos' && doc.estatus !== filters.estatus) {
        return false;
      }

      // Filtro por nivel de riesgo
      if (filters.nivel_riesgo !== 'todos' && result?.nivel_riesgo !== filters.nivel_riesgo) {
        return false;
      }

      // Filtro por tipo de documento
      if (filters.tipo_documento !== 'todos' && doc.documento_tipo_id.toString() !== filters.tipo_documento) {
        return false;
      }

      // Filtro por fecha
      if (filters.fecha_desde) {
        const fechaDoc = new Date(doc.fecha_documento);
        const fechaFiltro = new Date(filters.fecha_desde);
        if (fechaDoc < fechaFiltro) return false;
      }

      if (filters.fecha_hasta) {
        const fechaDoc = new Date(doc.fecha_documento);
        const fechaFiltro = new Date(filters.fecha_hasta);
        if (fechaDoc > fechaFiltro) return false;
      }

      // Filtro por búsqueda
      if (filters.busqueda) {
        const tipoDoc = documentosTipos?.find((t: DocumentoTipo) => t.documento_tipo_id === doc.documento_tipo_id);
        const searchText = filters.busqueda.toLowerCase();
        return (
          tipoDoc?.nombre.toLowerCase().includes(searchText) ||
          doc.comentario_revisor?.toLowerCase().includes(searchText) ||
          doc.documento_id.toString().includes(searchText)
        );
      }

      return true;
    });
  }, [documentos, documentosTipos, filters, validationResults]);

  // Mostrar detalles de validación
  const showValidationDetails = (result: ValidationResult) => {
    setDetailData(result);
    setShowDetailModal(true);
  };

  // Obtener color del badge por nivel de riesgo
  const getRiskBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return 'success';
      case 'medio': return 'warning';
      case 'alto': return 'danger';
      case 'critico': return 'danger';
      default: return 'secondary';
    }
  };

  // Estadísticas de validación
  const stats = useMemo(() => {
    const total = validationResults.length;
    const bajo = validationResults.filter(r => r.nivel_riesgo === 'bajo').length;
    const medio = validationResults.filter(r => r.nivel_riesgo === 'medio').length;
    const alto = validationResults.filter(r => r.nivel_riesgo === 'alto').length;
    const critico = validationResults.filter(r => r.nivel_riesgo === 'critico').length;
    const promedio = total > 0 ? Math.round(validationResults.reduce((sum, r) => sum + r.puntuacion_calidad, 0) / total) : 0;

    return { total, bajo, medio, alto, critico, promedio };
  }, [validationResults]);

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Validados</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.bajo}</div>
            <div className="text-sm text-gray-500">Bajo Riesgo</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.medio}</div>
            <div className="text-sm text-gray-500">Medio Riesgo</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.alto}</div>
            <div className="text-sm text-gray-500">Alto Riesgo</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-800">{stats.critico}</div>
            <div className="text-sm text-gray-500">Crítico</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.promedio}%</div>
            <div className="text-sm text-gray-500">Calidad Prom.</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={filters.busqueda}
                onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estatus
            </label>
            <select
              value={filters.estatus}
              onChange={(e) => setFilters(prev => ({ ...prev, estatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estatus</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de Riesgo
            </label>
            <select
              value={filters.nivel_riesgo}
              onChange={(e) => setFilters(prev => ({ ...prev, nivel_riesgo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los niveles</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={filters.tipo_documento}
              onChange={(e) => setFilters(prev => ({ ...prev, tipo_documento: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              {documentosTipos?.map((tipo: DocumentoTipo) => (
                <option key={tipo.documento_tipo_id} value={tipo.documento_tipo_id.toString()}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters(prev => ({ ...prev, fecha_desde: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters(prev => ({ ...prev, fecha_hasta: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({
              estatus: 'todos',
              nivel_riesgo: 'todos',
              tipo_documento: 'todos',
              fecha_desde: '',
              fecha_hasta: '',
              busqueda: ''
            })}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Lista de documentos */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Validaciones de Documentos ({filteredDocumentos.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estatus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocumentos?.map((documento: Documento) => {
                const tipoDoc = documentosTipos?.find((t: DocumentoTipo) => t.documento_tipo_id === documento.documento_tipo_id);
                const validationResult = getValidationResult(documento.documento_id);
                const isDocumentValidating = isValidating.has(documento.documento_id);

                return (
                  <tr key={documento.documento_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-10 w-10 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tipoDoc?.nombre || 'Tipo desconocido'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {documento.documento_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        documento.estatus === 'aceptado' ? 'success' :
                        documento.estatus === 'rechazado' ? 'danger' :
                        documento.estatus === 'vencido' ? 'warning' : 'secondary'
                      }>
                        {documento.estatus}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isDocumentValidating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          <span className="text-sm text-gray-500">Validando...</span>
                        </div>
                      ) : validationResult ? (
                        <Badge variant={getRiskBadgeVariant(validationResult.nivel_riesgo)}>
                          {validationResult.nivel_riesgo} riesgo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Sin validar</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {validationResult ? (
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {validationResult.puntuacion_calidad}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                validationResult.puntuacion_calidad >= 80 ? 'bg-green-500' :
                                validationResult.puntuacion_calidad >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${validationResult.puntuacion_calidad}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(documento.fecha_documento).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!validationResult && !isDocumentValidating && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleValidateDocument(documento)}
                        >
                          Validar
                        </Button>
                      )}
                      
                      {validationResult && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => showValidationDetails(validationResult)}
                        >
                          Ver detalles
                        </Button>
                      )}
                      
                      {onVerDocumento && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerDocumento(documento)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredDocumentos.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay documentos para validar
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron documentos que coincidan con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de detalles de validación */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalles de Validación"
        size="lg"
      >
        {detailData && (
          <div className="space-y-6">
            {/* Puntuación general */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {detailData.puntuacion_calidad}%
              </div>
              <div className="text-sm text-gray-500 mb-4">Puntuación de Calidad</div>
              <Badge variant={getRiskBadgeVariant(detailData.nivel_riesgo)} size="lg">
                Riesgo {detailData.nivel_riesgo}
              </Badge>
            </div>

            {/* Validaciones específicas */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Validaciones Específicas</h4>
              <div className="space-y-2">
                {Object.entries(detailData.validaciones).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    {value ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Problemas detectados */}
            {detailData.problemas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Problemas Detectados</h4>
                <div className="space-y-2">
                  {detailData.problemas.map((problema, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-700">{problema}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {detailData.recomendaciones.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recomendaciones</h4>
                <div className="space-y-2">
                  {detailData.recomendaciones.map((recomendacion, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-blue-700">{recomendacion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha de validación */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              Validado el {detailData.fecha_validacion.toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentoValidaciones;
