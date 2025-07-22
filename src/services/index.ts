// Índice de servicios para el frontend admin

export { apiService } from './api.service';
export { usuarioService } from './usuario.service';
export { clienteService } from './cliente.service';
export { documentoService } from './documento.service';
export { solicitudService } from './solicitud.service';

// Re-exportar tipos y interfaces de servicios
export type { 
  SolicitudCompleta, 
  SolicitudEstadisticas, 
  SolicitudResumen 
} from './solicitud.service';
export type { 
  ClienteCompletitud 
} from './cliente.service';
export type { 
  DocumentoCompletitud 
} from './documento.service';
