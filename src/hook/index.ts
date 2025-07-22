// Exportaciones principales de todos los hooks del sistema

// ==================== MÓDULOS PRINCIPALES ====================

// Módulo Cliente - Exportación completa
export * from './cliente';

// Módulo Documento - Exportación completa  
export * from './documento';

// TODO: Agregar exports para otros módulos cuando se implementen

// ==================== RE-EXPORTACIONES DIRECTAS ====================

// Hooks más utilizados de Cliente
export {
  useClienteManager,
  useClienteForm,
  useClienteFilters,
  useClienteCompletitud,
  useClienteStats
} from './cliente';

// Hooks más utilizados de Documento
export {
  useDocumentoManager,
  useDocumentoForm,
  useDocumentoFilters,
  useDocumentoValidation,
  useDocumentoStats
} from './documento';

// ==================== SOLICITUD - EXPORTACIONES ESPECÍFICAS ====================

// Hooks de Solicitud
export {
  useSolicitudManager,
  useSolicitudForm,
  useSolicitudFilters,
  useSolicitudValidation,
  useSolicitudStats
} from './solicitud';

// Tipos específicos de Solicitud (con alias para evitar conflictos)
export type {
  UseSolicitudManagerState,
  UseSolicitudManagerOptions,
  UseSolicitudManagerReturn,
  UseSolicitudFormState,
  UseSolicitudFormOptions,
  UseSolicitudFormReturn,
  ProductoFormData,
  SolicitudFormData,
  UseSolicitudFiltersState,
  UseSolicitudFiltersOptions,
  UseSolicitudFiltersReturn,
  UseSolicitudValidationState,
  UseSolicitudValidationOptions,
  UseSolicitudValidationReturn,
  SolicitudValidationRule,
  SolicitudValidationResult,
  UseSolicitudStatsState,
  UseSolicitudStatsOptions,
  UseSolicitudStatsReturn,
  SolicitudStatsData
} from './solicitud';

// Tipos con alias para evitar conflictos
export type {
  ValidationSummary as SolicitudValidationSummary,
  TrendData as SolicitudTrendData
} from './solicitud';

// ==================== DASHBOARD - EXPORTACIONES ESPECÍFICAS ====================

// Hook compuesto principal de Dashboard
export {
  useDashboard
} from './dashboard';

// Hooks individuales de Dashboard
export {
  useDashboardData,
  useDashboardMetrics,
  useDashboardCharts,
  useDashboardAlerts,
  useDashboardFilters
} from './dashboard';

// Tipos específicos de Dashboard
export type {
  UseDashboardOptions,
  UseDashboardReturn,
  DashboardData,
  DashboardPeriod,
  UseDashboardDataState,
  UseDashboardDataOptions,
  UseDashboardDataReturn,
  DashboardMetric,
  MetricCategory,
  KPI,
  UseDashboardMetricsState,
  UseDashboardMetricsOptions,
  UseDashboardMetricsReturn,
  ChartDataPoint,
  ChartSeries,
  ChartConfig,
  UseDashboardChartsState,
  UseDashboardChartsOptions,
  UseDashboardChartsReturn,
  DashboardAlert,
  AlertRule,
  AlertStatistics,
  UseDashboardAlertsState,
  UseDashboardAlertsOptions,
  UseDashboardAlertsReturn,
  DashboardFilter,
  UseDashboardFiltersState,
  UseDashboardFiltersOptions,
  UseDashboardFiltersReturn
} from './dashboard';

// Tipos con alias para evitar conflictos
export type {
  FilterPreset as DashboardFilterPreset
} from './dashboard';

// ==================== USUARIO - EXPORTACIONES ESPECÍFICAS ====================

// Hooks de Usuario
export {
  useUsuarioManager,
  useUsuarioForm,
  useUsuarioFilters,
  useUsuarioValidation,
  useUsuarioStats,
  useAuth
} from './usuario';

// Tipos específicos de Usuario
export type {
  Usuario,
  UsuarioCreacion,
  UsuarioActualizacion,
  FiltrosUsuario,
  PaginacionUsuario,
  UseUsuarioManagerState,
  UseUsuarioManagerOptions,
  UseUsuarioManagerReturn,
  UsuarioFormData,
  PasswordFormData,
  UsuarioFormErrors,
  UseUsuarioFormState,
  UseUsuarioFormOptions,
  UseUsuarioFormReturn,
  UsuarioFilterState,
  UseUsuarioFiltersState,
  UseUsuarioFiltersOptions,
  UseUsuarioFiltersReturn,
  UsuarioValidationRule,
  UsuarioValidationResult,
  SecurityValidation,
  UseUsuarioValidationState,
  UseUsuarioValidationOptions,
  UseUsuarioValidationReturn,
  UsuarioStatsData,
  UsuarioMetrics,
  UsuarioAnalytics,
  UseUsuarioStatsState,
  UseUsuarioStatsOptions,
  UseUsuarioStatsReturn,
  LoginCredentials,
  AuthUser,
  SessionInfo,
  LoginAttempt,
  SessionActivity,
  SecuritySettings,
  UseAuthState,
  UseAuthOptions,
  UseAuthReturn
} from './usuario';

// Tipos con alias para evitar conflictos
export type {
  ValidationSummary as UsuarioValidationSummary,
  TrendData as UsuarioTrendData,
  FilterPreset as UsuarioFilterPreset
} from './usuario';
