import { useState, useEffect, useCallback, useMemo } from 'react';
import { clienteService } from '../../services/cliente.service';
import { formatearNombreCompleto, calcularEdad } from '../../utils/formatters';
import { debounce, storage } from '../../utils/helpers';
import type { 
  Cliente, 
  ClienteCreation, 
  ClienteFilter, 
  ClienteCompletitud,
  ClienteEstadisticas,
  TipoPersona,
  PaginatedResponse 
} from '../../types';

// Tipos específicos para el hook
interface UseClienteManagerState {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  lastOperation: string | null;
  estadisticas: ClienteEstadisticas | null;
}

interface UseClienteManagerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseClienteManagerFilters {
  busqueda: string;
  tipoPersona: TipoPersona[];
  estado: string;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  completitudMinima: number;
  conDocumentosVencidos: boolean;
}

interface UseClienteManagerReturn {
  // Estado
  state: UseClienteManagerState;
  pagination: UseClienteManagerPagination;
  filtros: UseClienteManagerFilters;
  
  // Operaciones CRUD
  operations: {
    cargar: () => Promise<void>;
    crear: (data: ClienteCreation) => Promise<Cliente | null>;
    actualizar: (id: number, data: Partial<ClienteCreation>) => Promise<Cliente | null>;
    eliminar: (id: number) => Promise<boolean>;
    obtenerPorId: (id: number) => Promise<Cliente | null>;
    validarRFC: (rfc: string, excludeId?: number) => Promise<boolean>;
    buscarPorRFC: (rfc: string) => Promise<Cliente | null>;
    evaluarClienteRecurrente: (rfc: string) => Promise<any>;
    exportar: (formato: 'csv' | 'excel') => Promise<void>;
  };
  
  // Gestión de onboarding
  onboarding: {
    validarCompletitud: (id: number) => Promise<ClienteCompletitud | null>;
    obtenerEstadoOnboarding: (id: number) => Promise<any>;
    verificarProcesoOnboarding: (id: number) => Promise<any>;
    obtenerDocumentosVencidos: (id: number) => Promise<any[]>;
    calcularProgresoOnboarding: (cliente: Cliente) => number;
  };
  
  // Acciones
  actions: {
    seleccionar: (cliente: Cliente | null) => void;
    limpiarError: () => void;
    refrescar: () => Promise<void>;
    cambiarPagina: (page: number) => void;
    cambiarLimite: (limit: number) => void;
    actualizarFiltros: (filtros: Partial<UseClienteManagerFilters>) => void;
    buscar: (query: string) => void;
    limpiarFiltros: () => void;
    cargarEstadisticas: () => Promise<void>;
  };
  
  // Utilidades administrativas
  utils: {
    clientesActivos: Cliente[];
    clientesInactivos: Cliente[];
    clientesPorTipo: Record<TipoPersona, Cliente[]>;
    clientesConDocumentosVencidos: Cliente[];
    clientesCompletitudBaja: Cliente[];
    clientesRecientes: Cliente[];
    totalClientes: number;
    hayMasResultados: boolean;
    resumenPorEstado: Record<string, number>;
    promedioCompletitud: number;
    alertasAdministrativas: any[];
  };
}

const FILTROS_INICIALES: UseClienteManagerFilters = {
  busqueda: '',
  tipoPersona: [],
  estado: '',
  fechaDesde: null,
  fechaHasta: null,
  completitudMinima: 0,
  conDocumentosVencidos: false
};

const STORAGE_KEY = 'cliente-manager-filters';

export const useClienteManager = (
  filtrosIniciales: Partial<UseClienteManagerFilters> = {},
  paginacionInicial: Partial<UseClienteManagerPagination> = {}
): UseClienteManagerReturn => {
  
  // ==================== ESTADOS ====================
  const [state, setState] = useState<UseClienteManagerState>({
    clientes: [],
    selectedCliente: null,
    loading: false,
    error: null,
    operationLoading: false,
    lastOperation: null,
    estadisticas: null
  });

  const [filtros, setFiltros] = useState<UseClienteManagerFilters>(() => {
    const savedFilters = storage.get<UseClienteManagerFilters>(STORAGE_KEY);
    return {
      ...FILTROS_INICIALES,
      ...savedFilters,
      ...filtrosIniciales
    };
  });
  
  const [pagination, setPagination] = useState<UseClienteManagerPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    ...paginacionInicial
  });

  // ==================== OPERACIONES CRUD ====================
  
  const cargar = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Construir filtros para el servicio
      const serviceFilters: ClienteFilter = {
        search: filtros.busqueda,
        tipo_persona: filtros.tipoPersona.length > 0 ? filtros.tipoPersona : undefined,
        estado: filtros.estado ? [filtros.estado] : undefined,
        fecha_registro_desde: filtros.fechaDesde || undefined,
        fecha_registro_hasta: filtros.fechaHasta || undefined,
        completitud_minima: filtros.completitudMinima > 0 ? filtros.completitudMinima : undefined
      };

      const response: PaginatedResponse<Cliente> = await clienteService.getClientes(serviceFilters);
      
      // Aplicar filtros adicionales del lado del cliente
      let clientesFiltrados = response.data;
      
      if (filtros.conDocumentosVencidos) {
        clientesFiltrados = await Promise.all(
          clientesFiltrados.map(async cliente => {
            const completitud = await clienteService.validarCompletitud(cliente.cliente_id);
            return completitud?.documentos_vencidos && completitud.documentos_vencidos > 0 ? cliente : null;
          })
        ).then(results => results.filter(Boolean) as Cliente[]);
      }
      
      setState(prev => ({
        ...prev,
        clientes: clientesFiltrados,
        loading: false
      }));
      
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar clientes';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [filtros, pagination.page, pagination.limit]);

  const crear = useCallback(async (data: ClienteCreation): Promise<Cliente | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      error: null,
      lastOperation: 'crear'
    }));
    
    try {
      // Validaciones adicionales para el administrador
      if (data.rfc) {
        const rfcExiste = await clienteService.validarRFCUnico(data.rfc);
        if (!rfcExiste) {
          throw new Error('El RFC ya está registrado en el sistema');
        }
      }

      // Validar edad mínima para personas físicas
      if (data.tipo_persona === 'PF' && data.fecha_nacimiento) {
        const edad = calcularEdad(data.fecha_nacimiento);
        if (edad < 18) {
          throw new Error('El cliente debe ser mayor de 18 años');
        }
      }

      const nuevoCliente = await clienteService.createCliente(data);
      
      setState(prev => ({
        ...prev,
        clientes: [nuevoCliente, ...prev.clientes],
        operationLoading: false,
        lastOperation: null
      }));
      
      // Actualizar estadísticas
      await cargarEstadisticas();
      
      return nuevoCliente;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';
      setState(prev => ({
        ...prev,
        operationLoading: false,
        error: errorMessage,
        lastOperation: null
      }));
      return null;
    }
  }, []);

  const actualizar = useCallback(async (
    id: number, 
    data: Partial<ClienteCreation>
  ): Promise<Cliente | null> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      error: null,
      lastOperation: 'actualizar'
    }));
    
    try {
      // Validar RFC único si se está actualizando
      if (data.rfc) {
        const rfcExiste = await clienteService.validarRFCUnico(data.rfc, id);
        if (!rfcExiste) {
          throw new Error('El RFC ya está registrado por otro cliente');
        }
      }

      const clienteActualizado = await clienteService.updateCliente(id, data);
      
      setState(prev => ({
        ...prev,
        clientes: prev.clientes.map(cliente => 
          cliente.cliente_id === id ? clienteActualizado : cliente
        ),
        selectedCliente: prev.selectedCliente?.cliente_id === id 
          ? clienteActualizado 
          : prev.selectedCliente,
        operationLoading: false,
        lastOperation: null
      }));
      
      return clienteActualizado;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
      setState(prev => ({
        ...prev,
        operationLoading: false,
        error: errorMessage,
        lastOperation: null
      }));
      return null;
    }
  }, []);

  const eliminar = useCallback(async (id: number): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      operationLoading: true, 
      error: null,
      lastOperation: 'eliminar'
    }));
    
    try {
      // Verificar si el cliente tiene solicitudes activas
      const cliente = await clienteService.getClienteById(id);
      if (cliente.solicitudes && cliente.solicitudes.length > 0) {
        const solicitudesActivas = cliente.solicitudes.filter(s => 
          s.estatus === 'iniciada' || s.estatus === 'en_revision'
        );
        
        if (solicitudesActivas.length > 0) {
          throw new Error('No se puede eliminar el cliente. Tiene solicitudes activas.');
        }
      }

      await clienteService.deleteCliente(id);
      
      setState(prev => ({
        ...prev,
        clientes: prev.clientes.filter(cliente => cliente.cliente_id !== id),
        selectedCliente: prev.selectedCliente?.cliente_id === id 
          ? null 
          : prev.selectedCliente,
        operationLoading: false,
        lastOperation: null
      }));
      
      // Actualizar estadísticas
      await cargarEstadisticas();
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cliente';
      setState(prev => ({
        ...prev,
        operationLoading: false,
        error: errorMessage,
        lastOperation: null
      }));
      return false;
    }
  }, []);

  const obtenerPorId = useCallback(async (id: number): Promise<Cliente | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const cliente = await clienteService.getClienteById(id);
      setState(prev => ({ ...prev, loading: false }));
      return cliente;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener cliente';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  }, []);

  const validarRFC = useCallback(async (rfc: string, excludeId?: number): Promise<boolean> => {
    try {
      return await clienteService.validarRFCUnico(rfc, excludeId);
    } catch (error) {
      return false;
    }
  }, []);

  const buscarPorRFC = useCallback(async (rfc: string): Promise<Cliente | null> => {
    try {
      return await clienteService.buscarPorRFC(rfc);
    } catch (error) {
      return null;
    }
  }, []);

  const evaluarClienteRecurrente = useCallback(async (rfc: string) => {
    try {
      return await clienteService.evaluarClienteRecurrente(rfc);
    } catch (error) {
      return null;
    }
  }, []);

  const exportar = useCallback(async (formato: 'csv' | 'excel') => {
    try {
      setState(prev => ({ ...prev, operationLoading: true, lastOperation: `Exportando como ${formato.toUpperCase()}` }));
      await clienteService.exportarClientes(filtros as any);
      console.log(`Exportación completada en formato ${formato}`);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Error al exportar clientes como ${formato}` 
      }));
    } finally {
      setState(prev => ({ ...prev, operationLoading: false, lastOperation: null }));
    }
  }, [filtros]);

  // ==================== GESTIÓN DE ONBOARDING ====================
  
  const validarCompletitud = useCallback(async (id: number): Promise<ClienteCompletitud | null> => {
    try {
      const resultado = await clienteService.validarCompletitud(id);
      // Mapear el resultado del servicio al tipo esperado del hook
      return {
        cliente_id: resultado.cliente_id,
        porcentaje_completitud: resultado.completitud_porcentaje,
        datos_basicos_completos: resultado.datos_basicos_completos,
        direccion_completa: resultado.direccion_completa,
        campos_faltantes: resultado.documentos_faltantes || [],
        puede_proceder_onboarding: resultado.puede_proceder
      };
    } catch (error) {
      return null;
    }
  }, []);

  const obtenerEstadoOnboarding = useCallback(async (id: number) => {
    try {
      return await clienteService.getEstadoOnboarding(id);
    } catch (error) {
      return null;
    }
  }, []);

  const verificarProcesoOnboarding = useCallback(async (id: number) => {
    try {
      return await clienteService.verificarProcesoOnboarding(id);
    } catch (error) {
      return null;
    }
  }, []);

  const obtenerDocumentosVencidos = useCallback(async (id: number) => {
    try {
      const completitud = await clienteService.validarCompletitud(id);
      return completitud?.documentos_faltantes || [];
    } catch (error) {
      return [];
    }
  }, []);

  const calcularProgresoOnboarding = useCallback((cliente: Cliente): number => {
    let progreso = 0;
    
    // Datos básicos (30%)
    if (cliente.rfc) progreso += 10;
    if (cliente.correo) progreso += 10;
    if (cliente.telefono) progreso += 10;
    
    // Datos específicos por tipo (40%)
    if (cliente.tipo_persona === 'PF') {
      if (cliente.nombre && cliente.apellido_paterno) progreso += 20;
      if (cliente.fecha_nacimiento) progreso += 10;
      if (cliente.curp) progreso += 10;
    } else {
      if (cliente.razon_social) progreso += 20;
      if (cliente.representante_legal) progreso += 10;
      if (cliente.fecha_constitucion) progreso += 10;
    }
    
    // Dirección (30%)
    if (cliente.calle && cliente.numero_exterior) progreso += 10;
    if (cliente.colonia && cliente.codigo_postal) progreso += 10;
    if (cliente.ciudad && cliente.estado) progreso += 10;
    
    return Math.min(progreso, 100);
  }, []);

  // ==================== ACCIONES ====================
  
  const seleccionar = useCallback((cliente: Cliente | null) => {
    setState(prev => ({ ...prev, selectedCliente: cliente }));
  }, []);

  const limpiarError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refrescar = useCallback(async () => {
    await cargar();
    await cargarEstadisticas();
  }, [cargar]);

  const cambiarPagina = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const cambiarLimite = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const actualizarFiltros = useCallback((nuevosFiltros: Partial<UseClienteManagerFilters>) => {
    const filtrosActualizados = { ...filtros, ...nuevosFiltros };
    setFiltros(filtrosActualizados);
    storage.set(STORAGE_KEY, filtrosActualizados);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filtros]);

  const buscar = useMemo(() => 
    debounce((query: string) => {
      actualizarFiltros({ busqueda: query });
    }, 300), 
    [actualizarFiltros]
  );

  const limpiarFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIALES);
    storage.remove(STORAGE_KEY);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const estadisticasServicio = await clienteService.getEstadisticas();
      // Mapear las estadísticas del servicio al tipo esperado
      const estadisticas: ClienteEstadisticas = {
        total_clientes: estadisticasServicio.total || 0,
        clientes_activos: estadisticasServicio.total || 0, // Por ahora todos son activos
        clientes_inactivos: 0,
        clientes_pendientes_aprobacion: 0,
        clientes_rechazados: 0,
        porcentaje_completitud_promedio: estadisticasServicio.completitud_promedio || 0,
        clientes_por_tipo: {
          fisica: estadisticasServicio.por_tipo_persona?.PF || 0,
          moral: estadisticasServicio.por_tipo_persona?.PM || 0
        },
        onboarding_completados_mes: 0,
        tendencia_mensual: []
      };
      setState(prev => ({ ...prev, estadisticas }));
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  // ==================== EFECTOS ====================
  
  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // ==================== UTILIDADES COMPUTADAS ====================
  
  const utils = useMemo(() => {
    // Por ahora consideramos todos los clientes como activos ya que el modelo no tiene campo inactivo
    const clientesActivos = state.clientes;
    const clientesInactivos: Cliente[] = [];
    
    const clientesPorTipo = state.clientes.reduce((acc, cliente) => {
      acc[cliente.tipo_persona] = acc[cliente.tipo_persona] || [];
      acc[cliente.tipo_persona].push(cliente);
      return acc;
    }, {} as Record<TipoPersona, Cliente[]>);

    const clientesRecientes = state.clientes
      .filter(cliente => {
        const dias = (Date.now() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return dias <= 30;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const resumenPorEstado = state.clientes.reduce((acc, cliente) => {
      const estado = cliente.estado || 'sin_estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular promedio de completitud
    const promedioCompletitud = state.clientes.length > 0
      ? state.clientes.reduce((sum, cliente) => 
          sum + calcularProgresoOnboarding(cliente), 0) / state.clientes.length
      : 0;

    // Generar alertas administrativas
    const alertasAdministrativas = [
      // Clientes con completitud baja
      ...state.clientes
        .filter(cliente => calcularProgresoOnboarding(cliente) < 50)
        .map(cliente => ({
          tipo: 'completitud_baja',
          cliente_id: cliente.cliente_id,
          mensaje: `${formatearNombreCompleto(cliente)} tiene completitud baja`,
          severidad: 'medium' as const
        })),
      
      // Clientes sin actividad reciente
      ...state.clientes
        .filter(cliente => {
          const dias = (Date.now() - new Date(cliente.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          return dias > 30;
        })
        .map(cliente => ({
          tipo: 'sin_actividad',
          cliente_id: cliente.cliente_id,
          mensaje: `${formatearNombreCompleto(cliente)} sin actividad por más de 30 días`,
          severidad: 'low' as const
        }))
    ];

    return {
      clientesActivos,
      clientesInactivos,
      clientesPorTipo,
      clientesConDocumentosVencidos: [], // Se calculará dinámicamente
      clientesCompletitudBaja: state.clientes.filter(c => calcularProgresoOnboarding(c) < 70),
      clientesRecientes,
      totalClientes: state.clientes.length,
      hayMasResultados: pagination.page < pagination.totalPages,
      resumenPorEstado,
      promedioCompletitud,
      alertasAdministrativas
    };
  }, [state.clientes, pagination.page, pagination.totalPages, calcularProgresoOnboarding]);

  // ==================== RETURN ====================
  
  return {
    state,
    pagination,
    filtros,
    
    operations: {
      cargar,
      crear,
      actualizar,
      eliminar,
      obtenerPorId,
      validarRFC,
      buscarPorRFC,
      evaluarClienteRecurrente,
      exportar
    },
    
    onboarding: {
      validarCompletitud,
      obtenerEstadoOnboarding,
      verificarProcesoOnboarding,
      obtenerDocumentosVencidos,
      calcularProgresoOnboarding
    },
    
    actions: {
      seleccionar,
      limpiarError,
      refrescar,
      cambiarPagina,
      cambiarLimite,
      actualizarFiltros,
      buscar,
      limpiarFiltros,
      cargarEstadisticas
    },
    
    utils
  };
};
