import React, { useState, useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Modal } from '../shared/Modal';
import { useSolicitudManager } from '../../hook/solicitud';
import { useValidacionSolicitudes } from '../../hook/solicitud';
import type { SolicitudCompleta } from '../../services/solicitud.service';

interface SolicitudValidacionesProps {
  clienteId?: number;   // Si se proporciona, cargar solicitudes del cliente específico
  autoLoad?: boolean;   // Cargar automáticamente al montar el componente
  className?: string;
}

interface ValidationResult {
  solicitud_id: number;
  validaciones: {
    datos_completos: boolean;
    documentos_requeridos: boolean;
    cliente_verificado: boolean;
    cumple_requisitos: boolean;
    informacion_consistente: boolean;
  };
  problemas: string[];
  nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  puntuacion_completitud: number; // 0-100
  recomendaciones: string[];
  fecha_validacion: Date;
  requiere_revision_manual: boolean;
}

interface FilterState {
  estado: string;
  nivel_riesgo: string;
  fecha_desde: string;
  fecha_hasta: string;
  busqueda: string;
}

export const SolicitudValidaciones: React.FC<SolicitudValidacionesProps> = ({
  clienteId,
  autoLoad = true,
  className = ''
}) => {
  // Usar hooks reales para obtener datos
  const { state } = useSolicitudManager({ 
    cliente_id: clienteId, 
    autoLoad 
  });
  const { solicitudes, loading, error } = state;
  
  // Usar hook de validaciones real para errores de validación básicos
  const { validationErrors, hasErrors } = useValidacionSolicitudes(solicitudes);
  
  // Estados locales para validaciones detalladas
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState<Set<number>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<ValidationResult | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    estado: 'todos',
    nivel_riesgo: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    busqueda: ''
  });

  // Realizar validación automática usando datos reales
  const performAutoValidation = async (solicitud: SolicitudCompleta): Promise<ValidationResult> => {
    // Usar datos reales de la solicitud directamente - sin simulación de delay
    const validaciones = {
      datos_completos: !!(solicitud.cliente?.nombre && solicitud.cliente?.correo),
      documentos_requeridos: (solicitud.documentos?.length || 0) > 0,
      cliente_verificado: !!solicitud.cliente,
      cumple_requisitos: solicitud.estatus !== 'rechazada',
      informacion_consistente: !!(solicitud.productos && solicitud.productos.length > 0)
    };

    const problemas: string[] = [];
    if (!validaciones.datos_completos) problemas.push('Faltan datos obligatorios del cliente');
    if (!validaciones.documentos_requeridos) problemas.push('No hay documentos asociados a la solicitud');
    if (!validaciones.cliente_verificado) problemas.push('Cliente no encontrado en el sistema');
    if (!validaciones.cumple_requisitos) problemas.push('Solicitud previamente rechazada');
    if (!validaciones.informacion_consistente) problemas.push('No tiene productos asociados');

    const validCount = Object.values(validaciones).filter(Boolean).length;
    const puntuacion_completitud = Math.round((validCount / 5) * 100);

    let nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
    if (puntuacion_completitud >= 90) nivel_riesgo = 'bajo';
    else if (puntuacion_completitud >= 70) nivel_riesgo = 'medio';
    else if (puntuacion_completitud >= 50) nivel_riesgo = 'alto';
    else nivel_riesgo = 'critico';

    const recomendaciones: string[] = [];
    if (puntuacion_completitud < 80) {
      recomendaciones.push('Revisar y completar información faltante');
    }
    if (!validaciones.cliente_verificado) {
      recomendaciones.push('Verificar identidad del cliente antes de continuar');
    }
    if (!validaciones.documentos_requeridos) {
      recomendaciones.push('Solicitar documentos faltantes al cliente');
    }

    return {
      solicitud_id: solicitud.solicitud_id,
      validaciones,
      problemas,
      nivel_riesgo,
      puntuacion_completitud,
      recomendaciones,
      fecha_validacion: new Date(),
      requiere_revision_manual: nivel_riesgo === 'alto' || nivel_riesgo === 'critico'
    };
  };

  // Ejecutar validación
  const handleValidateSolicitud = async (solicitud: SolicitudCompleta) => {
    setIsValidating(prev => new Set(prev).add(solicitud.solicitud_id));

    try {
      const result = await performAutoValidation(solicitud);
      
      setValidationResults(prev => {
        const filtered = prev.filter(r => r.solicitud_id !== solicitud.solicitud_id);
        return [...filtered, result];
      });

    } catch (error) {
      console.error('Error en validación:', error);
    } finally {
      setIsValidating(prev => {
        const newSet = new Set(prev);
        newSet.delete(solicitud.solicitud_id);
        return newSet;
      });
    }
  };

  // Obtener resultado de validación
  const getValidationResult = (solicitudId: number): ValidationResult | undefined => {
    return validationResults.find(r => r.solicitud_id === solicitudId);
  };

  // Filtrar solicitudes
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(solicitud => {
      const result = getValidationResult(solicitud.solicitud_id);
      
      // Filtro por estado
      if (filters.estado !== 'todos' && solicitud.estatus !== filters.estado) {
        return false;
      }

      // Filtro por nivel de riesgo
      if (filters.nivel_riesgo !== 'todos' && result?.nivel_riesgo !== filters.nivel_riesgo) {
        return false;
      }

      // Filtro por fecha
      if (filters.fecha_desde) {
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        const fechaFiltro = new Date(filters.fecha_desde);
        if (fechaSolicitud < fechaFiltro) return false;
      }

      if (filters.fecha_hasta) {
        const fechaSolicitud = new Date(solicitud.fecha_creacion);
        const fechaFiltro = new Date(filters.fecha_hasta);
        if (fechaSolicitud > fechaFiltro) return false;
      }

      // Filtro por búsqueda
      if (filters.busqueda) {
        const searchText = filters.busqueda.toLowerCase();
        return (
          solicitud.cliente?.nombre?.toLowerCase().includes(searchText) ||
          solicitud.cliente?.correo?.toLowerCase().includes(searchText) ||
          solicitud.solicitud_id.toString().includes(searchText)
        );
      }

      return true;
    });
  }, [solicitudes, filters, validationResults]);

  // Mostrar detalles
  const showValidationDetails = (result: ValidationResult) => {
    setDetailData(result);
    setShowDetailModal(true);
  };

  // Obtener variant del badge
  const getRiskBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return 'success';
      case 'medio': return 'warning';
      case 'alto': return 'danger';
      case 'critico': return 'danger';
      default: return 'secondary';
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = validationResults.length;
    const bajo = validationResults.filter(r => r.nivel_riesgo === 'bajo').length;
    const medio = validationResults.filter(r => r.nivel_riesgo === 'medio').length;
    const alto = validationResults.filter(r => r.nivel_riesgo === 'alto').length;
    const critico = validationResults.filter(r => r.nivel_riesgo === 'critico').length;
    const promedio = total > 0 ? Math.round(validationResults.reduce((sum, r) => sum + r.puntuacion_completitud, 0) / total) : 0;
    const requierenRevision = validationResults.filter(r => r.requiere_revision_manual).length;

    return { total, bajo, medio, alto, critico, promedio, requierenRevision };
  }, [validationResults]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mostrar loading */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-600">Cargando solicitudes...</span>
          </div>
        </Card>
      )}

      {/* Mostrar errores */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700">Error al cargar solicitudes: {error}</span>
          </div>
        </Card>
      )}

      {/* Mostrar errores de validación básicos */}
      {hasErrors && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Errores de Validación Detectados</span>
            </div>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm text-yellow-700">• {error}</div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Solo mostrar contenido si no hay loading y hay solicitudes */}
      {!loading && solicitudes.length > 0 && (
        <>
          {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Validadas</div>
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
            <div className="text-sm text-gray-500">Completitud</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.requierenRevision}</div>
            <div className="text-sm text-gray-500">Rev. Manual</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={filters.busqueda}
                onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
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
              estado: 'todos',
              nivel_riesgo: 'todos',
              fecha_desde: '',
              fecha_hasta: '',
              busqueda: ''
            })}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Validaciones de Solicitudes ({filteredSolicitudes.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completitud
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
              {filteredSolicitudes.map(solicitud => {
                const validationResult = getValidationResult(solicitud.solicitud_id);
                const isValidatingSolicitud = isValidating.has(solicitud.solicitud_id);

                return (
                  <tr key={solicitud.solicitud_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-10 w-10 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {solicitud.cliente?.nombre || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {solicitud.solicitud_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        solicitud.estatus === 'aprobada' ? 'success' :
                        solicitud.estatus === 'rechazada' ? 'danger' :
                        solicitud.estatus === 'en_revision' ? 'info' : 'secondary'
                      }>
                        {solicitud.estatus}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isValidatingSolicitud ? (
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
                            {validationResult.puntuacion_completitud}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                validationResult.puntuacion_completitud >= 80 ? 'bg-green-500' :
                                validationResult.puntuacion_completitud >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${validationResult.puntuacion_completitud}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!validationResult && !isValidatingSolicitud && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleValidateSolicitud(solicitud)}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSolicitudes.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay solicitudes para validar
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron solicitudes que coincidan con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de detalles */}
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
                {detailData.puntuacion_completitud}%
              </div>
              <div className="text-sm text-gray-500 mb-4">Puntuación de Completitud</div>
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

            {/* Información adicional */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                <div>Validado el {detailData.fecha_validacion.toLocaleString()}</div>
                {detailData.requiere_revision_manual && (
                  <div className="flex items-center justify-center space-x-1 text-yellow-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Requiere revisión manual</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Cerrar el fragmento condicional */}
      </>
      )}

      {/* Mensaje cuando no hay solicitudes */}
      {!loading && solicitudes.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin solicitudes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay solicitudes disponibles para validar.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SolicitudValidaciones;
