// Tipos basados en el modelo Usuario del backend

export type RolUsuario = 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
export type EstatusUsuario = 'activo' | 'suspendido';

export interface Usuario {
  usuario_id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  rol: RolUsuario;
  estatus: EstatusUsuario;
  created_at: Date;
  updated_at: Date;
  // Métodos computados (se calcularán en el frontend)
  nombre_completo?: string;
  esta_activo?: boolean;
}

export interface UsuarioCreation {
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  password: string;
  rol: RolUsuario;
  estatus?: EstatusUsuario;
}

export interface UsuarioUpdate {
  nombre?: string;
  apellido?: string;
  username?: string;
  correo?: string;
  password?: string;
  rol?: RolUsuario;
  estatus?: EstatusUsuario;
}

export interface UsuarioLogin {
  username: string;
  password: string;
}

export interface UsuarioAuth {
  usuario: Usuario;
  token: string;
  expires_at: Date;
  permisos: string[];
}

export interface UsuarioFilter {
  rol?: RolUsuario[];
  estatus?: EstatusUsuario[];
  fecha_creacion_desde?: Date;
  fecha_creacion_hasta?: Date;
  search?: string;
}

export interface UsuarioStats {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_suspendidos: number;
  usuarios_super: number;
  usuarios_admin: number;
  usuarios_auditor: number;
  usuarios_operador: number;
  usuarios_nuevos_mes: number;
}

export interface UsuarioPermiso {
  usuario_id: number;
  permisos: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    admin: boolean;
  };
  puede_gestionar_usuarios: boolean;
  puede_aprobar_solicitudes: boolean;
  puede_rechazar_solicitudes: boolean;
  puede_ver_reportes: boolean;
  puede_exportar_datos: boolean;
}

export interface UsuarioSesion {
  usuario_id: number;
  username: string;
  nombre_completo: string;
  rol: RolUsuario;
  permisos: string[];
  token: string;
  expires_at: Date;
  ultima_actividad: Date;
}

export interface UsuarioActividad {
  actividad_id: number;
  usuario_id: number;
  accion: string;
  descripcion: string;
  ip_address: string;
  user_agent: string;
  created_at: Date;
  
  // Relaciones
  usuario?: Usuario;
}

export interface UsuarioPasswordReset {
  usuario_id: number;
  token: string;
  expires_at: Date;
  usado: boolean;
  created_at: Date;
}

export interface UsuarioPasswordChange {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

export interface UsuarioProfile {
  usuario_id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  rol: RolUsuario;
  estatus: EstatusUsuario;
  created_at: Date;
  updated_at: Date;
  ultima_sesion?: Date;
  solicitudes_asignadas?: number;
  solicitudes_procesadas?: number;
  documentos_revisados?: number;
}

// Constantes de permisos
export const PERMISOS_POR_ROL: Record<RolUsuario, string[]> = {
  SUPER: ['create', 'read', 'update', 'delete', 'admin'],
  ADMIN: ['create', 'read', 'update', 'delete'],
  AUDITOR: ['read'],
  OPERADOR: ['read', 'update'],
};

// Tipos para autenticación
export interface AuthState {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  token: string | null;
  permisos: string[];
  loading: boolean;
  error: string | null;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: UsuarioLogin) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: RolUsuario) => boolean;
}

// Tipos para formularios
export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  password?: string;
  password_confirmacion?: string;
  rol: RolUsuario;
  estatus: EstatusUsuario;
}