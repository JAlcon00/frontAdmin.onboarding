import { useState, useCallback, useEffect, useMemo } from 'react';
import { solicitudService } from '../../services/solicitud.service';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { 
  SolicitudCreation, 
  SolicitudFilter, 
  SolicitudProducto,
  ProductoCodigo,
  EstatusSolicitud
} from '../../types';

// ==================== INTERFACES ====================

export interface UseSolicitudManagerState {
  solicitudes: SolicitudCompleta[];
  selectedSolicitud: SolicitudCompleta | null;
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  lastOperation: string | null;
}

export interface UseSolicitudManagerOptions {
  cliente_id?: number;
  autoLoad?: boolean;
  onSolicitudChange?: (solicitud: SolicitudCompleta) => void;
  onStatusChange?: (solicitud: SolicitudCompleta, newStatus: EstatusSolicitud) => void;
}

export interface UseSolicitudManagerReturn {
  // Estado
  state: UseSolicitudManagerState;
  
  // Acciones CRUD
  crear: (data: SolicitudCreation) => Promise<SolicitudCompleta | null>;
  actualizar: (id: number, data: { estatus?: EstatusSolicitud }) => Promise<SolicitudCompleta | null>;
  eliminar: (id: number) => Promise<boolean>;
  obtener: (id: number) => Promise<SolicitudCompleta | null>;
  listar: (filtros?: SolicitudFilter) => Promise<SolicitudCompleta[]>;
  
  // Gestión de productos
  agregarProducto: (solicitudId: number, producto: { producto: ProductoCodigo; monto: number; plazo_meses: number }) => Promise<SolicitudProducto | null>;
  actualizarProducto: (solicitudId: number, productoId: number, data: { monto?: number; plazo_meses?: number }) => Promise<SolicitudProducto | null>;
  eliminarProducto: (solicitudId: number, productoId: number) => Promise<boolean>;
  
  // Gestión de estados
  cambiarEstatus: (id: number, estatus: EstatusSolicitud, observaciones?: string) => Promise<boolean>;
  aprobar: (id: number, observaciones?: string) => Promise<boolean>;
  rechazar: (id: number, observaciones: string) => Promise<boolean>;
  cancelar: (id: number, observaciones: string) => Promise<boolean>;
  enviarRevision: (id: number, observaciones?: string) => Promise<boolean>;
  
  // Utilidades de selección
  seleccionar: (solicitud: SolicitudCompleta | null) => void;
  limpiarSeleccion: () => void;
  
  // Operaciones en lote
  aprobarLote: (ids: number[], observaciones?: string) => Promise<number>;
  rechazarLote: (ids: number[], observaciones: string) => Promise<number>;
  cancelarLote: (ids: number[], observaciones: string) => Promise<number>;
  eliminarLote: (ids: number[]) => Promise<number>;
  
  // Utilidades computadas
  utils: {
    solicitudesPorEstatus: Record<EstatusSolicitud, SolicitudCompleta[]>;
    solicitudesPorProducto: Record<ProductoCodigo, SolicitudCompleta[]>;
    solicitudesVencidas: SolicitudCompleta[];
    solicitudesPendientes: SolicitudCompleta[];
    estadisticas: {
      total: number;
      iniciadas: number;
      en_revision: number;
      aprobadas: number;
      rechazadas: number;
      canceladas: number;
      monto_total: number;
      monto_promedio: number;
    };
    canCreate: boolean;
    canModify: (solicitud: SolicitudCompleta) => boolean;
  };
}

// ==================== CONSTANTES ====================

const ESTADO_INICIAL: UseSolicitudManagerState = {
  solicitudes: [], // Inicializar vacío, se cargarán desde la base de datos
  selectedSolicitud: null,
  loading: false,
  error: null,
  operationLoading: false,
  lastOperation: null
};

// ==================== HOOK PRINCIPAL ====================

export function useSolicitudManager(options: UseSolicitudManagerOptions = {}): UseSolicitudManagerReturn {
  const {
    cliente_id,
    autoLoad = true,
    onSolicitudChange,
    onStatusChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseSolicitudManagerState>(ESTADO_INICIAL);

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

  const crear = useCallback(async (data: SolicitudCreation): Promise<SolicitudCompleta | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Creando solicitud',
      error: null 
    }));

    try {
      const nuevaSolicitud = await solicitudService.createSolicitud(data);
      
      setState(prev => ({
        ...prev,
        solicitudes: [...prev.solicitudes, nuevaSolicitud],
        operationLoading: false,
        lastOperation: null
      }));

      onSolicitudChange?.(nuevaSolicitud);
      return nuevaSolicitud;

    } catch (error) {
      handleError(error, 'crear solicitud');
      return null;
    }
  }, [handleError, onSolicitudChange]);

  const actualizar = useCallback(async (
    id: number, 
    data: { estatus?: EstatusSolicitud }
  ): Promise<SolicitudCompleta | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Actualizando solicitud',
      error: null 
    }));

    try {
      const solicitudActualizada = await solicitudService.updateSolicitud(id, data);
      
      setState(prev => ({
        ...prev,
        solicitudes: prev.solicitudes.map(sol => 
          sol.solicitud_id === id ? solicitudActualizada : sol
        ),
        selectedSolicitud: prev.selectedSolicitud?.solicitud_id === id 
          ? solicitudActualizada 
          : prev.selectedSolicitud,
        operationLoading: false,
        lastOperation: null
      }));

      onSolicitudChange?.(solicitudActualizada);
      if (data.estatus) {
        onStatusChange?.(solicitudActualizada, data.estatus);
      }
      
      return solicitudActualizada;

    } catch (error) {
      handleError(error, 'actualizar solicitud');
      return null;
    }
  }, [handleError, onSolicitudChange, onStatusChange]);

  const eliminar = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Eliminando solicitud',
      error: null 
    }));

    try {
      await solicitudService.deleteSolicitud(id);
      
      setState(prev => ({
        ...prev,
        solicitudes: prev.solicitudes.filter(sol => sol.solicitud_id !== id),
        selectedSolicitud: prev.selectedSolicitud?.solicitud_id === id 
          ? null 
          : prev.selectedSolicitud,
        operationLoading: false,
        lastOperation: null
      }));

      return true;

    } catch (error) {
      handleError(error, 'eliminar solicitud');
      return false;
    }
  }, [handleError]);

  const obtener = useCallback(async (id: number): Promise<SolicitudCompleta | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const solicitud = await solicitudService.getSolicitudById(id);
      
      setState(prev => ({
        ...prev,
        selectedSolicitud: solicitud,
        loading: false
      }));

      return solicitud;

    } catch (error) {
      handleError(error, 'obtener solicitud');
      return null;
    }
  }, [handleError]);

  const listar = useCallback(async (filtros?: SolicitudFilter): Promise<SolicitudCompleta[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Si hay cliente_id específico, incluirlo en los filtros
      const filtrosCompletos = cliente_id 
        ? { ...filtros, cliente_id }
        : filtros;

      const response = await solicitudService.getSolicitudes(filtrosCompletos);
      const solicitudes = Array.isArray(response) ? response : response.data || [];
      
      setState(prev => ({
        ...prev,
        solicitudes,
        loading: false
      }));

      return solicitudes;

    } catch (error) {
      handleError(error, 'listar solicitudes');
      return [];
    }
  }, [cliente_id, handleError]);

  // ==================== GESTIÓN DE PRODUCTOS ====================

  const agregarProducto = useCallback(async (
    solicitudId: number,
    producto: { producto: ProductoCodigo; monto: number; plazo_meses: number }
  ): Promise<SolicitudProducto | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Agregando producto',
      error: null 
    }));

    try {
      const nuevoProducto = await solicitudService.addProductoToSolicitud(solicitudId, producto);
      
      // Actualizar la solicitud en el estado
      setState(prev => ({
        ...prev,
        solicitudes: prev.solicitudes.map(sol => 
          sol.solicitud_id === solicitudId 
            ? { ...sol, productos: [...(sol.productos || []), nuevoProducto] }
            : sol
        ),
        operationLoading: false,
        lastOperation: null
      }));

      return nuevoProducto;

    } catch (error) {
      handleError(error, 'agregar producto');
      return null;
    }
  }, [handleError]);

  const actualizarProducto = useCallback(async (
    solicitudId: number,
    productoId: number,
    data: { monto?: number; plazo_meses?: number }
  ): Promise<SolicitudProducto | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Actualizando producto',
      error: null 
    }));

    try {
      const productoActualizado = await solicitudService.updateProductoSolicitud(solicitudId, productoId, data);
      
      // Actualizar el producto en el estado
      setState(prev => ({
        ...prev,
        solicitudes: prev.solicitudes.map(sol => 
          sol.solicitud_id === solicitudId 
            ? {
                ...sol,
                productos: sol.productos?.map(prod => 
                  prod.solicitud_producto_id === productoId ? productoActualizado : prod
                ) || []
              }
            : sol
        ),
        operationLoading: false,
        lastOperation: null
      }));

      return productoActualizado;

    } catch (error) {
      handleError(error, 'actualizar producto');
      return null;
    }
  }, [handleError]);

  const eliminarProducto = useCallback(async (solicitudId: number, productoId: number): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: 'Eliminando producto',
      error: null 
    }));

    try {
      await solicitudService.deleteProductoSolicitud(solicitudId, productoId);
      
      // Remover el producto del estado
      setState(prev => ({
        ...prev,
        solicitudes: prev.solicitudes.map(sol => 
          sol.solicitud_id === solicitudId 
            ? {
                ...sol,
                productos: sol.productos?.filter(prod => prod.solicitud_producto_id !== productoId) || []
              }
            : sol
        ),
        operationLoading: false,
        lastOperation: null
      }));

      return true;

    } catch (error) {
      handleError(error, 'eliminar producto');
      return false;
    }
  }, [handleError]);

  // ==================== GESTIÓN DE ESTADOS ====================

  const cambiarEstatus = useCallback(async (
    id: number,
    estatus: EstatusSolicitud,
    _observaciones?: string
  ): Promise<boolean> => {
    const solicitudActualizada = await actualizar(id, { estatus });
    return solicitudActualizada !== null;
  }, [actualizar]);

  const aprobar = useCallback(async (id: number, observaciones?: string): Promise<boolean> => {
    return cambiarEstatus(id, 'aprobada', observaciones);
  }, [cambiarEstatus]);

  const rechazar = useCallback(async (id: number, observaciones: string): Promise<boolean> => {
    return cambiarEstatus(id, 'rechazada', observaciones);
  }, [cambiarEstatus]);

  const cancelar = useCallback(async (id: number, observaciones: string): Promise<boolean> => {
    return cambiarEstatus(id, 'cancelada', observaciones);
  }, [cambiarEstatus]);

  const enviarRevision = useCallback(async (id: number, observaciones?: string): Promise<boolean> => {
    return cambiarEstatus(id, 'en_revision', observaciones);
  }, [cambiarEstatus]);

  // ==================== UTILIDADES DE SELECCIÓN ====================

  const seleccionar = useCallback((solicitud: SolicitudCompleta | null) => {
    setState(prev => ({ ...prev, selectedSolicitud: solicitud }));
  }, []);

  const limpiarSeleccion = useCallback(() => {
    setState(prev => ({ ...prev, selectedSolicitud: null }));
  }, []);

  // ==================== OPERACIONES EN LOTE ====================

  const aprobarLote = useCallback(async (ids: number[], observaciones?: string): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Aprobando ${ids.length} solicitudes`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await aprobar(id, observaciones);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'aprobar solicitudes en lote');
      return exitosos;
    }
  }, [aprobar, handleError]);

  const rechazarLote = useCallback(async (ids: number[], observaciones: string): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Rechazando ${ids.length} solicitudes`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await rechazar(id, observaciones);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'rechazar solicitudes en lote');
      return exitosos;
    }
  }, [rechazar, handleError]);

  const cancelarLote = useCallback(async (ids: number[], observaciones: string): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Cancelando ${ids.length} solicitudes`,
      error: null 
    }));

    let exitosos = 0;
    
    try {
      for (const id of ids) {
        const success = await cancelar(id, observaciones);
        if (success) exitosos++;
      }

      setState(prev => ({ 
        ...prev, 
        operationLoading: false, 
        lastOperation: null 
      }));

      return exitosos;

    } catch (error) {
      handleError(error, 'cancelar solicitudes en lote');
      return exitosos;
    }
  }, [cancelar, handleError]);

  const eliminarLote = useCallback(async (ids: number[]): Promise<number> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      lastOperation: `Eliminando ${ids.length} solicitudes`,
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
      handleError(error, 'eliminar solicitudes en lote');
      return exitosos;
    }
  }, [eliminar, handleError]);

  // ==================== UTILIDADES COMPUTADAS ====================

  const utils = useMemo(() => {
    const solicitudesPorEstatus = state.solicitudes.reduce((acc, sol) => {
      acc[sol.estatus] = acc[sol.estatus] || [];
      acc[sol.estatus].push(sol);
      return acc;
    }, {} as Record<EstatusSolicitud, SolicitudCompleta[]>);

    const solicitudesPorProducto = state.solicitudes.reduce((acc, sol) => {
      sol.productos?.forEach(producto => {
        acc[producto.producto] = acc[producto.producto] || [];
        if (!acc[producto.producto].find(s => s.solicitud_id === sol.solicitud_id)) {
          acc[producto.producto].push(sol);
        }
      });
      return acc;
    }, {} as Record<ProductoCodigo, SolicitudCompleta[]>);

    const solicitudesVencidas: SolicitudCompleta[] = []; // TODO: Implementar lógica de vencimiento
    const solicitudesPendientes = solicitudesPorEstatus.iniciada || [];

    const estadisticas = {
      total: state.solicitudes.length,
      iniciadas: solicitudesPorEstatus.iniciada?.length || 0,
      en_revision: solicitudesPorEstatus.en_revision?.length || 0,
      aprobadas: solicitudesPorEstatus.aprobada?.length || 0,
      rechazadas: solicitudesPorEstatus.rechazada?.length || 0,
      canceladas: solicitudesPorEstatus.cancelada?.length || 0,
      monto_total: state.solicitudes.reduce((total, sol) => 
        total + (sol.productos?.reduce((sum, prod) => sum + prod.monto, 0) || 0), 0
      ),
      monto_promedio: state.solicitudes.length > 0 
        ? state.solicitudes.reduce((total, sol) => 
            total + (sol.productos?.reduce((sum, prod) => sum + prod.monto, 0) || 0), 0
          ) / state.solicitudes.length 
        : 0
    };

    const canCreate = !state.operationLoading;
    const canModify = (solicitud: SolicitudCompleta) => 
      solicitud.estatus === 'iniciada' && !state.operationLoading;

    return {
      solicitudesPorEstatus,
      solicitudesPorProducto,
      solicitudesVencidas,
      solicitudesPendientes,
      estadisticas,
      canCreate,
      canModify
    };
  }, [state.solicitudes, state.operationLoading]);

  // ==================== EFECTOS ====================

  // Auto-cargar al montar el componente
  useEffect(() => {
    if (autoLoad) {
      listar();
    }
  }, [autoLoad, listar]);

  // Limpiar estado cuando cambie el cliente_id
  useEffect(() => {
    if (cliente_id !== undefined) {
      setState(prev => ({
        ...prev,
        solicitudes: [],
        selectedSolicitud: null
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
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    cambiarEstatus,
    aprobar,
    rechazar,
    cancelar,
    enviarRevision,
    seleccionar,
    limpiarSeleccion,
    aprobarLote,
    rechazarLote,
    cancelarLote,
    eliminarLote,
    utils
  };
}
