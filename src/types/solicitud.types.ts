// Tipos basados en el modelo Solicitud del backend

export type EstatusSolicitud = 'iniciada' | 'en_revision' | 'aprobada' | 'rechazada' | 'cancelada';
export type ProductoCodigo = 'CS' | 'CC' | 'FA' | 'AR'; // Crédito Simple, Cuenta Corriente, Factoraje, Arrendamiento
export type Moneda = 'MXN' | 'USD';

export interface Solicitud {
  solicitud_id: number;
  cliente_id: number;
  estatus: EstatusSolicitud;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  
  // Relaciones
  cliente?: Cliente;
  productos?: SolicitudProducto[];
  documentos?: SolicitudDocumento[];
  comentarios?: SolicitudComentario[];
  historial?: SolicitudHistorial[];
}

export interface SolicitudProducto {
  solicitud_producto_id: number;
  solicitud_id: number;
  producto: ProductoCodigo;
  monto: number;
  plazo_meses: number;
  fecha_registro: Date;
  
  // Relaciones
  solicitud?: Solicitud;
  
  // Campos calculados
  nombre_producto?: string;
  pago_mensual_estimado?: number;
  monto_formateado?: string;
}

export interface SolicitudDocumento {
  solicitud_documento_id: number;
  solicitud_id: number;
  documento_id: number;
  requerido: boolean;
  created_at: Date;
  
  // Relaciones
  documento?: Documento;
}

export interface SolicitudComentario {
  comentario_id: number;
  solicitud_id: number;
  usuario_id: number;
  comentario: string;
  tipo: 'interno' | 'cliente' | 'sistema';
  created_at: Date;
  
  // Relaciones
  usuario?: Usuario;
}

export interface SolicitudHistorial {
  historial_id: number;
  solicitud_id: number;
  usuario_id: number;
  accion: string;
  estatus_anterior?: EstatusSolicitud;
  estatus_nuevo?: EstatusSolicitud;
  comentario?: string;
  fecha_accion: Date;
  
  // Relaciones
  usuario?: Usuario;
}

export interface SolicitudCreation {
  cliente_id: number;
  productos: Array<{
    producto_codigo: ProductoCodigo;
    monto_solicitado: number;
    moneda: Moneda;
    plazo_meses: number;
  }>;
}

export interface SolicitudUpdate {
  estatus?: EstatusSolicitud;
  comentario?: string;
  usuario_id?: number;
}

export interface SolicitudFilter {
  cliente_id?: number;
  estatus?: EstatusSolicitud[];
  producto_codigo?: ProductoCodigo[];
  fecha_creacion_desde?: Date;
  fecha_creacion_hasta?: Date;
  fecha_actualizacion_desde?: Date;
  fecha_actualizacion_hasta?: Date;
  monto_minimo?: number;
  monto_maximo?: number;
  moneda?: Moneda[];
  asignado_a?: number;
  search?: string;
}

export interface SolicitudStats {
  total_solicitudes: number;
  solicitudes_iniciadas: number;
  solicitudes_en_revision: number;
  solicitudes_aprobadas: number;
  solicitudes_rechazadas: number;
  solicitudes_canceladas: number;
  monto_total_solicitado: number;
  monto_total_aprobado: number;
  tiempo_promedio_aprobacion: number; // en días
}

export interface SolicitudDetalle {
  solicitud: Solicitud;
  cliente: Cliente;
  productos: SolicitudProducto[];
  documentos: SolicitudDocumento[];
  comentarios: SolicitudComentario[];
  historial: SolicitudHistorial[];
  completitud_documentos: number;
  puede_aprobar: boolean;
  puede_rechazar: boolean;
  puede_cancelar: boolean;
}

export interface SolicitudAprobacion {
  solicitud_id: number;
  aprobada: boolean;
  monto_aprobado?: number;
  tasa_aprobada?: number;
  plazo_aprobado?: number;
  comentario?: string;
  condiciones?: string;
  fecha_aprobacion: Date;
  aprobado_por: number;
}

export interface SolicitudFlujo {
  solicitud_id: number;
  pasos: Array<{
    paso: number;
    nombre: string;
    descripcion: string;
    completado: boolean;
    fecha_completado?: Date;
    requerido: boolean;
    documentos_requeridos?: string[];
  }>;
  paso_actual: number;
  puede_avanzar: boolean;
  porcentaje_completitud: number;
}

export interface SolicitudAsignacion {
  solicitud_id: number;
  asignado_a: number;
  asignado_por: number;
  fecha_asignacion: Date;
  comentario?: string;
}

export interface SolicitudReporte {
  solicitud_id: number;
  folio: string;
  cliente_nombre: string;
  cliente_rfc: string;
  tipo_persona: string;
  productos: string[];
  monto_total: number;
  estatus: EstatusSolicitud;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  tiempo_en_proceso: number; // días
  completitud_documentos: number;
  gestor_asignado?: string;
}

// Importar tipos relacionados
import type { Cliente } from './cliente.types';
import type { Documento } from './documento.types';
import type { Usuario } from './usuario.types';