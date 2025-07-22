import React, { useState, useEffect, useMemo } from 'react';
import {
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button, Badge, Card, LoadingSpinner, Modal, useModal } from '../shared';
import { formatearFecha } from '../../utils/formatters';
import { useDocumentoManager } from '../../hook/documento';
import type { Documento } from '../../types/documento.types';

interface DocumentoValidationExtended extends Documento {
  validationStatus: 'valid' | 'invalid' | 'pending' | 'expired';
  validationErrors: string[];
  daysUntilExpiry?: number;
  nombre_archivo: string; // Campo requerido para nombre del archivo
  descripcion: string; // Campo requerido para descripción
}

interface ValidacionDocumentosProps {
  onValidationComplete?: (results: DocumentoValidationExtended[]) => void;
}

export const ValidacionDocumentos: React.FC<ValidacionDocumentosProps> = ({
  onValidationComplete
}) => {
  // Usar hooks reales para obtener datos
  const { state } = useDocumentoManager({ autoLoad: true });
  const { documentos, loading } = state;
  
  const [validating, setValidating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentoValidationExtended | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'valid' | 'invalid' | 'pending' | 'expired',
    search: ''
  });

  const { isOpen, openModal, closeModal } = useModal();

  // Procesar documentos reales para agregar información de validación calculada
  const processedDocumentos: DocumentoValidationExtended[] = useMemo(() => {
    return documentos.map((doc: Documento) => {
      // Calcular estado de validación basado en datos reales
      let validationStatus: 'valid' | 'invalid' | 'pending' | 'expired';
      const validationErrors: string[] = [];
      let daysUntilExpiry: number | undefined;

      // Verificar si está vencido
      if (doc.esta_vencido) {
        validationStatus = 'expired';
        validationErrors.push('Documento vencido');
      } 
      // Verificar si tiene archivo
      else if (!doc.archivo_url) {
        validationStatus = 'pending';
        validationErrors.push('Archivo no cargado');
      }
      // Verificar si está aceptado
      else if (doc.estatus === 'aceptado') {
        validationStatus = 'valid';
      }
      // Verificar si está rechazado
      else if (doc.estatus === 'rechazado') {
        validationStatus = 'invalid';
        validationErrors.push('Documento rechazado');
        if (doc.comentario_revisor) {
          validationErrors.push(doc.comentario_revisor);
        }
      }
      // Por defecto pendiente
      else {
        validationStatus = 'pending';
        validationErrors.push('Pendiente de revisión');
      }

      // Calcular días hasta vencimiento si hay fecha de expiración
      if (doc.fecha_expiracion) {
        const today = new Date();
        const expiry = new Date(doc.fecha_expiracion);
        daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          validationErrors.push(`Vence en ${daysUntilExpiry} días`);
        }
      }

      return {
        ...doc,
        validationStatus,
        validationErrors,
        daysUntilExpiry,
        nombre_archivo: doc.documento_tipo?.nombre || `Documento ${doc.documento_id}`,
        descripcion: doc.comentario_revisor || 'Sin descripción'
      } as DocumentoValidationExtended;
    });
  }, [documentos]);

  useEffect(() => {
    if (onValidationComplete && processedDocumentos.length > 0) {
      onValidationComplete(processedDocumentos);
    }
  }, [processedDocumentos, onValidationComplete]);

  const revalidateDocument = async (docId: number) => {
    setValidating(true);
    try {
      // Revalidación inmediata sin simulación
      // Aquí iría la llamada real al servicio de validación
      console.log(`Revalidating document ${docId}`);
    } catch (error) {
      console.error('Error revalidating document:', error);
    } finally {
      setValidating(false);
    }
  };

  const getStatusBadge = (status: DocumentoValidationExtended['validationStatus']) => {
    const config = {
      valid: { variant: 'success' as const, text: 'Válido' },
      invalid: { variant: 'danger' as const, text: 'Inválido' },
      pending: { variant: 'warning' as const, text: 'Por vencer' },
      expired: { variant: 'danger' as const, text: 'Vencido' }
    };
    return config[status];
  };

  const getStatusIcon = (status: DocumentoValidationExtended['validationStatus']) => {
    switch (status) {
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const filteredDocumentos = processedDocumentos.filter(doc => {
    const matchesStatus = filters.status === 'all' || doc.validationStatus === filters.status;
    const matchesSearch = !filters.search || 
      doc.nombre_archivo.toLowerCase().includes(filters.search.toLowerCase()) ||
      doc.descripcion.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: processedDocumentos.length,
    valid: processedDocumentos.filter(d => d.validationStatus === 'valid').length,
    invalid: processedDocumentos.filter(d => d.validationStatus === 'invalid').length,
    pending: processedDocumentos.filter(d => d.validationStatus === 'pending').length,
    expired: processedDocumentos.filter(d => d.validationStatus === 'expired').length
  };

  if (loading) {
    return (
      <Card className="text-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Validando documentos...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Validación de Documentos</h2>
            <p className="text-gray-600 mt-1">Verificación automática de documentos y cumplimiento</p>
          </div>
          <Button
            variant="outline"
            leftIcon={ArrowPathIcon}
            onClick={() => window.location.reload()}
            loading={validating}
          >
            Revalidar Todo
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="text-center" padding="sm">
            <DocumentTextIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </Card>
          <Card className="text-center" padding="sm">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
            <p className="text-sm text-gray-600">Válidos</p>
          </Card>
          <Card className="text-center" padding="sm">
            <XCircleIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
            <p className="text-sm text-gray-600">Inválidos</p>
          </Card>
          <Card className="text-center" padding="sm">
            <ClockIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Por vencer</p>
          </Card>
          <Card className="text-center" padding="sm">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-sm text-gray-600">Vencidos</p>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="all">Todos los estados</option>
            <option value="valid">Válidos</option>
            <option value="invalid">Inválidos</option>
            <option value="pending">Por vencer</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Lista de documentos */}
      <Card>
        <div className="space-y-4">
          {filteredDocumentos.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
              <p className="text-gray-500">No se encontraron documentos con los filtros seleccionados</p>
            </div>
          ) : (
            filteredDocumentos.map((doc) => (
              <div
                key={doc.documento_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(doc.validationStatus)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{doc.nombre_archivo}</h4>
                    <p className="text-sm text-gray-600">{doc.descripcion}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={getStatusBadge(doc.validationStatus).variant} size="sm">
                        {getStatusBadge(doc.validationStatus).text}
                      </Badge>
                      {doc.fecha_expiracion && (
                        <span className="text-xs text-gray-500">
                          Vence: {formatearFecha(doc.fecha_expiracion)}
                        </span>
                      )}
                    </div>
                    {doc.validationErrors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {doc.validationErrors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={EyeIcon}
                    onClick={() => {
                      setSelectedDoc(doc);
                      openModal();
                    }}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={ArrowPathIcon}
                    onClick={() => revalidateDocument(doc.documento_id)}
                    loading={validating}
                  >
                    Revalidar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal de detalle */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Detalle de Validación"
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(selectedDoc.validationStatus)}
              <div>
                <h3 className="font-medium text-gray-900">{selectedDoc.nombre_archivo}</h3>
                <Badge variant={getStatusBadge(selectedDoc.validationStatus).variant} size="sm">
                  {getStatusBadge(selectedDoc.validationStatus).text}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Fecha de subida:</p>
                <p className="text-gray-600">{formatearFecha(selectedDoc.fecha_subida)}</p>
              </div>
              {selectedDoc.fecha_expiracion && (
                <div>
                  <p className="font-medium text-gray-700">Fecha de vencimiento:</p>
                  <p className="text-gray-600">{formatearFecha(selectedDoc.fecha_expiracion)}</p>
                </div>
              )}
            </div>

            {selectedDoc.validationErrors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errores de validación:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedDoc.validationErrors.map((error, index) => (
                    <li key={index} className="text-red-600 text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-medium text-gray-700 mb-2">Descripción:</p>
              <p className="text-gray-600 text-sm">{selectedDoc.descripcion}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ValidacionDocumentos;
