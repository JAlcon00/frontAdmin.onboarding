import { useState, useCallback, useEffect } from 'react';
import { documentoService } from '../../services/documento.service';
import type { 
  Documento,
  EstatusDocumento
} from '../../types';

// ==================== INTERFACES ====================

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (documento: Documento) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  category: 'formato' | 'contenido' | 'vigencia' | 'completitud' | 'negocio';
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string;
  suggestedAction?: string;
}

export interface DocumentoValidationResult {
  documento: Documento;
  isValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  score: number; // 0-100
  recommendations: string[];
}

export interface ValidationSummary {
  totalDocuments: number;
  validDocuments: number;
  documentsWithErrors: number;
  documentsWithWarnings: number;
  averageScore: number;
}

export interface UseDocumentoValidationState {
  validations: Record<number, DocumentoValidationResult>;
  globalRules: ValidationRule[];
  customRules: ValidationRule[];
  isValidating: boolean;
  validationErrors: Record<number, string>;
  summary: ValidationSummary;
}

export interface UseDocumentoValidationOptions {
  enableCustomRules?: boolean;
  includeBusinessRules?: boolean;
  strictMode?: boolean;
  onValidationComplete?: (result: DocumentoValidationResult) => void;
  onValidationError?: (documentoId: number, error: string) => void;
}

export interface UseDocumentoValidationReturn {
  // Estado
  state: UseDocumentoValidationState;
  
  // Validaciones
  validateDocumento: (documento: Documento) => Promise<DocumentoValidationResult>;
  validateMultiple: (documentos: Documento[]) => Promise<DocumentoValidationResult[]>;
  revalidateDocumento: (documentoId: number) => Promise<DocumentoValidationResult | null>;
  
  // Gestión de reglas
  addCustomRule: (rule: ValidationRule) => void;
  removeCustomRule: (ruleId: string) => void;
  updateCustomRule: (ruleId: string, rule: Partial<ValidationRule>) => void;
  enableRule: (ruleId: string) => void;
  disableRule: (ruleId: string) => void;
  
  // Utilidades
  getValidationResult: (documentoId: number) => DocumentoValidationResult | null;
  isDocumentoValid: (documentoId: number) => boolean;
  getValidationScore: (documentoId: number) => number;
  getValidationSummary: () => ValidationSummary;
  
  // Exportación e importación
  exportValidationReport: (documentoIds?: number[]) => string;
  generateValidationCertificate: (documentoId: number) => string | null;
  
  // Bulk operations
  validateAll: (documentos: Documento[]) => Promise<void>;
  clearValidations: () => void;
  clearValidation: (documentoId: number) => void;
}

// ==================== REGLAS DE VALIDACIÓN ====================

const createGlobalRules = (): ValidationRule[] => [
  // Reglas de formato
  {
    id: 'archivo_existente',
    name: 'Archivo Existente',
    description: 'Verifica que el documento tenga un archivo asociado',
    validate: (documento: Documento): ValidationResult => ({
      isValid: Boolean(documento.archivo_url),
      message: documento.archivo_url ? 'Archivo presente' : 'No hay archivo asociado al documento'
    }),
    severity: 'error',
    category: 'formato'
  },
  
  {
    id: 'estatus_valido',
    name: 'Estatus Válido',
    description: 'Verifica que el documento tenga un estatus válido',
    validate: (documento: Documento): ValidationResult => {
      const estatusValidos: EstatusDocumento[] = ['pendiente', 'aceptado', 'rechazado', 'vencido'];
      const isValid = estatusValidos.includes(documento.estatus);
      
      return {
        isValid,
        message: isValid ? 'Estatus válido' : `Estatus inválido: ${documento.estatus}`,
        suggestedAction: isValid ? undefined : 'Actualizar el estatus del documento'
      };
    },
    severity: 'error',
    category: 'contenido'
  },

  // Reglas de vigencia
  {
    id: 'documento_vencido',
    name: 'Vigencia del Documento',
    description: 'Verifica si el documento está vencido',
    validate: (documento: Documento): ValidationResult => {
      if (!documento.fecha_expiracion) {
        return {
          isValid: true,
          message: 'Documento sin fecha de expiración'
        };
      }

      const hoy = new Date();
      const fechaExpiracion = new Date(documento.fecha_expiracion);
      const isValid = fechaExpiracion >= hoy;

      return {
        isValid,
        message: isValid ? 'Documento vigente' : 'Documento vencido',
        details: isValid ? undefined : `Venció el ${fechaExpiracion.toLocaleDateString()}`,
        suggestedAction: isValid ? undefined : 'Solicitar documento actualizado'
      };
    },
    severity: 'error',
    category: 'vigencia'
  },

  {
    id: 'proximo_vencimiento',
    name: 'Próximo a Vencer',
    description: 'Advierte sobre documentos próximos a vencer (30 días)',
    validate: (documento: Documento): ValidationResult => {
      if (!documento.fecha_expiracion) {
        return {
          isValid: true,
          message: 'Documento sin fecha de expiración'
        };
      }

      const hoy = new Date();
      const fechaExpiracion = new Date(documento.fecha_expiracion);
      const diasRestantes = Math.ceil((fechaExpiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        return {
          isValid: false,
          message: 'Documento vencido'
        };
      }

      const isValid = diasRestantes > 30;
      
      return {
        isValid,
        message: isValid ? 'Vigencia adecuada' : `Vence en ${diasRestantes} días`,
        details: `Días restantes: ${diasRestantes}`,
        suggestedAction: isValid ? undefined : 'Notificar al cliente para renovación'
      };
    },
    severity: 'warning',
    category: 'vigencia'
  },

  // Reglas de contenido
  {
    id: 'fecha_documento_valida',
    name: 'Fecha del Documento',
    description: 'Verifica que la fecha del documento sea válida',
    validate: (documento: Documento): ValidationResult => {
      const fechaDoc = new Date(documento.fecha_documento);
      const hoy = new Date();
      const hace5Anos = new Date();
      hace5Anos.setFullYear(hace5Anos.getFullYear() - 5);

      if (fechaDoc > hoy) {
        return {
          isValid: false,
          message: 'La fecha del documento no puede ser futura',
          suggestedAction: 'Corregir la fecha del documento'
        };
      }

      if (fechaDoc < hace5Anos) {
        return {
          isValid: true,
          message: 'Documento muy antiguo',
          details: `Documento de ${fechaDoc.getFullYear()}`,
        };
      }

      return {
        isValid: true,
        message: 'Fecha del documento válida'
      };
    },
    severity: 'warning',
    category: 'contenido'
  },

  // Reglas de negocio
  {
    id: 'documento_rechazado_sin_comentario',
    name: 'Comentarios en Rechazos',
    description: 'Los documentos rechazados deben tener comentarios del revisor',
    validate: (documento: Documento): ValidationResult => {
      if (documento.estatus !== 'rechazado') {
        return {
          isValid: true,
          message: 'No aplicable'
        };
      }

      const hasComment = Boolean(documento.comentario_revisor?.trim());
      
      return {
        isValid: hasComment,
        message: hasComment ? 'Comentario presente' : 'Documento rechazado sin comentarios',
        suggestedAction: hasComment ? undefined : 'Agregar comentarios explicando el rechazo'
      };
    },
    severity: 'error',
    category: 'negocio'
  }
];

// ==================== HOOK PRINCIPAL ====================

export function useDocumentoValidation(options: UseDocumentoValidationOptions = {}) {
  const {
    enableCustomRules = true,
    includeBusinessRules = true,
    strictMode = false,
    onValidationComplete,
    onValidationError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDocumentoValidationState>(() => ({
    validations: {},
    globalRules: createGlobalRules(),
    customRules: [],
    isValidating: false,
    validationErrors: {},
    summary: {
      totalDocuments: 0,
      validDocuments: 0,
      documentsWithErrors: 0,
      documentsWithWarnings: 0,
      averageScore: 0
    }
  }));

  // ==================== UTILIDADES ====================

  const calculateScore = useCallback((results: ValidationResult[]): number => {
    if (results.length === 0) return 100;

    const totalRules = results.length;
    const errors = results.filter(r => !r.isValid && r.message !== 'No aplicable').length;
    
    if (strictMode && errors > 0) return 0;
    
    return Math.max(0, Math.round(((totalRules - errors) / totalRules) * 100));
  }, [strictMode]);

  const generateRecommendations = useCallback((results: ValidationResult[]): string[] => {
    return results
      .filter(r => !r.isValid && r.suggestedAction)
      .map(r => r.suggestedAction!)
      .filter((action, index, array) => array.indexOf(action) === index); // Remove duplicates
  }, []);

  const getActiveRules = useCallback((): ValidationRule[] => {
    const rules = [...state.globalRules];
    
    if (enableCustomRules) {
      rules.push(...state.customRules);
    }
    
    if (!includeBusinessRules) {
      return rules.filter(rule => rule.category !== 'negocio');
    }
    
    return rules;
  }, [state.globalRules, state.customRules, enableCustomRules, includeBusinessRules]);

  // ==================== VALIDACIONES ====================

  const validateDocumento = useCallback(async (documento: Documento): Promise<DocumentoValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const rules = getActiveRules();
      const results = rules.map(rule => {
        try {
          return { rule, result: rule.validate(documento) };
        } catch (error) {
          return {
            rule,
            result: {
              isValid: false,
              message: `Error en validación: ${rule.name}`,
              details: error instanceof Error ? error.message : 'Error desconocido'
            }
          };
        }
      });

      const errors = results
        .filter(({ rule, result }) => rule.severity === 'error' && !result.isValid)
        .map(({ result }) => result);

      const warnings = results
        .filter(({ rule, result }) => rule.severity === 'warning' && !result.isValid)
        .map(({ result }) => result);

      const info = results
        .filter(({ rule }) => rule.severity === 'info')
        .map(({ result }) => result);

      const allResults = results.map(({ result }) => result);
      const score = calculateScore(allResults);
      const recommendations = generateRecommendations(allResults);

      const validationResult: DocumentoValidationResult = {
        documento,
        isValid: errors.length === 0,
        errors,
        warnings,
        info,
        score,
        recommendations
      };

      setState(prev => ({
        ...prev,
        validations: {
          ...prev.validations,
          [documento.documento_id]: validationResult
        },
        isValidating: false
      }));

      if (onValidationComplete) {
        onValidationComplete(validationResult);
      }

      return validationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en validación';
      
      setState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [documento.documento_id]: errorMessage
        },
        isValidating: false
      }));

      if (onValidationError) {
        onValidationError(documento.documento_id, errorMessage);
      }

      throw error;
    }
  }, [getActiveRules, calculateScore, generateRecommendations, onValidationComplete, onValidationError]);

  const validateMultiple = useCallback(async (documentos: Documento[]): Promise<DocumentoValidationResult[]> => {
    const results: DocumentoValidationResult[] = [];
    
    for (const documento of documentos) {
      try {
        const result = await validateDocumento(documento);
        results.push(result);
      } catch (error) {
        console.error(`Error validating documento ${documento.documento_id}:`, error);
      }
    }

    return results;
  }, [validateDocumento]);

  const revalidateDocumento = useCallback(async (documentoId: number): Promise<DocumentoValidationResult | null> => {
    try {
      const documento = await documentoService.getDocumentoById(documentoId);
      return await validateDocumento(documento);
    } catch (error) {
      console.error(`Error revalidating documento ${documentoId}:`, error);
      return null;
    }
  }, [validateDocumento]);

  // ==================== GESTIÓN DE REGLAS ====================

  const addCustomRule = useCallback((rule: ValidationRule) => {
    setState(prev => ({
      ...prev,
      customRules: [...prev.customRules, rule]
    }));
  }, []);

  const removeCustomRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      customRules: prev.customRules.filter(rule => rule.id !== ruleId)
    }));
  }, []);

  const updateCustomRule = useCallback((ruleId: string, updates: Partial<ValidationRule>) => {
    setState(prev => ({
      ...prev,
      customRules: prev.customRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  }, []);

  const enableRule = useCallback((ruleId: string) => {
    // TODO: Implementar enable/disable de reglas
    console.log('Enabling rule:', ruleId);
  }, []);

  const disableRule = useCallback((ruleId: string) => {
    // TODO: Implementar enable/disable de reglas
    console.log('Disabling rule:', ruleId);
  }, []);

  // ==================== UTILIDADES ====================

  const getValidationResult = useCallback((documentoId: number): DocumentoValidationResult | null => {
    return state.validations[documentoId] || null;
  }, [state.validations]);

  const isDocumentoValid = useCallback((documentoId: number): boolean => {
    const result = state.validations[documentoId];
    return result ? result.isValid : false;
  }, [state.validations]);

  const getValidationScore = useCallback((documentoId: number): number => {
    const result = state.validations[documentoId];
    return result ? result.score : 0;
  }, [state.validations]);

  const getValidationSummary = useCallback(() => {
    return state.summary;
  }, [state.summary]);

  // ==================== EXPORTACIÓN ====================

  const exportValidationReport = useCallback((documentoIds?: number[]): string => {
    const validations = documentoIds
      ? documentoIds.map(id => state.validations[id]).filter(Boolean)
      : Object.values(state.validations);

    const report = {
      generatedAt: new Date().toISOString(),
      summary: state.summary,
      validations: validations.map(v => ({
        documentoId: v.documento.documento_id,
        isValid: v.isValid,
        score: v.score,
        errors: v.errors.length,
        warnings: v.warnings.length,
        recommendations: v.recommendations
      }))
    };

    return JSON.stringify(report, null, 2);
  }, [state.validations, state.summary]);

  const generateValidationCertificate = useCallback((documentoId: number): string | null => {
    const result = state.validations[documentoId];
    if (!result || !result.isValid) return null;

    return `CERTIFICADO DE VALIDACIÓN
    
Documento ID: ${documentoId}
Fecha de validación: ${new Date().toLocaleDateString()}
Puntuación: ${result.score}/100
Estado: VÁLIDO

Este documento ha pasado todas las validaciones requeridas.
    `;
  }, [state.validations]);

  // ==================== BULK OPERATIONS ====================

  const validateAll = useCallback(async (documentos: Documento[]) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      await validateMultiple(documentos);
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, [validateMultiple]);

  const clearValidations = useCallback(() => {
    setState(prev => ({
      ...prev,
      validations: {},
      validationErrors: {}
    }));
  }, []);

  const clearValidation = useCallback((documentoId: number) => {
    setState(prev => {
      const newValidations = { ...prev.validations };
      const newErrors = { ...prev.validationErrors };
      
      delete newValidations[documentoId];
      delete newErrors[documentoId];
      
      return {
        ...prev,
        validations: newValidations,
        validationErrors: newErrors
      };
    });
  }, []);

  // ==================== EFECTOS ====================

  // Actualizar resumen cuando cambian las validaciones
  useEffect(() => {
    const validations = Object.values(state.validations);
    const totalDocuments = validations.length;
    const validDocuments = validations.filter(v => v.isValid).length;
    const documentsWithErrors = validations.filter(v => v.errors.length > 0).length;
    const documentsWithWarnings = validations.filter(v => v.warnings.length > 0).length;
    const averageScore = totalDocuments > 0
      ? Math.round(validations.reduce((sum, v) => sum + v.score, 0) / totalDocuments)
      : 0;

    setState(prev => ({
      ...prev,
      summary: {
        totalDocuments,
        validDocuments,
        documentsWithErrors,
        documentsWithWarnings,
        averageScore
      }
    }));
  }, [state.validations]);

  // ==================== RETORNO ====================

  return {
    state,
    validateDocumento,
    validateMultiple,
    revalidateDocumento,
    addCustomRule,
    removeCustomRule,
    updateCustomRule,
    enableRule,
    disableRule,
    getValidationResult,
    isDocumentoValid,
    getValidationScore,
    getValidationSummary,
    exportValidationReport,
    generateValidationCertificate,
    validateAll,
    clearValidations,
    clearValidation
  };
}