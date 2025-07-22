/**
 * @fileoverview Hook para estadísticas y análisis de usuarios
 * @module hook/usuario/useUsuarioStats
 * @description Proporciona métricas, tendencias y análisis estadísticos de usuarios
 */

import { useState, useCallback, useEffect } from 'react';
import type { Usuario } from './useUsuarioManager';

// ==================== INTERFACES Y TIPOS ====================

export interface UsuarioStatsData {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosSuspendidos: number;
  porcentajeActivos: number;
  distribuccionPorRol: {
    SUPER: number;
    ADMIN: number;
    AUDITOR: number;
    OPERADOR: number;
  };
  usuariosNuevos: {
    hoy: number;
    semana: number;
    mes: number;
  };
  tendenciaRegistros: TrendData[];
  actividadReciente: {
    ultimoMes: number;
    ultimaSemana: number;
    ultimoDia: number;
  };
}

export interface TrendData {
  fecha: string;
  valor: number;
  tipo: 'registros' | 'activaciones' | 'suspensiones' | 'logins';
  acumulado?: number;
}

export interface UsuarioMetrics {
  crecimiento: {
    mensual: number;
    semanal: number;
    diario: number;
  };
  retencion: {
    usuarios30Dias: number;
    usuarios7Dias: number;
    usuarios1Dia: number;
  };
  seguridad: {
    usuariosConPasswordSegura: number;
    usuariosConEmailCorporativo: number;
    cuentasComprommetidas: number;
  };
}

export interface UsuarioAnalytics {
  demograficos: {
    promedioRolesPorTipo: Record<string, number>;
    distribucionGeografica?: Record<string, number>;
  };
  patrones: {
    horariosActividad: Array<{ hora: number; usuarios: number }>;
    diasSemanaActividad: Array<{ dia: string; usuarios: number }>;
  };
  predicciones: {
    crecimientoEsperado30Dias: number;
    riesgoRotacion: Array<{ usuario_id: number; score: number }>;
  };
}

export interface UseUsuarioStatsState {
  stats: UsuarioStatsData | null;
  metrics: UsuarioMetrics | null;
  analytics: UsuarioAnalytics | null;
  trends: TrendData[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  period: '24h' | '7d' | '30d' | '90d' | '1y';
  selectedMetrics: string[];
  realTimeData: boolean;
}

export interface UseUsuarioStatsOptions {
  defaultPeriod?: '24h' | '7d' | '30d' | '90d' | '1y';
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  enableAnalytics?: boolean;
  selectedMetrics?: string[];
  onStatsUpdate?: (stats: UsuarioStatsData) => void;
  onError?: (error: string) => void;
}

export interface UseUsuarioStatsReturn {
  // Estado
  state: UseUsuarioStatsState;
  
  // Carga de datos
  loadStats: (period?: '24h' | '7d' | '30d' | '90d' | '1y') => Promise<void>;
  loadMetrics: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadTrends: (type: 'registros' | 'activaciones' | 'suspensiones' | 'logins') => Promise<void>;
  
  // Cálculos estadísticos
  calculateStats: (usuarios: Usuario[]) => UsuarioStatsData;
  calculateGrowthRate: (currentCount: number, previousCount: number) => number;
  calculateRetentionRate: (usuarios: Usuario[], days: number) => number;
  
  // Análisis de tendencias
  getTrendAnalysis: (type: 'registros' | 'activaciones' | 'suspensiones' | 'logins') => {
    tendencia: 'ascendente' | 'descendente' | 'estable';
    cambioPercentual: number;
    prediccion: number;
  };
  
  // Comparaciones
  comparePeriodicStats: (period1: string, period2: string) => Promise<{
    diferencia: number;
    porcentajeCambio: number;
    metricas: Array<{ metrica: string; valor1: number; valor2: number; cambio: number }>;
  }>;
  
  // Filtros y agrupaciones
  getStatsByRole: (rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => Promise<UsuarioStatsData>;
  getStatsByStatus: (estatus: 'activo' | 'suspendido') => Promise<UsuarioStatsData>;
  getStatsByDateRange: (startDate: string, endDate: string) => Promise<UsuarioStatsData>;
  
  // Exportación y reportes
  exportStats: (format: 'json' | 'csv' | 'excel') => Promise<string>;
  generateReport: (includeCharts?: boolean) => Promise<string>;
  
  // Configuración
  setPeriod: (period: '24h' | '7d' | '30d' | '90d' | '1y') => void;
  toggleMetric: (metric: string) => void;
  toggleRealTime: () => void;
  
  // Utilidades
  refreshAllStats: () => Promise<void>;
  getTopMetrics: (limit?: number) => Array<{ name: string; value: number; change: number }>;
  getAlertsFromStats: () => Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
}

// ==================== CONFIGURACIÓN INICIAL ====================

const estadoInicial: UseUsuarioStatsState = {
  stats: null,
  metrics: null,
  analytics: null,
  trends: [],
  loading: false,
  error: null,
  lastUpdate: null,
  period: '30d',
  selectedMetrics: ['totalUsuarios', 'usuariosActivos', 'usuariosNuevos', 'distribuccionPorRol'],
  realTimeData: false
};

const metricsDefault = [
  'totalUsuarios',
  'usuariosActivos', 
  'usuariosSuspendidos',
  'usuariosNuevos',
  'distribuccionPorRol',
  'crecimiento',
  'retencion',
  'actividadReciente'
];

// ==================== HOOK PRINCIPAL ====================

export function useUsuarioStats(options: UseUsuarioStatsOptions = {}): UseUsuarioStatsReturn {
  const {
    defaultPeriod = '30d',
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutos
    enableRealTime = false,
    enableAnalytics = true,
    selectedMetrics = metricsDefault,
    onStatsUpdate,
    onError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseUsuarioStatsState>({
    ...estadoInicial,
    period: defaultPeriod,
    selectedMetrics,
    realTimeData: enableRealTime
  });

  // ==================== FUNCIONES AUXILIARES ====================

  const manejarError = useCallback((error: unknown, contexto: string) => {
    const mensaje = error instanceof Error ? error.message : `Error en ${contexto}`;
    setState(prev => ({ ...prev, error: mensaje, loading: false }));
    onError?.(mensaje);
    console.error(`Error en ${contexto}:`, error);
  }, [onError]);

  const formatearFecha = useCallback((fecha: Date): string => {
    return fecha.toISOString().split('T')[0];
  }, []);

  // ==================== CARGA DE DATOS ====================

  const loadStats = useCallback(async (period: '24h' | '7d' | '30d' | '90d' | '1y' = state.period) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/usuarios/stats?period=${period}&metrics=${state.selectedMetrics.join(',')}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const stats = await response.json();
      
      setState(prev => ({
        ...prev,
        stats,
        period,
        loading: false,
        lastUpdate: new Date()
      }));

      onStatsUpdate?.(stats);

    } catch (error) {
      manejarError(error, 'cargar estadísticas');
    }
  }, [state.period, state.selectedMetrics, onStatsUpdate, manejarError]);

  const loadMetrics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/usuarios/metrics?period=${state.period}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const metrics = await response.json();
      
      setState(prev => ({
        ...prev,
        metrics,
        loading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      manejarError(error, 'cargar métricas');
    }
  }, [state.period, manejarError]);

  const loadAnalytics = useCallback(async () => {
    if (!enableAnalytics) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/usuarios/analytics?period=${state.period}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const analytics = await response.json();
      
      setState(prev => ({
        ...prev,
        analytics,
        loading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      manejarError(error, 'cargar análisis');
    }
  }, [enableAnalytics, state.period, manejarError]);

  const loadTrends = useCallback(async (type: 'registros' | 'activaciones' | 'suspensiones' | 'logins') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/usuarios/trends?type=${type}&period=${state.period}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const trends = await response.json();
      
      setState(prev => ({
        ...prev,
        trends: trends.data || [],
        loading: false,
        lastUpdate: new Date()
      }));

    } catch (error) {
      manejarError(error, 'cargar tendencias');
    }
  }, [state.period, manejarError]);

  // ==================== CÁLCULOS ESTADÍSTICOS ====================

  const calculateStats = useCallback((usuarios: Usuario[]): UsuarioStatsData => {
    const ahora = new Date();
    const unDiaAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const unMesAtras = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalUsuarios = usuarios.length;
    const usuariosActivos = usuarios.filter(u => u.estatus === 'activo').length;
    const usuariosSuspendidos = totalUsuarios - usuariosActivos;
    const porcentajeActivos = totalUsuarios > 0 ? (usuariosActivos / totalUsuarios) * 100 : 0;

    // Distribución por rol
    const distribuccionPorRol = usuarios.reduce((acc, usuario) => {
      acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
      return acc;
    }, { SUPER: 0, ADMIN: 0, AUDITOR: 0, OPERADOR: 0 });

    // Usuarios nuevos
    const usuariosNuevos = {
      hoy: usuarios.filter(u => new Date(u.created_at) >= unDiaAtras).length,
      semana: usuarios.filter(u => new Date(u.created_at) >= unaSemanaAtras).length,
      mes: usuarios.filter(u => new Date(u.created_at) >= unMesAtras).length
    };

    // Tendencia de registros (simplificada)
    const tendenciaRegistros: TrendData[] = [];
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      const inicioDelDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      const finDelDia = new Date(inicioDelDia.getTime() + 24 * 60 * 60 * 1000);
      
      const registrosDelDia = usuarios.filter(u => {
        const fechaCreacion = new Date(u.created_at);
        return fechaCreacion >= inicioDelDia && fechaCreacion < finDelDia;
      }).length;

      tendenciaRegistros.push({
        fecha: formatearFecha(fecha),
        valor: registrosDelDia,
        tipo: 'registros'
      });
    }

    // Actividad reciente (simplificada - en producción se usarían datos de logs)
    const actividadReciente = {
      ultimoMes: usuarios.filter(u => new Date(u.updated_at) >= unMesAtras).length,
      ultimaSemana: usuarios.filter(u => new Date(u.updated_at) >= unaSemanaAtras).length,
      ultimoDia: usuarios.filter(u => new Date(u.updated_at) >= unDiaAtras).length
    };

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosSuspendidos,
      porcentajeActivos,
      distribuccionPorRol,
      usuariosNuevos,
      tendenciaRegistros,
      actividadReciente
    };
  }, [formatearFecha]);

  const calculateGrowthRate = useCallback((currentCount: number, previousCount: number): number => {
    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    return ((currentCount - previousCount) / previousCount) * 100;
  }, []);

  const calculateRetentionRate = useCallback((usuarios: Usuario[], days: number): number => {
    const fechaCorte = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const usuariosEnPeriodo = usuarios.filter(u => new Date(u.created_at) <= fechaCorte);
    const usuariosActivos = usuariosEnPeriodo.filter(u => u.estatus === 'activo');
    
    return usuariosEnPeriodo.length > 0 ? (usuariosActivos.length / usuariosEnPeriodo.length) * 100 : 0;
  }, []);

  // ==================== ANÁLISIS DE TENDENCIAS ====================

  const getTrendAnalysis = useCallback((type: 'registros' | 'activaciones' | 'suspensiones' | 'logins') => {
    const trendsDelTipo = state.trends.filter(t => t.tipo === type);
    
    if (trendsDelTipo.length < 2) {
      return {
        tendencia: 'estable' as const,
        cambioPercentual: 0,
        prediccion: 0
      };
    }

    const valores = trendsDelTipo.map(t => t.valor);
    const ultimosValores = valores.slice(-7); // Últimos 7 puntos
    const primerosValores = valores.slice(0, 7); // Primeros 7 puntos

    const promedioReciente = ultimosValores.reduce((a, b) => a + b, 0) / ultimosValores.length;
    const promedioAnterior = primerosValores.reduce((a, b) => a + b, 0) / primerosValores.length;

    const cambioPercentual = calculateGrowthRate(promedioReciente, promedioAnterior);
    
    let tendencia: 'ascendente' | 'descendente' | 'estable';
    if (Math.abs(cambioPercentual) < 5) {
      tendencia = 'estable';
    } else if (cambioPercentual > 0) {
      tendencia = 'ascendente';
    } else {
      tendencia = 'descendente';
    }

    // Predicción simple basada en tendencia lineal
    const prediccion = promedioReciente * (1 + (cambioPercentual / 100));

    return {
      tendencia,
      cambioPercentual,
      prediccion
    };
  }, [state.trends, calculateGrowthRate]);

  // ==================== COMPARACIONES ====================

  const comparePeriodicStats = useCallback(async (period1: string, period2: string) => {
    try {
      const [response1, response2] = await Promise.all([
        fetch(`/api/usuarios/stats?period=${period1}`),
        fetch(`/api/usuarios/stats?period=${period2}`)
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error('Error obteniendo datos para comparación');
      }

      const [stats1, stats2] = await Promise.all([
        response1.json(),
        response2.json()
      ]);

      const metricas = [
        { metrica: 'Total Usuarios', valor1: stats1.totalUsuarios, valor2: stats2.totalUsuarios },
        { metrica: 'Usuarios Activos', valor1: stats1.usuariosActivos, valor2: stats2.usuariosActivos },
        { metrica: 'Usuarios Nuevos', valor1: stats1.usuariosNuevos.mes, valor2: stats2.usuariosNuevos.mes }
      ].map(m => ({
        ...m,
        cambio: calculateGrowthRate(m.valor1, m.valor2)
      }));

      const diferencia = stats1.totalUsuarios - stats2.totalUsuarios;
      const porcentajeCambio = calculateGrowthRate(stats1.totalUsuarios, stats2.totalUsuarios);

      return {
        diferencia,
        porcentajeCambio,
        metricas
      };

    } catch (error) {
      manejarError(error, 'comparar estadísticas');
      return {
        diferencia: 0,
        porcentajeCambio: 0,
        metricas: []
      };
    }
  }, [calculateGrowthRate, manejarError]);

  // ==================== FILTROS Y AGRUPACIONES ====================

  const getStatsByRole = useCallback(async (rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => {
    try {
      const response = await fetch(`/api/usuarios/stats?period=${state.period}&filter=rol:${rol}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      manejarError(error, `cargar estadísticas por rol ${rol}`);
      return null;
    }
  }, [state.period, manejarError]);

  const getStatsByStatus = useCallback(async (estatus: 'activo' | 'suspendido') => {
    try {
      const response = await fetch(`/api/usuarios/stats?period=${state.period}&filter=estatus:${estatus}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      manejarError(error, `cargar estadísticas por estatus ${estatus}`);
      return null;
    }
  }, [state.period, manejarError]);

  const getStatsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`/api/usuarios/stats?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      manejarError(error, 'cargar estadísticas por rango de fechas');
      return null;
    }
  }, [manejarError]);

  // ==================== EXPORTACIÓN Y REPORTES ====================

  const exportStats = useCallback(async (format: 'json' | 'csv' | 'excel'): Promise<string> => {
    const stats = state.stats;
    if (!stats) return '';

    switch (format) {
      case 'json':
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          period: state.period,
          stats,
          metrics: state.metrics,
          trends: state.trends
        }, null, 2);

      case 'csv':
        const csvData = [
          ['Métrica', 'Valor'],
          ['Total Usuarios', stats.totalUsuarios.toString()],
          ['Usuarios Activos', stats.usuariosActivos.toString()],
          ['Usuarios Suspendidos', stats.usuariosSuspendidos.toString()],
          ['% Activos', stats.porcentajeActivos.toFixed(2) + '%'],
          ['Nuevos Hoy', stats.usuariosNuevos.hoy.toString()],
          ['Nuevos Semana', stats.usuariosNuevos.semana.toString()],
          ['Nuevos Mes', stats.usuariosNuevos.mes.toString()],
          ['SUPER', stats.distribuccionPorRol.SUPER.toString()],
          ['ADMIN', stats.distribuccionPorRol.ADMIN.toString()],
          ['AUDITOR', stats.distribuccionPorRol.AUDITOR.toString()],
          ['OPERADOR', stats.distribuccionPorRol.OPERADOR.toString()]
        ];
        return csvData.map(row => row.join(',')).join('\n');

      default:
        return JSON.stringify(stats, null, 2);
    }
  }, [state.stats, state.period, state.metrics, state.trends]);

  const generateReport = useCallback(async (includeCharts: boolean = false): Promise<string> => {
    const stats = state.stats;
    if (!stats) return 'No hay datos disponibles';

    let report = `Reporte de Estadísticas de Usuarios\n`;
    report += `===================================\n\n`;
    report += `Período: ${state.period}\n`;
    report += `Generado: ${new Date().toLocaleString()}\n\n`;
    
    report += `RESUMEN GENERAL:\n`;
    report += `- Total de usuarios: ${stats.totalUsuarios}\n`;
    report += `- Usuarios activos: ${stats.usuariosActivos} (${stats.porcentajeActivos.toFixed(1)}%)\n`;
    report += `- Usuarios suspendidos: ${stats.usuariosSuspendidos}\n\n`;
    
    report += `NUEVOS USUARIOS:\n`;
    report += `- Hoy: ${stats.usuariosNuevos.hoy}\n`;
    report += `- Esta semana: ${stats.usuariosNuevos.semana}\n`;
    report += `- Este mes: ${stats.usuariosNuevos.mes}\n\n`;
    
    report += `DISTRIBUCIÓN POR ROL:\n`;
    Object.entries(stats.distribuccionPorRol).forEach(([rol, cantidad]) => {
      const porcentaje = stats.totalUsuarios > 0 ? (cantidad / stats.totalUsuarios * 100).toFixed(1) : '0';
      report += `- ${rol}: ${cantidad} (${porcentaje}%)\n`;
    });
    
    report += `\nACTIVIDAD RECIENTE:\n`;
    report += `- Último día: ${stats.actividadReciente.ultimoDia} usuarios\n`;
    report += `- Última semana: ${stats.actividadReciente.ultimaSemana} usuarios\n`;
    report += `- Último mes: ${stats.actividadReciente.ultimoMes} usuarios\n`;
    
    if (includeCharts && state.trends.length > 0) {
      report += `\nTENDENCIAS (últimos 30 días):\n`;
      const analisisTendencia = getTrendAnalysis('registros');
      report += `- Tendencia: ${analisisTendencia.tendencia}\n`;
      report += `- Cambio: ${analisisTendencia.cambioPercentual.toFixed(1)}%\n`;
      report += `- Predicción: ${analisisTendencia.prediccion.toFixed(0)} registros\n`;
    }
    
    return report;
  }, [state.stats, state.period, state.trends, getTrendAnalysis]);

  // ==================== CONFIGURACIÓN ====================

  const setPeriod = useCallback((period: '24h' | '7d' | '30d' | '90d' | '1y') => {
    setState(prev => ({ ...prev, period }));
  }, []);

  const toggleMetric = useCallback((metric: string) => {
    setState(prev => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metric)
        ? prev.selectedMetrics.filter(m => m !== metric)
        : [...prev.selectedMetrics, metric]
    }));
  }, []);

  const toggleRealTime = useCallback(() => {
    setState(prev => ({ ...prev, realTimeData: !prev.realTimeData }));
  }, []);

  // ==================== UTILIDADES ====================

  const refreshAllStats = useCallback(async () => {
    await Promise.all([
      loadStats(),
      loadMetrics(),
      enableAnalytics ? loadAnalytics() : Promise.resolve(),
      loadTrends('registros')
    ]);
  }, [loadStats, loadMetrics, loadAnalytics, loadTrends, enableAnalytics]);

  const getTopMetrics = useCallback((limit: number = 5) => {
    const stats = state.stats;
    if (!stats) return [];

    const metrics = [
      { name: 'Total Usuarios', value: stats.totalUsuarios, change: 0 },
      { name: 'Usuarios Activos', value: stats.usuariosActivos, change: 0 },
      { name: 'Nuevos Este Mes', value: stats.usuariosNuevos.mes, change: 0 },
      { name: 'Actividad Reciente', value: stats.actividadReciente.ultimaSemana, change: 0 }
    ];

    return metrics.slice(0, limit);
  }, [state.stats]);

  const getAlertsFromStats = useCallback(() => {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const stats = state.stats;
    
    if (!stats) return alerts;

    // Alertas basadas en las estadísticas
    if (stats.porcentajeActivos < 80) {
      alerts.push({
        type: 'usuarios_inactivos',
        message: `Solo ${stats.porcentajeActivos.toFixed(1)}% de usuarios están activos`,
        severity: stats.porcentajeActivos < 60 ? 'high' : 'medium'
      });
    }

    if (stats.usuariosNuevos.mes === 0) {
      alerts.push({
        type: 'sin_registros',
        message: 'No ha habido nuevos registros este mes',
        severity: 'medium'
      });
    }

    if (stats.distribuccionPorRol.SUPER > stats.totalUsuarios * 0.1) {
      alerts.push({
        type: 'muchos_super_usuarios',
        message: 'Hay demasiados super usuarios (>10% del total)',
        severity: 'medium'
      });
    }

    return alerts;
  }, [state.stats]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoRefresh) {
      loadStats();
    }
  }, [autoRefresh, loadStats]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAllStats();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshAllStats]);

  // Recargar cuando cambie el período
  useEffect(() => {
    if (state.period !== defaultPeriod) {
      loadStats(state.period);
    }
  }, [state.period, defaultPeriod, loadStats]);

  // ==================== RETORNO ====================

  return {
    state,
    loadStats,
    loadMetrics,
    loadAnalytics,
    loadTrends,
    calculateStats,
    calculateGrowthRate,
    calculateRetentionRate,
    getTrendAnalysis,
    comparePeriodicStats,
    getStatsByRole,
    getStatsByStatus,
    getStatsByDateRange,
    exportStats,
    generateReport,
    setPeriod,
    toggleMetric,
    toggleRealTime,
    refreshAllStats,
    getTopMetrics,
    getAlertsFromStats
  };
}
