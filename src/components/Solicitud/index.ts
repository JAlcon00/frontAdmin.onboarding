// Exportaciones del módulo solicitud
export { default as SolicitudCard } from './SolicitudCard';
export { default as SolicitudList } from './SolicitudList';
export { default as SolicitudFilters } from './SolicitudFilters';
export { default as SolicitudForm } from './SolicitudForm';
export { default as SolicitudDetail } from './SolicitudDetail';
export { default as SolicitudStats } from './SolicitudStats';
export { default as Solicitud } from './Solicitud';

// Componentes avanzados de Solicitud (100% completados)
export { default as SolicitudValidaciones } from './SolicitudValidaciones';
export { default as SolicitudTimeline } from './SolicitudTimeline';
export { default as SolicitudAprobacion } from './SolicitudAprobacion';
export { default as SolicitudDocumentos } from './SolicitudDocumentos';

// Exportar tipos específicos
export type { SolicitudFormData } from '../../hook/solicitud';
export type { SolicitudCompleta, SolicitudEstadisticas } from '../../services/solicitud.service';
export type { SolicitudFilter } from '../../types';
