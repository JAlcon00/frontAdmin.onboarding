import { useState, useCallback, useEffect } from 'react';
import { solicitudService } from '../../services/solicitud.service';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { 
  SolicitudCreation,
  ProductoCodigo
} from '../../types';

// ==================== INTERFACES ====================

export interface UseSolicitudFormState {
  formData: SolicitudFormData;
  productos: ProductoFormData[];
  errors: Record<string, string | undefined>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

export interface ProductoFormData {
  producto: ProductoCodigo;
  monto: number;
  plazo_meses: number;
  temp_id?: string; // Para identificar productos antes de guardar
}

export interface SolicitudFormData {
  cliente_id: number;
  productos: ProductoFormData[];
}

export interface UseSolicitudFormOptions {
  solicitud?: SolicitudCompleta;
  cliente_id?: number;
  onSuccess?: (solicitud: SolicitudCompleta) => void;
  onError?: (error: string) => void;
  validateOnChange?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseSolicitudFormReturn {
  // Estado
  state: UseSolicitudFormState;
  
  // Acciones de formulario
  updateField: (field: keyof SolicitudFormData, value: any) => void;
  updateMultipleFields: (fields: Partial<SolicitudFormData>) => void;
  resetForm: () => void;
  loadSolicitud: (solicitud: SolicitudCompleta) => void;
  
  // Gestión de productos
  addProducto: (producto: Omit<ProductoFormData, 'temp_id'>) => void;
  updateProducto: (index: number, producto: Partial<ProductoFormData>) => void;
  removeProducto: (index: number) => void;
  reorderProductos: (fromIndex: number, toIndex: number) => void;
  
  // Validaciones
  validateField: (field: keyof SolicitudFormData) => string | null;
  validateProducto: (index: number) => Record<string, string>;
  validateForm: () => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof SolicitudFormData) => void;
  
  // Envío del formulario
  submitForm: () => Promise<SolicitudCompleta | null>;
  saveDraft: () => Promise<void>;
  
  // Utilidades
  isDirtyField: (field: keyof SolicitudFormData) => boolean;
  isFieldRequired: (field: keyof SolicitudFormData) => boolean;
  getFieldError: (field: keyof SolicitudFormData) => string | null;
  getTotalMonto: () => number;
  isValidForSubmit: () => boolean;
}

// ==================== CONSTANTES ====================

const FORM_DATA_INITIAL: SolicitudFormData = {
  cliente_id: 0,
  productos: []
};

const PRODUCTOS_OPCIONES: Array<{value: ProductoCodigo, label: string}> = [
  { value: 'CS', label: 'Crédito Simple' },
  { value: 'CC', label: 'Cuenta Corriente' },
  { value: 'FA', label: 'Factoraje' },
  { value: 'AR', label: 'Arrendamiento' }
];

const PLAZO_MIN_MESES = 1;
const PLAZO_MAX_MESES = 120;
const MONTO_MIN = 1000;
const MONTO_MAX = 50000000;

// ==================== HOOK PRINCIPAL ====================

export function useSolicitudForm(options: UseSolicitudFormOptions = {}): UseSolicitudFormReturn {
  const {
    solicitud,
    cliente_id,
    onSuccess,
    onError,
    validateOnChange = true,
    autoSave = false,
    autoSaveDelay = 3000
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseSolicitudFormState>({
    formData: { 
      ...FORM_DATA_INITIAL, 
      cliente_id: cliente_id || 0 
    },
    productos: [],
    errors: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false,
    submitError: null,
    submitSuccess: false
  });

  // ==================== UTILIDADES DE VALIDACIÓN ====================

  const validateField = useCallback((field: keyof SolicitudFormData): string | null => {
    const value = state.formData[field];

    switch (field) {
      case 'cliente_id':
        if (!value || value === 0) return 'Debe seleccionar un cliente';
        break;
      default:
        break;
    }

    return null;
  }, [state.formData]);

  const validateProducto = useCallback((index: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    const producto = state.productos[index];

    if (!producto) return errors;

    if (!producto.producto) {
      errors.producto = 'Debe seleccionar un tipo de producto';
    }

    if (!producto.monto || producto.monto < MONTO_MIN) {
      errors.monto = `El monto debe ser mayor a $${MONTO_MIN.toLocaleString()}`;
    } else if (producto.monto > MONTO_MAX) {
      errors.monto = `El monto no debe exceder $${MONTO_MAX.toLocaleString()}`;
    }

    if (!producto.plazo_meses || producto.plazo_meses < PLAZO_MIN_MESES) {
      errors.plazo_meses = `El plazo debe ser mayor a ${PLAZO_MIN_MESES} mes`;
    } else if (producto.plazo_meses > PLAZO_MAX_MESES) {
      errors.plazo_meses = `El plazo no debe exceder ${PLAZO_MAX_MESES} meses`;
    }

    return errors;
  }, [state.productos]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos básicos
    const clienteError = validateField('cliente_id');
    if (clienteError) newErrors.cliente_id = clienteError;

    // Validar que hay al menos un producto
    if (state.productos.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto';
    }

    // Validar cada producto
    state.productos.forEach((_, index) => {
      const productoErrors = validateProducto(index);
      if (Object.keys(productoErrors).length > 0) {
        Object.keys(productoErrors).forEach(key => {
          newErrors[`producto_${index}_${key}`] = productoErrors[key];
        });
      }
    });

    // Verificar productos duplicados
    const productosUnicos = new Set(state.productos.map(p => p.producto));
    if (productosUnicos.size !== state.productos.length) {
      newErrors.productos_duplicados = 'No puede tener productos duplicados';
    }

    setState(prev => ({ 
      ...prev, 
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    }));

    return Object.keys(newErrors).length === 0;
  }, [state.productos, validateField, validateProducto]);

  // ==================== ACCIONES DE FORMULARIO ====================

  const updateField = useCallback((field: keyof SolicitudFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      },
      isDirty: true,
      submitSuccess: false
    }));

    if (validateOnChange) {
      setTimeout(() => {
        const error = validateField(field);
        setState(prev => ({
          ...prev,
          errors: error 
            ? { ...prev.errors, [field]: error }
            : { ...prev.errors, [field]: undefined }
        }));
      }, 300);
    }
  }, [validateOnChange, validateField]);

  const updateMultipleFields = useCallback((fields: Partial<SolicitudFormData>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...fields
      },
      isDirty: true,
      submitSuccess: false
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: { 
        ...FORM_DATA_INITIAL, 
        cliente_id: cliente_id || 0 
      },
      productos: [],
      errors: {},
      isDirty: false,
      submitError: null,
      submitSuccess: false,
      isValid: false
    }));
  }, [cliente_id]);

  const loadSolicitud = useCallback((solicitudData: SolicitudCompleta) => {
    const productos = solicitudData.productos.map(p => ({
      producto: p.producto,
      monto: p.monto,
      plazo_meses: p.plazo_meses
    }));

    setState(prev => ({
      ...prev,
      formData: {
        cliente_id: solicitudData.cliente_id,
        productos
      },
      productos,
      isDirty: false,
      submitSuccess: false,
      errors: {}
    }));
  }, []);

  // ==================== GESTIÓN DE PRODUCTOS ====================

  const addProducto = useCallback((producto: Omit<ProductoFormData, 'temp_id'>) => {
    const nuevoProducto = {
      ...producto,
      temp_id: `temp_${Date.now()}_${Math.random()}`
    };

    setState(prev => ({
      ...prev,
      productos: [...prev.productos, nuevoProducto],
      isDirty: true,
      submitSuccess: false
    }));
  }, []);

  const updateProducto = useCallback((index: number, producto: Partial<ProductoFormData>) => {
    setState(prev => ({
      ...prev,
      productos: prev.productos.map((p, i) => 
        i === index ? { ...p, ...producto } : p
      ),
      isDirty: true,
      submitSuccess: false
    }));
  }, []);

  const removeProducto = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index),
      isDirty: true,
      submitSuccess: false
    }));
  }, []);

  const reorderProductos = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const productos = [...prev.productos];
      const [moved] = productos.splice(fromIndex, 1);
      productos.splice(toIndex, 0, moved);
      
      return {
        ...prev,
        productos,
        isDirty: true,
        submitSuccess: false
      };
    });
  }, []);

  // ==================== UTILIDADES ====================

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  const clearFieldError = useCallback((field: keyof SolicitudFormData) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined }
    }));
  }, []);

  const isDirtyField = useCallback((field: keyof SolicitudFormData): boolean => {
    if (!solicitud) return state.isDirty;
    
    const originalValue = field === 'cliente_id' 
      ? solicitud.cliente_id 
      : [];
    
    return state.formData[field] !== originalValue;
  }, [state.formData, state.isDirty, solicitud]);

  const isFieldRequired = useCallback((field: keyof SolicitudFormData): boolean => {
    return ['cliente_id'].includes(field);
  }, []);

  const getFieldError = useCallback((field: keyof SolicitudFormData): string | null => {
    return state.errors[field] || null;
  }, [state.errors]);

  const getTotalMonto = useCallback((): number => {
    return state.productos.reduce((total, producto) => total + (producto.monto || 0), 0);
  }, [state.productos]);

  const isValidForSubmit = useCallback((): boolean => {
    return state.isValid && state.productos.length > 0 && !state.isSubmitting;
  }, [state.isValid, state.productos.length, state.isSubmitting]);

  // ==================== ENVÍO DEL FORMULARIO ====================

  const submitForm = useCallback(async (): Promise<SolicitudCompleta | null> => {
    if (!validateForm()) {
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submitError: null 
    }));

    try {
      const solicitudData: SolicitudCreation = {
        cliente_id: state.formData.cliente_id,
        productos: state.productos.map(p => ({
          producto_codigo: p.producto,
          monto_solicitado: p.monto,
          moneda: 'MXN' as const,
          plazo_meses: p.plazo_meses
        }))
      };

      const result = await solicitudService.createSolicitud(solicitudData);
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        submitSuccess: true,
        isDirty: false
      }));

      onSuccess?.(result);
      return result;

    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear la solicitud';
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        submitError: errorMessage
      }));

      onError?.(errorMessage);
      return null;
    }
  }, [state.formData, state.productos, validateForm, onSuccess, onError]);

  const saveDraft = useCallback(async (): Promise<void> => {
    // TODO: Implementar guardado como borrador
    console.log('Guardando borrador...', state.formData);
  }, [state.formData]);

  // ==================== EFECTOS ====================

  // Cargar solicitud si se proporciona
  useEffect(() => {
    if (solicitud) {
      loadSolicitud(solicitud);
    }
  }, [solicitud, loadSolicitud]);

  // Validar formulario cuando cambie
  useEffect(() => {
    if (state.isDirty) {
      validateForm();
    }
  }, [state.productos, state.formData, state.isDirty, validateForm]);

  // Auto-guardado
  useEffect(() => {
    if (autoSave && state.isDirty && state.isValid && !state.isSubmitting) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, autoSaveDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoSave, state.isDirty, state.isValid, state.isSubmitting, autoSaveDelay, saveDraft]);

  // ==================== RETORNO ====================

  return {
    state,
    updateField,
    updateMultipleFields,
    resetForm,
    loadSolicitud,
    addProducto,
    updateProducto,
    removeProducto,
    reorderProductos,
    validateField,
    validateProducto,
    validateForm,
    clearErrors,
    clearFieldError,
    submitForm,
    saveDraft,
    isDirtyField,
    isFieldRequired,
    getFieldError,
    getTotalMonto,
    isValidForSubmit
  };
}

// ==================== EXPORTAR CONSTANTES ====================

export { PRODUCTOS_OPCIONES, PLAZO_MIN_MESES, PLAZO_MAX_MESES, MONTO_MIN, MONTO_MAX };
