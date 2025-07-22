import { useState, useCallback, useEffect } from 'react';
import { clienteService } from '../../services/cliente.service';
import { isValidRFC, isValidCURP, isValidEmail, isValidPhone } from '../../utils';
import type { 
  Cliente, 
  ClienteCreation, 
  ClienteFormData, 
  TipoPersona 
} from '../../types';

// ==================== INTERFACES ====================

export interface UseClienteFormState {
  formData: ClienteFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  validatingRFC: boolean;
  rfcExists: boolean;
}

export interface UseClienteFormOptions {
  cliente?: Cliente;
  onSuccess?: (cliente: Cliente) => void;
  onError?: (error: string) => void;
  validateOnChange?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseClienteFormReturn {
  // Estado
  state: UseClienteFormState;
  
  // Acciones de formulario
  updateField: (field: keyof ClienteFormData, value: any) => void;
  updateMultipleFields: (fields: Partial<ClienteFormData>) => void;
  resetForm: () => void;
  loadCliente: (cliente: Cliente) => void;
  
  // Validaciones
  validateField: (field: keyof ClienteFormData) => string | null;
  validateForm: () => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof ClienteFormData) => void;
  
  // Envío del formulario
  submitForm: () => Promise<Cliente | null>;
  
  // Utilidades
  isDirtyField: (field: keyof ClienteFormData) => boolean;
  isFieldRequired: (field: keyof ClienteFormData) => boolean;
  getFieldError: (field: keyof ClienteFormData) => string | null;
  
  // Estado del tipo de persona
  tipoPersonaFields: {
    required: (keyof ClienteFormData)[];
    optional: (keyof ClienteFormData)[];
    hidden: (keyof ClienteFormData)[];
  };
}

// ==================== CONSTANTES ====================

const FORM_DATA_INITIAL: ClienteFormData = {
  tipo_persona: 'PF',
  correo: '',
  telefono: '',
  pais: 'México',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  fecha_nacimiento: undefined,
  curp: '',
  razon_social: '',
  representante_legal: '',
  fecha_constitucion: undefined,
  rfc: '',
  calle: '',
  numero_exterior: '',
  numero_interior: '',
  colonia: '',
  codigo_postal: '',
  ciudad: '',
  estado: ''
};

// Campos por tipo de persona
const CAMPOS_POR_TIPO: Record<TipoPersona, {
  required: (keyof ClienteFormData)[];
  optional: (keyof ClienteFormData)[];
  hidden: (keyof ClienteFormData)[];
}> = {
  PF: {
    required: ['tipo_persona', 'nombre', 'apellido_paterno', 'rfc', 'correo', 'pais'],
    optional: ['apellido_materno', 'fecha_nacimiento', 'curp', 'telefono', 'calle', 'numero_exterior', 'numero_interior', 'colonia', 'codigo_postal', 'ciudad', 'estado'],
    hidden: ['razon_social', 'representante_legal', 'fecha_constitucion']
  },
  PF_AE: {
    required: ['tipo_persona', 'nombre', 'apellido_paterno', 'rfc', 'correo', 'pais'],
    optional: ['apellido_materno', 'fecha_nacimiento', 'curp', 'telefono', 'calle', 'numero_exterior', 'numero_interior', 'colonia', 'codigo_postal', 'ciudad', 'estado', 'razon_social'],
    hidden: ['representante_legal', 'fecha_constitucion']
  },
  PM: {
    required: ['tipo_persona', 'razon_social', 'representante_legal', 'rfc', 'correo', 'pais'],
    optional: ['fecha_constitucion', 'telefono', 'calle', 'numero_exterior', 'numero_interior', 'colonia', 'codigo_postal', 'ciudad', 'estado'],
    hidden: ['nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento', 'curp']
  }
};

// ==================== HOOK PRINCIPAL ====================

export function useClienteForm(options: UseClienteFormOptions = {}): UseClienteFormReturn {
  const {
    cliente,
    onSuccess,
    onError,
    validateOnChange = true,
    autoSave = false,
    autoSaveDelay = 2000
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseClienteFormState>({
    formData: FORM_DATA_INITIAL,
    errors: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false,
    submitError: null,
    submitSuccess: false,
    validatingRFC: false,
    rfcExists: false
  });

  // ==================== VALIDACIONES ====================

  const validateField = useCallback((field: keyof ClienteFormData): string | null => {
    const value = state.formData[field];
    const tipoPersona = state.formData.tipo_persona;
    const isRequired = CAMPOS_POR_TIPO[tipoPersona].required.includes(field);

    // Validar campos requeridos
    if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'Este campo es obligatorio';
    }

    // Validaciones específicas por campo
    switch (field) {
      case 'rfc':
        if (value && !isValidRFC(value as string)) {
          return 'RFC inválido';
        }
        break;

      case 'curp':
        if (value && !isValidCURP(value as string)) {
          return 'CURP inválido';
        }
        break;

      case 'correo':
        if (value && !isValidEmail(value as string)) {
          return 'Email inválido';
        }
        break;

      case 'telefono':
        if (value && !isValidPhone(value as string)) {
          return 'Teléfono inválido';
        }
        break;

      case 'codigo_postal':
        if (value && !/^\d{5}$/.test(value as string)) {
          return 'Código postal debe tener 5 dígitos';
        }
        break;

      case 'fecha_nacimiento':
        if (value) {
          const fecha = new Date(value as Date);
          const hoy = new Date();
          const edad = hoy.getFullYear() - fecha.getFullYear();
          if (edad < 18 || edad > 120) {
            return 'La edad debe estar entre 18 y 120 años';
          }
        }
        break;

      case 'fecha_constitucion':
        if (value) {
          const fecha = new Date(value as Date);
          const hoy = new Date();
          if (fecha > hoy) {
            return 'La fecha de constitución no puede ser futura';
          }
        }
        break;
    }

    return null;
  }, [state.formData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const tipoPersona = state.formData.tipo_persona;
    const camposAValidar = [
      ...CAMPOS_POR_TIPO[tipoPersona].required,
      ...CAMPOS_POR_TIPO[tipoPersona].optional
    ];

    let isValid = true;

    for (const field of camposAValidar) {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setState(prev => ({ 
      ...prev, 
      errors: newErrors, 
      isValid 
    }));

    return isValid;
  }, [validateField]);

  // ==================== ACCIONES ====================

  const updateField = useCallback((field: keyof ClienteFormData, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      let newErrors = { ...prev.errors };

      // Si se cambia el tipo de persona, limpiar campos no aplicables
      if (field === 'tipo_persona') {
        const camposHidden = CAMPOS_POR_TIPO[value as TipoPersona].hidden;
        camposHidden.forEach(campo => {
          (newFormData as any)[campo] = '';
          delete newErrors[campo];
        });
      }

      // Validar campo si está habilitado
      if (validateOnChange) {
        const error = validateField(field);
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
      }

      const isDirty = JSON.stringify(newFormData) !== JSON.stringify(FORM_DATA_INITIAL);

      return {
        ...prev,
        formData: newFormData,
        errors: newErrors,
        isDirty,
        submitSuccess: false // Reset success state on change
      };
    });
  }, [validateField, validateOnChange]);

  const updateMultipleFields = useCallback((fields: Partial<ClienteFormData>) => {
    setState(prev => {
      const newFormData = { ...prev.formData, ...fields };
      let newErrors = { ...prev.errors };

      // Validar campos modificados si está habilitado
      if (validateOnChange) {
        Object.keys(fields).forEach(field => {
          const error = validateField(field as keyof ClienteFormData);
          if (error) {
            newErrors[field] = error;
          } else {
            delete newErrors[field];
          }
        });
      }

      const isDirty = JSON.stringify(newFormData) !== JSON.stringify(FORM_DATA_INITIAL);

      return {
        ...prev,
        formData: newFormData,
        errors: newErrors,
        isDirty,
        submitSuccess: false
      };
    });
  }, [validateField, validateOnChange]);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: cliente ? clienteToFormData(cliente) : FORM_DATA_INITIAL,
      errors: {},
      isDirty: false,
      submitError: null,
      submitSuccess: false
    }));
  }, [cliente]);

  const loadCliente = useCallback((clienteData: Cliente) => {
    setState(prev => ({
      ...prev,
      formData: clienteToFormData(clienteData),
      errors: {},
      isDirty: false,
      submitError: null,
      submitSuccess: false
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  const clearFieldError = useCallback((field: keyof ClienteFormData) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return { ...prev, errors: newErrors };
    });
  }, []);

  // ==================== ENVÍO DEL FORMULARIO ====================

  const submitForm = useCallback(async (): Promise<Cliente | null> => {
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submitError: null, 
      submitSuccess: false 
    }));

    try {
      // Validar formulario
      const isFormValid = validateForm();
      if (!isFormValid) {
        setState(prev => ({ 
          ...prev, 
          isSubmitting: false, 
          submitError: 'Por favor corrige los errores del formulario' 
        }));
        return null;
      }

      // Preparar datos para envío
      const clienteData: ClienteCreation = formDataToClienteCreation(state.formData);

      // Crear o actualizar cliente
      let resultado: Cliente;
      if (cliente?.cliente_id) {
        resultado = await clienteService.updateCliente(cliente.cliente_id, clienteData);
      } else {
        resultado = await clienteService.createCliente(clienteData);
      }

      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        submitSuccess: true,
        isDirty: false
      }));

      onSuccess?.(resultado);
      return resultado;

    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar cliente';
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        submitError: errorMessage 
      }));

      onError?.(errorMessage);
      return null;
    }
  }, [state.formData, validateForm, cliente, onSuccess, onError]);

  // ==================== UTILIDADES ====================

  const isDirtyField = useCallback((field: keyof ClienteFormData): boolean => {
    const initialValue = cliente ? clienteToFormData(cliente)[field] : FORM_DATA_INITIAL[field];
    return state.formData[field] !== initialValue;
  }, [state.formData, cliente]);

  const isFieldRequired = useCallback((field: keyof ClienteFormData): boolean => {
    return CAMPOS_POR_TIPO[state.formData.tipo_persona].required.includes(field);
  }, [state.formData.tipo_persona]);

  const getFieldError = useCallback((field: keyof ClienteFormData): string | null => {
    return state.errors[field] || null;
  }, [state.errors]);

  // ==================== EFECTOS ====================

  // Cargar cliente inicial
  useEffect(() => {
    if (cliente) {
      loadCliente(cliente);
    }
  }, [cliente, loadCliente]);

  // Validar RFC duplicado
  useEffect(() => {
    const rfc = state.formData.rfc;
    if (rfc && isValidRFC(rfc) && rfc !== cliente?.rfc) {
      setState(prev => ({ ...prev, validatingRFC: true }));
      
      const validateRFC = async () => {
        try {
          // Por ahora, simplemente simular la validación
          // TODO: Implementar validateRFC en el servicio
          const exists = false; // await clienteService.validateRFC(rfc);
          setState(prev => ({ 
            ...prev, 
            validatingRFC: false, 
            rfcExists: exists 
          }));
          
          if (exists) {
            setState(prev => ({
              ...prev,
              errors: {
                ...prev.errors,
                rfc: 'Ya existe un cliente con este RFC'
              }
            }));
          }
        } catch (error) {
          setState(prev => ({ ...prev, validatingRFC: false }));
        }
      };

      const timeoutId = setTimeout(validateRFC, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [state.formData.rfc, cliente?.rfc]);

  // Auto-guardar
  useEffect(() => {
    if (autoSave && state.isDirty && state.isValid && !state.isSubmitting) {
      const timeoutId = setTimeout(() => {
        submitForm();
      }, autoSaveDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoSave, state.isDirty, state.isValid, state.isSubmitting, autoSaveDelay, submitForm]);

  // ==================== CAMPOS POR TIPO DE PERSONA ====================

  const tipoPersonaFields = {
    required: CAMPOS_POR_TIPO[state.formData.tipo_persona].required,
    optional: CAMPOS_POR_TIPO[state.formData.tipo_persona].optional,
    hidden: CAMPOS_POR_TIPO[state.formData.tipo_persona].hidden
  };

  // ==================== RETORNO ====================

  return {
    state,
    updateField,
    updateMultipleFields,
    resetForm,
    loadCliente,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    submitForm,
    isDirtyField,
    isFieldRequired,
    getFieldError,
    tipoPersonaFields
  };
}

// ==================== UTILIDADES DE TRANSFORMACIÓN ====================

function clienteToFormData(cliente: Cliente): ClienteFormData {
  return {
    tipo_persona: cliente.tipo_persona,
    correo: cliente.correo,
    telefono: cliente.telefono || '',
    pais: cliente.pais,
    nombre: cliente.nombre || '',
    apellido_paterno: cliente.apellido_paterno || '',
    apellido_materno: cliente.apellido_materno || '',
    fecha_nacimiento: cliente.fecha_nacimiento,
    curp: cliente.curp || '',
    razon_social: cliente.razon_social || '',
    representante_legal: cliente.representante_legal || '',
    fecha_constitucion: cliente.fecha_constitucion,
    rfc: cliente.rfc,
    calle: cliente.calle || '',
    numero_exterior: cliente.numero_exterior || '',
    numero_interior: cliente.numero_interior || '',
    colonia: cliente.colonia || '',
    codigo_postal: cliente.codigo_postal || '',
    ciudad: cliente.ciudad || '',
    estado: cliente.estado || ''
  };
}

function formDataToClienteCreation(formData: ClienteFormData): ClienteCreation {
  const baseData: ClienteCreation = {
    tipo_persona: formData.tipo_persona,
    rfc: formData.rfc,
    correo: formData.correo,
    pais: formData.pais || 'México'
  };

  // Agregar campos opcionales solo si tienen valor
  if (formData.nombre) baseData.nombre = formData.nombre;
  if (formData.apellido_paterno) baseData.apellido_paterno = formData.apellido_paterno;
  if (formData.apellido_materno) baseData.apellido_materno = formData.apellido_materno;
  if (formData.fecha_nacimiento) baseData.fecha_nacimiento = formData.fecha_nacimiento;
  if (formData.curp) baseData.curp = formData.curp;
  if (formData.razon_social) baseData.razon_social = formData.razon_social;
  if (formData.representante_legal) baseData.representante_legal = formData.representante_legal;
  if (formData.fecha_constitucion) baseData.fecha_constitucion = formData.fecha_constitucion;
  if (formData.telefono) baseData.telefono = formData.telefono;
  if (formData.calle) baseData.calle = formData.calle;
  if (formData.numero_exterior) baseData.numero_exterior = formData.numero_exterior;
  if (formData.numero_interior) baseData.numero_interior = formData.numero_interior;
  if (formData.colonia) baseData.colonia = formData.colonia;
  if (formData.codigo_postal) baseData.codigo_postal = formData.codigo_postal;
  if (formData.ciudad) baseData.ciudad = formData.ciudad;
  if (formData.estado) baseData.estado = formData.estado;

  return baseData;
}
