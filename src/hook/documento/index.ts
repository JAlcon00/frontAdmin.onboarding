/**
 * @fileoverview Barrel export para hooks de documento
 * @module hook/documento
 * @description Exporta todos los hooks relacionados con la gestión de documentos
 */

// Hook principal de gestión de documentos
export { useDocumentoManager } from './useDocumentoManager';
export type { 
  UseDocumentoManagerState, 
  UseDocumentoManagerOptions, 
  UseDocumentoManagerReturn 
} from './useDocumentoManager';

// Hook para formularios de documentos
export { useDocumentoForm } from './useDocumentoForm';
export type {
  DocumentoFormData,
  UseDocumentoFormState,
  UseDocumentoFormOptions,
  UseDocumentoFormReturn
} from './useDocumentoForm';

// Hook para filtros de documentos
export { useDocumentoFilters } from './useDocumentoFilters';
export type {
  DocumentoFilterState,
  UseDocumentoFiltersState,
  UseDocumentoFiltersOptions,
  UseDocumentoFiltersReturn,
  FilterPreset
} from './useDocumentoFilters';

// Hook para validación de documentos
export { useDocumentoValidation } from './useDocumentoValidation';
export type {
  ValidationRule,
  ValidationResult,
  ValidationSummary,
  DocumentoValidationResult,
  UseDocumentoValidationState,
  UseDocumentoValidationOptions,
  UseDocumentoValidationReturn
} from './useDocumentoValidation';

// Hook para estadísticas de documentos
export { useDocumentoStats } from './useDocumentoStats';
export type {
  DocumentoStatsData,
  TrendData,
  ClienteDocumentoStats,
  UseDocumentoStatsState,
  UseDocumentoStatsOptions,
  UseDocumentoStatsReturn
} from './useDocumentoStats';

// Hook de validaciones de documentos
export { useValidacionDocumentos } from './useDocumentoValidaciones';
export type { DocumentoCoherenciaResult } from './useDocumentoValidaciones';
