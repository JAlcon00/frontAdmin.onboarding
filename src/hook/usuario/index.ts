/**
 * @fileoverview Barrel export para hooks de usuario
 * @module hook/usuario
 * @description Exporta todos los hooks relacionados con la gestión de usuarios
 */

// ==================== HOOKS PRINCIPALES ====================

// Hook principal de gestión de usuarios
export { useUsuarioManager } from './useUsuarioManager';
// Tipos canónicos de usuario
export type {
  Usuario,
  UsuarioCreation,
  UsuarioUpdate,
  UsuarioFilter
} from '../../types/usuario.types';
// Tipos de estado y retorno del hook (si son necesarios, reexportar desde el propio hook)
export type {
  UseUsuarioManagerState,
  UseUsuarioManagerOptions,
  UseUsuarioManagerReturn
} from './useUsuarioManager';

// Hook para formularios de usuarios
export { useUsuarioForm } from './useUsuarioForm';
// Tipos de formulario canónicos
export type {
  UsuarioFormData
} from '../../types/usuario.types';
// Tipos propios del hook (errores, estado, etc.)
export type {
  PasswordFormData,
  UsuarioFormErrors,
  UseUsuarioFormState,
  UseUsuarioFormOptions,
  UseUsuarioFormReturn
} from './useUsuarioForm';

// Hook para filtros de usuarios
export { useUsuarioFilters } from './useUsuarioFilters';
// Tipos de filtro canónicos (si existen)
// (UsuarioFilter ya se exporta arriba como canónico)
// Tipos propios del hook
export type {
  UsuarioFilterState,
  UseUsuarioFiltersState,
  UseUsuarioFiltersOptions,
  UseUsuarioFiltersReturn,
  FilterPreset
} from './useUsuarioFilters';

// Hook para validación de usuarios
export { useUsuarioValidation } from './useUsuarioValidation';
// Tipos de validación canónicos (si existen)
// (No hay tipos de validación globales en usuario.types.ts, así que se exportan los propios del hook)
export type {
  UsuarioValidationRule,
  UsuarioValidationResult,
  ValidationSummary,
  SecurityValidation,
  UseUsuarioValidationState,
  UseUsuarioValidationOptions,
  UseUsuarioValidationReturn
} from './useUsuarioValidation';

// Hook para estadísticas de usuarios
export { useUsuarioStats } from './useUsuarioStats';
export type {
  UsuarioStatsData,
  TrendData,
  UsuarioMetrics,
  UsuarioAnalytics,
  UseUsuarioStatsState,
  UseUsuarioStatsOptions,
  UseUsuarioStatsReturn
} from './useUsuarioStats';

// Hook para autenticación y auditoría
export { useAuth } from './useAuth';
export type {
  LoginCredentials,
  AuthUser,
  SessionInfo,
  LoginAttempt,
  SessionActivity,
  SecuritySettings,
  UseAuthState,
  UseAuthOptions,
  UseAuthReturn
} from './useAuth';
