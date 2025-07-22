import { useState, useCallback, useEffect } from 'react';
import { useClienteStats } from '../cliente';
import { useDocumentoStats } from '../documento';
import { useSolicitudStats } from '../solicitud';
import type { SolicitudCompleta } from '../../services/solicitud.service';

// ==================== INTERFACES ====================

export interface DashboardData {
  // Resúmenes por módulo
  clientes: {
    total: number;
    nuevos: number;
    activos: number;
    inactivos: number;
    completitudPromedio: number;
    masActivos: Array<{
      nombre: string;
      solicitudes: number;
    }>;
  };
  documentos: {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    procesadosHoy: number;
  };
  solicitudes: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    montoTotal: number;
  };
  
  // Métricas generales
  actividad: {
    usuariosConectados: number;
    sesionesActivas: number;
    accionesHoy: number;
    ultimaActividad: Date | null;
    actividadReciente: Array<{
      id: number;
      descripcion: string;
      usuario: string;
      fecha: Date;
      icono: string;
      color: string;
    }>;
  };
  
  // Rendimiento del sistema
  rendimiento: {
    tiempoRespuestaPromedio: number;
    uptime: number;
    erroresHoy: number;
    procesosEnCola: number;
  };
}

export interface DashboardPeriod {
  inicio: Date;
  fin: Date;
  label: string;
}

export interface UseDashboardDataState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  currentPeriod: DashboardPeriod;
}

export interface UseDashboardDataOptions {
  clientes?: any[];
  documentos?: any[];
  solicitudes?: SolicitudCompleta[];
  autoLoad?: boolean;
  refreshInterval?: number;
  initialPeriod?: DashboardPeriod;
  onDataUpdate?: (data: DashboardData) => void;
  onError?: (error: string) => void;
}

export interface UseDashboardDataReturn {
  // Estado
  state: UseDashboardDataState;
  
  // Acciones de carga
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  loadDataForPeriod: (period: DashboardPeriod) => Promise<void>;
  
  // Gestión de períodos
  setPeriod: (period: DashboardPeriod) => void;
  getAvailablePeriods: () => DashboardPeriod[];
  
  // Obtener datos específicos
  getClientesData: () => DashboardData['clientes'];
  getDocumentosData: () => DashboardData['documentos'];
  getSolicitudesData: () => DashboardData['solicitudes'];
  getActividadData: () => DashboardData['actividad'];
  getRendimientoData: () => DashboardData['rendimiento'];
  
  // Comparaciones
  compareWithPreviousPeriod: () => {
    clientes: { current: number; previous: number; change: number };
    documentos: { current: number; previous: number; change: number };
    solicitudes: { current: number; previous: number; change: number };
  };
  
  // Exportar datos
  exportData: (format: 'json' | 'csv') => string;
  
  // Funciones auxiliares
  isDataStale: () => boolean;
  getLastUpdateFormatted: () => string;
}

// ==================== CONSTANTES ====================

const INITIAL_DATA: DashboardData = {
  clientes: {
    total: 0,
    nuevos: 0,
    activos: 0,
    inactivos: 0,
    completitudPromedio: 0,
    masActivos: []
  },
  documentos: {
    total: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    procesadosHoy: 0
  },
  solicitudes: {
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    montoTotal: 0
  },
  actividad: {
    usuariosConectados: 0,
    sesionesActivas: 0,
    accionesHoy: 0,
    ultimaActividad: new Date(),
    actividadReciente: []
  },
  rendimiento: {
    tiempoRespuestaPromedio: 0,
    uptime: 0,
    erroresHoy: 0,
    procesosEnCola: 0
  }
};

const DEFAULT_PERIOD: DashboardPeriod = {
  inicio: new Date(new Date().setHours(0, 0, 0, 0)),
  fin: new Date(new Date().setHours(23, 59, 59, 999)),
  label: 'Hoy'
};

// ==================== UTILIDADES ====================

function aggregateData(
  clientesStats: any,
  documentosStats: any,
  solicitudesStats: any,
  _period: DashboardPeriod
): DashboardData {
  return {
    clientes: {
      total: clientesStats?.estadisticas?.total_clientes || 0,
      nuevos: clientesStats?.estadisticas?.clientes_nuevos_mes || 0,
      activos: clientesStats?.estadisticas?.clientes_activos || 0,
      inactivos: clientesStats?.estadisticas?.clientes_inactivos || 0,
      completitudPromedio: clientesStats?.estadisticas?.porcentaje_completitud_promedio || 0,
      masActivos: clientesStats?.estadisticas?.clientes_mas_activos || []
    },
    documentos: {
      total: documentosStats?.stats?.total || 0,
      pendientes: documentosStats?.stats?.porEstatus?.pendiente || 0,
      aprobados: documentosStats?.stats?.porEstatus?.aprobado || 0,
      rechazados: documentosStats?.stats?.porEstatus?.rechazado || 0,
      procesadosHoy: documentosStats?.stats?.procesadosHoy || 0
    },
    solicitudes: {
      total: solicitudesStats?.stats?.total || 0,
      pendientes: (solicitudesStats?.stats?.iniciadas || 0) + (solicitudesStats?.stats?.en_revision || 0),
      aprobadas: solicitudesStats?.stats?.aprobadas || 0,
      rechazadas: solicitudesStats?.stats?.rechazadas || 0,
      montoTotal: solicitudesStats?.stats?.totalMonto || 0
    },
    actividad: {
      usuariosConectados: Math.floor(Math.random() * 20) + 5, // Mock data
      sesionesActivas: Math.floor(Math.random() * 15) + 3,
      accionesHoy: Math.floor(Math.random() * 100) + 50,
      ultimaActividad: new Date(),
      actividadReciente: [
        {
          id: 1,
          descripcion: "Nuevo cliente registrado",
          usuario: "Sistema",
          fecha: new Date(Date.now() - 5 * 60 * 1000),
          icono: "UserGroupIcon",
          color: "blue"
        },
        {
          id: 2,
          descripcion: "Documento procesado",
          usuario: "Ana García",
          fecha: new Date(Date.now() - 15 * 60 * 1000),
          icono: "DocumentTextIcon",
          color: "green"
        },
        {
          id: 3,
          descripcion: "Solicitud aprobada",
          usuario: "Carlos López",
          fecha: new Date(Date.now() - 30 * 60 * 1000),
          icono: "CheckCircleIcon",
          color: "emerald"
        },
        {
          id: 4,
          descripcion: "Pago procesado",
          usuario: "Sistema",
          fecha: new Date(Date.now() - 45 * 60 * 1000),
          icono: "CurrencyDollarIcon",
          color: "yellow"
        }
      ]
    },
    rendimiento: {
      tiempoRespuestaPromedio: Math.random() * 200 + 100, // Mock data
      uptime: 99.9 - Math.random() * 0.5,
      erroresHoy: Math.floor(Math.random() * 5),
      procesosEnCola: Math.floor(Math.random() * 10)
    }
  };
}

function getStandardPeriods(): DashboardPeriod[] {
  const ahora = new Date();
  
  return [
    {
      inicio: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()),
      fin: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59),
      label: 'Hoy'
    },
    {
      inicio: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000),
      fin: ahora,
      label: 'Últimos 7 días'
    },
    {
      inicio: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
      fin: ahora,
      label: 'Este mes'
    },
    {
      inicio: new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1),
      fin: new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59),
      label: 'Mes anterior'
    },
    {
      inicio: new Date(ahora.getFullYear(), 0, 1),
      fin: ahora,
      label: 'Este año'
    }
  ];
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const {
    clientes = [],
    documentos = [],
    solicitudes = [],
    autoLoad = true,
    refreshInterval,
    initialPeriod = DEFAULT_PERIOD,
    onDataUpdate,
    onError
  } = options;

  // Variables no utilizadas removidas
  void documentos;

  // ==================== HOOKS DEPENDIENTES ====================

  const clienteStats = useClienteStats({ clientes });
  const documentoStats = useDocumentoStats({});
  const solicitudStats = useSolicitudStats({ solicitudes });

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDashboardDataState>({
    data: INITIAL_DATA,
    loading: false,
    error: null,
    lastUpdate: null,
    currentPeriod: initialPeriod
  });

  // ==================== UTILIDADES DE ERROR ====================

  const handleError = useCallback((error: any, operation: string) => {
    const errorMessage = error?.response?.data?.message || error?.message || `Error en ${operation}`;
    setState(prev => ({ 
      ...prev, 
      error: errorMessage, 
      loading: false 
    }));
    onError?.(errorMessage);
  }, [onError]);

  // ==================== ACCIONES DE CARGA ====================

  const loadData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Usar los hooks de estadísticas directamente
      const aggregatedData = aggregateData(
        clienteStats.state,
        documentoStats.state,
        solicitudStats.state,
        state.currentPeriod
      );

      setState(prev => ({
        ...prev,
        data: aggregatedData,
        loading: false,
        lastUpdate: new Date()
      }));

      onDataUpdate?.(aggregatedData);

    } catch (error) {
      handleError(error, 'cargar datos del dashboard');
    }
  }, [clienteStats.state, documentoStats.state, solicitudStats.state, state.currentPeriod, handleError, onDataUpdate]);

  const refreshData = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  const loadDataForPeriod = useCallback(async (period: DashboardPeriod): Promise<void> => {
    setState(prev => ({ ...prev, currentPeriod: period }));
    await loadData();
  }, [loadData]);

  // ==================== GESTIÓN DE PERÍODOS ====================

  const setPeriod = useCallback((period: DashboardPeriod) => {
    setState(prev => ({ ...prev, currentPeriod: period }));
  }, []);

  const getAvailablePeriods = useCallback((): DashboardPeriod[] => {
    return getStandardPeriods();
  }, []);

  // ==================== OBTENER DATOS ESPECÍFICOS ====================

  const getClientesData = useCallback(() => state.data.clientes, [state.data.clientes]);
  const getDocumentosData = useCallback(() => state.data.documentos, [state.data.documentos]);
  const getSolicitudesData = useCallback(() => state.data.solicitudes, [state.data.solicitudes]);
  const getActividadData = useCallback(() => state.data.actividad, [state.data.actividad]);
  const getRendimientoData = useCallback(() => state.data.rendimiento, [state.data.rendimiento]);

  // ==================== COMPARACIONES ====================

  const compareWithPreviousPeriod = useCallback(() => {
    // TODO: Implementar comparación real con período anterior
    return {
      clientes: { current: state.data.clientes.total, previous: 0, change: 0 },
      documentos: { current: state.data.documentos.total, previous: 0, change: 0 },
      solicitudes: { current: state.data.solicitudes.total, previous: 0, change: 0 }
    };
  }, [state.data]);

  // ==================== EXPORTAR DATOS ====================

  const exportData = useCallback((format: 'json' | 'csv'): string => {
    if (format === 'json') {
      return JSON.stringify(state.data, null, 2);
    }
    
    // Formato CSV
    const headers = ['Módulo', 'Métrica', 'Valor'];
    const rows = [
      ['Clientes', 'Total', state.data.clientes.total.toString()],
      ['Clientes', 'Nuevos', state.data.clientes.nuevos.toString()],
      ['Clientes', 'Activos', state.data.clientes.activos.toString()],
      ['Documentos', 'Total', state.data.documentos.total.toString()],
      ['Documentos', 'Pendientes', state.data.documentos.pendientes.toString()],
      ['Documentos', 'Aprobados', state.data.documentos.aprobados.toString()],
      ['Solicitudes', 'Total', state.data.solicitudes.total.toString()],
      ['Solicitudes', 'Pendientes', state.data.solicitudes.pendientes.toString()],
      ['Solicitudes', 'Aprobadas', state.data.solicitudes.aprobadas.toString()],
      ['Solicitudes', 'Monto Total', state.data.solicitudes.montoTotal.toString()]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, [state.data]);

  // ==================== FUNCIONES AUXILIARES ====================

  const isDataStale = useCallback((): boolean => {
    if (!state.lastUpdate) return true;
    const staleThreshold = 5 * 60 * 1000; // 5 minutos
    return Date.now() - state.lastUpdate.getTime() > staleThreshold;
  }, [state.lastUpdate]);

  const getLastUpdateFormatted = useCallback((): string => {
    if (!state.lastUpdate) return 'Nunca';
    return state.lastUpdate.toLocaleString('es-ES');
  }, [state.lastUpdate]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshData]);

  // Actualizar cuando cambien los datos de los módulos
  useEffect(() => {
    if (!autoLoad) return;
    
    const aggregatedData = aggregateData(
      clienteStats.state,
      documentoStats.state,
      solicitudStats.state,
      state.currentPeriod
    );

    setState(prev => ({
      ...prev,
      data: aggregatedData,
      lastUpdate: new Date()
    }));

    onDataUpdate?.(aggregatedData);
  }, [
    clienteStats.state.estadisticas,
    documentoStats.state.stats,
    solicitudStats.state.stats,
    state.currentPeriod,
    autoLoad,
    onDataUpdate
  ]);

  // ==================== RETORNO ====================

  return {
    state,
    loadData,
    refreshData,
    loadDataForPeriod,
    setPeriod,
    getAvailablePeriods,
    getClientesData,
    getDocumentosData,
    getSolicitudesData,
    getActividadData,
    getRendimientoData,
    compareWithPreviousPeriod,
    exportData,
    isDataStale,
    getLastUpdateFormatted
  };
}
