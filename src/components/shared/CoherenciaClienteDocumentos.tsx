import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { ValidationAlert } from '../shared/ValidationAlert';
import { 
  validarCompletitudDocumentosCliente,
  obtenerErroresValidacionDocumentos
} from '../../utils/validation';

interface CoherenciaClienteDocumentosProps {
  cliente: any;
  documentos: any[];
  onValidationChange?: (isValid: boolean) => void;
  showDetails?: boolean;
  className?: string;
}

export const CoherenciaClienteDocumentos: React.FC<CoherenciaClienteDocumentosProps> = ({
  cliente,
  documentos,
  onValidationChange,
  showDetails = true,
  className = ''
}) => {
  const [validationResults, setValidationResults] = useState({
    esCompleto: false,
    documentosFaltantes: [] as string[],
    documentosInvalidos: [] as string[],
    porcentajeCompletitud: 0
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (cliente && documentos.length > 0) {
      // Validar completitud de documentos
      const completitud = validarCompletitudDocumentosCliente(cliente, documentos);
      setValidationResults(completitud);

      // Validar coherencia de documentos
      const documentosCliente = documentos.filter(doc => doc.cliente_id === cliente.cliente_id);
      const errors = obtenerErroresValidacionDocumentos(documentosCliente);
      setValidationErrors(errors);

      // Notificar cambio de validación
      const isValid = completitud.esCompleto && errors.length === 0;
      onValidationChange?.(isValid);
    }
  }, [cliente, documentos, onValidationChange]);

  const getCompletitudColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletitudBgColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-green-500';
    if (porcentaje >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCompletitudIcon = (porcentaje: number) => {
    if (porcentaje >= 90) return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (porcentaje >= 70) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
    return <XCircleIcon className="w-5 h-5 text-red-600" />;
  };

  if (!cliente) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
          <p className="text-gray-500">No hay cliente seleccionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Alertas de validación */}
      {validationErrors.length > 0 && (
        <ValidationAlert
          type="error"
          message={`Se encontraron ${validationErrors.length} problemas de coherencia en documentos`}
          details={validationErrors}
          onClose={() => setValidationErrors([])}
        />
      )}

      {/* Resumen de coherencia */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Coherencia Cliente-Documentos
            </h3>
          </div>
          {getCompletitudIcon(validationResults.porcentajeCompletitud)}
        </div>

        {/* Información del cliente */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
            <div>
              <p className="font-medium text-gray-900">
                {cliente.tipo_persona === 'PF' 
                  ? `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno}`.trim()
                  : cliente.razon_social || 'Sin razón social'
                }
              </p>
              <p className="text-sm text-gray-500">
                {cliente.tipo_persona === 'PF' ? 'Persona Física' : 'Persona Moral'} • RFC: {cliente.rfc}
              </p>
            </div>
          </div>
        </div>

        {/* Completitud de documentos */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Completitud de Documentos
            </span>
            <span className={`text-sm font-bold ${getCompletitudColor(validationResults.porcentajeCompletitud)}`}>
              {validationResults.porcentajeCompletitud}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getCompletitudBgColor(validationResults.porcentajeCompletitud)}`}
              style={{ width: `${validationResults.porcentajeCompletitud}%` }}
            />
          </div>
        </div>

        {/* Detalles de validación */}
        {showDetails && (
          <div className="space-y-3">
            {/* Documentos faltantes */}
            {validationResults.documentosFaltantes.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    Documentos Faltantes ({validationResults.documentosFaltantes.length})
                  </span>
                </div>
                <ul className="text-xs text-red-700 space-y-1">
                  {validationResults.documentosFaltantes.map((doc, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">•</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos inválidos */}
            {validationResults.documentosInvalidos.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Documentos con Problemas ({validationResults.documentosInvalidos.length})
                  </span>
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {validationResults.documentosInvalidos.map((doc, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2">•</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estado completo */}
            {validationResults.esCompleto && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Documentos completos y coherentes
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoherenciaClienteDocumentos;
