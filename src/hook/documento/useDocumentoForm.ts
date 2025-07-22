import { useState, useCallback, useEffect, useMemo } from 'react';
import { documentoService } from '../../services/documento.service';
import type { DocumentoSubida } from '../../services/documento.service';
import type { 
  Documento
} from '../../types';

// ==================== INTERFACES ====================

export interface DocumentoFormData {
  documento_tipo_id: number;
  cliente_id: number;
  fecha_documento: Date;
  fecha_expiracion?: Date;
  archivo?: File;
  comentarios?: string;
  folio_solicitud?: string;
  reemplazar?: boolean;
}

export interface UseDocumentoFormState {
  formData: DocumentoFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  submitAttempted: boolean;
  uploadProgress: number;
  isValid: boolean;
  isDirty: boolean;
  file: File | null;
  previewUrl: string | null;
}

export interface UseDocumentoFormOptions {
  initialData?: Partial<DocumentoFormData>;
  clienteId?: number;
  documentoTipoId?: number;
  autoValidate?: boolean;
  enablePreview?: boolean;
  maxFileSize?: number; // en bytes
  allowedTypes?: string[];
  onSubmitSuccess?: (documento: Documento) => void;
  onSubmitError?: (error: string) => void;
  onFileChange?: (file: File | null) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface UseDocumentoFormReturn {
  // Estado del formulario
  state: UseDocumentoFormState;
  
  // Acciones del formulario
  updateField: (field: keyof DocumentoFormData, value: any) => void;
  updateFile: (file: File | null) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  markFieldTouched: (field: string) => void;
  validateField: (field: keyof DocumentoFormData) => string | null;
  validateForm: () => boolean;
  
  // Acciones de envío
  submit: () => Promise<Documento | null>;
  reset: () => void;
  resetToInitial: () => void;
  
  // Utilidades de archivo
  removeFile: () => void;
  generatePreview: () => void;
  validateFile: (file: File) => { valid: boolean; errors: string[] };
  
  // Acciones de validación
  isFieldValid: (field: keyof DocumentoFormData) => boolean;
  getFieldError: (field: keyof DocumentoFormData) => string | null;
  hasFieldError: (field: keyof DocumentoFormData) => boolean;
  
  // Utilidades computadas
  canSubmit: boolean;
  hasChanges: boolean;
  formErrors: string[];
  requiredFields: (keyof DocumentoFormData)[];
}

// ==================== CONSTANTES ====================

const TAMAÑO_MAX_ARCHIVO = 10 * 1024 * 1024; // 10MB
const TIPOS_ARCHIVO_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const INITIAL_FORM_DATA: DocumentoFormData = {
  documento_tipo_id: 0,
  cliente_id: 0,
  fecha_documento: new Date(),
  fecha_expiracion: undefined,
  archivo: undefined,
  comentarios: '',
  folio_solicitud: '',
  reemplazar: false
};

const REQUIRED_FIELDS: (keyof DocumentoFormData)[] = [
  'documento_tipo_id',
  'cliente_id', 
  'fecha_documento'
];

// ==================== HOOK PRINCIPAL ====================

export function useDocumentoForm(options: UseDocumentoFormOptions = {}) {
  const {
    initialData = {},
    clienteId,
    documentoTipoId,
    autoValidate = true,
    enablePreview = true,
    maxFileSize = TAMAÑO_MAX_ARCHIVO,
    allowedTypes = TIPOS_ARCHIVO_PERMITIDOS,
    onSubmitSuccess,
    onSubmitError,
    onFileChange,
    onValidationChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDocumentoFormState>(() => {
    const formData = {
      ...INITIAL_FORM_DATA,
      ...initialData,
      ...(clienteId && { cliente_id: clienteId }),
      ...(documentoTipoId && { documento_tipo_id: documentoTipoId })
    };

    return {
      formData,
      errors: {},
      touched: {},
      isSubmitting: false,
      submitAttempted: false,
      uploadProgress: 0,
      isValid: false,
      isDirty: false,
      file: null,
      previewUrl: null
    };
  });

  // ==================== VALIDACIONES ====================

  const validateField = useCallback((field: keyof DocumentoFormData): string | null => {
    const value = state.formData[field];

    switch (field) {
      case 'documento_tipo_id':
        if (!value || value === 0) return 'El tipo de documento es requerido';
        return null;

      case 'cliente_id':
        if (!value || value === 0) return 'El cliente es requerido';
        return null;

      case 'fecha_documento':
        if (!value) return 'La fecha del documento es requerida';
        if (value instanceof Date && value > new Date()) return 'La fecha no puede ser futura';
        return null;

      case 'fecha_expiracion':
        if (value && value instanceof Date && state.formData.fecha_documento instanceof Date) {
          if (value <= state.formData.fecha_documento) {
            return 'La fecha de expiración debe ser posterior a la fecha del documento';
          }
        }
        return null;

      case 'archivo':
        if (!state.file) return 'El archivo es requerido';
        return null;

      default:
        return null;
    }
  }, [state.formData, state.file]);

  const validateFile = useCallback((file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar tamaño
    if (file.size > maxFileSize) {
      errors.push(`El archivo es muy grande. Máximo: ${maxFileSize / 1024 / 1024}MB`);
    }

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      errors.push('Tipo de archivo no permitido');
    }

    // Validar nombre
    if (!file.name || file.name.trim() === '') {
      errors.push('El archivo debe tener un nombre válido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, [maxFileSize, allowedTypes]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos requeridos
    REQUIRED_FIELDS.forEach(field => {
      const error = validateField(field);
      if (error) newErrors[field] = error;
    });

    // Validar archivo si está presente
    if (state.file) {
      const fileValidation = validateFile(state.file);
      if (!fileValidation.valid) {
        newErrors.archivo = fileValidation.errors.join(', ');
      }
    } else {
      newErrors.archivo = 'El archivo es requerido';
    }

    setState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    }));

    const isValid = Object.keys(newErrors).length === 0;
    
    if (onValidationChange) {
      onValidationChange(isValid);
    }

    return isValid;
  }, [state.file, validateField, validateFile, onValidationChange]);

  // ==================== ACCIONES DEL FORMULARIO ====================

  const updateField = useCallback((field: keyof DocumentoFormData, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      const newErrors = { ...prev.errors };
      
      // Limpiar error del campo si existe
      if (newErrors[field]) {
        delete newErrors[field];
      }

      // Validar campo si autoValidate está habilitado
      if (autoValidate && prev.touched[field]) {
        const error = validateField(field);
        if (error) newErrors[field] = error;
      }

      const isDirty = JSON.stringify(newFormData) !== JSON.stringify({
        ...INITIAL_FORM_DATA,
        ...initialData,
        ...(clienteId && { cliente_id: clienteId }),
        ...(documentoTipoId && { documento_tipo_id: documentoTipoId })
      });

      return {
        ...prev,
        formData: newFormData,
        errors: newErrors,
        isDirty,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, [autoValidate, validateField, initialData, clienteId, documentoTipoId]);

  const updateFile = useCallback((file: File | null) => {
    setState(prev => {
      const newState = {
        ...prev,
        file,
        previewUrl: null,
        uploadProgress: 0
      };

      // Limpiar errores de archivo
      const newErrors = { ...prev.errors };
      delete newErrors.archivo;

      // Validar archivo si está presente
      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          newErrors.archivo = validation.errors.join(', ');
        }
      }

      newState.errors = newErrors;
      newState.isValid = Object.keys(newErrors).length === 0;
      newState.isDirty = true;

      return newState;
    });

    // Generar preview si está habilitado
    if (file && enablePreview) {
      generatePreview();
    }

    if (onFileChange) {
      onFileChange(file);
    }
  }, [validateFile, enablePreview, onFileChange]);

  const markFieldTouched = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: false
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  // ==================== ACCIONES DE ARCHIVO ====================

  const removeFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      previewUrl: null,
      uploadProgress: 0
    }));

    if (onFileChange) {
      onFileChange(null);
    }
  }, [onFileChange]);

  const generatePreview = useCallback(() => {
    if (!state.file || !enablePreview) return;

    if (state.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(state.file);
      setState(prev => ({ ...prev, previewUrl: url }));
    }
  }, [state.file, enablePreview]);

  // ==================== ACCIONES DE ENVÍO ====================

  const submit = useCallback(async (): Promise<Documento | null> => {
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submitAttempted: true,
      uploadProgress: 0
    }));

    try {
      // Validar formulario
      const isValid = validateForm();
      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        return null;
      }

      if (!state.file) {
        setState(prev => ({ 
          ...prev, 
          isSubmitting: false,
          errors: { ...prev.errors, archivo: 'El archivo es requerido' }
        }));
        return null;
      }

      // Preparar datos para envío
      const documentoSubida: DocumentoSubida = {
        clienteId: state.formData.cliente_id,
        documentoTipoId: state.formData.documento_tipo_id,
        file: state.file,
        fechaDocumento: state.formData.fecha_documento,
        folioSolicitud: state.formData.folio_solicitud,
        reemplazar: state.formData.reemplazar
      };

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      // Enviar documento
      const resultado = await documentoService.subirDocumento(documentoSubida);
      
      clearInterval(progressInterval);
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        uploadProgress: 100,
        isDirty: false
      }));

      if (onSubmitSuccess) {
        onSubmitSuccess(resultado);
      }

      return resultado;

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        uploadProgress: 0
      }));

      const errorMessage = error instanceof Error ? error.message : 'Error al subir documento';
      
      if (onSubmitError) {
        onSubmitError(errorMessage);
      }

      throw error;
    }
  }, [state.formData, state.file, validateForm, onSubmitSuccess, onSubmitError]);

  const reset = useCallback(() => {
    setState({
      formData: INITIAL_FORM_DATA,
      errors: {},
      touched: {},
      isSubmitting: false,
      submitAttempted: false,
      uploadProgress: 0,
      isValid: false,
      isDirty: false,
      file: null,
      previewUrl: null
    });
  }, []);

  const resetToInitial = useCallback(() => {
    const formData = {
      ...INITIAL_FORM_DATA,
      ...initialData,
      ...(clienteId && { cliente_id: clienteId }),
      ...(documentoTipoId && { documento_tipo_id: documentoTipoId })
    };

    setState({
      formData,
      errors: {},
      touched: {},
      isSubmitting: false,
      submitAttempted: false,
      uploadProgress: 0,
      isValid: false,
      isDirty: false,
      file: null,
      previewUrl: null
    });
  }, [initialData, clienteId, documentoTipoId]);

  // ==================== UTILIDADES COMPUTADAS ====================

  const isFieldValid = useCallback((field: keyof DocumentoFormData): boolean => {
    return !state.errors[field];
  }, [state.errors]);

  const getFieldError = useCallback((field: keyof DocumentoFormData): string | null => {
    return state.errors[field] || null;
  }, [state.errors]);

  const hasFieldError = useCallback((field: keyof DocumentoFormData): boolean => {
    return Boolean(state.errors[field]);
  }, [state.errors]);

  const canSubmit = useMemo(() => {
    return state.isValid && !state.isSubmitting && state.file !== null && state.isDirty;
  }, [state.isValid, state.isSubmitting, state.file, state.isDirty]);

  const hasChanges = useMemo(() => {
    return state.isDirty;
  }, [state.isDirty]);

  const formErrors = useMemo(() => {
    return Object.values(state.errors).filter(Boolean);
  }, [state.errors]);

  const requiredFields = useMemo(() => {
    return REQUIRED_FIELDS;
  }, []);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoValidate && state.submitAttempted) {
      validateForm();
    }
  }, [state.formData, state.file, autoValidate, state.submitAttempted, validateForm]);

  // Limpiar preview URL al desmontar
  useEffect(() => {
    return () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state.previewUrl]);

  // ==================== RETORNO ====================

  return {
    state,
    updateField,
    updateFile,
    setFieldError,
    clearFieldError,
    markFieldTouched,
    validateField,
    validateForm,
    submit,
    reset,
    resetToInitial,
    removeFile,
    generatePreview,
    validateFile,
    isFieldValid,
    getFieldError,
    hasFieldError,
    canSubmit,
    hasChanges,
    formErrors,
    requiredFields
  };
}