import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  InformationCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { useSolicitudManager } from '../../hook/solicitud';

interface SolicitudAprobacionProps {
  solicitudId: number;  // ID de la solicitud a cargar
  onApprove?: (data: AprobacionData) => Promise<void>;
  onReject?: (data: RechazoData) => Promise<void>;
  onRequestChanges?: (data: CambiosData) => Promise<void>;
  currentUserId?: number;
  className?: string;
}

interface AprobacionData {
  comentario?: string;
  condiciones?: string[];
  nivel_aprobacion: 'nivel1' | 'nivel2' | 'nivel3' | 'final';
}

interface RechazoData {
  motivo: string;
  comentario: string;
  motivos_detallados: string[];
}

interface CambiosData {
  comentario: string;
  cambios_requeridos: string[];
  plazo_respuesta?: number; // días
}

interface DecisionScoring {
  puntuacion_general: number;
  criterios: {
    documentacion: number;
    solvencia: number;
    experiencia: number;
    riesgo: number;
  };
  recomendacion: 'aprobar' | 'rechazar' | 'revisar';
}

export const SolicitudAprobacion: React.FC<SolicitudAprobacionProps> = ({
  solicitudId,
  onApprove,
  onReject,
  onRequestChanges,
  currentUserId,
  className = ''
}) => {
  // Usar hooks reales para cargar datos
  const { state, obtener } = useSolicitudManager();
  const { selectedSolicitud: solicitud, loading, error } = state;
  
  // Cargar solicitud si se proporciona el ID
  useEffect(() => {
    if (solicitudId) {
      obtener(solicitudId);
    }
  }, [solicitudId, obtener]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
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
      <div className="bg-white shadow rounded-lg p-6">
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center text-gray-500">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Solicitud no encontrada</span>
        </div>
      </div>
    );
  }
  const [accionActiva, setAccionActiva] = useState<'aprobar' | 'rechazar' | 'cambios' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados del formulario
  const [comentario, setComentario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [condiciones, setCondiciones] = useState<string[]>([]);
  const [motivosDetallados, setMotivosDetallados] = useState<string[]>([]);
  const [cambiosRequeridos, setCambiosRequeridos] = useState<string[]>([]);
  const [plazoRespuesta, setPlazoRespuesta] = useState<number>(7);
  const [nivelAprobacion, setNivelAprobacion] = useState<'nivel1' | 'nivel2' | 'nivel3' | 'final'>('nivel1');

  // Scoring automático de la decisión
  const [scoring, setScoring] = useState<DecisionScoring | null>(null);

  // Calcular scoring automático basado en datos reales
  useEffect(() => {
    if (!solicitud) return;
    
    const calcularScoring = (): DecisionScoring => {
      // Usar datos reales de la solicitud para calcular scoring
      const tieneDocumentos = (solicitud.documentos?.length || 0) > 0;
      const tieneProductos = (solicitud.productos?.length || 0) > 0;
      const estatusValido = solicitud.estatus !== 'rechazada' && solicitud.estatus !== 'cancelada';
      
      // Cálculos determinísticos basados en datos reales (sin Math.random)
      const documentosCount = solicitud.documentos?.length || 0;
      const clienteCompleto = solicitud.cliente && solicitud.cliente.rfc && solicitud.cliente.correo;
      const productosCount = solicitud.productos?.length || 0;
      const montoSolicitado = solicitud.productos?.[0]?.monto || 0;
      
      // Scoring basado en datos reales:
      // Documentación: más documentos = mejor score
      const documentacion = tieneDocumentos ? 
        Math.min(95, 60 + (documentosCount * 10)) : 30;
      
      // Solvencia: basada en completitud del cliente y monto
      const solvencia = clienteCompleto ? 
        Math.min(95, 70 + (montoSolicitado > 100000 ? 10 : 20)) : 45;
      
      // Experiencia: basada en número de productos solicitados
      const experiencia = tieneProductos ? 
        Math.min(95, 65 + (productosCount * 8)) : 40;
      
      // Riesgo: basado en estatus y consistencia de datos
      const riesgo = estatusValido && clienteCompleto && tieneDocumentos ? 85 : 35;
      
      const puntuacion_general = Math.round((documentacion + solvencia + experiencia + riesgo) / 4);
      
      let recomendacion: 'aprobar' | 'rechazar' | 'revisar';
      if (puntuacion_general >= 80) {
        recomendacion = 'aprobar';
      } else if (puntuacion_general >= 60) {
        recomendacion = 'revisar';
      } else {
        recomendacion = 'rechazar';
      }

      return {
        puntuacion_general,
        criterios: { 
          documentacion: Math.round(documentacion), 
          solvencia: Math.round(solvencia), 
          experiencia: Math.round(experiencia), 
          riesgo: Math.round(riesgo) 
        },
        recomendacion
      };
    };

    setScoring(calcularScoring());
  }, [solicitud]);

  // Opciones predefinidas
  const condicionesPredefinidas = [
    'Proporcionar garantía adicional',
    'Reducir monto solicitado en 20%',
    'Incrementar plazo de pago',
    'Proporcionar aval corporativo',
    'Actualizar información financiera',
    'Completar documentación legal',
    'Establecer cuenta de garantía'
  ];

  const motivosRechazoPredefinidos = [
    'Insuficiente capacidad de pago',
    'Documentación incompleta',
    'Historial crediticio adverso',
    'Garantías insuficientes',
    'Información financiera desactualizada',
    'No cumple políticas internas',
    'Riesgo operativo elevado'
  ];

  const cambiosPredefinidos = [
    'Actualizar estados financieros',
    'Proporcionar referencias comerciales',
    'Completar información legal',
    'Clarificar propósito del crédito',
    'Proporcionar plan de negocio',
    'Actualizar información de contacto',
    'Revisar términos y condiciones'
  ];

  // Handlers para abrir modales
  const handleAprobar = () => {
    setAccionActiva('aprobar');
    setShowModal(true);
    setComentario('');
    setCondiciones([]);
  };

  const handleRechazar = () => {
    setAccionActiva('rechazar');
    setShowModal(true);
    setComentario('');
    setMotivo('');
    setMotivosDetallados([]);
  };

  const handleSolicitarCambios = () => {
    setAccionActiva('cambios');
    setShowModal(true);
    setComentario('');
    setCambiosRequeridos([]);
    setPlazoRespuesta(7);
  };

  // Handler para ejecutar acción
  const ejecutarAccion = async () => {
    if (!accionActiva) return;

    setIsProcessing(true);
    try {
      switch (accionActiva) {
        case 'aprobar':
          if (onApprove) {
            await onApprove({
              comentario,
              condiciones,
              nivel_aprobacion: nivelAprobacion
            });
          }
          break;
        case 'rechazar':
          if (onReject) {
            await onReject({
              motivo,
              comentario,
              motivos_detallados: motivosDetallados
            });
          }
          break;
        case 'cambios':
          if (onRequestChanges) {
            await onRequestChanges({
              comentario,
              cambios_requeridos: cambiosRequeridos,
              plazo_respuesta: plazoRespuesta
            });
          }
          break;
      }
      setShowModal(false);
      setAccionActiva(null);
    } catch (error) {
      console.error('Error al procesar acción:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verificar si el usuario puede realizar acciones
  const puedeActuar = solicitud?.estatus === 'en_revision' && currentUserId;

  // Obtener color del scoring
  const getScoringColor = (puntuacion: number): string => {
    if (puntuacion >= 80) return 'text-green-600';
    if (puntuacion >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoringBgColor = (puntuacion: number): string => {
    if (puntuacion >= 80) return 'bg-green-100';
    if (puntuacion >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Toggle para arrays
  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estado actual */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Proceso de Aprobación
        </h3>
        <Badge variant={
          solicitud?.estatus === 'aprobada' ? 'success' :
          solicitud?.estatus === 'rechazada' ? 'danger' :
          solicitud?.estatus === 'en_revision' ? 'info' : 'secondary'
        }>
          {solicitud?.estatus}
        </Badge>
      </div>

      {/* Panel de scoring automático */}
      {scoring && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Análisis Automático de Apoyo
            </h4>
            <div className="flex items-center space-x-2">
              <div className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${getScoringBgColor(scoring.puntuacion_general)}
                ${getScoringColor(scoring.puntuacion_general)}
              `}>
                {scoring.puntuacion_general}/100
              </div>
              <span className="text-xs text-gray-500">Solo orientativo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scoring.criterios.documentacion}
              </div>
              <div className="text-sm text-gray-500">Documentación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scoring.criterios.solvencia}
              </div>
              <div className="text-sm text-gray-500">Solvencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {scoring.criterios.experiencia}
              </div>
              <div className="text-sm text-gray-500">Experiencia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {scoring.criterios.riesgo}
              </div>
              <div className="text-sm text-gray-500">Gestión Riesgo</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <span className="text-sm font-medium text-blue-900">
                Recomendación del Sistema (solo orientativa):
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={
                  scoring.recomendacion === 'aprobar' ? 'success' :
                  scoring.recomendacion === 'revisar' ? 'warning' : 'danger'
                }>
                  {scoring.recomendacion === 'aprobar' ? 'Aprobar' :
                   scoring.recomendacion === 'revisar' ? 'Revisar' : 'Rechazar'}
                </Badge>
                <span className="text-xs text-blue-700">
                  La decisión final es responsabilidad del usuario
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Botones de acción */}
      {puedeActuar && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Decisión de Aprobación
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4" />
              <span>Autorización exclusiva del usuario</span>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante - Responsabilidad del Usuario</p>
                <p>
                  El análisis automático es únicamente una herramienta de apoyo. 
                  La decisión final de aprobar, rechazar o solicitar cambios es 
                  <strong> exclusiva responsabilidad del usuario autorizado</strong>.
                  El sistema no toma decisiones automáticas.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleAprobar}
              variant="success"
              className="flex items-center justify-center space-x-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>Aprobar</span>
            </Button>
            
            <Button
              onClick={handleSolicitarCambios}
              variant="warning"
              className="flex items-center justify-center space-x-2"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Solicitar Cambios</span>
            </Button>
            
            <Button
              onClick={handleRechazar}
              variant="danger"
              className="flex items-center justify-center space-x-2"
            >
              <XCircleIcon className="h-5 w-5" />
              <span>Rechazar</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Historial de comentarios */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Comentarios del Proceso
        </h4>
        
        {solicitud?.comentarios && solicitud.comentarios.length > 0 ? (
          <div className="space-y-4">
            {solicitud.comentarios.map((comentario, index) => (
              <div key={comentario.comentario_id || index} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {comentario.usuario?.nombre || 'Usuario'}
                    </span>
                    <Badge variant={
                      comentario.tipo === 'interno' ? 'secondary' :
                      comentario.tipo === 'cliente' ? 'info' : 'warning'
                    }>
                      {comentario.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{new Date(comentario.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{comentario.comentario}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin comentarios
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay comentarios registrados en el proceso.
            </p>
          </div>
        )}
      </Card>

      {/* Modal para acciones */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          accionActiva === 'aprobar' ? 'Aprobar Solicitud' :
          accionActiva === 'rechazar' ? 'Rechazar Solicitud' :
          'Solicitar Cambios'
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Formulario específico según la acción */}
          {accionActiva === 'aprobar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Aprobación
                </label>
                <select
                  value={nivelAprobacion}
                  onChange={(e) => setNivelAprobacion(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="nivel1">Nivel 1 - Analista</option>
                  <option value="nivel2">Nivel 2 - Supervisor</option>
                  <option value="nivel3">Nivel 3 - Gerente</option>
                  <option value="final">Aprobación Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones de Aprobación (opcional)
                </label>
                <div className="space-y-2">
                  {condicionesPredefinidas.map((condicion) => (
                    <label key={condicion} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={condiciones.includes(condicion)}
                        onChange={() => toggleArrayItem(condiciones, setCondiciones, condicion)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{condicion}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {accionActiva === 'rechazar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo Principal *
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar motivo...</option>
                  {motivosRechazoPredefinidos.map((motivoPred) => (
                    <option key={motivoPred} value={motivoPred}>{motivoPred}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivos Detallados
                </label>
                <div className="space-y-2">
                  {motivosRechazoPredefinidos.map((motivoDet) => (
                    <label key={motivoDet} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={motivosDetallados.includes(motivoDet)}
                        onChange={() => toggleArrayItem(motivosDetallados, setMotivosDetallados, motivoDet)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{motivoDet}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {accionActiva === 'cambios' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cambios Requeridos
                </label>
                <div className="space-y-2">
                  {cambiosPredefinidos.map((cambio) => (
                    <label key={cambio} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={cambiosRequeridos.includes(cambio)}
                        onChange={() => toggleArrayItem(cambiosRequeridos, setCambiosRequeridos, cambio)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{cambio}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plazo de Respuesta (días)
                </label>
                <input
                  type="number"
                  value={plazoRespuesta}
                  onChange={(e) => setPlazoRespuesta(parseInt(e.target.value) || 7)}
                  min="1"
                  max="30"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Comentario general */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios {accionActiva === 'rechazar' ? '*' : '(opcional)'}
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Escriba aquí sus comentarios adicionales..."
              required={accionActiva === 'rechazar'}
            />
          </div>

          {/* Información adicional */}
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Responsabilidad de Decisión</p>
              <p>
                Usted como usuario autorizado es el único responsable de esta decisión. 
                Esta acción será registrada en el historial de la solicitud con su identificación 
                y notificada automáticamente a todas las partes involucradas.
                El análisis del sistema es solo orientativo.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant={
                accionActiva === 'aprobar' ? 'success' :
                accionActiva === 'rechazar' ? 'danger' : 'warning'
              }
              onClick={ejecutarAccion}
              disabled={
                isProcessing || 
                (accionActiva === 'rechazar' && (!motivo || !comentario)) ||
                (accionActiva === 'cambios' && cambiosRequeridos.length === 0)
              }
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                accionActiva === 'aprobar' ? 'Aprobar' :
                accionActiva === 'rechazar' ? 'Rechazar' : 'Solicitar Cambios'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SolicitudAprobacion;
