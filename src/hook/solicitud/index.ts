// Índice de hooks de solicitud

export { useSolicitudManager } from './useSolicitudManager';
export type { 
  UseSolicitudManagerState,
  UseSolicitudManagerOptions,
  UseSolicitudManagerReturn
} from './useSolicitudManager';

export { useSolicitudForm } from './useSolicitudForm';
export type { 
  UseSolicitudFormState,
  UseSolicitudFormOptions,
  UseSolicitudFormReturn,
  ProductoFormData,
  SolicitudFormData
} from './useSolicitudForm';

export { useSolicitudFilters } from './useSolicitudFilters';
export type { 
  UseSolicitudFiltersState,
  UseSolicitudFiltersOptions,
  UseSolicitudFiltersReturn
} from './useSolicitudFilters';

export { useSolicitudValidation } from './useSolicitudValidation';
export type { 
  UseSolicitudValidationState,
  UseSolicitudValidationOptions,
  UseSolicitudValidationReturn,
  SolicitudValidationRule,
  SolicitudValidationResult,
  ValidationSummary
} from './useSolicitudValidation';

export { useSolicitudStats } from './useSolicitudStats';
export type { 
  UseSolicitudStatsState,
  UseSolicitudStatsOptions,
  UseSolicitudStatsReturn,
  SolicitudStatsData,
  TrendData
} from './useSolicitudStats';

// Hook de validaciones de solicitudes
export { useValidacionSolicitudes } from './useSolicitudValidaciones';
export type { ValidationResult } from './useSolicitudValidaciones';
