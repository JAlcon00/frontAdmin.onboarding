// Tipos actualizados basados en el modelo DocumentoTipo del backend

export type EstatusDocumento = 'pendiente' | 'aceptado' | 'rechazado' | 'vencido';

export interface DocumentoTipo {
  documento_tipo_id: number;
  nombre: string;
  aplica_pf: boolean;
  aplica_pfae: boolean;
  aplica_pm: boolean;
  vigencia_dias?: number;
  opcional: boolean;
  
  // Campos calculados (se procesarán en el frontend)
  descripcion_vigencia?: string;
  aplica_tipo_persona?: boolean;
  necesita_renovacion?: boolean;
  es_documento_una_vez?: boolean;
}

export interface DocumentoTipoCreation {
  nombre: string;
  aplica_pf: boolean;
  aplica_pfae: boolean;
  aplica_pm: boolean;
  vigencia_dias?: number;
  opcional: boolean;
}

export interface DocumentoTipoFilter {
  aplica_pf?: boolean;
  aplica_pfae?: boolean;
  aplica_pm?: boolean;
  opcional?: boolean;
  con_vigencia?: boolean;
  vigencia_dias?: number;
  nombre?: string;
}

export interface Documento {
  documento_id: number;
  cliente_id: number;
  documento_tipo_id: number;
  archivo_url: string;
  fecha_documento: Date;
  fecha_subida: Date;
  fecha_expiracion?: Date;
  estatus: EstatusDocumento;
  comentario_revisor?: string;
  
  // Relaciones
  cliente?: Cliente;
  documento_tipo?: DocumentoTipo;
  
  // Campos calculados
  esta_vencido?: boolean;
  dias_hasta_vencimiento?: number;
  proximo_a_vencer?: boolean;
  es_valido?: boolean;
}

export interface DocumentoCreation {
  cliente_id: number;
  documento_tipo_id: number;
  archivo_url: string;
  fecha_documento: Date;
  fecha_expiracion?: Date;
}

export interface DocumentoUpdate {
  estatus?: EstatusDocumento;
  comentario_revisor?: string;
  fecha_expiracion?: Date;
}

export interface DocumentoFilter {
  cliente_id?: number;
  documento_tipo_id?: number;
  estatus?: EstatusDocumento[];
  fecha_subida_desde?: Date;
  fecha_subida_hasta?: Date;
  fecha_expiracion_desde?: Date;
  fecha_expiracion_hasta?: Date;
  proximo_vencer?: boolean;
  dias_vencimiento?: number;
  tipo_persona?: TipoPersona;
}

export interface DocumentoStats {
  total_documentos: number;
  documentos_pendientes: number;
  documentos_aceptados: number;
  documentos_rechazados: number;
  documentos_vencidos: number;
  documentos_proximos_vencer: number;
}

export interface DocumentoRequerido {
  documento_tipo_id: number;
  documento_tipo: DocumentoTipo;
  documento_subido?: Documento;
  es_obligatorio: boolean;
  esta_completo: boolean;
  esta_vencido: boolean;
  dias_para_vencimiento?: number;
}

export interface DocumentoCompletitud {
  cliente_id: number;
  tipo_persona: TipoPersona;
  documentos_requeridos: DocumentoRequerido[];
  total_requeridos: number;
  total_subidos: number;
  total_aceptados: number;
  total_pendientes: number;
  total_rechazados: number;
  total_vencidos: number;
  porcentaje_completitud: number;
  puede_proceder: boolean;
  documentos_faltantes: string[];
}

export interface DocumentoValidation {
  es_valido: boolean;
  errores: string[];
  advertencias: string[];
}

export interface DocumentoRevision {
  documento_id: number;
  revisor_id: number;
  accion: 'aprobar' | 'rechazar';
  comentario?: string;
  fecha_revision: Date;
}

export interface DocumentoAlerta {
  documento_id: number;
  cliente_id: number;
  cliente_nombre: string;
  documento_tipo: string;
  tipo_alerta: 'vencimiento_proximo' | 'vencido' | 'rechazado' | 'faltante';
  mensaje: string;
  dias_restantes?: number;
  prioridad: 'alta' | 'media' | 'baja';
  fecha_alerta: Date;
}

// Tipos para upload de archivos
export interface DocumentoUpload {
  cliente_id: number;
  documento_tipo_id: number;
  archivo: File;
  fecha_documento: Date;
  fecha_expiracion?: Date;
}

export interface DocumentoUploadResponse {
  success: boolean;
  documento?: Documento;
  error?: string;
  validaciones?: DocumentoValidation;
}

// Tipos para gestión masiva de documentos
export interface DocumentoMasivo {
  documento_ids: number[];
  accion: 'aprobar' | 'rechazar' | 'marcar_vencido';
  comentario?: string;
  revisor_id: number;
}

export interface DocumentoMasivoResponse {
  success: boolean;
  procesados: number;
  errores: Array<{
    documento_id: number;
    error: string;
  }>;
}

// Importar tipos relacionados
import type { Cliente, TipoPersona } from './cliente.types';