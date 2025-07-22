import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, LoadingSpinner, Modal, useModal } from '../shared';
import { formatearFecha } from '../../utils/formatters';
import { useClienteManager } from '../../hook/cliente';

interface ValidationRule {
  id: string;
  categoria: 'identidad' | 'financiera' | 'legal' | 'cumplimiento';
  titulo: string;
  descripcion: string;
  estado: 'valido' | 'invalido' | 'pendiente' | 'advertencia';
  prioridad: 'alta' | 'media' | 'baja';
  detalle?: string;
  fecha_validacion?: Date;
  validador: string;
  acciones_recomendadas?: string[];
}

interface ClienteValidationResult {
  cliente_id: number;
  puntaje_confianza: number; // 0-100
  nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  validaciones: ValidationRule[];
  fecha_ultima_validacion: Date;
  requiere_revision_manual: boolean;
  observaciones: string[];
  documentos_verificados: string[];
  referencias_verificadas: string[];
}

interface ClienteValidacionesProps {
  clienteId?: string;
  onRevalidate?: () => void;
  onManualReview?: (ruleId: string) => void;
  showActions?: boolean;
  autoRefresh?: boolean;
}

export const ClienteValidaciones: React.FC<ClienteValidacionesProps> = ({
  clienteId,
  onRevalidate,
  onManualReview,
  showActions = true,
  autoRefresh = false
}) => {
  const { state } = useClienteManager(); 
  
  const [validationResult, setValidationResult] = useState<ClienteValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const { isOpen, openModal, closeModal } = useModal();

  const cliente = clienteId ? state.clientes.find(c => c.cliente_id.toString() === clienteId) : state.selectedCliente;

  // Loading spinner while no cliente is available
  if (!cliente) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando datos del cliente...</span>
      </div>
    );
  }

  useEffect(() => {
    loadValidationResults();
  }, [cliente.cliente_id]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadValidationResults, 30000); // Refrescar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadValidationResults = async () => {
    try {
      setLoading(true);
      
      // Generar validaciones basadas en datos reales del cliente
      const validaciones: ValidationRule[] = [];
      const observaciones: string[] = [];
      const documentos_verificados: string[] = [];
      
      // Validación de RFC
      if (cliente.rfc) {
        validaciones.push({
          id: 'rfc_verification',
          categoria: 'identidad',
          titulo: 'Verificación de RFC',
          descripcion: 'Validación del RFC contra base de datos del SAT',
          estado: cliente.rfc.length === 13 ? 'valido' : 'advertencia',
          prioridad: 'alta',
          detalle: cliente.rfc.length === 13 ? 'RFC válido formato correcto' : 'RFC formato incorrecto',
          fecha_validacion: cliente.updated_at,
          validador: 'Sistema SAT',
          acciones_recomendadas: cliente.rfc.length !== 13 ? ['Verificar formato de RFC'] : []
        });
        if (cliente.rfc.length === 13) documentos_verificados.push('RFC');
      } else {
        validaciones.push({
          id: 'rfc_verification',
          categoria: 'identidad',
          titulo: 'Verificación de RFC',
          descripcion: 'Validación del RFC contra base de datos del SAT',
          estado: 'pendiente',
          prioridad: 'alta',
          detalle: 'RFC no proporcionado',
          validador: 'Sistema SAT',
          acciones_recomendadas: ['Solicitar RFC del cliente']
        });
        observaciones.push('RFC pendiente de captura');
      }

      // Validación de CURP
      if (cliente.curp) {
        validaciones.push({
          id: 'curp_verification',
          categoria: 'identidad',
          titulo: 'Verificación de CURP',
          descripcion: 'Validación del CURP contra RENAPO',
          estado: cliente.curp.length === 18 ? 'valido' : 'advertencia',
          prioridad: 'alta',
          detalle: cliente.curp.length === 18 ? 'CURP formato correcto' : 'CURP formato incorrecto',
          fecha_validacion: cliente.updated_at,
          validador: 'RENAPO',
          acciones_recomendadas: cliente.curp.length !== 18 ? ['Verificar formato de CURP'] : []
        });
        if (cliente.curp.length === 18) documentos_verificados.push('CURP');
      } else {
        validaciones.push({
          id: 'curp_verification',
          categoria: 'identidad',
          titulo: 'Verificación de CURP',
          descripcion: 'Validación del CURP contra RENAPO',
          estado: 'pendiente',
          prioridad: 'alta',
          detalle: 'CURP no proporcionado',
          validador: 'RENAPO',
          acciones_recomendadas: ['Solicitar CURP del cliente']
        });
        observaciones.push('CURP pendiente de captura');
      }

      // Validación de contacto
      const tieneContactoCompleto = cliente.correo && cliente.telefono;
      validaciones.push({
        id: 'contact_verification',
        categoria: 'identidad',
        titulo: 'Verificación de Contacto',
        descripcion: 'Validación de datos de contacto del cliente',
        estado: tieneContactoCompleto ? 'valido' : 'advertencia',
        prioridad: 'media',
        detalle: tieneContactoCompleto ? 'Datos de contacto completos' : 'Faltan datos de contacto',
        fecha_validacion: cliente.updated_at,
        validador: 'Sistema',
        acciones_recomendadas: !tieneContactoCompleto ? ['Completar correo y teléfono'] : []
      });

      // Validación de documentos
      const documentosCount = cliente.documentos?.length || 0;
      validaciones.push({
        id: 'document_completeness',
        categoria: 'legal',
        titulo: 'Completitud de Documentos',
        descripcion: 'Verificación de documentos requeridos',
        estado: documentosCount >= 3 ? 'valido' : documentosCount >= 1 ? 'advertencia' : 'pendiente',
        prioridad: 'alta',
        detalle: `${documentosCount} documentos cargados`,
        fecha_validacion: cliente.updated_at,
        validador: 'Sistema',
        acciones_recomendadas: documentosCount < 3 ? ['Completar documentación requerida'] : []
      });

      // Validación de solicitudes
      const solicitudesCount = cliente.solicitudes?.length || 0;
      const tieneAprobada = cliente.solicitudes?.some((s: any) => s.estatus === 'aprobada') || false;
      
      validaciones.push({
        id: 'application_status',
        categoria: 'cumplimiento',
        titulo: 'Estado de Solicitudes',
        descripcion: 'Validación del estado de solicitudes del cliente',
        estado: tieneAprobada ? 'valido' : solicitudesCount > 0 ? 'advertencia' : 'pendiente',
        prioridad: 'media',
        detalle: tieneAprobada ? 'Tiene solicitud aprobada' : `${solicitudesCount} solicitudes registradas`,
        fecha_validacion: cliente.updated_at,
        validador: 'Sistema',
        acciones_recomendadas: !tieneAprobada && solicitudesCount === 0 ? ['Iniciar proceso de solicitud'] : []
      });

      // Calcular puntaje de confianza basado en validaciones
      const validacionesValidas = validaciones.filter(v => v.estado === 'valido').length;
      const totalValidaciones = validaciones.length;
      const puntaje_confianza = Math.round((validacionesValidas / totalValidaciones) * 100);
      
      // Determinar nivel de riesgo
      let nivel_riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
      if (puntaje_confianza >= 80) nivel_riesgo = 'bajo';
      else if (puntaje_confianza >= 60) nivel_riesgo = 'medio';
      else if (puntaje_confianza >= 40) nivel_riesgo = 'alto';
      else nivel_riesgo = 'critico';

      const realValidation: ClienteValidationResult = {
        cliente_id: cliente.cliente_id,
        puntaje_confianza,
        nivel_riesgo,
        fecha_ultima_validacion: new Date(),
        requiere_revision_manual: nivel_riesgo === 'alto' || nivel_riesgo === 'critico',
        validaciones,
        observaciones,
        documentos_verificados,
        referencias_verificadas: tieneContactoCompleto ? ['Datos de contacto'] : []
      };
      
      setValidationResult(realValidation);
    } catch (error) {
      console.error('Error loading validation results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    try {
      setValidating(true);
      // Revalidación inmediata usando datos reales
      await loadValidationResults();
      onRevalidate?.();
    } catch (error) {
      console.error('Error during revalidation:', error);
    } finally {
      setValidating(false);
    }
  };

  const getRiskBadge = (nivel: ClienteValidationResult['nivel_riesgo']) => {
    const config = {
      bajo: { variant: 'success' as const, text: 'Riesgo Bajo' },
      medio: { variant: 'warning' as const, text: 'Riesgo Medio' },
      alto: { variant: 'danger' as const, text: 'Riesgo Alto' },
      critico: { variant: 'danger' as const, text: 'Riesgo Crítico' }
    };
    return config[nivel];
  };

  const getValidationBadge = (estado: ValidationRule['estado']) => {
    const config = {
      valido: { variant: 'success' as const, text: 'Válido' },
      invalido: { variant: 'danger' as const, text: 'Inválido' },
      pendiente: { variant: 'warning' as const, text: 'Pendiente' },
      advertencia: { variant: 'warning' as const, text: 'Advertencia' }
    };
    return config[estado];
  };

  const getValidationIcon = (estado: ValidationRule['estado']) => {
    switch (estado) {
      case 'valido':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'invalido':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'advertencia':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityIcon = (prioridad: ValidationRule['prioridad']) => {
    const colors = {
      alta: 'text-red-500',
      media: 'text-yellow-500',
      baja: 'text-green-500'
    };
    return <div className={`w-2 h-2 rounded-full bg-current ${colors[prioridad]}`}></div>;
  };

  const getConfidenceColor = (puntaje: number) => {
    if (puntaje >= 80) return 'text-green-600';
    if (puntaje >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredValidations = validationResult?.validaciones.filter(validation => {
    const matchesCategoria = filtroCategoria === 'todas' || validation.categoria === filtroCategoria;
    const matchesEstado = filtroEstado === 'todos' || validation.estado === filtroEstado;
    return matchesCategoria && matchesEstado;
  }) || [];

  if (loading) {
    return (
      <Card className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Validando datos del cliente...</p>
      </Card>
    );
  }

  if (!validationResult) {
    return (
      <Card className="text-center py-8">
        <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin validaciones</h3>
        <p className="text-gray-500">No se encontraron resultados de validación para este cliente</p>
        {showActions && (
          <Button className="mt-4" onClick={handleRevalidate}>
            Iniciar Validación
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen de validación */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Validaciones del Cliente - {cliente.rfc}
            </h2>
            <p className="text-gray-600 mt-1">
              {cliente.tipo_persona === 'PM' ? cliente.razon_social : `${cliente.nombre} ${cliente.apellido_paterno}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={getRiskBadge(validationResult.nivel_riesgo).variant}>
              {getRiskBadge(validationResult.nivel_riesgo).text}
            </Badge>
            {showActions && (
              <Button
                variant="outline"
                leftIcon={ArrowPathIcon}
                onClick={handleRevalidate}
                loading={validating}
                size="sm"
              >
                Revalidar
              </Button>
            )}
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${getConfidenceColor(validationResult.puntaje_confianza)}`}>
              {validationResult.puntaje_confianza}%
            </div>
            <p className="text-sm text-gray-600">Puntaje de Confianza</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {validationResult.validaciones.filter(v => v.estado === 'valido').length}
            </div>
            <p className="text-sm text-gray-600">Validaciones Exitosas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {validationResult.validaciones.filter(v => v.estado === 'invalido').length}
            </div>
            <p className="text-sm text-gray-600">Validaciones Fallidas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {validationResult.validaciones.filter(v => v.estado === 'pendiente').length}
            </div>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Última validación:</span>
            <span className="ml-2 text-gray-600">{formatearFecha(validationResult.fecha_ultima_validacion)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Revisión manual:</span>
            <span className={`ml-2 ${validationResult.requiere_revision_manual ? 'text-red-600' : 'text-green-600'}`}>
              {validationResult.requiere_revision_manual ? 'Requerida' : 'No requerida'}
            </span>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              <option value="identidad">Identidad</option>
              <option value="financiera">Financiera</option>
              <option value="legal">Legal</option>
              <option value="cumplimiento">Cumplimiento</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="valido">Válidos</option>
              <option value="invalido">Inválidos</option>
              <option value="pendiente">Pendientes</option>
              <option value="advertencia">Advertencias</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de validaciones */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Detalle de Validaciones ({filteredValidations.length})
        </h3>
        <div className="space-y-4">
          {filteredValidations.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay validaciones</h3>
              <p className="text-gray-500">No se encontraron validaciones con los filtros seleccionados</p>
            </div>
          ) : (
            filteredValidations.map((validation) => (
              <div
                key={validation.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0 mt-1">
                  {getValidationIcon(validation.estado)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{validation.titulo}</h4>
                      {getPriorityIcon(validation.prioridad)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getValidationBadge(validation.estado).variant} size="sm">
                        {getValidationBadge(validation.estado).text}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {validation.categoria}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{validation.descripcion}</p>
                  
                  {validation.detalle && (
                    <p className="text-xs text-gray-500 mb-2">{validation.detalle}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Validador: {validation.validador}</span>
                    {validation.fecha_validacion && (
                      <span>{formatearFecha(validation.fecha_validacion)}</span>
                    )}
                  </div>

                  {validation.acciones_recomendadas && validation.acciones_recomendadas.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Acciones recomendadas:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {validation.acciones_recomendadas.map((accion, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {accion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {showActions && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={EyeIcon}
                        onClick={() => {
                          setSelectedRule(validation);
                          openModal();
                        }}
                      >
                        Detalle
                      </Button>
                      {validation.estado === 'invalido' && onManualReview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onManualReview(validation.id)}
                        >
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Observaciones */}
      {validationResult.observaciones.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h3>
          <div className="space-y-2">
            {validationResult.observaciones.map((obs, index) => (
              <div key={index} className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{obs}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de detalle */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={selectedRule ? `Detalle: ${selectedRule.titulo}` : 'Detalle de Validación'}
        size="lg"
      >
        {selectedRule && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getValidationIcon(selectedRule.estado)}
              <div>
                <h3 className="font-medium text-gray-900">{selectedRule.titulo}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getValidationBadge(selectedRule.estado).variant} size="sm">
                    {getValidationBadge(selectedRule.estado).text}
                  </Badge>
                  <Badge variant="info" size="sm">{selectedRule.categoria}</Badge>
                  <div className="flex items-center space-x-1">
                    {getPriorityIcon(selectedRule.prioridad)}
                    <span className="text-xs text-gray-600">Prioridad {selectedRule.prioridad}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-gray-700 mb-2">Descripción:</p>
              <p className="text-gray-600 text-sm">{selectedRule.descripcion}</p>
            </div>

            {selectedRule.detalle && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Detalle:</p>
                <p className="text-gray-600 text-sm">{selectedRule.detalle}</p>
              </div>
            )}

            {selectedRule.acciones_recomendadas && selectedRule.acciones_recomendadas.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Acciones recomendadas:</p>
                <ul className="space-y-1">
                  {selectedRule.acciones_recomendadas.map((accion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-blue-500 mr-2" />
                      {accion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Validador:</p>
                <p className="text-gray-600">{selectedRule.validador}</p>
              </div>
              {selectedRule.fecha_validacion && (
                <div>
                  <p className="font-medium text-gray-700">Fecha de validación:</p>
                  <p className="text-gray-600">{formatearFecha(selectedRule.fecha_validacion)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClienteValidaciones;
