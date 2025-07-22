import { useState, useEffect, useCallback } from 'react';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import { validarSolicitudConCliente, obtenerErroresValidacion } from '../../utils/validation';

export interface ValidationResult {
  validationErrors: string[];
  solicitudesValidas: SolicitudCompleta[];
  solicitudesInvalidas: SolicitudCompleta[];
  hasErrors: boolean;
  clearErrors: () => void;
}

/**
 * Hook para manejar validación de solicitudes
 */
export const useValidacionSolicitudes = (solicitudes: SolicitudCompleta[]): ValidationResult => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateSolicitudes = useCallback(() => {
    if (solicitudes.length === 0) {
      setValidationErrors([]);
      return;
    }

    const errors = obtenerErroresValidacion(solicitudes);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      console.warn(`Se encontraron ${errors.length} solicitudes sin cliente válido:`, errors);
    }
  }, [solicitudes]);

  useEffect(() => {
    validateSolicitudes();
  }, [validateSolicitudes]);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  // Filtrar solicitudes válidas e inválidas
  const solicitudesValidas = solicitudes.filter(validarSolicitudConCliente);
  const solicitudesInvalidas = solicitudes.filter(s => !validarSolicitudConCliente(s));

  return {
    validationErrors,
    solicitudesValidas,
    solicitudesInvalidas,
    hasErrors: validationErrors.length > 0,
    clearErrors
  };
};
