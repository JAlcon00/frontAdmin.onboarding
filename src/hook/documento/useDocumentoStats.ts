import { useState, useCallback, useEffect } from 'react';
import { documentoService } from '../../services/documento.service';
import type { 
  Documento, 
  DocumentoTipo,
  EstatusDocumento
} from '../../types';

// ==================== INTERFACES ====================

export interface DocumentoStatsData {
  // Estadísticas por estatus
  porEstatus: Record<EstatusDocumento, number>;
  
  // Estadísticas por tipo
  porTipo: Array<{
    tipo_id: number;
    nombre: string;
    total: number;
    pendientes: number;
    aceptados: number;
    rechazados: number;
    vencidos: number;
  }>;
  
  // Estadísticas temporales
  porMes: Array<{
    mes: string;
    año: number;
    total: number;
    aceptados: number;
    rechazados: number;
  }>;
  
  // Estadísticas de vigencia
  vigencia: {
    vigentes: number;
    vencidos: number;
    proximosVencer: number; // Próximos 30 días
    sinVencimiento: number;
  };
  
  // Estadísticas de completitud
  completitud: {
    documentosRequeridos: number;
    documentosPresentes: number;
    porcentajeCompletitud: number;
  };
  
  // Estadísticas de rendimiento
  rendimiento: {
    tiempoPromedioRevision: number; // en horas
    documentosRevisadosHoy: number;
    documentosRevisadosSemana: number;
    eficienciaRevision: number; // porcentaje
  };
  
  // Totales generales
  totales: {
    total: number;
    pendientes: number;
    aceptados: number;
    rechazados: number;
    vencidos: number;
  };
}

export interface TrendData {
  fecha: Date;
  total: number;
  aceptados: number;
  rechazados: number;
  pendientes: number;
}

export interface ClienteDocumentoStats {
  cliente_id: number;
  nombre_cliente: string;
  total_documentos: number;
  documentos_pendientes: number;
  documentos_aceptados: number;
  documentos_rechazados: number;
  documentos_vencidos: number;
  porcentaje_completitud: number;
  ultimo_documento: Date | null;
}

export interface UseDocumentoStatsState {
  stats: DocumentoStatsData | null;
  trends: TrendData[];
  clienteStats: ClienteDocumentoStats[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface UseDocumentoStatsOptions {
  autoLoad?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
  includeClienteStats?: boolean;
  includeTrends?: boolean;
  trendPeriod?: 'week' | 'month' | 'quarter' | 'year';
  onStatsUpdate?: (stats: DocumentoStatsData) => void;
  onError?: (error: string) => void;
}

export interface UseDocumentoStatsReturn {
  // Estado
  state: UseDocumentoStatsState;
  
  // Acciones de carga
  loadStats: () => Promise<void>;
  loadTrends: (period: 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  loadClienteStats: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Configuración
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Utilidades computadas
  getStatsByEstatus: (estatus: EstatusDocumento) => number;
  getStatsByTipo: (tipoId: number) => any;
  getTotalDocumentos: () => number;
  getCompletitudPorcentaje: () => number;
  getEficienciaRevision: () => number;
  
  // Análisis avanzado
  getTopDocumentTypes: (limit?: number) => Array<{ nombre: string; total: number }>;
  getWorstPerformingTypes: (limit?: number) => Array<{ nombre: string; rechazos: number; porcentaje: number }>;
  getPendingWorkload: () => { total: number; urgentes: number; normales: number };
  getProductivityMetrics: () => {
    documentosPorHora: number;
    tiempoPromedioRevision: number;
    backlog: number;
  };
  
  // Predicciones y alertas
  predictWorkload: (days: number) => number;
  getAlerts: () => Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count?: number;
  }>;
  
  // Exportación
  exportStats: (format: 'json' | 'csv') => string;
  generateReport: (templateType: 'executive' | 'operational' | 'compliance') => string;
  
  // Comparaciones
  compareWithPreviousPeriod: (period: 'week' | 'month') => {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

// ==================== CONSTANTES ====================

const INITIAL_STATS: DocumentoStatsData = {
  porEstatus: {
    pendiente: 0,
    aceptado: 0,
    rechazado: 0,
    vencido: 0
  },
  porTipo: [],
  porMes: [],
  vigencia: {
    vigentes: 0,
    vencidos: 0,
    proximosVencer: 0,
    sinVencimiento: 0
  },
  completitud: {
    documentosRequeridos: 0,
    documentosPresentes: 0,
    porcentajeCompletitud: 0
  },
  rendimiento: {
    tiempoPromedioRevision: 0,
    documentosRevisadosHoy: 0,
    documentosRevisadosSemana: 0,
    eficienciaRevision: 0
  },
  totales: {
    total: 0,
    pendientes: 0,
    aceptados: 0,
    rechazados: 0,
    vencidos: 0
  }
};

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

// ==================== UTILIDADES ====================

function calculateStats(documentos: Documento[], tipos: DocumentoTipo[]): DocumentoStatsData {
  const stats = { ...INITIAL_STATS };
  const ahora = new Date();

  // Estadísticas por estatus
  documentos.forEach(doc => {
    stats.porEstatus[doc.estatus]++;
    stats.totales.total++;
    stats.totales[doc.estatus === 'pendiente' ? 'pendientes' : 
                   doc.estatus === 'aceptado' ? 'aceptados' : 
                   doc.estatus === 'rechazado' ? 'rechazados' : 'vencidos']++;
  });

  // Estadísticas por tipo
  const tipoStats = new Map();
  tipos.forEach(tipo => {
    tipoStats.set(tipo.documento_tipo_id, {
      tipo_id: tipo.documento_tipo_id,
      nombre: tipo.nombre,
      total: 0,
      pendientes: 0,
      aceptados: 0,
      rechazados: 0,
      vencidos: 0
    });
  });

  documentos.forEach(doc => {
    const tipoStat = tipoStats.get(doc.documento_tipo_id);
    if (tipoStat) {
      tipoStat.total++;
      tipoStat[doc.estatus === 'pendiente' ? 'pendientes' : 
               doc.estatus === 'aceptado' ? 'aceptados' : 
               doc.estatus === 'rechazado' ? 'rechazados' : 'vencidos']++;
    }
  });

  stats.porTipo = Array.from(tipoStats.values());

  // Estadísticas de vigencia
  documentos.forEach(doc => {
    if (!doc.fecha_expiracion) {
      stats.vigencia.sinVencimiento++;
    } else {
      const fechaExp = new Date(doc.fecha_expiracion);
      if (fechaExp < ahora) {
        stats.vigencia.vencidos++;
      } else {
        const diasRestantes = Math.ceil((fechaExp.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 30) {
          stats.vigencia.proximosVencer++;
        } else {
          stats.vigencia.vigentes++;
        }
      }
    }
  });

  // Estadísticas por mes (últimos 12 meses)
  const mesesStats = new Map();
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    mesesStats.set(key, {
      mes: fecha.toLocaleDateString('es', { month: 'long' }),
      año: fecha.getFullYear(),
      total: 0,
      aceptados: 0,
      rechazados: 0
    });
  }

  documentos.forEach(doc => {
    const fechaSubida = new Date(doc.fecha_subida);
    const key = `${fechaSubida.getFullYear()}-${fechaSubida.getMonth()}`;
    const mesStat = mesesStats.get(key);
    if (mesStat) {
      mesStat.total++;
      if (doc.estatus === 'aceptado') mesStat.aceptados++;
      if (doc.estatus === 'rechazado') mesStat.rechazados++;
    }
  });

  stats.porMes = Array.from(mesesStats.values());

  // Estadísticas de rendimiento
  const documentosRevisados = documentos.filter(doc => 
    doc.estatus === 'aceptado' || doc.estatus === 'rechazado'
  );
  
  stats.rendimiento.documentosRevisadosHoy = documentosRevisados.filter(doc => {
    const fechaSubida = new Date(doc.fecha_subida);
    return fechaSubida.toDateString() === ahora.toDateString();
  }).length;

  stats.rendimiento.documentosRevisadosSemana = documentosRevisados.filter(doc => {
    const fechaSubida = new Date(doc.fecha_subida);
    const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    return fechaSubida >= unaSemanaAtras;
  }).length;

  if (documentosRevisados.length > 0) {
    stats.rendimiento.eficienciaRevision = Math.round(
      (stats.porEstatus.aceptado / documentosRevisados.length) * 100
    );
  }

  // Completitud (simplificada)
  stats.completitud.documentosRequeridos = tipos.filter(t => !t.opcional).length;
  stats.completitud.documentosPresentes = stats.totales.total;
  stats.completitud.porcentajeCompletitud = stats.completitud.documentosRequeridos > 0
    ? Math.round((stats.completitud.documentosPresentes / stats.completitud.documentosRequeridos) * 100)
    : 100;

  return stats;
}

// ==================== HOOK PRINCIPAL ====================

export function useDocumentoStats(options: UseDocumentoStatsOptions = {}) {
  const {
    autoLoad = true,
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    includeClienteStats = false,
    includeTrends = false,
    trendPeriod = 'month',
    onStatsUpdate,
    onError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDocumentoStatsState>(() => ({
    stats: null,
    trends: [],
    clienteStats: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    autoRefresh,
    refreshInterval
  }));

  const [refreshTimer, setRefreshTimer] = useState<number | null>(null);

  // ==================== ACCIONES DE CARGA ====================

  const loadStats = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cargar documentos y tipos para calcular estadísticas
      const [documentosResponse, tipos] = await Promise.all([
        documentoService.getDocumentos({}),
        documentoService.getTiposDocumento()
      ]);

      const documentos = documentosResponse.data || [];
      const stats = calculateStats(documentos, tipos);

      setState(prev => ({
        ...prev,
        stats,
        isLoading: false,
        lastUpdated: new Date()
      }));

      if (onStatsUpdate) {
        onStatsUpdate(stats);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onStatsUpdate, onError]);

  const loadTrends = useCallback(async (_period: 'week' | 'month' | 'quarter' | 'year') => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implementar carga de tendencias del backend
      // Por ahora, generar datos de ejemplo
      const trends: TrendData[] = [];
      const ahora = new Date();
      
      for (let i = 7; i >= 0; i--) {
        const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
        trends.push({
          fecha,
          total: Math.floor(Math.random() * 50),
          aceptados: Math.floor(Math.random() * 30),
          rechazados: Math.floor(Math.random() * 10),
          pendientes: Math.floor(Math.random() * 20)
        });
      }

      setState(prev => ({
        ...prev,
        trends,
        isLoading: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar tendencias';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  const loadClienteStats = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implementar estadísticas por cliente
      const clienteStats: ClienteDocumentoStats[] = [];
      
      setState(prev => ({
        ...prev,
        clienteStats,
        isLoading: false
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas de clientes';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadStats(),
      includeTrends ? loadTrends(trendPeriod) : Promise.resolve(),
      includeClienteStats ? loadClienteStats() : Promise.resolve()
    ]);
  }, [loadStats, loadTrends, loadClienteStats, includeTrends, includeClienteStats, trendPeriod]);

  // ==================== CONFIGURACIÓN ====================

  const setAutoRefresh = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoRefresh: enabled }));
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setState(prev => ({ ...prev, refreshInterval: interval }));
  }, []);

  // ==================== UTILIDADES COMPUTADAS ====================

  const getStatsByEstatus = useCallback((estatus: EstatusDocumento): number => {
    return state.stats?.porEstatus[estatus] || 0;
  }, [state.stats]);

  const getStatsByTipo = useCallback((tipoId: number) => {
    return state.stats?.porTipo.find(t => t.tipo_id === tipoId) || null;
  }, [state.stats]);

  const getTotalDocumentos = useCallback((): number => {
    return state.stats?.totales.total || 0;
  }, [state.stats]);

  const getCompletitudPorcentaje = useCallback((): number => {
    return state.stats?.completitud.porcentajeCompletitud || 0;
  }, [state.stats]);

  const getEficienciaRevision = useCallback((): number => {
    return state.stats?.rendimiento.eficienciaRevision || 0;
  }, [state.stats]);

  // ==================== ANÁLISIS AVANZADO ====================

  const getTopDocumentTypes = useCallback((limit = 5) => {
    if (!state.stats) return [];
    
    return state.stats.porTipo
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map(t => ({ nombre: t.nombre, total: t.total }));
  }, [state.stats]);

  const getWorstPerformingTypes = useCallback((limit = 5) => {
    if (!state.stats) return [];
    
    return state.stats.porTipo
      .filter(t => t.total > 0)
      .map(t => ({
        nombre: t.nombre,
        rechazos: t.rechazados,
        porcentaje: Math.round((t.rechazados / t.total) * 100)
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, limit);
  }, [state.stats]);

  const getPendingWorkload = useCallback(() => {
    const total = getStatsByEstatus('pendiente');
    const urgentes = state.stats?.vigencia.proximosVencer || 0;
    const normales = total - urgentes;
    
    return { total, urgentes, normales };
  }, [state.stats, getStatsByEstatus]);

  const getProductivityMetrics = useCallback(() => {
    const stats = state.stats?.rendimiento;
    return {
      documentosPorHora: stats ? Math.round(stats.documentosRevisadosHoy / 8) : 0, // Asumiendo 8 horas laborales
      tiempoPromedioRevision: stats?.tiempoPromedioRevision || 0,
      backlog: getStatsByEstatus('pendiente')
    };
  }, [state.stats, getStatsByEstatus]);

  // ==================== PREDICCIONES Y ALERTAS ====================

  const predictWorkload = useCallback((days: number): number => {
    if (!state.stats) return 0;
    
    const promedioSemanal = state.stats.rendimiento.documentosRevisadosSemana;
    const promedioDiario = promedioSemanal / 7;
    
    return Math.round(promedioDiario * days);
  }, [state.stats]);

  const getAlerts = useCallback(() => {
    const alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; count?: number }> = [];
    
    if (!state.stats) return alerts;

    // Alertas de documentos vencidos
    if (state.stats.vigencia.vencidos > 0) {
      alerts.push({
        type: 'error',
        message: 'Documentos vencidos requieren atención',
        count: state.stats.vigencia.vencidos
      });
    }

    // Alertas de próximos vencimientos
    if (state.stats.vigencia.proximosVencer > 0) {
      alerts.push({
        type: 'warning',
        message: 'Documentos próximos a vencer',
        count: state.stats.vigencia.proximosVencer
      });
    }

    // Alertas de backlog alto
    const pendientes = getStatsByEstatus('pendiente');
    if (pendientes > 100) {
      alerts.push({
        type: 'warning',
        message: 'Alto volumen de documentos pendientes',
        count: pendientes
      });
    }

    // Alertas de baja eficiencia
    if (state.stats.rendimiento.eficienciaRevision < 70) {
      alerts.push({
        type: 'info',
        message: 'Eficiencia de revisión por debajo del 70%'
      });
    }

    return alerts;
  }, [state.stats, getStatsByEstatus]);

  // ==================== EXPORTACIÓN ====================

  const exportStats = useCallback((format: 'json' | 'csv'): string => {
    if (!state.stats) return '';

    if (format === 'json') {
      return JSON.stringify({
        generatedAt: new Date().toISOString(),
        stats: state.stats,
        trends: state.trends,
        clienteStats: state.clienteStats
      }, null, 2);
    } else {
      // CSV básico
      const csv = [
        'Estatus,Cantidad',
        ...Object.entries(state.stats.porEstatus).map(([k, v]) => `${k},${v}`),
        '',
        'Tipo,Total,Pendientes,Aceptados,Rechazados',
        ...state.stats.porTipo.map(t => `${t.nombre},${t.total},${t.pendientes},${t.aceptados},${t.rechazados}`)
      ].join('\n');
      
      return csv;
    }
  }, [state.stats, state.trends, state.clienteStats]);

  const generateReport = useCallback((templateType: 'executive' | 'operational' | 'compliance'): string => {
    if (!state.stats) return '';

    const ahora = new Date();
    const reportHeader = `REPORTE DE DOCUMENTOS - ${templateType.toUpperCase()}
Generado: ${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}
    
`;

    switch (templateType) {
      case 'executive':
        return reportHeader + `RESUMEN EJECUTIVO
        
Total de documentos: ${state.stats.totales.total}
Documentos procesados: ${state.stats.totales.aceptados + state.stats.totales.rechazados}
Eficiencia de aprobación: ${state.stats.rendimiento.eficienciaRevision}%
Completitud general: ${state.stats.completitud.porcentajeCompletitud}%

ALERTAS PRINCIPALES:
${getAlerts().map(a => `- ${a.message}${a.count ? ` (${a.count})` : ''}`).join('\n')}
`;

      case 'operational':
        return reportHeader + `REPORTE OPERACIONAL
        
PENDIENTES DE REVISIÓN: ${state.stats.totales.pendientes}
- Urgentes (próximos a vencer): ${state.stats.vigencia.proximosVencer}
- Normales: ${state.stats.totales.pendientes - state.stats.vigencia.proximosVencer}

PRODUCTIVIDAD:
- Documentos revisados hoy: ${state.stats.rendimiento.documentosRevisadosHoy}
- Documentos revisados esta semana: ${state.stats.rendimiento.documentosRevisadosSemana}

TIPOS MÁS PROCESADOS:
${getTopDocumentTypes(3).map(t => `- ${t.nombre}: ${t.total} documentos`).join('\n')}
`;

      case 'compliance':
        return reportHeader + `REPORTE DE CUMPLIMIENTO
        
ESTADO DE VIGENCIAS:
- Documentos vigentes: ${state.stats.vigencia.vigentes}
- Documentos vencidos: ${state.stats.vigencia.vencidos}
- Próximos a vencer (30 días): ${state.stats.vigencia.proximosVencer}

COMPLETITUD DE DOCUMENTACIÓN:
- Documentos requeridos: ${state.stats.completitud.documentosRequeridos}
- Documentos presentes: ${state.stats.completitud.documentosPresentes}
- Nivel de completitud: ${state.stats.completitud.porcentajeCompletitud}%

TIPOS CON MAYOR TASA DE RECHAZO:
${getWorstPerformingTypes(3).map(t => `- ${t.nombre}: ${t.porcentaje}% de rechazo`).join('\n')}
`;

      default:
        return reportHeader + 'Tipo de reporte no reconocido';
    }
  }, [state.stats, getAlerts, getTopDocumentTypes, getWorstPerformingTypes]);

  const compareWithPreviousPeriod = useCallback((_period: 'week' | 'month') => {
    // TODO: Implementar comparación con período anterior
    return {
      current: getTotalDocumentos(),
      previous: 0,
      change: 0,
      changePercentage: 0
    };
  }, [getTotalDocumentos]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  useEffect(() => {
    if (state.autoRefresh && state.refreshInterval > 0) {
      const timer = window.setInterval(() => {
        refresh();
      }, state.refreshInterval);
      
      setRefreshTimer(timer);
      
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }
  }, [state.autoRefresh, state.refreshInterval, refresh]);

  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [refreshTimer]);

  // ==================== RETORNO ====================

  return {
    state,
    loadStats,
    loadTrends,
    loadClienteStats,
    refresh,
    setAutoRefresh,
    setRefreshInterval,
    getStatsByEstatus,
    getStatsByTipo,
    getTotalDocumentos,
    getCompletitudPorcentaje,
    getEficienciaRevision,
    getTopDocumentTypes,
    getWorstPerformingTypes,
    getPendingWorkload,
    getProductivityMetrics,
    predictWorkload,
    getAlerts,
    exportStats,
    generateReport,
    compareWithPreviousPeriod
  };
}