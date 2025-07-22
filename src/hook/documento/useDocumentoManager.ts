import { useState, useCallback, useEffect, useMemo } from 'react';
import { documentoService } from '../../services/documento.service';
import type { 
  Documento, 
  DocumentoCreation, 
  DocumentoFilter, 
  DocumentoTipo,
  EstatusDocumento
} from '../../types';

// ==================== INTERFACES ====================

export interface UseDocumentoManagerState {
  documentos: Documento[];
  selectedDocumento: Documento | null;
  documentosTipos: DocumentoTipo[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  lastOperation: string | null;
  uploadProgress: Record<string, number>;
  pendingUploads: string[];
}

export interface UseDocumentoManagerOptions {
  cliente_id?: number;
  autoLoad?: boolean;
  enableCache?: boolean;
  cacheTimeout?: number;
  onDocumentoChange?: (documento: Documento) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (documento: Documento) => void;
  onUploadError?: (fileId: string, error: string) => void;
}

export interface UseDocumentoManagerReturn {
  // Estado
  state: UseDocumentoManagerState;
  
  // Acciones CRUD
  crear: (data: DocumentoCreation) => Promise<Documento | null>;
  actualizar: (id: number, data: Partial<DocumentoCreation>) => Promise<Documento | null>;
  eliminar: (id: number) => Promise<boolean>;
  obtener: (id: number) => Promise<Documento | null>;
  listar: (filtros?: DocumentoFilter) => Promise<Documento[]>;
  
  // Gestión de archivos
  subirArchivo: (file: File, documento_tipo_id: number, cliente_id: number) => Promise<Documento | null>;
  descargarArchivo: (id: number) => Promise<void>;
  previsualizarArchivo: (id: number) => Promise<string | null>;
  validarArchivo: (file: File) => { valid: boolean; errors: string[] };
  
  // Gestión de estado
  cambiarEstatus: (id: number, estatus: EstatusDocumento, observaciones?: string) => Promise<boolean>;
  aprobar: (id: number, observaciones?: string) => Promise<boolean>;
  rechazar: (id: number, observaciones: string) => Promise<boolean>;
  solicitarCorreccion: (id: number, observaciones: string) => Promise<boolean>;
  
  // Utilidades de selección
  seleccionar: (documento: Documento | null) => void;
  limpiarSeleccion: () => void;
  
  // Operaciones en lote
  aprobarLote: (ids: number[], observaciones?: string) => Promise<number>;
  rechazarLote: (ids: number[], observaciones: string) => Promise<number>;
  eliminarLote: (ids: number[]) => Promise<number>;
  
  // Gestión de tipos de documento
  cargarTipos: () => Promise<DocumentoTipo[]>;
  
  // Utilidades computadas
  utils: {
    documentosPorTipo: Record<number, Documento[]>;
    documentosPorEstatus: Record<EstatusDocumento, Documento[]>;
    documentosVencidos: Documento[];
    documentosPendientes: Documento[];
    estadisticas: {
      total: number;
      aprobados: number;
      pendientes: number;
      rechazados: number;
      vencidos: number;
    };
    isUploading: boolean;
    canUpload: boolean;
  };
}

// ==================== CONSTANTES ====================

const ESTADO_INICIAL: UseDocumentoManagerState = {
  documentos: [],
  selectedDocumento: null,
  documentosTipos: [],
  loading: false,
  error: null,
  operationLoading: false,
  lastOperation: null,
  uploadProgress: {},
  pendingUploads: []
};

const TIPOS_ARCHIVO_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const TAMAÑO_MAX_ARCHIVO = 10 * 1024 * 1024; // 10MB

// ==================== HOOK PRINCIPAL ====================

export function useDocumentoManager(options: UseDocumentoManagerOptions = {}): UseDocumentoManagerReturn {
  const {
    cliente_id,
    autoLoad = true,
    onDocumentoChange,
    onUploadProgress,
    onUploadComplete,
    onUploadError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDocumentoManagerState>(ESTADO_INICIAL);

  // ==================== UTILIDADES ====================

  const handleError = useCallback((error: any, operacion: string) => {
    const mensaje = error?.response?.data?.message || error?.message || `Error en ${operacion}`;
    setState(prev => ({ 
      ...prev, 
      error: mensaje, 
      loading: false, 
      operationLoading: false 
    }));
    return mensaje;
  }, []);

  // ==================== ACCIONES CRUD ====================

  const crear = useCallback(async (data: DocumentoCreation): Promise<Documento | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Creando documento',
      error: null 
    }));

    try {
      const nuevoDocumento = await documentoService.createDocumento(data);
      
      setState(prev => ({
        ...prev,
        documentos: [...prev.documentos, nuevoDocumento],
        operationLoading: false,
        lastOperation: null
      }));

      onDocumentoChange?.(nuevoDocumento);
      return nuevoDocumento;

    } catch (error) {
      handleError(error, 'crear documento');
      return null;
    }
  }, [handleError, onDocumentoChange]);

  const actualizar = useCallback(async (
    id: number, 
    data: Partial<DocumentoCreation>
  ): Promise<Documento | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Actualizando documento',
      error: null 
    }));

    try {
      const documentoActualizado = await documentoService.updateDocumento(id, data);
      
      setState(prev => ({
        ...prev,
        documentos: prev.documentos.map(doc => 
          doc.documento_id === id ? documentoActualizado : doc
        ),
        selectedDocumento: prev.selectedDocumento?.documento_id === id 
          ? documentoActualizado 
          : prev.selectedDocumento,
        operationLoading: false,
        lastOperation: null
      }));

      onDocumentoChange?.(documentoActualizado);
      return documentoActualizado;

    } catch (error) {
      handleError(error, 'actualizar documento');
      return null;
    }
  }, [handleError, onDocumentoChange]);

  const eliminar = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Eliminando documento',
      error: null 
    }));

    try {
      await documentoService.deleteDocumento(id);
      
      setState(prev => ({
        ...prev,
        documentos: prev.documentos.filter(doc => doc.documento_id !== id),
        selectedDocumento: prev.selectedDocumento?.documento_id === id 
          ? null 
          : prev.selectedDocumento,
        operationLoading: false,
        lastOperation: null
      }));

      return true;

    } catch (error) {
      handleError(error, 'eliminar documento');
      return false;
    }
  }, [handleError]);

  const obtener = useCallback(async (id: number): Promise<Documento | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const documento = await documentoService.getDocumentoById(id);
      
      setState(prev => ({
        ...prev,
        selectedDocumento: documento,
        loading: false
      }));

      return documento;

    } catch (error) {
      handleError(error, 'obtener documento');
      return null;
    }
  }, [handleError]);

  const listar = useCallback(async (filtros?: DocumentoFilter): Promise<Documento[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Si hay cliente_id específico, incluirlo en los filtros
      const filtrosCompletos = cliente_id 
        ? { ...filtros, cliente_id }
        : filtros;

      const response = await documentoService.getDocumentos(filtrosCompletos);
      const documentos = Array.isArray(response) ? response : response.data || [];
      
      setState(prev => ({
        ...prev,
        documentos,
        loading: false
      }));

      return documentos;

    } catch (error) {
      handleError(error, 'listar documentos');
      return [];
    }
  }, [cliente_id, handleError]);

  // ==================== GESTIÓN DE ARCHIVOS ====================

  const validarArchivo = useCallback((file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar tipo de archivo
    if (!TIPOS_ARCHIVO_PERMITIDOS.includes(file.type)) {
      errors.push(`Tipo de archivo no permitido: ${file.type}`);
    }

    // Validar tamaño
    if (file.size > TAMAÑO_MAX_ARCHIVO) {
      errors.push(`Archivo muy grande. Máximo: ${TAMAÑO_MAX_ARCHIVO / 1024 / 1024}MB`);
    }

    // Validar nombre
    if (!file.name || file.name.trim() === '') {
      errors.push('El archivo debe tener un nombre válido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  const subirArchivo = useCallback(async (
    file: File,
    documento_tipo_id: number,
    clienteId: number
  ): Promise<Documento | null> => {
    // Validar archivo
    const validacion = validarArchivo(file);
    if (!validacion.valid) {
      const error = `Archivo inválido: ${validacion.errors.join(', ')}`;
      setState(prev => ({ ...prev, error }));
      onUploadError?.(file.name, error);
      return null;
    }

    const fileId = `${Date.now()}_${file.name}`;
    
    setState(prev => ({
      ...prev,
      pendingUploads: [...prev.pendingUploads, fileId],
      uploadProgress: { ...prev.uploadProgress, [fileId]: 0 },
      operationLoading: true,
      lastOperation: `Subiendo ${file.name}`,
      error: null
    }));

    try {
      // Simulación de progreso de subida
      const progressInterval = setInterval(() => {
        setState(prev => {
          const currentProgress = prev.uploadProgress[fileId] || 0;
          const newProgress = Math.min(currentProgress + 10, 90);
          
          onUploadProgress?.(fileId, newProgress);
          
          return {
            ...prev,
            uploadProgress: {
              ...prev.uploadProgress,
              [fileId]: newProgress
            }
          };
        });
      }, 200);

      const documentoSubida = {
        clienteId,
        documentoTipoId: documento_tipo_id,
        file,
        fechaDocumento: new Date()
      };

      const documento = await documentoService.subirDocumento(documentoSubida);
      
      clearInterval(progressInterval);

      setState(prev => {
        const newUploadProgress = { ...prev.uploadProgress };
        delete newUploadProgress[fileId];
        
        return {
          ...prev,
          documentos: [...prev.documentos, documento],
          pendingUploads: prev.pendingUploads.filter(id => id !== fileId),
          uploadProgress: newUploadProgress,
          operationLoading: false,
          lastOperation: null
        };
      });

      onUploadProgress?.(fileId, 100);
      onUploadComplete?.(documento);
      onDocumentoChange?.(documento);
      
      return documento;

    } catch (error) {
      setState(prev => {
        const newUploadProgress = { ...prev.uploadProgress };
        delete newUploadProgress[fileId];
        
        return {
          ...prev,
          pendingUploads: prev.pendingUploads.filter(id => id !== fileId),
          uploadProgress: newUploadProgress,
          operationLoading: false,
          lastOperation: null
        };
      });

      const errorMsg = handleError(error, 'subir archivo');
      onUploadError?.(fileId, errorMsg);
      return null;
    }
  }, [validarArchivo, handleError, onUploadProgress, onUploadComplete, onUploadError, onDocumentoChange]);

  const descargarArchivo = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Descargando archivo' 
    }));

    try {
      const documento = state.documentos.find(d => d.documento_id === id);
      if (!documento) {
        throw new Error('Documento no encontrado');
      }
      
      await documentoService.descargarDocumento(documento);
      
      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

    } catch (error) {
      handleError(error, 'descargar archivo');
    }
  }, [handleError]);

  const previsualizarArchivo = useCallback(async (id: number): Promise<string | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Cargando vista previa' 
    }));

    try {
      const previewUrl = await documentoService.regenerarUrlDocumento(id);
      
      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return previewUrl;

    } catch (error) {
      handleError(error, 'cargar vista previa');
      return null;
    }
  }, [handleError]);

  // ==================== GESTIÓN DE ESTADO ====================

  const cambiarEstatus = useCallback(async (
    id: number,
    estatus: EstatusDocumento,
    observaciones?: string
  ): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Cambiando estatus a ${estatus}`,
      error: null 
    }));

    try {
      // Solo se puede usar reviewDocumento para aceptar o rechazar
      if (estatus === 'aceptado' || estatus === 'rechazado') {
        const documentoActualizado = await documentoService.reviewDocumento(id, {
          estatus,
          comentario_revisor: observaciones
        });
        
        setState(prev => ({
          ...prev,
          documentos: prev.documentos.map(doc => 
            doc.documento_id === id ? documentoActualizado : doc
          ),
          selectedDocumento: prev.selectedDocumento?.documento_id === id 
            ? documentoActualizado 
            : prev.selectedDocumento,
          operationLoading: false,
          lastOperation: null
        }));

        onDocumentoChange?.(documentoActualizado);
        return true;
      } else {
        throw new Error(`No se puede cambiar al estatus ${estatus} directamente`);
      }

    } catch (error) {
      handleError(error, 'cambiar estatus');
      return false;
    }
  }, [handleError, onDocumentoChange]);

  const aprobar = useCallback(async (id: number, observaciones?: string): Promise<boolean> => {
    return cambiarEstatus(id, 'aceptado', observaciones);
  }, [cambiarEstatus]);

  const rechazar = useCallback(async (id: number, observaciones: string): Promise<boolean> => {
    return cambiarEstatus(id, 'rechazado', observaciones);
  }, [cambiarEstatus]);

  const solicitarCorreccion = useCallback(async (id: number, observaciones: string): Promise<boolean> => {
    return cambiarEstatus(id, 'pendiente', observaciones);
  }, [cambiarEstatus]);

  // ==================== UTILIDADES DE SELECCIÓN ====================

  const seleccionar = useCallback((documento: Documento | null) => {
    setState(prev => ({ ...prev, selectedDocumento: documento }));
  }, []);

  const limpiarSeleccion = useCallback(() => {
    setState(prev => ({ ...prev, selectedDocumento: null }));
  }, []);

  // ==================== OPERACIONES EN LOTE ====================

  const aprobarLote = useCallback(async (ids: number[], observaciones?: string): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Aprobando ${ids.length} documentos`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await cambiarEstatus(id, 'aceptado', observaciones);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'aprobar documentos en lote');
      return exitosos;
    }
  }, [cambiarEstatus, handleError]);

  const rechazarLote = useCallback(async (ids: number[], observaciones: string): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Rechazando ${ids.length} documentos`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await cambiarEstatus(id, 'rechazado', observaciones);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'rechazar documentos en lote');
      return exitosos;
    }
  }, [cambiarEstatus, handleError]);

  const eliminarLote = useCallback(async (ids: number[]): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Eliminando ${ids.length} documentos`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await eliminar(id);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'eliminar documentos en lote');
      return exitosos;
    }
  }, [eliminar, handleError]);

  // ==================== GESTIÓN DE TIPOS ====================

  const cargarTipos = useCallback(async (): Promise<DocumentoTipo[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const tipos = await documentoService.getTiposDocumento();
      
      setState(prev => ({
        ...prev,
        documentosTipos: tipos,
        loading: false
      }));

      return tipos;

    } catch (error) {
      handleError(error, 'cargar tipos de documento');
      return [];
    }
  }, [handleError]);

  // ==================== UTILIDADES COMPUTADAS ====================

  const utils = useMemo(() => {
    const documentosPorTipo = state.documentos.reduce((acc, doc) => {
      const tipoId = doc.documento_tipo_id;
      acc[tipoId] = acc[tipoId] || [];
      acc[tipoId].push(doc);
      return acc;
    }, {} as Record<number, Documento[]>);

    const documentosPorEstatus = state.documentos.reduce((acc, doc) => {
      acc[doc.estatus] = acc[doc.estatus] || [];
      acc[doc.estatus].push(doc);
      return acc;
    }, {} as Record<EstatusDocumento, Documento[]>);

    const ahora = new Date();
    const documentosVencidos = state.documentos.filter(doc => 
      doc.fecha_expiracion && new Date(doc.fecha_expiracion) < ahora
    );

    const documentosPendientes = state.documentos.filter(doc => 
      doc.estatus === 'pendiente'
    );

    const estadisticas = {
      total: state.documentos.length,
      aprobados: documentosPorEstatus.aceptado?.length || 0,
      pendientes: documentosPendientes.length,
      rechazados: documentosPorEstatus.rechazado?.length || 0,
      vencidos: documentosVencidos.length
    };

    const isUploading = state.pendingUploads.length > 0;
    const canUpload = !state.operationLoading && !isUploading;

    return {
      documentosPorTipo,
      documentosPorEstatus,
      documentosVencidos,
      documentosPendientes,
      estadisticas,
      isUploading,
      canUpload
    };
  }, [state.documentos, state.pendingUploads, state.operationLoading]);

  // ==================== EFECTOS ====================

  // Auto-cargar al montar el componente
  useEffect(() => {
    if (autoLoad) {
      listar();
      cargarTipos();
    }
  }, [autoLoad, listar, cargarTipos]);

  // Limpiar estado cuando cambie el cliente_id
  useEffect(() => {
    if (cliente_id !== undefined) {
      setState(prev => ({
        ...prev,
        documentos: [],
        selectedDocumento: null
      }));
      
      if (autoLoad) {
        listar();
      }
    }
  }, [cliente_id, autoLoad, listar]);

  // ==================== RETORNO ====================

  return {
    state,
    crear,
    actualizar,
    eliminar,
    obtener,
    listar,
    subirArchivo,
    descargarArchivo,
    previsualizarArchivo,
    validarArchivo,
    cambiarEstatus,
    aprobar,
    rechazar,
    solicitarCorreccion,
    seleccionar,
    limpiarSeleccion,
    aprobarLote,
    rechazarLote,
    eliminarLote,
    cargarTipos,
    utils
  };
}
