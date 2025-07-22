import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { Modal } from '../shared/Modal';
import type { Documento, DocumentoTipo, DocumentoRevision as DocumentoRevisionType } from '../../types/documento.types';

interface DocumentoRevisionProps {
  documentos: Documento[];
  documentosTipos: DocumentoTipo[];
  onRevisar?: (revision: DocumentoRevisionType) => Promise<void>;
  onVerDocumento?: (documento: Documento) => void;
  revisorId: number;
  className?: string;
}

interface RevisionState {
  documento: Documento | null;
  accion: 'aprobar' | 'rechazar' | null;
  comentario: string;
  showModal: boolean;
}

export const DocumentoRevision: React.FC<DocumentoRevisionProps> = ({
  documentos,
  documentosTipos,
  onRevisar,
  onVerDocumento,
  revisorId,
  className = ''
}) => {
  const [revisionState, setRevisionState] = useState<RevisionState>({
    documento: null,
    accion: null,
    comentario: '',
    showModal: false
  });
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    solo_pendientes: true,
    tipo_documento: 'todos'
  });

  // Filtrar documentos para revisión
  const documentosPendientes = documentos.filter(doc => {
    if (filtros.solo_pendientes && doc.estatus !== 'pendiente') {
      return false;
    }
    
    if (filtros.tipo_documento !== 'todos' && 
        doc.documento_tipo_id.toString() !== filtros.tipo_documento) {
      return false;
    }
    
    return true;
  });

  // Iniciar proceso de revisión
  const iniciarRevision = (documento: Documento, accion: 'aprobar' | 'rechazar') => {
    setRevisionState({
      documento,
      accion,
      comentario: '',
      showModal: true
    });
  };

  // Cancelar revisión
  const cancelarRevision = () => {
    setRevisionState({
      documento: null,
      accion: null,
      comentario: '',
      showModal: false
    });
  };

  // Confirmar revisión
  const confirmarRevision = async () => {
    if (!revisionState.documento || !revisionState.accion || !onRevisar) {
      return;
    }

    setLoading(true);
    
    try {
      const revision: DocumentoRevisionType = {
        documento_id: revisionState.documento.documento_id,
        revisor_id: revisorId,
        accion: revisionState.accion,
        comentario: revisionState.comentario || undefined,
        fecha_revision: new Date()
      };

      await onRevisar(revision);
      cancelarRevision();
    } catch (error) {
      console.error('Error al procesar revisión:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener información del tipo de documento
  const getTipoDocumento = (tipoId: number) => {
    return documentosTipos.find(tipo => tipo.documento_tipo_id === tipoId);
  };

  // Calcular días desde subida
  const getDiasSinRevisar = (fechaSubida: Date): number => {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fechaSubida).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Obtener prioridad basada en días sin revisar
  const getPrioridad = (dias: number): { nivel: 'baja' | 'media' | 'alta' | 'critica', color: string } => {
    if (dias >= 7) return { nivel: 'critica', color: 'red' };
    if (dias >= 5) return { nivel: 'alta', color: 'orange' };
    if (dias >= 3) return { nivel: 'media', color: 'yellow' };
    return { nivel: 'baja', color: 'green' };
  };

  // Estadísticas de revisión
  const stats = {
    total: documentosPendientes.length,
    criticos: documentosPendientes.filter(doc => getDiasSinRevisar(doc.fecha_subida) >= 7).length,
    altos: documentosPendientes.filter(doc => {
      const dias = getDiasSinRevisar(doc.fecha_subida);
      return dias >= 5 && dias < 7;
    }).length,
    medios: documentosPendientes.filter(doc => {
      const dias = getDiasSinRevisar(doc.fecha_subida);
      return dias >= 3 && dias < 5;
    }).length,
    bajos: documentosPendientes.filter(doc => getDiasSinRevisar(doc.fecha_subida) < 3).length
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.criticos}</div>
            <div className="text-sm text-gray-500">Críticos (7+ días)</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.altos}</div>
            <div className="text-sm text-gray-500">Altos (5-6 días)</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.medios}</div>
            <div className="text-sm text-gray-500">Medios (3-4 días)</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.bajos}</div>
            <div className="text-sm text-gray-500">Bajos (0-2 días)</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.solo_pendientes}
                onChange={(e) => setFiltros(prev => ({ 
                  ...prev, 
                  solo_pendientes: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Solo documentos pendientes
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={filtros.tipo_documento}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                tipo_documento: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              {documentosTipos.map(tipo => (
                <option key={tipo.documento_tipo_id} value={tipo.documento_tipo_id.toString()}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltros({
                solo_pendientes: true,
                tipo_documento: 'todos'
              })}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de documentos para revisar */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Documentos para Revisión ({documentosPendientes.length})
          </h3>
        </div>

        {documentosPendientes.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay documentos pendientes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Todos los documentos han sido revisados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documentosPendientes.map(documento => {
              const tipoDoc = getTipoDocumento(documento.documento_tipo_id);
              const diasSinRevisar = getDiasSinRevisar(documento.fecha_subida);
              const prioridad = getPrioridad(diasSinRevisar);

              return (
                <div key={documento.documento_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {tipoDoc?.nombre || 'Tipo desconocido'}
                          </h4>
                          <Badge 
                            variant={
                              prioridad.nivel === 'critica' ? 'danger' :
                              prioridad.nivel === 'alta' ? 'warning' :
                              prioridad.nivel === 'media' ? 'info' : 'success'
                            }
                            size="sm"
                          >
                            Prioridad {prioridad.nivel}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              Subido hace {diasSinRevisar} día{diasSinRevisar !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <UserIcon className="h-4 w-4" />
                            <span>Cliente ID: {documento.cliente_id}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <DocumentTextIcon className="h-4 w-4" />
                            <span>Doc ID: {documento.documento_id}</span>
                          </div>
                        </div>

                        {documento.comentario_revisor && (
                          <div className="mt-2 flex items-start space-x-1">
                            <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600 italic">
                              "{documento.comentario_revisor}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {onVerDocumento && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerDocumento(documento)}
                          leftIcon={EyeIcon}
                        >
                          Ver
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => iniciarRevision(documento, 'rechazar')}
                        leftIcon={XCircleIcon}
                      >
                        Rechazar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => iniciarRevision(documento, 'aprobar')}
                        leftIcon={CheckCircleIcon}
                      >
                        Aprobar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal de revisión */}
      <Modal
        isOpen={revisionState.showModal}
        onClose={cancelarRevision}
        title={`${revisionState.accion === 'aprobar' ? 'Aprobar' : 'Rechazar'} Documento`}
        size="md"
      >
        {revisionState.documento && (
          <div className="space-y-6">
            {/* Información del documento */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Información del Documento
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <div className="font-medium">
                    {getTipoDocumento(revisionState.documento.documento_tipo_id)?.nombre || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Cliente ID:</span>
                  <div className="font-medium">{revisionState.documento.cliente_id}</div>
                </div>
                
                <div>
                  <span className="text-gray-500">Fecha subida:</span>
                  <div className="font-medium">
                    {new Date(revisionState.documento.fecha_subida).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Días pendiente:</span>
                  <div className="font-medium">
                    {getDiasSinRevisar(revisionState.documento.fecha_subida)} días
                  </div>
                </div>
              </div>
            </div>

            {/* Advertencia para rechazo */}
            {revisionState.accion === 'rechazar' && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Documento será rechazado</p>
                  <p>El cliente deberá subir una nueva versión del documento.</p>
                </div>
              </div>
            )}

            {/* Información para aprobación */}
            {revisionState.accion === 'aprobar' && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Documento será aprobado</p>
                  <p>El documento pasará al estado "aceptado" y será válido para el proceso.</p>
                </div>
              </div>
            )}

            {/* Campo de comentario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios {revisionState.accion === 'rechazar' ? '(requerido)' : '(opcional)'}
              </label>
              <textarea
                value={revisionState.comentario}
                onChange={(e) => setRevisionState(prev => ({ 
                  ...prev, 
                  comentario: e.target.value 
                }))}
                placeholder={
                  revisionState.accion === 'rechazar' 
                    ? 'Explica las razones del rechazo...'
                    : 'Agrega comentarios adicionales (opcional)...'
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              
              {revisionState.accion === 'rechazar' && !revisionState.comentario.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Los comentarios son obligatorios para rechazar un documento.
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={cancelarRevision}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              <Button
                variant={revisionState.accion === 'aprobar' ? 'success' : 'danger'}
                onClick={confirmarRevision}
                loading={loading}
                disabled={
                  revisionState.accion === 'rechazar' && !revisionState.comentario.trim()
                }
              >
                {revisionState.accion === 'aprobar' ? 'Aprobar Documento' : 'Rechazar Documento'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentoRevision;
