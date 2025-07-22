/**
 * @fileoverview Hook para validaciones específicas de usuarios
 * @module hook/usuario/useUsuarioValidation
 * @description Proporciona validaciones avanzadas, verificaciones y análisis de usuarios
 */

import { useState, useCallback, useEffect } from 'react';
import type { Usuario, UsuarioCreation } from '../../types/usuario.types';

// ==================== INTERFACES Y TIPOS ====================

export interface UsuarioValidationRule {
  field: string;
  type: 'required' | 'email' | 'username' | 'password' | 'role' | 'custom';
  message: string;
  validate: (value: any, userData?: Partial<Usuario>) => boolean | Promise<boolean>;
  severity: 'error' | 'warning' | 'info';
}

export interface UsuarioValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  suggestions: Array<{
    field: string;
    suggestion: string;
  }>;
}

export interface ValidationSummary {
  totalUsers: number;
  validUsers: number;
  usersWithErrors: number;
  usersWithWarnings: number;
  commonIssues: Array<{
    issue: string;
    count: number;
    affectedUsers: number[];
  }>;
}

export interface SecurityValidation {
  passwordStrength: {
    score: number;
    requirements: Array<{
      met: boolean;
      description: string;
    }>;
  };
  accountSecurity: {
    hasSecureEmail: boolean;
    hasRecentActivity: boolean;
    suspiciousActivity: boolean;
  };
  rolePermissions: {
    appropriate: boolean;
    suggestions: string[];
  };
}

export interface UseUsuarioValidationState {
  validationRules: UsuarioValidationRule[];
  lastValidation: UsuarioValidationResult | null;
  batchValidationResults: Map<number, UsuarioValidationResult>;
  validationInProgress: boolean;
  validationSummary: ValidationSummary | null;
  securityValidation: SecurityValidation | null;
  customRules: UsuarioValidationRule[];
}

export interface UseUsuarioValidationOptions {
  enableRealTimeValidation?: boolean;
  enableSecurityValidation?: boolean;
  customValidationRules?: UsuarioValidationRule[];
  strictMode?: boolean;
  onValidationComplete?: (result: UsuarioValidationResult) => void;
  onSecurityIssue?: (issue: string, severity: 'low' | 'medium' | 'high') => void;
}

export interface UseUsuarioValidationReturn {
  // Estado
  state: UseUsuarioValidationState;

  // Validación individual
  validateUser: (userData: Partial<Usuario | UsuarioCreation>) => Promise<UsuarioValidationResult>;
  validateField: (field: string, value: any, userData?: Partial<Usuario>) => Promise<boolean>;

  // Validaciones específicas
  validateUserCreation: (userData: UsuarioCreation) => Promise<UsuarioValidationResult>;
  validateUserUpdate: (userId: number, updateData: Partial<Usuario>) => Promise<UsuarioValidationResult>;
  validatePassword: (password: string, userData?: Partial<Usuario>) => Promise<UsuarioValidationResult>;

  // Validación en lote
  validateUserBatch: (users: Usuario[]) => Promise<Map<number, UsuarioValidationResult>>;
  getValidationSummary: (users: Usuario[]) => Promise<ValidationSummary>;

  // Validaciones de seguridad
  validateSecurity: (userData: Usuario) => Promise<SecurityValidation>;
  checkDuplicateEmails: (users: Usuario[]) => Array<{ email: string; userIds: number[] }>;
  checkDuplicateUsernames: (users: Usuario[]) => Array<{ username: string; userIds: number[] }>;

  // Gestión de reglas
  addValidationRule: (rule: UsuarioValidationRule) => void;
  removeValidationRule: (ruleId: string) => void;
  updateValidationRule: (ruleId: string, updates: Partial<UsuarioValidationRule>) => void;
  resetValidationRules: () => void;

  // Utilidades
  getValidationReport: (users: Usuario[]) => Promise<string>;
  exportValidationResults: () => string;
  getFieldValidationStatus: (field: string, value: any) => 'valid' | 'invalid' | 'warning' | 'pending';
}

// ==================== CONFIGURACIÓN INICIAL ====================

const estadoInicial: UseUsuarioValidationState = {
  validationRules: [],
  lastValidation: null,
  batchValidationResults: new Map(),
  validationInProgress: false,
  validationSummary: null,
  securityValidation: null,
  customRules: []
};

// ==================== REGLAS DE VALIDACIÓN POR DEFECTO ====================

const reglasValidacionDefault: UsuarioValidationRule[] = [
  {
    field: 'nombre',
    type: 'required',
    message: 'El nombre es requerido',
    validate: (value) => !!value && value.toString().trim().length > 0,
    severity: 'error'
  },
  {
    field: 'apellido',
    type: 'required',
    message: 'El apellido es requerido',
    validate: (value) => !!value && value.toString().trim().length > 0,
    severity: 'error'
  },
  {
    field: 'username',
    type: 'username',
    message: 'El nombre de usuario debe tener entre 3 y 100 caracteres y solo contener letras, números, guiones y guiones bajos',
    validate: (value) => {
      if (!value) return false;
      const username = value.toString();
      return username.length >= 3 && 
             username.length <= 100 && 
             /^[a-zA-Z0-9_-]+$/.test(username);
    },
    severity: 'error'
  },
  {
    field: 'correo',
    type: 'email',
    message: 'Debe ser un correo electrónico válido',
    validate: (value) => {
      if (!value) return false;
      const email = value.toString();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    severity: 'error'
  },
  {
    field: 'password',
    type: 'password',
    message: 'La contraseña debe tener al menos 8 caracteres',
    validate: (value) => {
      if (!value) return false;
      return value.toString().length >= 8;
    },
    severity: 'error'
  },
  {
    field: 'rol',
    type: 'role',
    message: 'Debe seleccionar un rol válido',
    validate: (value) => {
      const validRoles = ['SUPER', 'ADMIN', 'AUDITOR', 'OPERADOR'];
      return validRoles.includes(value);
    },
    severity: 'error'
  }
];

// ==================== HOOK PRINCIPAL ====================

export function useUsuarioValidation(options: UseUsuarioValidationOptions = {}): UseUsuarioValidationReturn {
  const {
    enableSecurityValidation = true,
    customValidationRules = [],
    strictMode = false,
    onValidationComplete,
    onSecurityIssue
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseUsuarioValidationState>(() => ({
    ...estadoInicial,
    validationRules: [...reglasValidacionDefault, ...customValidationRules],
    customRules: customValidationRules
  }));

  // ==================== FUNCIONES AUXILIARES ====================

  const ejecutarReglaValidacion = useCallback(async (
    rule: UsuarioValidationRule, 
    fieldValue: any, 
    userData?: Partial<Usuario>
  ): Promise<boolean> => {
    try {
      const result = rule.validate(fieldValue, userData);
      return result instanceof Promise ? await result : result;
    } catch (error) {
      console.error(`Error en regla de validación para ${rule.field}:`, error);
      return false;
    }
  }, []);

  // ==================== VALIDACIÓN INDIVIDUAL ====================

  const validateUser = useCallback(async (userData: Partial<Usuario | UsuarioCreation>): Promise<UsuarioValidationResult> => {
    setState(prev => ({ ...prev, validationInProgress: true }));

    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    const suggestions: Array<{ field: string; suggestion: string }> = [];

    try {
      // Ejecutar todas las reglas de validación
      for (const rule of state.validationRules) {
        const fieldValue = userData[rule.field as keyof typeof userData];
        const isValid = await ejecutarReglaValidacion(rule, fieldValue, userData);

        if (!isValid) {
          if (rule.severity === 'error') {
            errors.push({
              field: rule.field,
              message: rule.message,
              severity: rule.severity
            });
          } else if (rule.severity === 'warning') {
            warnings.push({
              field: rule.field,
              message: rule.message
            });
          }
        }
      }

      // Validaciones adicionales específicas
      if (userData.username) {
        const userId = 'usuario_id' in userData ? userData.usuario_id : undefined;
        const usernameExists = await checkUsernameExists(userData.username, userId);
        if (usernameExists) {
          errors.push({
            field: 'username',
            message: 'Este nombre de usuario ya está en uso',
            severity: 'error'
          });
        }
      }

      if (userData.correo) {
        const userId = 'usuario_id' in userData ? userData.usuario_id : undefined;
        const emailExists = await checkEmailExists(userData.correo, userId);
        if (emailExists) {
          errors.push({
            field: 'correo',
            message: 'Este correo electrónico ya está registrado',
            severity: 'error'
          });
        }
      }

      // Sugerencias basadas en los datos
      if (userData.rol === 'SUPER' && !strictMode) {
        suggestions.push({
          field: 'rol',
          suggestion: 'Considera si realmente necesita permisos de super usuario'
        });
      }

      if (userData.correo && !userData.correo.includes('@empresa.com')) {
        warnings.push({
          field: 'correo',
          message: 'Se recomienda usar el dominio corporativo'
        });
      }

      const result: UsuarioValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };

      setState(prev => ({ 
        ...prev, 
        lastValidation: result, 
        validationInProgress: false 
      }));

      onValidationComplete?.(result);
      return result;

    } catch (error) {
      console.error('Error durante la validación:', error);
      const errorResult: UsuarioValidationResult = {
        isValid: false,
        errors: [{ field: 'general', message: 'Error durante la validación', severity: 'error' }],
        warnings: [],
        suggestions: []
      };

      setState(prev => ({ 
        ...prev, 
        lastValidation: errorResult, 
        validationInProgress: false 
      }));

      return errorResult;
    }
  }, [state.validationRules, strictMode, ejecutarReglaValidacion, onValidationComplete]);

  const validateField = useCallback(async (
    field: string, 
    value: any, 
    userData?: Partial<Usuario>
  ): Promise<boolean> => {
    const relevantRules = state.validationRules.filter(rule => rule.field === field);
    
    for (const rule of relevantRules) {
      const isValid = await ejecutarReglaValidacion(rule, value, userData);
      if (!isValid && rule.severity === 'error') {
        return false;
      }
    }
    
    return true;
  }, [state.validationRules, ejecutarReglaValidacion]);

  // ==================== VALIDACIONES ESPECÍFICAS ====================

  const validateUserCreation = useCallback(async (userData: UsuarioCreation): Promise<UsuarioValidationResult> => {
    // Validación específica para creación (password requerido, etc.)
    const result = await validateUser(userData);
    
    // Validaciones adicionales para creación
    if (!userData.password || userData.password.length < 8) {
      result.errors.push({
        field: 'password',
        message: 'La contraseña es requerida y debe tener al menos 8 caracteres',
        severity: 'error'
      });
      result.isValid = false;
    }

    return result;
  }, [validateUser]);

  const validateUserUpdate = useCallback(async (
    userId: number, 
    updateData: Partial<Usuario & { password?: string }>
  ): Promise<UsuarioValidationResult> => {
    // Validación específica para actualización (password opcional, etc.)
    const result = await validateUser({ ...updateData, usuario_id: userId });
    
    // Filtrar validaciones de password si no se está actualizando
    if (!updateData.password) {
      result.errors = result.errors.filter(error => error.field !== 'password');
    }

    return result;
  }, [validateUser]);

  const validatePassword = useCallback(async (
    password: string, 
    userData?: Partial<Usuario>
  ): Promise<UsuarioValidationResult> => {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    const suggestions: Array<{ field: string; suggestion: string }> = [];

    // Validaciones básicas de longitud
    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'La contraseña debe tener al menos 8 caracteres',
        severity: 'error'
      });
    }

    if (password.length > 128) {
      errors.push({
        field: 'password',
        message: 'La contraseña no puede exceder 128 caracteres',
        severity: 'error'
      });
    }

    // Validaciones de complejidad
    if (!/[a-z]/.test(password)) {
      warnings.push({
        field: 'password',
        message: 'Se recomienda incluir letras minúsculas'
      });
    }

    if (!/[A-Z]/.test(password)) {
      warnings.push({
        field: 'password',
        message: 'Se recomienda incluir letras mayúsculas'
      });
    }

    if (!/\d/.test(password)) {
      warnings.push({
        field: 'password',
        message: 'Se recomienda incluir números'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push({
        field: 'password',
        message: 'Se recomienda incluir caracteres especiales'
      });
    }

    // Validaciones de seguridad
    if (userData?.username && password.toLowerCase().includes(userData.username.toLowerCase())) {
      errors.push({
        field: 'password',
        message: 'La contraseña no debe contener el nombre de usuario',
        severity: 'error'
      });
    }

    if (userData?.nombre && password.toLowerCase().includes(userData.nombre.toLowerCase())) {
      warnings.push({
        field: 'password',
        message: 'Se recomienda no usar el nombre en la contraseña'
      });
    }

    // Sugerencias
    if (warnings.length > 2) {
      suggestions.push({
        field: 'password',
        suggestion: 'Considera usar una contraseña más robusta con diferentes tipos de caracteres'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }, []);

  // ==================== VALIDACIÓN EN LOTE ====================

  const validateUserBatch = useCallback(async (users: Usuario[]): Promise<Map<number, UsuarioValidationResult>> => {
    setState(prev => ({ ...prev, validationInProgress: true }));

    const results = new Map<number, UsuarioValidationResult>();

    try {
      for (const user of users) {
        const result = await validateUser(user);
        results.set(user.usuario_id, result);
      }

      setState(prev => ({ 
        ...prev, 
        batchValidationResults: results, 
        validationInProgress: false 
      }));

      return results;
    } catch (error) {
      console.error('Error en validación en lote:', error);
      setState(prev => ({ ...prev, validationInProgress: false }));
      return results;
    }
  }, [validateUser]);

  const getValidationSummary = useCallback(async (users: Usuario[]): Promise<ValidationSummary> => {
    const results = await validateUserBatch(users);
    
    let validUsers = 0;
    let usersWithErrors = 0;
    let usersWithWarnings = 0;
    const issueCounter = new Map<string, { count: number; affectedUsers: number[] }>();

    results.forEach((result, userId) => {
      if (result.isValid && result.warnings.length === 0) {
        validUsers++;
      }
      
      if (result.errors.length > 0) {
        usersWithErrors++;
        result.errors.forEach(error => {
          const key = `${error.field}: ${error.message}`;
          if (!issueCounter.has(key)) {
            issueCounter.set(key, { count: 0, affectedUsers: [] });
          }
          const issue = issueCounter.get(key)!;
          issue.count++;
          issue.affectedUsers.push(userId);
        });
      }
      
      if (result.warnings.length > 0) {
        usersWithWarnings++;
      }
    });

    const commonIssues = Array.from(issueCounter.entries()).map(([issue, data]) => ({
      issue,
      count: data.count,
      affectedUsers: data.affectedUsers
    })).sort((a, b) => b.count - a.count);

    const summary: ValidationSummary = {
      totalUsers: users.length,
      validUsers,
      usersWithErrors,
      usersWithWarnings,
      commonIssues
    };

    setState(prev => ({ ...prev, validationSummary: summary }));
    return summary;
  }, [validateUserBatch]);

  // ==================== VALIDACIONES DE SEGURIDAD ====================

  const validateSecurity = useCallback(async (userData: Usuario): Promise<SecurityValidation> => {
    if (!enableSecurityValidation) {
      return {
        passwordStrength: { score: 0, requirements: [] },
        accountSecurity: { hasSecureEmail: false, hasRecentActivity: false, suspiciousActivity: false },
        rolePermissions: { appropriate: true, suggestions: [] }
      };
    }

    // Validar fortaleza de contraseña (simulado - en producción se evaluaría el hash)
    const passwordRequirements = [
      { met: userData.correo?.includes('@empresa.com') || false, description: 'Usa dominio corporativo' },
      { met: userData.estatus === 'activo', description: 'Cuenta activa' },
      { met: userData.rol !== 'SUPER' || userData.correo?.includes('admin'), description: 'Rol apropiado para el correo' }
    ];

    const securityValidation: SecurityValidation = {
      passwordStrength: {
        score: passwordRequirements.filter(req => req.met).length,
        requirements: passwordRequirements
      },
      accountSecurity: {
        hasSecureEmail: userData.correo?.includes('@empresa.com') || false,
        hasRecentActivity: true, // Esto se evaluaría con datos reales
        suspiciousActivity: false // Esto requeriría análisis de logs
      },
      rolePermissions: {
        appropriate: true,
        suggestions: []
      }
    };

    // Verificar si el rol es apropiado
    if (userData.rol === 'SUPER' && !userData.correo?.includes('admin')) {
      securityValidation.rolePermissions.appropriate = false;
      securityValidation.rolePermissions.suggestions.push('Considera un rol menos privilegiado');
      onSecurityIssue?.('Usuario con rol SUPER sin correo administrativo', 'medium');
    }

    setState(prev => ({ ...prev, securityValidation }));
    return securityValidation;
  }, [enableSecurityValidation, onSecurityIssue]);

  const checkDuplicateEmails = useCallback((users: Usuario[]) => {
    const emailMap = new Map<string, number[]>();
    
    users.forEach(user => {
      if (user.correo) {
        if (!emailMap.has(user.correo)) {
          emailMap.set(user.correo, []);
        }
        emailMap.get(user.correo)!.push(user.usuario_id);
      }
    });

    return Array.from(emailMap.entries())
      .filter(([, userIds]) => userIds.length > 1)
      .map(([email, userIds]) => ({ email, userIds }));
  }, []);

  const checkDuplicateUsernames = useCallback((users: Usuario[]) => {
    const usernameMap = new Map<string, number[]>();
    
    users.forEach(user => {
      if (user.username) {
        if (!usernameMap.has(user.username)) {
          usernameMap.set(user.username, []);
        }
        usernameMap.get(user.username)!.push(user.usuario_id);
      }
    });

    return Array.from(usernameMap.entries())
      .filter(([, userIds]) => userIds.length > 1)
      .map(([username, userIds]) => ({ username, userIds }));
  }, []);

  // ==================== FUNCIONES AUXILIARES DE VERIFICACIÓN ====================

  const checkUsernameExists = useCallback(async (username: string, excludeId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/usuarios/validate/username?username=${encodeURIComponent(username)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
      const { available } = await response.json();
      return !available;
    } catch (error) {
      console.error('Error verificando username:', error);
      return false;
    }
  }, []);

  const checkEmailExists = useCallback(async (email: string, excludeId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/usuarios/validate/email?email=${encodeURIComponent(email)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
      const { available } = await response.json();
      return !available;
    } catch (error) {
      console.error('Error verificando email:', error);
      return false;
    }
  }, []);

  // ==================== GESTIÓN DE REGLAS ====================

  const addValidationRule = useCallback((rule: UsuarioValidationRule) => {
    setState(prev => ({
      ...prev,
      validationRules: [...prev.validationRules, rule],
      customRules: [...prev.customRules, rule]
    }));
  }, []);

  const removeValidationRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      validationRules: prev.validationRules.filter(rule => rule.field !== ruleId),
      customRules: prev.customRules.filter(rule => rule.field !== ruleId)
    }));
  }, []);

  const updateValidationRule = useCallback((ruleId: string, updates: Partial<UsuarioValidationRule>) => {
    setState(prev => ({
      ...prev,
      validationRules: prev.validationRules.map(rule => 
        rule.field === ruleId ? { ...rule, ...updates } : rule
      ),
      customRules: prev.customRules.map(rule => 
        rule.field === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  }, []);

  const resetValidationRules = useCallback(() => {
    setState(prev => ({
      ...prev,
      validationRules: reglasValidacionDefault,
      customRules: []
    }));
  }, []);

  // ==================== UTILIDADES ====================

  const getValidationReport = useCallback(async (users: Usuario[]): Promise<string> => {
    const summary = await getValidationSummary(users);
    
    let report = `Reporte de Validación de Usuarios\n`;
    report += `===============================\n\n`;
    report += `Total de usuarios: ${summary.totalUsers}\n`;
    report += `Usuarios válidos: ${summary.validUsers}\n`;
    report += `Usuarios con errores: ${summary.usersWithErrors}\n`;
    report += `Usuarios con advertencias: ${summary.usersWithWarnings}\n\n`;
    
    if (summary.commonIssues.length > 0) {
      report += `Problemas más comunes:\n`;
      summary.commonIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.issue} (${issue.count} usuarios)\n`;
      });
    }
    
    return report;
  }, [getValidationSummary]);

  const exportValidationResults = useCallback((): string => {
    return JSON.stringify({
      lastValidation: state.lastValidation,
      batchResults: Array.from(state.batchValidationResults.entries()),
      validationSummary: state.validationSummary,
      timestamp: new Date().toISOString()
    }, null, 2);
  }, [state.lastValidation, state.batchValidationResults, state.validationSummary]);

  const getFieldValidationStatus = useCallback((field: string): 'valid' | 'invalid' | 'warning' | 'pending' => {
    if (state.validationInProgress) return 'pending';
    
    const lastValidation = state.lastValidation;
    if (!lastValidation) return 'pending';
    
    const hasError = lastValidation.errors.some(error => error.field === field);
    if (hasError) return 'invalid';
    
    const hasWarning = lastValidation.warnings.some(warning => warning.field === field);
    if (hasWarning) return 'warning';
    
    return 'valid';
  }, [state.validationInProgress, state.lastValidation]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    // Inicializar reglas de validación personalizadas
    if (customValidationRules.length > 0) {
      setState(prev => ({
        ...prev,
        validationRules: [...reglasValidacionDefault, ...customValidationRules],
        customRules: customValidationRules
      }));
    }
  }, [customValidationRules]);

  // ==================== RETORNO ====================

  return {
    state,
    validateUser,
    validateField,
    validateUserCreation,
    validateUserUpdate,
    validatePassword,
    validateUserBatch,
    getValidationSummary,
    validateSecurity,
    checkDuplicateEmails,
    checkDuplicateUsernames,
    addValidationRule,
    removeValidationRule,
    updateValidationRule,
    resetValidationRules,
    getValidationReport,
    exportValidationResults,
    getFieldValidationStatus
  };
}
