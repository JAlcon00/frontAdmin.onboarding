import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  CalendarIcon, 
  UserIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import type { Documento, DocumentoCreation, DocumentoUpdate } from '../../types/documento.types';

interface DocumentoFormProps {
  documento?: Documento;
  isEditing?: boolean;
  onSubmit: (data: DocumentoCreation | DocumentoUpdate) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

interface FormData {
  cliente_id: number | '';
  documento_tipo_id: number | '';
  archivo: File | null;
  fecha_documento: string;
  fecha_expiracion: string;
  estatus?: string;
  comentario_revisor?: string;
}

export const DocumentoForm: React.FC<DocumentoFormProps> = ({
  documento,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    cliente_id: '',
    documento_tipo_id: '',
    archivo: null,
    fecha_documento: '',
    fecha_expiracion: ''
  });

  const [dragOver, setDragOver] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (documento && isEditing) {
      setFormData({
        cliente_id: documento.cliente_id,
        documento_tipo_id: documento.documento_tipo_id,
        archivo: null,
        fecha_documento: new Date(documento.fecha_documento).toISOString().split('T')[0],
        fecha_expiracion: documento.fecha_expiracion 
          ? new Date(documento.fecha_expiracion).toISOString().split('T')[0] 
          : '',
        estatus: documento.estatus,
        comentario_revisor: documento.comentario_revisor || ''
      });
    }
  }, [documento, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convertir a número si es necesario
    const processedValue = (name === 'cliente_id' || name === 'documento_tipo_id') && value
      ? Number(value)
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar errores de validación
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        archivo: 'Tipo de archivo no permitido. Solo se permiten PDF, imágenes y documentos de Word.'
      }));
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors(prev => ({
        ...prev,
        archivo: 'El archivo es demasiado grande. El tamaño máximo es 10MB.'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      archivo: file
    }));

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Limpiar errores
    if (validationErrors.archivo) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.archivo;
        return newErrors;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.cliente_id) {
      errors.cliente_id = 'El cliente es requerido';
    }

    if (!formData.documento_tipo_id) {
      errors.documento_tipo_id = 'El tipo de documento es requerido';
    }

    if (!isEditing && !formData.archivo) {
      errors.archivo = 'El archivo es requerido';
    }

    if (!formData.fecha_documento) {
      errors.fecha_documento = 'La fecha del documento es requerida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing) {
      // Actualizar documento existente
      const updateData: DocumentoUpdate = {};
      
      if (formData.estatus) {
        updateData.estatus = formData.estatus as any;
      }
      
      if (formData.comentario_revisor) {
        updateData.comentario_revisor = formData.comentario_revisor;
      }
      
      if (formData.fecha_expiracion) {
        updateData.fecha_expiracion = new Date(formData.fecha_expiracion);
      }

      onSubmit(updateData);
    } else {
      // Crear nuevo documento
      const createData: DocumentoCreation = {
        cliente_id: formData.cliente_id as number,
        documento_tipo_id: formData.documento_tipo_id as number,
        archivo_url: formData.archivo?.name || '', // Esto se actualizará después del upload
        fecha_documento: new Date(formData.fecha_documento),
        fecha_expiracion: formData.fecha_expiracion ? new Date(formData.fecha_expiracion) : undefined
      };

      onSubmit(createData);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      archivo: null
    }));
    setFilePreview(null);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <DocumentIcon className="w-8 h-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <DocumentTextIcon className="w-8 h-8 text-red-500" />;
    } else {
      return <FolderIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Documento' : 'Nuevo Documento'}
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente ID *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleInputChange}
                disabled={isEditing}
                className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.cliente_id ? 'border-red-300' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-50' : ''}`}
                placeholder="ID del cliente"
              />
            </div>
            {validationErrors.cliente_id && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cliente_id}</p>
            )}
          </div>

          {/* Tipo de documento ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de documento ID *
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                name="documento_tipo_id"
                value={formData.documento_tipo_id}
                onChange={handleInputChange}
                disabled={isEditing}
                className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.documento_tipo_id ? 'border-red-300' : 'border-gray-300'
                } ${isEditing ? 'bg-gray-50' : ''}`}
                placeholder="ID del tipo de documento"
              />
            </div>
            {validationErrors.documento_tipo_id && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.documento_tipo_id}</p>
            )}
          </div>

          {/* Fecha del documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha del documento *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="fecha_documento"
                value={formData.fecha_documento}
                onChange={handleInputChange}
                className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.fecha_documento ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {validationErrors.fecha_documento && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.fecha_documento}</p>
            )}
          </div>

          {/* Fecha de expiración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de expiración
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="fecha_expiracion"
                value={formData.fecha_expiracion}
                onChange={handleInputChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estatus (solo para edición) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estatus
              </label>
              <select
                name="estatus"
                value={formData.estatus || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar estatus</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
          )}
        </div>

        {/* Comentario del revisor (solo para edición) */}
        {isEditing && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario del revisor
            </label>
            <textarea
              name="comentario_revisor"
              value={formData.comentario_revisor || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Agregar comentarios sobre el documento..."
            />
          </div>
        )}

        {/* Upload de archivo (solo para nuevo documento) */}
        {!isEditing && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo del documento *
            </label>
            
            {!formData.archivo ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                } ${validationErrors.archivo ? 'border-red-300' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Arrastra y suelta un archivo aquí, o <span className="text-blue-600">haz clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, imágenes o documentos de Word (máximo 10MB)
                  </p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(formData.archivo)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.archivo.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.archivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {filePreview && (
                  <div className="mt-4">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}
            
            {validationErrors.archivo && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.archivo}</p>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                {isEditing ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default DocumentoForm;
