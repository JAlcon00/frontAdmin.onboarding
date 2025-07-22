import { useState, useEffect, useCallback } from 'react';
import type { Documento } from '../../types/documento.types';
import { validarDocumentoConCliente, obtenerErroresValidacionDocumentos } from '../../utils/validation';

export interface DocumentoCoherenciaResult {
  validationErrors: string[];
  documentosValidos: Documento[];
  documentosInvalidos: Documento[];
  hasErrors: boolean;
  clearErrors: () => void;
  documentosSinCliente: Documento[];
  clientesSinDocumentos: number[];
}

/**
 * Hook para manejar validación de documentos y su coherencia con clientes
 */
export const useValidacionDocumentos = (documentos: Documento[]): DocumentoCoherenciaResult => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateDocumentos = useCallback(() => {
    if (documentos.length === 0) {
      setValidationErrors([]);
      return;
    }

    const errors = obtenerErroresValidacionDocumentos(documentos);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      console.warn(`Se encontraron ${errors.length} documentos con problemas de coherencia:`, errors);
    }
  }, [documentos]);

  useEffect(() => {
    validateDocumentos();
  }, [validateDocumentos]);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  // Filtrar documentos válidos e inválidos
  const documentosValidos = documentos.filter(validarDocumentoConCliente);
  const documentosInvalidos = documentos.filter(doc => !validarDocumentoConCliente(doc));
  
  // Documentos sin cliente
  const documentosSinCliente = documentos.filter(doc => !doc.cliente_id);
  
  // Clientes que aparecen en documentos pero podrían no tener documentos completos
  const clientesSinDocumentos = Array.from(new Set(documentos.map(doc => doc.cliente_id)))
    .filter(clienteId => {
      const docsCliente = documentos.filter(doc => doc.cliente_id === clienteId);
      return docsCliente.length === 0;
    });

  return {
    validationErrors,
    documentosValidos,
    documentosInvalidos,
    hasErrors: validationErrors.length > 0,
    clearErrors,
    documentosSinCliente,
    clientesSinDocumentos
  };
};
