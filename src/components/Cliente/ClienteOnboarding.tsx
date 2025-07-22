import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, LoadingSpinner, Modal, useModal } from '../shared';
import { formatearFecha } from '../../utils/formatters';
import { useClienteManager } from '../../hook/cliente';

interface OnboardingStep {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'completado' | 'en_progreso' | 'pendiente' | 'rechazado';
  fecha_completado?: Date;
  fecha_limite?: Date;
  requerido: boolean;
  orden: number;
  detalles?: string[];
  documentos_necesarios?: string[];
  acciones_disponibles?: string[];
}

interface OnboardingProgress {
  cliente_id: number;
  porcentaje_completitud: number;
  paso_actual: string;
  puede_avanzar: boolean;
  fecha_inicio: Date;
  fecha_estimada_finalizacion?: Date;
  tiempo_promedio_restante?: number; // en días
  pasos: OnboardingStep[];
  documentos_pendientes: string[];
  validaciones_pendientes: string[];
  observaciones: string[];
}

interface ClienteOnboardingProps {
  clienteId?: string;
  onRefresh?: () => void;
  onStepAction?: (stepId: string, action: string) => void;
  onDocumentUpload?: (stepId: string, documentType: string) => void;
  showActions?: boolean;
}

export const ClienteOnboarding: React.FC<ClienteOnboardingProps> = ({
  clienteId,
  onRefresh,
  onStepAction,
  onDocumentUpload,
  showActions = true
}) => {
  const { state } = useClienteManager();
  
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

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
    loadOnboardingProgress();
  }, [cliente.cliente_id]);

  const loadOnboardingProgress = async () => {
    try {
      setLoading(true);
      
      // Calcular progreso basado en datos reales del cliente
      const tieneRFC = !!cliente.rfc;
      const tieneCorreo = !!cliente.correo;
      const tieneTelefono = !!cliente.telefono;
      const tieneNombre = !!cliente.nombre;
      const tieneDocumentos = (cliente.documentos?.length || 0) > 0;
      const tieneSolicitudes = (cliente.solicitudes?.length || 0) > 0;
      
      // Calcular porcentaje basado en datos reales
      const criterios = [tieneRFC, tieneCorreo, tieneTelefono, tieneNombre, tieneDocumentos, tieneSolicitudes];
      const completados = criterios.filter(Boolean).length;
      const porcentaje = (completados / criterios.length) * 100;
      
      // Determinar paso actual basado en lo que falta
      let pasoActual = 'configuracion_productos';
      if (!tieneNombre || !tieneCorreo || !tieneTelefono) pasoActual = 'datos_basicos';
      else if (!tieneDocumentos) pasoActual = 'documentos';
      else if (tieneDocumentos && !tieneSolicitudes) pasoActual = 'informacion_financiera';
      else if (tieneSolicitudes) pasoActual = 'aprobacion_final';
      
      const onboardingProgress: OnboardingProgress = {
        cliente_id: cliente.cliente_id,
        porcentaje_completitud: porcentaje,
        paso_actual: pasoActual,
        puede_avanzar: tieneNombre && tieneCorreo,
        fecha_inicio: cliente.created_at || new Date(),
        fecha_estimada_finalizacion: new Date(Date.now() + (tieneDocumentos && tieneSolicitudes ? 1 : tieneDocumentos ? 5 : 10) * 24 * 60 * 60 * 1000),
        tiempo_promedio_restante: tieneDocumentos && tieneSolicitudes ? 1 : tieneDocumentos ? 3 : tieneNombre && tieneCorreo ? 5 : 7,
        pasos: [
          {
            id: 'datos_basicos',
            titulo: 'Datos Básicos',
            descripcion: 'Información personal y contacto',
            estado: (tieneNombre && tieneCorreo && tieneTelefono) ? 'completado' : 'en_progreso',
            fecha_completado: (tieneNombre && tieneCorreo && tieneTelefono) ? cliente.created_at : undefined,
            requerido: true,
            orden: 1,
            detalles: [
              tieneRFC ? 'RFC capturado' : 'RFC pendiente',
              tieneCorreo ? 'Correo confirmado' : 'Correo pendiente',
              tieneTelefono ? 'Teléfono validado' : 'Teléfono pendiente'
            ],
            acciones_disponibles: ['ver_detalle', 'editar_datos']
          },
          {
            id: 'documentos',
            titulo: 'Documentación',
            descripcion: 'Subir documentos de identidad y comprobantes',
            estado: tieneDocumentos ? 'completado' : (tieneNombre && tieneCorreo) ? 'en_progreso' : 'pendiente',
            fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
            fecha_completado: tieneDocumentos ? cliente.updated_at : undefined,
            requerido: true,
            orden: 2,
            detalles: tieneDocumentos ? 
              [`${cliente.documentos?.length || 0} documento(s) subido(s)`] : 
              ['No hay documentos subidos'],
            documentos_necesarios: tieneDocumentos ? [] : ['Identificación oficial', 'Comprobante de domicilio'],
            acciones_disponibles: tieneDocumentos ? ['ver_documentos'] : ['subir_documento']
          },
          {
            id: 'validacion_identidad',
            titulo: 'Validación de Identidad',
            descripcion: 'Verificación biométrica y documental',
            estado: tieneDocumentos ? 'completado' : 'pendiente',
            fecha_completado: tieneDocumentos ? cliente.updated_at : undefined,
            requerido: true,
            orden: 3,
            detalles: tieneDocumentos ? ['Identidad verificada'] : ['Requiere documentos completos'],
            acciones_disponibles: tieneDocumentos ? ['ver_validacion'] : []
          },
          {
            id: 'informacion_financiera',
            titulo: 'Información Financiera',
            descripcion: 'Ingresos y referencias comerciales',
            estado: tieneSolicitudes ? 'completado' : tieneDocumentos ? 'en_progreso' : 'pendiente',
            fecha_completado: tieneSolicitudes ? cliente.updated_at : undefined,
            requerido: true,
            orden: 4,
            detalles: tieneSolicitudes ? 
              [`${cliente.solicitudes?.length || 0} solicitud(es) creada(s)`] : 
              ['Información financiera pendiente'],
            acciones_disponibles: tieneDocumentos ? ['gestionar_solicitudes'] : []
          },
          {
            id: 'aprobacion_final',
            titulo: 'Aprobación Final',
            descripcion: 'Revisión y aprobación del expediente',
            estado: (tieneSolicitudes && tieneDocumentos) ? 'en_progreso' : 'pendiente',
            requerido: true,
            orden: 5,
            detalles: tieneSolicitudes ? ['En revisión'] : ['Pendiente de completar pasos anteriores'],
            acciones_disponibles: tieneSolicitudes ? ['ver_estatus'] : []
          },
          {
            id: 'configuracion_productos',
            titulo: 'Configuración de Productos',
            descripcion: 'Selección y configuración de productos financieros',
            estado: 'pendiente',
            requerido: false,
            orden: 6,
            detalles: ['Disponible después de aprobación'],
            acciones_disponibles: []
          }
        ],
        documentos_pendientes: tieneDocumentos ? [] : ['Identificación oficial', 'Comprobante de domicilio'],
        validaciones_pendientes: tieneDocumentos ? [] : ['Verificación de documentos'],
        observaciones: [
          ...(tieneDocumentos ? [] : ['Cliente requiere subir documentos de identidad']),
          ...(tieneSolicitudes ? [] : ['Cliente puede crear solicitudes una vez completada la documentación'])
        ]
      };
      
      setProgress(onboardingProgress);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = async (stepId: string, action: string) => {
    if (!onStepAction) return;
    
    try {
      setProcessingAction(`${stepId}-${action}`);
      await onStepAction(stepId, action);
      await loadOnboardingProgress(); // Refrescar datos
    } catch (error) {
      console.error('Error executing step action:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const getStepIcon = (estado: OnboardingStep['estado']) => {
    switch (estado) {
      case 'completado':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'en_progreso':
        return <ClockIcon className="w-6 h-6 text-blue-500" />;
      case 'rechazado':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepBadge = (estado: OnboardingStep['estado']) => {
    const config = {
      completado: { variant: 'success' as const, text: 'Completado' },
      en_progreso: { variant: 'warning' as const, text: 'En progreso' },
      pendiente: { variant: 'default' as const, text: 'Pendiente' },
      rechazado: { variant: 'danger' as const, text: 'Rechazado' }
    };
    return config[estado];
  };

  const getProgressBarColor = (porcentaje: number) => {
    if (porcentaje >= 80) return 'bg-green-500';
    if (porcentaje >= 60) return 'bg-yellow-500';
    if (porcentaje >= 40) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <Card className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Cargando progreso de onboarding...</p>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card className="text-center py-8">
        <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin datos de onboarding</h3>
        <p className="text-gray-500">No se encontró información del proceso de onboarding</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Progreso de Onboarding - {cliente.rfc}
            </h2>
            <p className="text-gray-600 mt-1">
              {cliente.tipo_persona === 'PM' ? cliente.razon_social : `${cliente.nombre} ${cliente.apellido_paterno}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={progress.puede_avanzar ? 'success' : 'warning'} size="sm">
              {progress.puede_avanzar ? 'Puede avanzar' : 'Requiere acción'}
            </Badge>
            {showActions && (
              <Button
                variant="outline"
                leftIcon={ArrowPathIcon}
                onClick={() => {
                  loadOnboardingProgress();
                  onRefresh?.();
                }}
                size="sm"
              >
                Actualizar
              </Button>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso General</span>
            <span className="text-sm font-medium text-gray-900">{progress.porcentaje_completitud}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(progress.porcentaje_completitud)}`}
              style={{ width: `${progress.porcentaje_completitud}%` }}
            />
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{progress.pasos.filter(p => p.estado === 'completado').length}</p>
            <p className="text-sm text-gray-600">Pasos completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{progress.documentos_pendientes.length}</p>
            <p className="text-sm text-gray-600">Documentos pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{progress.tiempo_promedio_restante || 0}</p>
            <p className="text-sm text-gray-600">Días estimados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{progress.validaciones_pendientes.length}</p>
            <p className="text-sm text-gray-600">Validaciones pendientes</p>
          </div>
        </div>

        {/* Fechas importantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Fecha de inicio:</span>
            <span className="ml-2 text-gray-600">{formatearFecha(progress.fecha_inicio)}</span>
          </div>
          {progress.fecha_estimada_finalizacion && (
            <div>
              <span className="font-medium text-gray-700">Finalización estimada:</span>
              <span className="ml-2 text-gray-600">{formatearFecha(progress.fecha_estimada_finalizacion)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de pasos */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pasos del Proceso</h3>
        <div className="space-y-4">
          {progress.pasos
            .sort((a, b) => a.orden - b.orden)
            .map((paso) => (
              <div 
                key={paso.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(paso.estado)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{paso.titulo}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStepBadge(paso.estado).variant} size="sm">
                        {getStepBadge(paso.estado).text}
                      </Badge>
                      {paso.requerido && (
                        <Badge variant="secondary" size="sm">Obligatorio</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{paso.descripcion}</p>
                  
                  {paso.detalles && paso.detalles.length > 0 && (
                    <ul className="text-xs text-gray-500 mb-2 space-y-1">
                      {paso.detalles.map((detalle, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {detalle}
                        </li>
                      ))}
                    </ul>
                  )}

                  {paso.fecha_completado && (
                    <p className="text-xs text-green-600 mb-2">
                      Completado: {formatearFecha(paso.fecha_completado)}
                    </p>
                  )}

                  {paso.fecha_limite && paso.estado !== 'completado' && (
                    <p className="text-xs text-orange-600 mb-2">
                      Fecha límite: {formatearFecha(paso.fecha_limite)}
                    </p>
                  )}

                  {paso.documentos_necesarios && paso.documentos_necesarios.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Documentos necesarios:</p>
                      <div className="flex flex-wrap gap-1">
                        {paso.documentos_necesarios.map((doc, idx) => (
                          <Badge key={idx} variant="info" size="sm">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {showActions && paso.acciones_disponibles && paso.acciones_disponibles.length > 0 && (
                  <div className="flex-shrink-0">
                    <div className="flex flex-col space-y-2">
                      {paso.acciones_disponibles.map((accion) => (
                        <Button
                          key={accion}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (accion === 'ver_detalle') {
                              setSelectedStep(paso);
                              openModal();
                            } else {
                              handleStepAction(paso.id, accion);
                            }
                          }}
                          loading={processingAction === `${paso.id}-${accion}`}
                        >
                          {accion === 'subir_documento' && 'Subir'}
                          {accion === 'ver_documentos' && 'Ver docs'}
                          {accion === 'ver_detalle' && 'Detalle'}
                          {accion === 'iniciar_validacion' && 'Iniciar'}
                          {accion === 'actualizar_ingresos' && 'Actualizar'}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </Card>

      {/* Observaciones */}
      {progress.observaciones.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h3>
          <div className="space-y-2">
            {progress.observaciones.map((obs, index) => (
              <div key={index} className="flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{obs}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de detalle de paso */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={selectedStep ? `Detalle: ${selectedStep.titulo}` : 'Detalle del Paso'}
        size="lg"
      >
        {selectedStep && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getStepIcon(selectedStep.estado)}
              <div>
                <h3 className="font-medium text-gray-900">{selectedStep.titulo}</h3>
                <Badge variant={getStepBadge(selectedStep.estado).variant} size="sm">
                  {getStepBadge(selectedStep.estado).text}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-gray-700 mb-2">Descripción:</p>
              <p className="text-gray-600 text-sm">{selectedStep.descripcion}</p>
            </div>

            {selectedStep.detalles && selectedStep.detalles.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Detalles:</p>
                <ul className="space-y-1">
                  {selectedStep.detalles.map((detalle, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      {detalle}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedStep.documentos_necesarios && selectedStep.documentos_necesarios.length > 0 && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Documentos requeridos:</p>
                <div className="space-y-2">
                  {selectedStep.documentos_necesarios.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{doc}</span>
                      {onDocumentUpload && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDocumentUpload(selectedStep.id, doc)}
                        >
                          Subir
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedStep.fecha_completado && (
                <div>
                  <p className="font-medium text-gray-700">Completado:</p>
                  <p className="text-gray-600">{formatearFecha(selectedStep.fecha_completado)}</p>
                </div>
              )}
              {selectedStep.fecha_limite && (
                <div>
                  <p className="font-medium text-gray-700">Fecha límite:</p>
                  <p className="text-gray-600">{formatearFecha(selectedStep.fecha_limite)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClienteOnboarding;
