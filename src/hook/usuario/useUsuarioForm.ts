/**
 * @fileoverview Hook para manejo de formularios de usuario
 * @module hook/usuario/useUsuarioForm
 * @description Proporciona validación, estado y manejo de formularios para crear y editar usuarios
 */

import { useState, useCallback, useEffect } from 'react';
import type { Usuario, UsuarioCreacion, UsuarioActualizacion } from './useUsuarioManager';

// ==================== INTERFACES Y TIPOS ====================

export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  password: string;
  confirmarPassword: string;
  rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus: 'activo' | 'suspendido';
}

export interface PasswordFormData {
  passwordActual: string;
  passwordNuevo: string;
  confirmarPassword: string;
}

export interface UsuarioFormErrors {
  nombre?: string;
  apellido?: string;
  username?: string;
  correo?: string;
  password?: string;
  confirmarPassword?: string;
  rol?: string;
  estatus?: string;
  passwordActual?: string;
  passwordNuevo?: string;
  general?: string;
}

export interface UseUsuarioFormState {
  formData: UsuarioFormData;
  passwordData: PasswordFormData;
  errors: UsuarioFormErrors;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  mode: 'create' | 'edit' | 'password';
}

export interface UseUsuarioFormOptions {
  initialData?: Partial<UsuarioFormData>;
  mode?: 'create' | 'edit' | 'password';
  enableValidation?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (data: UsuarioCreacion | UsuarioActualizacion | PasswordFormData) => Promise<boolean>;
  onValidationChange?: (isValid: boolean, errors: UsuarioFormErrors) => void;
  customValidators?: {
    username?: (value: string) => Promise<string | null>;
    correo?: (value: string) => Promise<string | null>;
  };
}

export interface UseUsuarioFormReturn {
  // Estado
  state: UseUsuarioFormState;
  
  // Manejo de campos
  setValue: (field: keyof UsuarioFormData | keyof PasswordFormData, value: string) => void;
  setError: (field: keyof UsuarioFormErrors, error: string | null) => void;
  setTouched: (field: string, touched?: boolean) => void;
  
  // Validaciones
  validateField: (field: keyof UsuarioFormData | keyof PasswordFormData) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  validatePasswordStrength: (password: string) => {
    score: number;
    feedback: string[];
    isValid: boolean;
  };
  
  // Acciones del formulario
  handleSubmit: () => Promise<boolean>;
  resetForm: () => void;
  loadUserData: (usuario: Usuario) => void;
  
  // Utilidades
  getFieldProps: (field: keyof UsuarioFormData | keyof PasswordFormData) => {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    error: string | undefined;
    touched: boolean;
  };
  
  // Información de roles
  getRoleInfo: (rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => {
    label: string;
    description: string;
    permissions: string[];
  };
}

// ==================== CONFIGURACIÓN INICIAL ====================

const formDataInicial: UsuarioFormData = {
  nombre: '',
  apellido: '',
  username: '',
  correo: '',
  password: '',
  confirmarPassword: '',
  rol: 'OPERADOR',
  estatus: 'activo'
};

const passwordDataInicial: PasswordFormData = {
  passwordActual: '',
  passwordNuevo: '',
  confirmarPassword: ''
};

const estadoInicial: UseUsuarioFormState = {
  formData: formDataInicial,
  passwordData: passwordDataInicial,
  errors: {},
  touched: {},
  isValid: false,
  isSubmitting: false,
  isDirty: false,
  mode: 'create'
};

// ==================== CONFIGURACIÓN DE ROLES ====================

const rolesInfo = {
  SUPER: {
    label: 'Super Usuario',
    description: 'Acceso completo al sistema incluyendo gestión de usuarios',
    permissions: ['Crear', 'Leer', 'Actualizar', 'Eliminar', 'Administrar']
  },
  ADMIN: {
    label: 'Administrador',
    description: 'Gestión completa de datos y usuarios limitada',
    permissions: ['Crear', 'Leer', 'Actualizar', 'Eliminar']
  },
  AUDITOR: {
    label: 'Auditor',
    description: 'Solo lectura para auditoría y reportes',
    permissions: ['Leer']
  },
  OPERADOR: {
    label: 'Operador',
    description: 'Operaciones básicas de lectura y actualización',
    permissions: ['Leer', 'Actualizar']
  }
};

// ==================== HOOK PRINCIPAL ====================

export function useUsuarioForm(options: UseUsuarioFormOptions = {}): UseUsuarioFormReturn {
  const {
    initialData = {},
    mode = 'create',
    enableValidation = true,
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    onValidationChange,
    customValidators
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseUsuarioFormState>({
    ...estadoInicial,
    mode,
    formData: { ...formDataInicial, ...initialData }
  });

  // ==================== VALIDACIONES ====================

  const validarCampoRequerido = useCallback((valor: string, nombreCampo: string): string | null => {
    if (!valor || valor.trim().length === 0) {
      return `${nombreCampo} es requerido`;
    }
    return null;
  }, []);

  const validarEmail = useCallback((email: string): string | null => {
    if (!email) return 'Correo electrónico es requerido';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Formato de correo electrónico inválido';
    }
    
    return null;
  }, []);

  const validarUsername = useCallback((username: string): string | null => {
    if (!username) return 'Nombre de usuario es requerido';
    
    if (username.length < 3) {
      return 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (username.length > 100) {
      return 'El nombre de usuario no puede exceder 100 caracteres';
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return 'Solo se permiten letras, números, guiones y guiones bajos';
    }
    
    return null;
  }, []);

  const validarPassword = useCallback((password: string, isRequired: boolean = true): string | null => {
    if (!password && isRequired) {
      return 'Contraseña es requerida';
    }
    
    if (password && password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (password && password.length > 128) {
      return 'La contraseña no puede exceder 128 caracteres';
    }
    
    return null;
  }, []);

  const validarConfirmacionPassword = useCallback((password: string, confirmacion: string): string | null => {
    if (!confirmacion) {
      return 'Confirmación de contraseña es requerida';
    }
    
    if (password !== confirmacion) {
      return 'Las contraseñas no coinciden';
    }
    
    return null;
  }, []);

  const validatePasswordStrength = useCallback((password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Usa al menos 8 caracteres');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye letras minúsculas');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye letras mayúsculas');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye números');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye caracteres especiales');
    }

    return {
      score,
      feedback,
      isValid: score >= 3
    };
  }, []);

  const validateField = useCallback(async (field: keyof UsuarioFormData | keyof PasswordFormData): Promise<boolean> => {
    if (!enableValidation) return true;

    let error: string | null = null;
    const formData = state.formData;
    const passwordData = state.passwordData;

    // Determinar el valor actual del campo
    const isPasswordField = field in passwordData;
    const value = isPasswordField 
      ? passwordData[field as keyof PasswordFormData]
      : formData[field as keyof UsuarioFormData];

    switch (field) {
      case 'nombre':
        error = validarCampoRequerido(value, 'Nombre');
        break;
      
      case 'apellido':
        error = validarCampoRequerido(value, 'Apellido');
        break;
      
      case 'username':
        error = validarUsername(value);
        if (!error && customValidators?.username) {
          error = await customValidators.username(value);
        }
        break;
      
      case 'correo':
        error = validarEmail(value);
        if (!error && customValidators?.correo) {
          error = await customValidators.correo(value);
        }
        break;
      
      case 'password':
        const isRequired = state.mode === 'create';
        error = validarPassword(value, isRequired);
        break;
      
      case 'confirmarPassword':
        if (state.mode === 'password') {
          error = validarConfirmacionPassword(passwordData.passwordNuevo, value);
        } else {
          error = validarConfirmacionPassword(formData.password, value);
        }
        break;
      
      case 'passwordActual':
        error = validarCampoRequerido(value, 'Contraseña actual');
        break;
      
      case 'passwordNuevo':
        error = validarPassword(value);
        break;
    }

    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      }
    }));

    return !error;
  }, [
    enableValidation, 
    state.formData, 
    state.passwordData, 
    state.mode,
    validarCampoRequerido, 
    validarUsername, 
    validarEmail, 
    validarPassword, 
    validarConfirmacionPassword,
    customValidators
  ]);

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!enableValidation) return true;

    const fieldsToValidate = state.mode === 'password' 
      ? ['passwordActual', 'passwordNuevo', 'confirmarPassword'] as const
      : ['nombre', 'apellido', 'username', 'correo', 'password', 'confirmarPassword'] as const;

    const validations = await Promise.all(
      fieldsToValidate.map(field => validateField(field))
    );

    const isValid = validations.every(Boolean);
    
    setState(prev => ({ ...prev, isValid }));
    onValidationChange?.(isValid, state.errors);
    
    return isValid;
  }, [enableValidation, state.mode, state.errors, validateField, onValidationChange]);

  // ==================== MANEJO DE CAMPOS ====================

  const setValue = useCallback((field: keyof UsuarioFormData | keyof PasswordFormData, value: string) => {
    setState(prev => {
      const isPasswordField = field in prev.passwordData;
      
      const newState = {
        ...prev,
        isDirty: true,
        ...(isPasswordField ? {
          passwordData: {
            ...prev.passwordData,
            [field]: value
          }
        } : {
          formData: {
            ...prev.formData,
            [field]: value
          }
        })
      };

      return newState;
    });

    // Validar en tiempo real si está habilitado
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnChange, validateField]);

  const setError = useCallback((field: keyof UsuarioFormErrors, error: string | null) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      }
    }));
  }, []);

  const setTouched = useCallback((field: string, touched: boolean = true) => {
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched
      }
    }));

    // Validar al perder el foco si está habilitado
    if (touched && validateOnBlur) {
      setTimeout(() => validateField(field as keyof UsuarioFormData | keyof PasswordFormData), 0);
    }
  }, [validateOnBlur, validateField]);

  // ==================== ACCIONES DEL FORMULARIO ====================

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isSubmitting: true, errors: { ...prev.errors, general: undefined } }));

    try {
      const isValid = await validateForm();
      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        return false;
      }

      if (onSubmit) {
        let submitData;
        
        if (state.mode === 'password') {
          submitData = state.passwordData;
        } else if (state.mode === 'create') {
          const { confirmarPassword, ...dataCreacion } = state.formData;
          submitData = dataCreacion;
        } else {
          // Modo edit - solo enviar campos que han cambiado
          const { confirmarPassword, password, ...dataActualizacion } = state.formData;
          // Solo incluir password si se proporcionó uno nuevo
          if (password) {
            submitData = { ...dataActualizacion, password };
          } else {
            submitData = dataActualizacion;
          }
        }

        const success = await onSubmit(submitData);
        
        if (success) {
          setState(prev => ({ 
            ...prev, 
            isSubmitting: false,
            isDirty: false
          }));
          return true;
        } else {
          setState(prev => ({ 
            ...prev, 
            isSubmitting: false,
            errors: { ...prev.errors, general: 'Error al procesar la solicitud' }
          }));
          return false;
        }
      }

      setState(prev => ({ ...prev, isSubmitting: false }));
      return true;

    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error inesperado';
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        errors: { ...prev.errors, general: mensaje }
      }));
      return false;
    }
  }, [state.formData, state.passwordData, state.mode, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...estadoInicial,
      mode: prev.mode,
      formData: { ...formDataInicial, ...initialData }
    }));
  }, [initialData]);

  const loadUserData = useCallback((usuario: Usuario) => {
    setState(prev => ({
      ...prev,
      formData: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        username: usuario.username,
        correo: usuario.correo,
        password: '',
        confirmarPassword: '',
        rol: usuario.rol,
        estatus: usuario.estatus
      },
      mode: 'edit',
      isDirty: false,
      errors: {},
      touched: {}
    }));
  }, []);

  // ==================== UTILIDADES ====================

  const getFieldProps = useCallback((field: keyof UsuarioFormData | keyof PasswordFormData) => {
    const isPasswordField = field in state.passwordData;
    const value = isPasswordField 
      ? state.passwordData[field as keyof PasswordFormData]
      : state.formData[field as keyof UsuarioFormData];

    return {
      value,
      onChange: (newValue: string) => setValue(field, newValue),
      onBlur: () => setTouched(field),
      error: state.errors[field as keyof UsuarioFormErrors],
      touched: state.touched[field] || false
    };
  }, [state.formData, state.passwordData, state.errors, state.touched, setValue, setTouched]);

  const getRoleInfo = useCallback((rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => {
    return rolesInfo[rol];
  }, []);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (enableValidation) {
      validateForm();
    }
  }, [state.formData, state.passwordData, enableValidation, validateForm]);

  // ==================== RETORNO ====================

  return {
    state,
    setValue,
    setError,
    setTouched,
    validateField,
    validateForm,
    validatePasswordStrength,
    handleSubmit,
    resetForm,
    loadUserData,
    getFieldProps,
    getRoleInfo
  };
}
