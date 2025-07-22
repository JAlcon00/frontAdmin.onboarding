import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import type { DocumentoTipo, DocumentoUpload as DocumentoUploadType } from '../../types/documento.types';

interface DocumentoUploadProps {
  clienteId: number;
  tipoDocumento: DocumentoTipo;
  solicitudId?: number;
  multiple?: boolean;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  onUpload?: (files: DocumentoUploadType[]) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  uploadProgress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const DocumentoUpload: React.FC<DocumentoUploadProps> = ({
  clienteId,
  solicitudId,
  tipoDocumento,
  multiple = false,
  maxSize = 10, // 10MB por defecto
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  onUpload,
  onCancel,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo excede el tamaño máximo de ${maxSize}MB`;
    }

    // Validar tipo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo de archivo no permitido. Tipos válidos: ${acceptedTypes.join(', ')}`;
    }

    return null;
  }, [maxSize, acceptedTypes]);

  // Generar preview para imágenes
  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  // Procesar archivos seleccionados
  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: `${Date.now()}-${i}`,
        preview: await generatePreview(file),
        status: error ? 'error' as const : 'pending' as const,
        error: error || undefined,
        uploadProgress: 0
      });
      
      newFiles.push(fileWithPreview);
    }

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
  }, [multiple, validateFile, generatePreview]);

  // Manejar drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Manejar selección de archivos
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // Remover archivo
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Subir archivos
  const handleUpload = useCallback(async () => {
    if (!onUpload || files.length === 0) return;

    const validFiles = files.filter(f => f.status !== 'error');
    if (validFiles.length === 0) {
      setGlobalError('No hay archivos válidos para subir');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    try {
      // Actualizar estado a "uploading"
      setFiles(prev => prev.map(f => 
        f.status !== 'error' ? { ...f, status: 'uploading' as const } : f
      ));

      // Preparar datos para upload
      const uploadsData: DocumentoUploadType[] = validFiles.map(file => ({
        cliente_id: clienteId,
        documento_tipo_id: tipoDocumento.documento_tipo_id,
        archivo: file,
        fecha_documento: new Date()
      }));

      await onUpload(uploadsData);

      // Marcar como exitosos
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'success' as const } : f
      ));

    } catch (error) {
      console.error('Error al subir archivos:', error);
      setGlobalError(error instanceof Error ? error.message : 'Error al subir archivos');
      
      // Marcar como error
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { 
          ...f, 
          status: 'error' as const, 
          error: 'Error en la subida' 
        } : f
      ));
    } finally {
      setIsUploading(false);
    }
  }, [files, onUpload, clienteId, solicitudId, tipoDocumento]);

  // Obtener icono por tipo de archivo
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentIcon;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasValidFiles = files.some(f => f.status !== 'error');
  const allUploaded = files.length > 0 && files.every(f => f.status === 'success');

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Subir Documentos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tipo: {tipoDocumento.nombre}
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${allUploaded ? 'bg-green-50 border-green-300' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Haz clic para subir
                </button>
                {' o arrastra y suelta'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedTypes.join(', ')} hasta {maxSize}MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Lista de archivos */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Archivos seleccionados ({files.length})
            </h4>
            
            <div className="space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file);
                
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <FileIcon className="h-10 w-10 text-gray-400" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {file.error}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {file.status === 'success' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                      {file.status === 'uploading' && (
                        <div className="w-5 h-5">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                      
                      <Badge variant={
                        file.status === 'success' ? 'success' :
                        file.status === 'error' ? 'danger' :
                        file.status === 'uploading' ? 'info' : 'secondary'
                      }>
                        {file.status === 'success' ? 'Subido' :
                         file.status === 'error' ? 'Error' :
                         file.status === 'uploading' ? 'Subiendo...' : 'Pendiente'}
                      </Badge>
                      
                      {file.status !== 'uploading' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error global */}
        {globalError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Información importante:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Los archivos deben estar en formato: {acceptedTypes.join(', ')}</li>
              <li>Tamaño máximo por archivo: {maxSize}MB</li>
              <li>Asegúrate de que los documentos sean legibles y estén completos</li>
            </ul>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isUploading}
            >
              Cancelar
            </Button>
          )}
          
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!hasValidFiles || isUploading || allUploaded}
            loading={isUploading}
          >
            {allUploaded ? 'Archivos subidos' : `Subir ${files.filter(f => f.status !== 'error').length} archivo(s)`}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DocumentoUpload;
