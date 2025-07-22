import { useState, useCallback, useMemo } from 'react';
import type { SolicitudCompleta } from '../../services/solicitud.service';

// ==================== INTERFACES ====================

export interface SolicitudValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'completitud' | 'negocio' | 'flujo' | 'documentos';
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  validator: (solicitud: SolicitudCompleta) => SolicitudValidationResult;
}

export interface SolicitudValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  info: string[];
  details?: Record<string, any>;
}

export interface UseSolicitudValidationState {
  rules: SolicitudValidationRule[];
  validationResults: Record<number, SolicitudValidationResult>;
  globalScore: number;
  isValidating: boolean;
  validationError: string | null;
}

export interface UseSolicitudValidationOptions {
  solicitudes?: SolicitudCompleta[];
  enabledRules?: string[];
  autoValidate?: boolean;
  customRules?: SolicitudValidationRule[];
}

export interface ValidationSummary {
  total: number;
  valid: number;
  withErrors: number;
  withWarnings: number;
  averageScore: number;
  commonIssues: Array<{
    message: string;
    count: number;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface UseSolicitudValidationReturn {
  // Estado
  state: UseSolicitudValidationState;
  
  // Validación individual
  validateSolicitud: (solicitud: SolicitudCompleta) => SolicitudValidationResult;
  validateSolicitudById: (id: number) => SolicitudValidationResult | null;
  
  // Validación en lote
  validateAll: (solicitudes: SolicitudCompleta[]) => Record<number, SolicitudValidationResult>;
  validateBatch: (solicitudes: SolicitudCompleta[]) => Promise<Record<number, SolicitudValidationResult>>;
  
  // Gestión de reglas
  enableRule: (ruleId: string) => void;
  disableRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  addCustomRule: (rule: SolicitudValidationRule) => void;
  removeCustomRule: (ruleId: string) => void;
  
  // Utilidades
  getSolicitudesWithErrors: () => SolicitudCompleta[];
  getSolicitudesWithWarnings: () => SolicitudCompleta[];
  getValidationSummary: () => ValidationSummary;
  canProceedToNextStep: (solicitud: SolicitudCompleta) => boolean;
  getRecommendedActions: (solicitud: SolicitudCompleta) => string[];
  
  // Configuración
  resetRules: () => void;
  exportValidationReport: () => string;
}

// ==================== CONSTANTES ====================

const DEFAULT_RULES: SolicitudValidationRule[] = [
  {
    id: 'productos_requeridos',
    name: 'Productos Requeridos',
    description: 'Verificar que la solicitud tenga al menos un producto',
    category: 'completitud',
    severity: 'error',
    enabled: true,
    validator: (solicitud) => {
      const hasProducts = solicitud.productos && solicitud.productos.length > 0;
      return {
        valid: hasProducts,
        score: hasProducts ? 100 : 0,
        errors: hasProducts ? [] : ['La solicitud debe tener al menos un producto'],
        warnings: [],
        info: []
      };
    }
  },
  {
    id: 'monto_minimo',
    name: 'Monto Mínimo',
    description: 'Verificar que cada producto tenga un monto mínimo válido',
    category: 'negocio',
    severity: 'error',
    enabled: true,
    validator: (solicitud) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const minAmount = 1000;
      
      solicitud.productos?.forEach((producto, index) => {
        if (producto.monto < minAmount) {
          errors.push(`Producto ${index + 1}: Monto ${producto.monto} es menor al mínimo requerido (${minAmount})`);
        }
      });
      
      return {
        valid: errors.length === 0,
        score: errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length * 25)),
        errors,
        warnings,
        info: []
      };
    }
  },
  {
    id: 'plazo_valido',
    name: 'Plazo Válido',
    description: 'Verificar que los plazos estén dentro de los rangos permitidos',
    category: 'negocio',
    severity: 'error',
    enabled: true,
    validator: (solicitud) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      solicitud.productos?.forEach((producto, index) => {
        if (producto.plazo_meses < 1) {
          errors.push(`Producto ${index + 1}: Plazo debe ser mayor a 0 meses`);
        } else if (producto.plazo_meses > 120) {
          errors.push(`Producto ${index + 1}: Plazo no puede ser mayor a 120 meses`);
        } else if (producto.plazo_meses > 60) {
          warnings.push(`Producto ${index + 1}: Plazo de ${producto.plazo_meses} meses es muy largo`);
        }
      });
      
      return {
        valid: errors.length === 0,
        score: errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 0,
        errors,
        warnings,
        info: []
      };
    }
  },
  {
    id: 'estatus_coherente',
    name: 'Estatus Coherente',
    description: 'Verificar que el estatus sea coherente con el flujo de trabajo',
    category: 'flujo',
    severity: 'warning',
    enabled: true,
    validator: (solicitud) => {
      const warnings: string[] = [];
      const info: string[] = [];
      
      // Verificaciones específicas por estatus
      switch (solicitud.estatus) {
        case 'aprobada':
          if (!solicitud.productos || solicitud.productos.length === 0) {
            warnings.push('Solicitud aprobada sin productos definidos');
          }
          break;
        case 'rechazada':
          info.push('Solicitud rechazada - verificar razones del rechazo');
          break;
        case 'cancelada':
          info.push('Solicitud cancelada - no requiere procesamiento adicional');
          break;
      }
      
      return {
        valid: true,
        score: warnings.length === 0 ? 100 : 80,
        errors: [],
        warnings,
        info
      };
    }
  },
  {
    id: 'productos_duplicados',
    name: 'Productos Duplicados',
    description: 'Verificar que no hay productos duplicados en la solicitud',
    category: 'negocio',
    severity: 'warning',
    enabled: true,
    validator: (solicitud) => {
      const productos = solicitud.productos?.map(p => p.producto) || [];
      const productosUnicos = new Set(productos);
      const hasDuplicates = productos.length !== productosUnicos.size;
      
      return {
        valid: !hasDuplicates,
        score: hasDuplicates ? 70 : 100,
        errors: [],
        warnings: hasDuplicates ? ['La solicitud contiene productos duplicados'] : [],
        info: []
      };
    }
  }
];

// ==================== HOOK PRINCIPAL ====================

export function useSolicitudValidation(options: UseSolicitudValidationOptions = {}): UseSolicitudValidationReturn {
  const {
    solicitudes = [],
    enabledRules = [],
    autoValidate = true,
    customRules = []
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseSolicitudValidationState>(() => ({
    rules: [
      ...DEFAULT_RULES.map(rule => ({
        ...rule,
        enabled: enabledRules.length === 0 || enabledRules.includes(rule.id)
      })),
      ...customRules
    ],
    validationResults: {},
    globalScore: 0,
    isValidating: false,
    validationError: null
  }));

  // ==================== VALIDACIÓN INDIVIDUAL ====================

  const validateSolicitud = useCallback((solicitud: SolicitudCompleta): SolicitudValidationResult => {
    const enabledRules = state.rules.filter(rule => rule.enabled);
    const results = enabledRules.map(rule => rule.validator(solicitud));
    
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const allInfo = results.flatMap(r => r.info);
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;
    
    const finalResult: SolicitudValidationResult = {
      valid: allErrors.length === 0,
      score: Math.round(averageScore),
      errors: allErrors,
      warnings: allWarnings,
      info: allInfo,
      details: {
        rulesApplied: enabledRules.length,
        individualResults: results
      }
    };
    
    // Actualizar resultado en el estado
    setState(prev => ({
      ...prev,
      validationResults: {
        ...prev.validationResults,
        [solicitud.solicitud_id]: finalResult
      }
    }));
    
    return finalResult;
  }, [state.rules]);

  const validateSolicitudById = useCallback((id: number): SolicitudValidationResult | null => {
    const solicitud = solicitudes.find(s => s.solicitud_id === id);
    return solicitud ? validateSolicitud(solicitud) : null;
  }, [solicitudes, validateSolicitud]);

  // ==================== VALIDACIÓN EN LOTE ====================

  const validateAll = useCallback((solicitudesData: SolicitudCompleta[]): Record<number, SolicitudValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true, validationError: null }));
    
    try {
      const results: Record<number, SolicitudValidationResult> = {};
      
      solicitudesData.forEach(solicitud => {
        results[solicitud.solicitud_id] = validateSolicitud(solicitud);
      });
      
      // Calcular puntuación global
      const scores = Object.values(results).map(r => r.score);
      const globalScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      
      setState(prev => ({
        ...prev,
        validationResults: { ...prev.validationResults, ...results },
        globalScore,
        isValidating: false
      }));
      
      return results;
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationError: error.message || 'Error durante la validación'
      }));
      
      return {};
    }
  }, [validateSolicitud]);

  const validateBatch = useCallback(async (solicitudesData: SolicitudCompleta[]): Promise<Record<number, SolicitudValidationResult>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = validateAll(solicitudesData);
        resolve(results);
      }, 100); // Simular procesamiento asíncrono
    });
  }, [validateAll]);

  // ==================== GESTIÓN DE REGLAS ====================

  const enableRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: true } : rule
      )
    }));
  }, []);

  const disableRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: false } : rule
      )
    }));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    }));
  }, []);

  const addCustomRule = useCallback((rule: SolicitudValidationRule) => {
    setState(prev => ({
      ...prev,
      rules: [...prev.rules, rule]
    }));
  }, []);

  const removeCustomRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  }, []);

  // ==================== UTILIDADES ====================

  const getSolicitudesWithErrors = useCallback((): SolicitudCompleta[] => {
    return solicitudes.filter(solicitud => {
      const result = state.validationResults[solicitud.solicitud_id];
      return result && result.errors.length > 0;
    });
  }, [solicitudes, state.validationResults]);

  const getSolicitudesWithWarnings = useCallback((): SolicitudCompleta[] => {
    return solicitudes.filter(solicitud => {
      const result = state.validationResults[solicitud.solicitud_id];
      return result && result.warnings.length > 0;
    });
  }, [solicitudes, state.validationResults]);

  const getValidationSummary = useCallback((): ValidationSummary => {
    const results = Object.values(state.validationResults);
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const withErrors = results.filter(r => r.errors.length > 0).length;
    const withWarnings = results.filter(r => r.warnings.length > 0).length;
    
    const averageScore = total > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / total 
      : 0;
    
    // Análisis de problemas comunes
    const allIssues = results.flatMap(r => [
      ...r.errors.map(e => ({ message: e, severity: 'error' as const })),
      ...r.warnings.map(w => ({ message: w, severity: 'warning' as const })),
      ...r.info.map(i => ({ message: i, severity: 'info' as const }))
    ]);
    
    const issueMap = new Map<string, { count: number; severity: 'error' | 'warning' | 'info' }>();
    allIssues.forEach(issue => {
      const existing = issueMap.get(issue.message);
      issueMap.set(issue.message, {
        count: existing ? existing.count + 1 : 1,
        severity: issue.severity
      });
    });
    
    const commonIssues = Array.from(issueMap.entries())
      .map(([message, { count, severity }]) => ({ message, count, severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      total,
      valid,
      withErrors,
      withWarnings,
      averageScore: Math.round(averageScore),
      commonIssues
    };
  }, [state.validationResults]);

  const canProceedToNextStep = useCallback((solicitud: SolicitudCompleta): boolean => {
    const result = state.validationResults[solicitud.solicitud_id];
    return result ? result.valid && result.score >= 70 : false;
  }, [state.validationResults]);

  const getRecommendedActions = useCallback((solicitud: SolicitudCompleta): string[] => {
    const result = state.validationResults[solicitud.solicitud_id];
    if (!result) return [];
    
    const actions: string[] = [];
    
    if (result.errors.length > 0) {
      actions.push('Corregir errores críticos antes de continuar');
    }
    
    if (result.warnings.length > 0) {
      actions.push('Revisar advertencias para optimizar la solicitud');
    }
    
    if (result.score < 70) {
      actions.push('Mejorar la calidad general de la solicitud');
    }
    
    if (!solicitud.productos || solicitud.productos.length === 0) {
      actions.push('Agregar productos a la solicitud');
    }
    
    return actions;
  }, [state.validationResults]);

  // ==================== CONFIGURACIÓN ====================

  const resetRules = useCallback(() => {
    setState(prev => ({
      ...prev,
      rules: DEFAULT_RULES.map(rule => ({ ...rule, enabled: true })),
      validationResults: {},
      globalScore: 0
    }));
  }, []);

  const exportValidationReport = useCallback((): string => {
    const summary = getValidationSummary();
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      rules: state.rules.filter(r => r.enabled),
      results: state.validationResults
    };
    
    return JSON.stringify(report, null, 2);
  }, [getValidationSummary, state.rules, state.validationResults]);

  // ==================== VALIDACIÓN AUTOMÁTICA ====================

  useMemo(() => {
    if (autoValidate && solicitudes.length > 0) {
      validateAll(solicitudes);
    }
    return solicitudes;
  }, [solicitudes, autoValidate, validateAll]);

  // ==================== RETORNO ====================

  return {
    state,
    validateSolicitud,
    validateSolicitudById,
    validateAll,
    validateBatch,
    enableRule,
    disableRule,
    toggleRule,
    addCustomRule,
    removeCustomRule,
    getSolicitudesWithErrors,
    getSolicitudesWithWarnings,
    getValidationSummary,
    canProceedToNextStep,
    getRecommendedActions,
    resetRules,
    exportValidationReport
  };
}
