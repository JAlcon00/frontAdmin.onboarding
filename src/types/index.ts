// Tipos principales del sistema de onboarding digital
export * from './cliente.types';
export * from './documento.types';
export * from './solicitud.types';
export * from './usuario.types';
export * from './shared.types';

// Tipos de respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Tipos de filtros comunes
export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos de estadísticas para dashboard
export interface DashboardStats {
  totalClientes: number;
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  documentosPendientes: number;
  documentosVencidos: number;
  documentosProximosVencer: number;
}

// Tipos de alertas y notificaciones
export interface AlertaNotificacion {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensaje: string;
  timestamp: Date;
  leida: boolean;
  accion?: {
    texto: string;
    url: string;
  };
}
