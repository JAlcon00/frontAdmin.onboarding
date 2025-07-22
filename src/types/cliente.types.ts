// Tipos basados en el modelo Cliente del backend

export type TipoPersona = 'PF' | 'PF_AE' | 'PM';

export interface Cliente {
  cliente_id: number;
  tipo_persona: TipoPersona;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  razon_social?: string;
  representante_legal?: string;
  rfc: string;
  curp?: string;
  fecha_nacimiento?: Date;
  fecha_constitucion?: Date;
  correo: string;
  telefono?: string;
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
  pais: string;
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  documentos?: Documento[];
  solicitudes?: Solicitud[];
  ingresos?: IngresoCliente[];
}

export interface ClienteCreation {
  tipo_persona: TipoPersona;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  razon_social?: string;
  representante_legal?: string;
  rfc: string;
  curp?: string;
  fecha_nacimiento?: Date;
  fecha_constitucion?: Date;
  correo: string;
  telefono?: string;
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
}

export interface ClienteCompletitud {
  cliente_id: number;
  porcentaje_completitud: number;
  datos_basicos_completos: boolean;
  direccion_completa: boolean;
  campos_faltantes: string[];
  puede_proceder_onboarding: boolean;
}

export interface ClienteFilter {
  tipo_persona?: TipoPersona[];
  estado?: string[];
  codigo_postal?: string;
  fecha_registro_desde?: Date;
  fecha_registro_hasta?: Date;
  completitud_minima?: number;
  tiene_solicitudes?: boolean;
  search?: string;
}

export interface ClienteStats {
  total_clientes: number;
  clientes_pf: number;
  clientes_pf_ae: number;
  clientes_pm: number;
  completitud_promedio: number;
  clientes_con_solicitudes: number;
  clientes_nuevos_mes: number;
}

// Tipos para formularios del frontend
export interface ClienteFormData {
  // Datos básicos
  tipo_persona: TipoPersona;
  correo: string;
  telefono?: string;
  pais: string;
  
  // Persona Física
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: Date;
  curp?: string;
  
  // Persona Moral
  razon_social?: string;
  representante_legal?: string;
  fecha_constitucion?: Date;
  
  // RFC (común)
  rfc: string;
  
  // Dirección
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  codigo_postal?: string;
  ciudad?: string;
  estado?: string;
}

// Importar tipos relacionados (solo tipos)
import type { Documento } from './documento.types';
import type { Solicitud } from './solicitud.types';

// Tipos actualizados basados en el modelo IngresoCliente del backend

export interface IngresoCliente {
  ingreso_id: number;
  cliente_id: number;
  tipo_persona: TipoPersona;
  sector: string;
  giro?: string;
  ingreso_anual: number;
  moneda: string;
  fecha_registro: Date;
  
  // Relaciones
  cliente?: Cliente;
  
  // Campos calculados
  ingreso_mensual?: number;
  ingreso_formateado?: string;
}

export interface IngresoClienteCreation {
  cliente_id: number;
  tipo_persona: TipoPersona;
  sector: string;
  giro?: string;
  ingreso_anual: number;
  moneda: string;
}

export interface IngresoClienteUpdate {
  sector?: string;
  giro?: string;
  ingreso_anual?: number;
  moneda?: string;
}

export interface IngresoClienteFilter {
  cliente_id?: number;
  tipo_persona?: TipoPersona[];
  sector?: string[];
  moneda?: string[];
  ingreso_minimo?: number;
  ingreso_maximo?: number;
  fecha_registro_desde?: Date;
  fecha_registro_hasta?: Date;
}

export interface IngresoClienteStats {
  total_ingresos: number;
  ingreso_promedio: number;
  ingreso_minimo: number;
  ingreso_maximo: number;
  sectores_principales: Array<{
    sector: string;
    cantidad: number;
    promedio_ingreso: number;
  }>;
  distribución_moneda: Array<{
    moneda: string;
    cantidad: number;
    porcentaje: number;
  }>;
}

// Tipos para sectores económicos
export interface SectorEconomico {
  codigo: string;
  nombre: string;
  descripcion?: string;
  giros_comunes: string[];
  activo: boolean;
}

export interface GiroComercial {
  codigo: string;
  nombre: string;
  sector: string;
  descripcion?: string;
  riesgo_nivel: 'bajo' | 'medio' | 'alto';
  activo: boolean;
}

export interface ClienteEstadisticas {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  clientes_pendientes_aprobacion: number;
  clientes_rechazados: number;
  porcentaje_completitud_promedio: number;
  clientes_por_tipo: {
    fisica: number;
    moral: number;
  };
  onboarding_completados_mes: number;
  tendencia_mensual: {
    mes: string;
    nuevos_clientes: number;
    onboarding_completados: number;
  }[];
}