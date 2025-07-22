import { useState, useCallback, useEffect } from 'react';
import type { SolicitudCompleta } from '../../services/solicitud.service';

// ==================== INTERFACES ====================

export interface SolicitudStatsData {
  // Estadísticas generales
  total: number;
  totalMonto: number;
  montoPromedio: number;
  
  // Por estatus
  iniciadas: number;
  en_revision: number;
  aprobadas: number;
  rechazadas: number;
  canceladas: number;
  
  // Por producto
  creditoSimple: number;
  cuentaCorriente: number;
  factoraje: number;
  arrendamiento: number;
  
  // Métricas de tiempo
  tiempoPromedioAprobacion: number; // días
  tiempoPromedioRevision: number; // días
  
  // Métricas de calidad
  tasaAprobacion: number; // porcentaje
  tasaRechazo: number; // porcentaje
  
  // Tendencias
  solicitudesEstesMes: number;
  solicitudesMesAnterior: number;
  tendenciaMensual: number; // porcentaje de cambio
  
  // Alertas
  solicitudesVencidas: number;
  solicitudesAtrasadas: number;
}

export interface TrendData {
  fecha: string;
  solicitudesCreadas: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  montoTotal: number;
}

export interface UseSolicitudStatsState {
  stats: SolicitudStatsData;
  trends: TrendData[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface UseSolicitudStatsOptions {
  solicitudes?: SolicitudCompleta[];
  autoLoad?: boolean;
  refreshInterval?: number;
  onStatsUpdate?: (stats: SolicitudStatsData) => void;
  onError?: (error: string) => void;
}

export interface UseSolicitudStatsReturn {
  // Estado
  state: UseSolicitudStatsState;
  
  // Acciones de carga
  loadStats: () => Promise<void>;
  loadTrends: (period: 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Métricas calculadas
  getTotalSolicitudes: () => number;
  getMontoTotal: () => number;
  getMontoPromedio: () => number;
  getTasaAprobacion: () => number;
  getTasaRechazo: () => number;
  getTendenciaMensual: () => number;
  
  // Estadísticas por período
  getStatsForPeriod: (inicio: Date, fin: Date) => SolicitudStatsData;
  getTopProductos: () => Array<{producto: string; cantidad: number; porcentaje: number}>;
  getDistribucionEstatus: () => Array<{estatus: string; cantidad: number; porcentaje: number}>;
  
  // Alertas y notificaciones
  getAlertas: () => Array<{tipo: string; mensaje: string; cantidad: number}>;
  getSolicitudesProblematicas: () => SolicitudCompleta[];
  getRecomendaciones: () => string[];
  
  // Reportes
  generateReport: (tipo: 'general' | 'productos' | 'estatus' | 'tendencias') => any;
  exportToCSV: () => string;
  
  // Comparaciones
  compareWithPreviousPeriod: (period: 'week' | 'month') => {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
}

// ==================== CONSTANTES ====================

const INITIAL_STATS: SolicitudStatsData = {
  total: 0,
  totalMonto: 0,
  montoPromedio: 0,
  iniciadas: 0,
  en_revision: 0,
  aprobadas: 0,
  rechazadas: 0,
  canceladas: 0,
  creditoSimple: 0,
  cuentaCorriente: 0,
  factoraje: 0,
  arrendamiento: 0,
  tiempoPromedioAprobacion: 0,
  tiempoPromedioRevision: 0,
  tasaAprobacion: 0,
  tasaRechazo: 0,
  solicitudesEstesMes: 0,
  solicitudesMesAnterior: 0,
  tendenciaMensual: 0,
  solicitudesVencidas: 0,
  solicitudesAtrasadas: 0
};

// ==================== UTILIDADES ====================

function calculateStats(solicitudes: SolicitudCompleta[]): SolicitudStatsData {
  const stats = { ...INITIAL_STATS };
  const ahora = new Date();

  // Estadísticas básicas
  stats.total = solicitudes.length;
  
  // Estadísticas por estatus
  solicitudes.forEach(sol => {
    switch (sol.estatus) {
      case 'iniciada':
        stats.iniciadas++;
        break;
      case 'en_revision':
        stats.en_revision++;
        break;
      case 'aprobada':
        stats.aprobadas++;
        break;
      case 'rechazada':
        stats.rechazadas++;
        break;
      case 'cancelada':
        stats.canceladas++;
        break;
    }
    
    // Calcular monto total
    const montoSolicitud = sol.productos?.reduce((sum, prod) => sum + prod.monto, 0) || 0;
    stats.totalMonto += montoSolicitud;
    
    // Estadísticas por producto
    sol.productos?.forEach(prod => {
      switch (prod.producto) {
        case 'CS':
          stats.creditoSimple++;
          break;
        case 'CC':
          stats.cuentaCorriente++;
          break;
        case 'FA':
          stats.factoraje++;
          break;
        case 'AR':
          stats.arrendamiento++;
          break;
      }
    });
  });
  
  // Cálculos derivados
  stats.montoPromedio = stats.total > 0 ? stats.totalMonto / stats.total : 0;
  stats.tasaAprobacion = stats.total > 0 ? (stats.aprobadas / stats.total) * 100 : 0;
  stats.tasaRechazo = stats.total > 0 ? (stats.rechazadas / stats.total) * 100 : 0;
  
  // Estadísticas temporales
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  
  stats.solicitudesEstesMes = solicitudes.filter(sol => 
    new Date(sol.fecha_creacion) >= inicioMes
  ).length;
  
  stats.solicitudesMesAnterior = solicitudes.filter(sol => {
    const fecha = new Date(sol.fecha_creacion);
    return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
  }).length;
  
  stats.tendenciaMensual = stats.solicitudesMesAnterior > 0 
    ? ((stats.solicitudesEstesMes - stats.solicitudesMesAnterior) / stats.solicitudesMesAnterior) * 100
    : 0;
  
  // TODO: Implementar cálculo de tiempos promedio y alertas
  
  return stats;
}

// ==================== HOOK PRINCIPAL ====================

export function useSolicitudStats(options: UseSolicitudStatsOptions = {}): UseSolicitudStatsReturn {
  const {
    solicitudes = [],
    autoLoad = true,
    refreshInterval,
    onStatsUpdate,
    onError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseSolicitudStatsState>({
    stats: INITIAL_STATS,
    trends: [],
    loading: false,
    error: null,
    lastUpdate: null
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

  const loadStats = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Si tenemos solicitudes locales, calcular stats directamente
      if (solicitudes.length > 0) {
        const stats = calculateStats(solicitudes);
        setState(prev => ({
          ...prev,
          stats,
          loading: false,
          lastUpdate: new Date()
        }));
        onStatsUpdate?.(stats);
      } else {
        // TODO: Cargar desde el servicio cuando esté disponible
        // const stats = await solicitudService.getEstadisticas();
        setState(prev => ({
          ...prev,
          loading: false,
          lastUpdate: new Date()
        }));
      }
    } catch (error) {
      handleError(error, 'cargar estadísticas');
    }
  }, [solicitudes, handleError, onStatsUpdate]);

  const loadTrends = useCallback(async (_period: 'week' | 'month' | 'quarter' | 'year') => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // TODO: Implementar carga de tendencias del backend
      // Por ahora, generar datos de ejemplo
      const trends: TrendData[] = [];
      const ahora = new Date();
      
      for (let i = 7; i >= 0; i--) {
        const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
        trends.push({
          fecha: fecha.toISOString().split('T')[0],
          solicitudesCreadas: Math.floor(Math.random() * 10) + 1,
          solicitudesAprobadas: Math.floor(Math.random() * 5),
          solicitudesRechazadas: Math.floor(Math.random() * 3),
          montoTotal: Math.floor(Math.random() * 1000000) + 100000
        });
      }
      
      setState(prev => ({
        ...prev,
        trends,
        loading: false
      }));

    } catch (error) {
      handleError(error, 'cargar tendencias');
    }
  }, [handleError]);

  const refreshStats = useCallback(async (): Promise<void> => {
    await loadStats();
  }, [loadStats]);

  // ==================== MÉTRICAS CALCULADAS ====================

  const getTotalSolicitudes = useCallback((): number => {
    return state.stats.total;
  }, [state.stats.total]);

  const getMontoTotal = useCallback((): number => {
    return state.stats.totalMonto;
  }, [state.stats.totalMonto]);

  const getMontoPromedio = useCallback((): number => {
    return state.stats.montoPromedio;
  }, [state.stats.montoPromedio]);

  const getTasaAprobacion = useCallback((): number => {
    return state.stats.tasaAprobacion;
  }, [state.stats.tasaAprobacion]);

  const getTasaRechazo = useCallback((): number => {
    return state.stats.tasaRechazo;
  }, [state.stats.tasaRechazo]);

  const getTendenciaMensual = useCallback((): number => {
    return state.stats.tendenciaMensual;
  }, [state.stats.tendenciaMensual]);

  // ==================== ESTADÍSTICAS POR PERÍODO ====================

  const getStatsForPeriod = useCallback((inicio: Date, fin: Date): SolicitudStatsData => {
    const solicitudesPeriodo = solicitudes.filter(sol => {
      const fecha = new Date(sol.fecha_creacion);
      return fecha >= inicio && fecha <= fin;
    });
    
    return calculateStats(solicitudesPeriodo);
  }, [solicitudes]);

  const getTopProductos = useCallback(() => {
    const stats = state.stats;
    const productos = [
      { producto: 'Crédito Simple', cantidad: stats.creditoSimple },
      { producto: 'Cuenta Corriente', cantidad: stats.cuentaCorriente },
      { producto: 'Factoraje', cantidad: stats.factoraje },
      { producto: 'Arrendamiento', cantidad: stats.arrendamiento }
    ];
    
    const total = productos.reduce((sum, p) => sum + p.cantidad, 0);
    
    return productos
      .map(p => ({
        ...p,
        porcentaje: total > 0 ? (p.cantidad / total) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [state.stats]);

  const getDistribucionEstatus = useCallback(() => {
    const stats = state.stats;
    const estatus = [
      { estatus: 'Iniciada', cantidad: stats.iniciadas },
      { estatus: 'En Revisión', cantidad: stats.en_revision },
      { estatus: 'Aprobada', cantidad: stats.aprobadas },
      { estatus: 'Rechazada', cantidad: stats.rechazadas },
      { estatus: 'Cancelada', cantidad: stats.canceladas }
    ];
    
    const total = stats.total;
    
    return estatus.map(e => ({
      ...e,
      porcentaje: total > 0 ? (e.cantidad / total) * 100 : 0
    }));
  }, [state.stats]);

  // ==================== ALERTAS Y NOTIFICACIONES ====================

  const getAlertas = useCallback(() => {
    const alertas = [];
    
    if (state.stats.solicitudesVencidas > 0) {
      alertas.push({
        tipo: 'vencidas',
        mensaje: 'Solicitudes vencidas requieren atención',
        cantidad: state.stats.solicitudesVencidas
      });
    }
    
    if (state.stats.solicitudesAtrasadas > 0) {
      alertas.push({
        tipo: 'atrasadas',
        mensaje: 'Solicitudes atrasadas en revisión',
        cantidad: state.stats.solicitudesAtrasadas
      });
    }
    
    if (state.stats.tasaRechazo > 30) {
      alertas.push({
        tipo: 'alta_tasa_rechazo',
        mensaje: 'Tasa de rechazo elevada',
        cantidad: Math.round(state.stats.tasaRechazo)
      });
    }
    
    return alertas;
  }, [state.stats]);

  const getSolicitudesProblematicas = useCallback((): SolicitudCompleta[] => {
    // TODO: Implementar lógica para identificar solicitudes problemáticas
    return [];
  }, []);

  const getRecomendaciones = useCallback((): string[] => {
    const recomendaciones = [];
    
    if (state.stats.tasaRechazo > 25) {
      recomendaciones.push('Revisar criterios de aprobación para reducir la tasa de rechazo');
    }
    
    if (state.stats.tiempoPromedioRevision > 7) {
      recomendaciones.push('Optimizar el proceso de revisión para reducir tiempos');
    }
    
    if (state.stats.tendenciaMensual < -20) {
      recomendaciones.push('Investigar la caída en solicitudes nuevas');
    }
    
    return recomendaciones;
  }, [state.stats]);

  // ==================== REPORTES ====================

  const generateReport = useCallback((tipo: 'general' | 'productos' | 'estatus' | 'tendencias') => {
    switch (tipo) {
      case 'general':
        return {
          titulo: 'Reporte General de Solicitudes',
          fecha: new Date().toISOString(),
          stats: state.stats,
          alertas: getAlertas(),
          recomendaciones: getRecomendaciones()
        };
      
      case 'productos':
        return {
          titulo: 'Reporte de Productos',
          fecha: new Date().toISOString(),
          distribucion: getTopProductos()
        };
      
      case 'estatus':
        return {
          titulo: 'Reporte de Estados',
          fecha: new Date().toISOString(),
          distribucion: getDistribucionEstatus()
        };
      
      case 'tendencias':
        return {
          titulo: 'Reporte de Tendencias',
          fecha: new Date().toISOString(),
          trends: state.trends,
          tendenciaMensual: state.stats.tendenciaMensual
        };
      
      default:
        return null;
    }
  }, [state.stats, state.trends, getAlertas, getRecomendaciones, getTopProductos, getDistribucionEstatus]);

  const exportToCSV = useCallback((): string => {
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Total Solicitudes', state.stats.total.toString()],
      ['Monto Total', state.stats.totalMonto.toString()],
      ['Monto Promedio', state.stats.montoPromedio.toFixed(2)],
      ['Tasa de Aprobación', state.stats.tasaAprobacion.toFixed(2) + '%'],
      ['Tasa de Rechazo', state.stats.tasaRechazo.toFixed(2) + '%'],
      ['Tendencia Mensual', state.stats.tendenciaMensual.toFixed(2) + '%']
    ];
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }, [state.stats]);

  // ==================== COMPARACIONES ====================

  const compareWithPreviousPeriod = useCallback((_period: 'week' | 'month') => {
    // TODO: Implementar comparación con período anterior
    return {
      current: getTotalSolicitudes(),
      previous: 0,
      change: 0,
      changePercentage: 0
    };
  }, [getTotalSolicitudes]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshStats]);

  // Actualizar stats cuando cambien las solicitudes
  useEffect(() => {
    if (solicitudes.length > 0) {
      const stats = calculateStats(solicitudes);
      setState(prev => ({
        ...prev,
        stats,
        lastUpdate: new Date()
      }));
      onStatsUpdate?.(stats);
    }
  }, [solicitudes, onStatsUpdate]);

  // ==================== RETORNO ====================

  return {
    state,
    loadStats,
    loadTrends,
    refreshStats,
    getTotalSolicitudes,
    getMontoTotal,
    getMontoPromedio,
    getTasaAprobacion,
    getTasaRechazo,
    getTendenciaMensual,
    getStatsForPeriod,
    getTopProductos,
    getDistribucionEstatus,
    getAlertas,
    getSolicitudesProblematicas,
    getRecomendaciones,
    generateReport,
    exportToCSV,
    compareWithPreviousPeriod
  };
}
