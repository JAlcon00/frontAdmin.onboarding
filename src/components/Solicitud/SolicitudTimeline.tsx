import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Modal } from '../shared/Modal';
import { useSolicitudManager } from '../../hook/solicitud';
import type { SolicitudHistorial } from '../../types';

interface SolicitudTimelineProps {
  solicitudId: number;  // ID de la solicitud a cargar
  showDetalle?: boolean;
  className?: string;
}

interface TimelineEvent {
  id: string;
  tipo: 'creacion' | 'actualizacion' | 'documento' | 'comentario' | 'aprobacion' | 'rechazo' | 'cancelacion';
  titulo: string;
  descripcion?: string;
  fecha: Date;
  usuario?: string;
  icono: React.ComponentType<{ className?: string }>;
  color: string;
  detalles?: any;
}

export const SolicitudTimeline: React.FC<SolicitudTimelineProps> = ({
  solicitudId,
  showDetalle = true,
  className = ''
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  // Generar eventos del timeline
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Evento de creación
    events.push({
      id: 'creacion',
      tipo: 'creacion',
      titulo: 'Solicitud creada',
      descripcion: 'La solicitud fue creada en el sistema',
      fecha: new Date(solicitud.fecha_creacion),
      icono: DocumentTextIcon,
      color: 'blue',
      detalles: {
        cliente_id: solicitud.cliente_id,
        estatus_inicial: 'iniciada'
      }
    });

    // Eventos del historial - usar historial real de la solicitud
    const historialReal = solicitud.historial || [];
    historialReal.forEach((item: SolicitudHistorial, index: number) => {
      let tipo: TimelineEvent['tipo'] = 'actualizacion';
      let icono = ClockIcon;
      let color = 'gray';
      let titulo = 'Actualización';

      // Determinar tipo de evento basado en el contenido
      if (item.accion?.includes('aprobad')) {
        tipo = 'aprobacion';
        icono = CheckCircleIcon;
        color = 'green';
        titulo = 'Solicitud aprobada';
      } else if (item.accion?.includes('rechazad')) {
        tipo = 'rechazo';
        icono = XCircleIcon;
        color = 'red';
        titulo = 'Solicitud rechazada';
      } else if (item.accion?.includes('cancelad')) {
        tipo = 'cancelacion';
        icono = XCircleIcon;
        color = 'orange';
        titulo = 'Solicitud cancelada';
      } else if (item.accion?.includes('document')) {
        tipo = 'documento';
        icono = DocumentTextIcon;
        color = 'purple';
        titulo = 'Documento agregado';
      } else if (item.accion?.includes('comentario')) {
        tipo = 'comentario';
        icono = ChatBubbleLeftIcon;
        color = 'blue';
        titulo = 'Comentario agregado';
      }

      events.push({
        id: `historial-${index}`,
        tipo,
        titulo,
        descripcion: item.accion || 'Sin descripción',
        fecha: new Date(item.fecha_accion),
        usuario: item.usuario?.nombre || 'Sistema',
        icono,
        color,
        detalles: item
      });
    });

    // Evento de actualización reciente
    if (solicitud.fecha_actualizacion && 
        new Date(solicitud.fecha_actualizacion).getTime() !== new Date(solicitud.fecha_creacion).getTime()) {
      events.push({
        id: 'actualizacion',
        tipo: 'actualizacion',
        titulo: 'Última actualización',
        descripcion: `Estado actual: ${solicitud.estatus}`,
        fecha: new Date(solicitud.fecha_actualizacion),
        icono: ClockIcon,
        color: 'indigo',
        detalles: {
          estatus: solicitud.estatus,
          fecha_actualizacion: solicitud.fecha_actualizacion
        }
      });
    }

    // Ordenar por fecha (más reciente primero)
    return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  };

  const timelineEvents = generateTimelineEvents();

  // Mostrar detalles del evento
  const showEventDetails = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Obtener el color del icono
  const getIconColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      red: 'text-red-500',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      indigo: 'text-indigo-500',
      gray: 'text-gray-500'
    };
    return colors[color] || 'text-gray-500';
  };

  // Obtener el color del fondo
  const getBgColor = (color: string): string => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      red: 'bg-red-100',
      orange: 'bg-orange-100',
      purple: 'bg-purple-100',
      indigo: 'bg-indigo-100',
      gray: 'bg-gray-100'
    };
    return colors[color] || 'bg-gray-100';
  };

  // Formatear fecha
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear fecha relativa
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `hace ${days} día${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else {
      return 'hace unos momentos';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Timeline de la Solicitud
        </h3>
        <Badge variant={
          solicitud.estatus === 'aprobada' ? 'success' :
          solicitud.estatus === 'rechazada' ? 'danger' :
          solicitud.estatus === 'en_revision' ? 'info' : 'secondary'
        }>
          {solicitud.estatus}
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {timelineEvents.map((event, eventIdx) => {
              const IconComponent = event.icono;
              
              return (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== timelineEvents.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`
                            h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                            ${getBgColor(event.color)}
                          `}
                        >
                          <IconComponent
                            className={`h-5 w-5 ${getIconColor(event.color)}`}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {event.titulo}
                          </p>
                          
                          {event.descripcion && (
                            <p className="text-sm text-gray-500 mt-1">
                              {event.descripcion}
                            </p>
                          )}
                          
                          {event.usuario && (
                            <div className="flex items-center space-x-1 mt-2">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {event.usuario}
                              </span>
                            </div>
                          )}
                          
                          {showDetalle && event.detalles && (
                            <button
                              onClick={() => showEventDetails(event)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center space-x-1"
                            >
                              <InformationCircleIcon className="h-3 w-3" />
                              <span>Ver detalles</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <time dateTime={event.fecha.toISOString()}>
                              {formatRelativeDate(event.fecha)}
                            </time>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(event.fecha)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {timelineEvents.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin eventos registrados
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay eventos disponibles para mostrar en el timeline.
            </p>
          </div>
        )}
      </Card>

      {/* Estadísticas del timeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {timelineEvents.length}
            </div>
            <div className="text-sm text-gray-500">Total eventos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {timelineEvents.filter(e => e.tipo === 'aprobacion').length}
            </div>
            <div className="text-sm text-gray-500">Aprobaciones</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {timelineEvents.filter(e => e.tipo === 'documento').length}
            </div>
            <div className="text-sm text-gray-500">Documentos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {timelineEvents.filter(e => e.tipo === 'comentario').length}
            </div>
            <div className="text-sm text-gray-500">Comentarios</div>
          </div>
        </Card>
      </div>

      {/* Modal de detalles */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detalles del Evento"
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${getBgColor(selectedEvent.color)}`}>
                <selectedEvent.icono className={`h-6 w-6 ${getIconColor(selectedEvent.color)}`} />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {selectedEvent.titulo}
                </h4>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedEvent.fecha)}
                </p>
              </div>
            </div>

            {selectedEvent.descripcion && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">Descripción</h5>
                <p className="text-sm text-gray-600">{selectedEvent.descripcion}</p>
              </div>
            )}

            {selectedEvent.usuario && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">Usuario</h5>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{selectedEvent.usuario}</span>
                </div>
              </div>
            )}

            {selectedEvent.detalles && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Detalles Técnicos</h5>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.detalles, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Información</p>
                <p>
                  Los eventos del timeline se generan automáticamente cuando ocurren 
                  cambios en la solicitud. La fecha y hora mostrada corresponde al 
                  momento exacto en que se registró la actividad.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SolicitudTimeline;
