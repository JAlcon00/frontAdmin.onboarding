import { useState, useCallback, useEffect } from 'react';
import type { DashboardData, DashboardPeriod } from './useDashboardData';

// ==================== INTERFACES ====================

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  format: 'number' | 'currency' | 'percentage' | 'time' | 'text';
  trend: 'up' | 'down' | 'stable';
  status: 'success' | 'warning' | 'error' | 'neutral';
  icon?: string;
  color?: string;
  description?: string;
}

export interface MetricCategory {
  id: string;
  title: string;
  metrics: DashboardMetric[];
  priority: 'high' | 'medium' | 'low';
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  achievement: number; // porcentaje del objetivo alcanzado
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'off-track';
  unit: string;
  description: string;
}

export interface UseDashboardMetricsState {
  metrics: DashboardMetric[];
  categories: MetricCategory[];
  kpis: KPI[];
  loading: boolean;
  error: string | null;
  lastCalculated: Date | null;
}

export interface UseDashboardMetricsOptions {
  dashboardData?: DashboardData;
  autoCalculate?: boolean;
  refreshInterval?: number;
  includeKPIs?: boolean;
  customMetrics?: DashboardMetric[];
  onMetricsUpdate?: (metrics: DashboardMetric[]) => void;
  onKPIAlert?: (kpi: KPI) => void;
}

export interface UseDashboardMetricsReturn {
  // Estado
  state: UseDashboardMetricsState;
  
  // Acciones de cálculo
  calculateMetrics: () => Promise<void>;
  calculateKPIs: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Obtener métricas
  getAllMetrics: () => DashboardMetric[];
  getMetricsByCategory: (categoryId: string) => DashboardMetric[];
  getMetricById: (id: string) => DashboardMetric | undefined;
  getTopMetrics: (count?: number) => DashboardMetric[];
  
  // Obtener KPIs
  getAllKPIs: () => KPI[];
  getKPIsAtRisk: () => KPI[];
  getKPIsOffTrack: () => KPI[];
  getKPIById: (id: string) => KPI | undefined;
  
  // Formateo y utilidades
  formatMetricValue: (metric: DashboardMetric) => string;
  getMetricTrendIcon: (trend: 'up' | 'down' | 'stable') => string;
  getMetricStatusColor: (status: string) => string;
  
  // Comparaciones
  compareMetrics: (period1: DashboardPeriod, period2: DashboardPeriod) => {
    improved: DashboardMetric[];
    declined: DashboardMetric[];
    stable: DashboardMetric[];
  };
  
  // Alertas
  getMetricAlerts: () => Array<{
    type: 'metric' | 'kpi';
    severity: 'high' | 'medium' | 'low';
    message: string;
    data: DashboardMetric | KPI;
  }>;
}

// ==================== CONSTANTES ====================

const METRIC_CATEGORIES: Omit<MetricCategory, 'metrics'>[] = [
  {
    id: 'clientes',
    title: 'Clientes',
    priority: 'high'
  },
  {
    id: 'documentos',
    title: 'Documentos',
    priority: 'high'
  },
  {
    id: 'solicitudes',
    title: 'Solicitudes',
    priority: 'high'
  },
  {
    id: 'actividad',
    title: 'Actividad',
    priority: 'medium'
  },
  {
    id: 'rendimiento',
    title: 'Rendimiento',
    priority: 'medium'
  }
];

const DEFAULT_KPIS: Omit<KPI, 'value' | 'achievement' | 'trend' | 'status'>[] = [
  {
    id: 'tasa_aprobacion_solicitudes',
    name: 'Tasa de Aprobación de Solicitudes',
    target: 75,
    unit: '%',
    description: 'Porcentaje de solicitudes aprobadas vs total de solicitudes procesadas'
  },
  {
    id: 'tiempo_procesamiento_documentos',
    name: 'Tiempo de Procesamiento de Documentos',
    target: 2,
    unit: 'días',
    description: 'Tiempo promedio para procesar documentos desde recepción hasta aprobación'
  },
  {
    id: 'completitud_clientes',
    name: 'Completitud de Datos de Clientes',
    target: 90,
    unit: '%',
    description: 'Porcentaje promedio de completitud de información de clientes'
  },
  {
    id: 'uptime_sistema',
    name: 'Disponibilidad del Sistema',
    target: 99.5,
    unit: '%',
    description: 'Porcentaje de tiempo que el sistema está disponible y funcionando'
  }
];

// ==================== UTILIDADES ====================

function calculateStatus(metric: DashboardMetric): 'success' | 'warning' | 'error' | 'neutral' {
  if (metric.changePercentage === undefined) return 'neutral';
  
  const absChange = Math.abs(metric.changePercentage);
  
  // Para métricas donde el crecimiento es bueno
  const positiveMetrics = ['total_clientes', 'clientes_activos', 'documentos_aprobados', 'solicitudes_aprobadas'];
  if (positiveMetrics.some(id => metric.id.includes(id))) {
    if (metric.changePercentage > 10) return 'success';
    if (metric.changePercentage < -10) return 'error';
    if (absChange > 5) return 'warning';
    return 'neutral';
  }
  
  // Para métricas donde el crecimiento puede ser malo
  const negativeMetrics = ['documentos_rechazados', 'solicitudes_rechazadas', 'errores'];
  if (negativeMetrics.some(id => metric.id.includes(id))) {
    if (metric.changePercentage > 20) return 'error';
    if (metric.changePercentage > 10) return 'warning';
    return 'neutral';
  }
  
  return 'neutral';
}

function formatValue(value: number | string, format: DashboardMetric['format']): string {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'time':
      if (value < 60) return `${value.toFixed(0)}s`;
      if (value < 3600) return `${(value / 60).toFixed(1)}min`;
      return `${(value / 3600).toFixed(1)}h`;
    
    case 'number':
    default:
      return new Intl.NumberFormat('es-MX').format(value);
  }
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardMetrics(options: UseDashboardMetricsOptions = {}): UseDashboardMetricsReturn {
  const {
    dashboardData,
    autoCalculate = true,
    refreshInterval,
    includeKPIs = true,
    customMetrics = [],
    onMetricsUpdate,
    onKPIAlert
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDashboardMetricsState>({
    metrics: [],
    categories: [],
    kpis: [],
    loading: false,
    error: null,
    lastCalculated: null
  });

  // ==================== UTILIDADES DE ERROR ====================

  const handleError = useCallback((error: any, operation: string) => {
    const errorMessage = error?.message || `Error en ${operation}`;
    setState(prev => ({ 
      ...prev, 
      error: errorMessage, 
      loading: false 
    }));
  }, []);

  // ==================== CÁLCULO DE MÉTRICAS ====================

  const calculateMetrics = useCallback(async (): Promise<void> => {
    if (!dashboardData) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const metrics: DashboardMetric[] = [
        // Métricas de clientes
        {
          id: 'total_clientes',
          title: 'Total Clientes',
          value: dashboardData.clientes.total,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'users',
          color: 'blue'
        },
        {
          id: 'clientes_nuevos',
          title: 'Clientes Nuevos',
          value: dashboardData.clientes.nuevos,
          format: 'number',
          trend: 'up',
          status: 'success',
          icon: 'user-plus',
          color: 'green'
        },
        {
          id: 'clientes_activos',
          title: 'Clientes Activos',
          value: dashboardData.clientes.activos,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'user-check',
          color: 'green'
        },
        {
          id: 'completitud_promedio',
          title: 'Completitud Promedio',
          value: dashboardData.clientes.completitudPromedio,
          format: 'percentage',
          trend: 'stable',
          status: 'neutral',
          icon: 'progress',
          color: 'orange'
        },
        
        // Métricas de documentos
        {
          id: 'total_documentos',
          title: 'Total Documentos',
          value: dashboardData.documentos.total,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'file-text',
          color: 'blue'
        },
        {
          id: 'documentos_pendientes',
          title: 'Documentos Pendientes',
          value: dashboardData.documentos.pendientes,
          format: 'number',
          trend: 'stable',
          status: 'warning',
          icon: 'clock',
          color: 'yellow'
        },
        {
          id: 'documentos_aprobados',
          title: 'Documentos Aprobados',
          value: dashboardData.documentos.aprobados,
          format: 'number',
          trend: 'up',
          status: 'success',
          icon: 'check-circle',
          color: 'green'
        },
        {
          id: 'documentos_procesados_hoy',
          title: 'Procesados Hoy',
          value: dashboardData.documentos.procesadosHoy,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'calendar',
          color: 'blue'
        },
        
        // Métricas de solicitudes
        {
          id: 'total_solicitudes',
          title: 'Total Solicitudes',
          value: dashboardData.solicitudes.total,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'file-check',
          color: 'blue'
        },
        {
          id: 'solicitudes_pendientes',
          title: 'Solicitudes Pendientes',
          value: dashboardData.solicitudes.pendientes,
          format: 'number',
          trend: 'stable',
          status: 'warning',
          icon: 'clock',
          color: 'yellow'
        },
        {
          id: 'solicitudes_aprobadas',
          title: 'Solicitudes Aprobadas',
          value: dashboardData.solicitudes.aprobadas,
          format: 'number',
          trend: 'up',
          status: 'success',
          icon: 'check-circle',
          color: 'green'
        },
        {
          id: 'monto_total_solicitudes',
          title: 'Monto Total',
          value: dashboardData.solicitudes.montoTotal,
          format: 'currency',
          trend: 'up',
          status: 'success',
          icon: 'dollar-sign',
          color: 'green'
        },
        
        // Métricas de actividad
        {
          id: 'usuarios_conectados',
          title: 'Usuarios Conectados',
          value: dashboardData.actividad.usuariosConectados,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'users',
          color: 'blue'
        },
        {
          id: 'sesiones_activas',
          title: 'Sesiones Activas',
          value: dashboardData.actividad.sesionesActivas,
          format: 'number',
          trend: 'stable',
          status: 'neutral',
          icon: 'activity',
          color: 'blue'
        },
        
        // Métricas de rendimiento
        {
          id: 'uptime',
          title: 'Disponibilidad',
          value: dashboardData.rendimiento.uptime,
          format: 'percentage',
          trend: 'stable',
          status: dashboardData.rendimiento.uptime > 99 ? 'success' : 'warning',
          icon: 'server',
          color: dashboardData.rendimiento.uptime > 99 ? 'green' : 'yellow'
        },
        {
          id: 'tiempo_respuesta',
          title: 'Tiempo de Respuesta',
          value: dashboardData.rendimiento.tiempoRespuestaPromedio,
          format: 'time',
          trend: 'stable',
          status: dashboardData.rendimiento.tiempoRespuestaPromedio < 200 ? 'success' : 'warning',
          icon: 'zap',
          color: dashboardData.rendimiento.tiempoRespuestaPromedio < 200 ? 'green' : 'yellow'
        }
      ];

      // Agregar métricas personalizadas
      const allMetrics = [...metrics, ...customMetrics];

      // Calcular estatus basado en cambios
      const processedMetrics = allMetrics.map(metric => ({
        ...metric,
        status: calculateStatus(metric)
      }));

      // Organizar en categorías
      const categories: MetricCategory[] = METRIC_CATEGORIES.map(cat => ({
        ...cat,
        metrics: processedMetrics.filter(metric => metric.id.startsWith(cat.id))
      }));

      setState(prev => ({
        ...prev,
        metrics: processedMetrics,
        categories,
        loading: false,
        lastCalculated: new Date()
      }));

      onMetricsUpdate?.(processedMetrics);

    } catch (error) {
      handleError(error, 'calcular métricas');
    }
  }, [dashboardData, customMetrics, handleError, onMetricsUpdate]);

  // ==================== CÁLCULO DE KPIS ====================

  const calculateKPIs = useCallback(async (): Promise<void> => {
    if (!dashboardData || !includeKPIs) return;

    try {
      const kpis: KPI[] = DEFAULT_KPIS.map(kpiTemplate => {
        let value = 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';

        switch (kpiTemplate.id) {
          case 'tasa_aprobacion_solicitudes':
            value = dashboardData.solicitudes.total > 0 
              ? (dashboardData.solicitudes.aprobadas / dashboardData.solicitudes.total) * 100
              : 0;
            break;
          
          case 'completitud_clientes':
            value = dashboardData.clientes.completitudPromedio;
            break;
          
          case 'uptime_sistema':
            value = dashboardData.rendimiento.uptime;
            break;
          
          case 'tiempo_procesamiento_documentos':
            // Mock data - en producción vendría del backend
            value = 1.5;
            break;
        }

        const achievement = (value / kpiTemplate.target) * 100;
        let status: KPI['status'] = 'on-track';
        
        if (achievement < 70) status = 'off-track';
        else if (achievement < 90) status = 'at-risk';

        // Alertar KPIs en riesgo
        if (status !== 'on-track') {
          const kpi = { ...kpiTemplate, value, achievement, trend, status };
          onKPIAlert?.(kpi);
        }

        return {
          ...kpiTemplate,
          value,
          achievement,
          trend,
          status
        };
      });

      setState(prev => ({
        ...prev,
        kpis
      }));

    } catch (error) {
      handleError(error, 'calcular KPIs');
    }
  }, [dashboardData, includeKPIs, handleError, onKPIAlert]);

  const refreshMetrics = useCallback(async (): Promise<void> => {
    await Promise.all([
      calculateMetrics(),
      calculateKPIs()
    ]);
  }, [calculateMetrics, calculateKPIs]);

  // ==================== OBTENER MÉTRICAS ====================

  const getAllMetrics = useCallback(() => state.metrics, [state.metrics]);

  const getMetricsByCategory = useCallback((categoryId: string) => {
    return state.metrics.filter(metric => metric.id.startsWith(categoryId));
  }, [state.metrics]);

  const getMetricById = useCallback((id: string) => {
    return state.metrics.find(metric => metric.id === id);
  }, [state.metrics]);

  const getTopMetrics = useCallback((count = 6) => {
    return state.metrics
      .sort(() => 0) // Simplificado por ahora
      .slice(0, count);
  }, [state.metrics]);

  // ==================== OBTENER KPIS ====================

  const getAllKPIs = useCallback(() => state.kpis, [state.kpis]);

  const getKPIsAtRisk = useCallback(() => {
    return state.kpis.filter(kpi => kpi.status === 'at-risk');
  }, [state.kpis]);

  const getKPIsOffTrack = useCallback(() => {
    return state.kpis.filter(kpi => kpi.status === 'off-track');
  }, [state.kpis]);

  const getKPIById = useCallback((id: string) => {
    return state.kpis.find(kpi => kpi.id === id);
  }, [state.kpis]);

  // ==================== FORMATEO Y UTILIDADES ====================

  const formatMetricValue = useCallback((metric: DashboardMetric): string => {
    return formatValue(metric.value, metric.format);
  }, []);

  const getMetricTrendIcon = useCallback((trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
    }
  }, []);

  const getMetricStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'neutral':
      default: return '#6B7280';
    }
  }, []);

  // ==================== COMPARACIONES ====================

  const compareMetrics = useCallback((_period1: DashboardPeriod, _period2: DashboardPeriod) => {
    // TODO: Implementar comparación real entre períodos
    return {
      improved: state.metrics.filter(m => m.trend === 'up'),
      declined: state.metrics.filter(m => m.trend === 'down'),
      stable: state.metrics.filter(m => m.trend === 'stable')
    };
  }, [state.metrics]);

  // ==================== ALERTAS ====================

  const getMetricAlerts = useCallback(() => {
    const alerts: Array<{
      type: 'metric' | 'kpi';
      severity: 'high' | 'medium' | 'low';
      message: string;
      data: DashboardMetric | KPI;
    }> = [];

    // Alertas de métricas
    state.metrics.forEach(metric => {
      if (metric.status === 'error') {
        alerts.push({
          type: 'metric',
          severity: 'high',
          message: `${metric.title} requiere atención inmediata`,
          data: metric
        });
      } else if (metric.status === 'warning') {
        alerts.push({
          type: 'metric',
          severity: 'medium',
          message: `${metric.title} muestra señales de alerta`,
          data: metric
        });
      }
    });

    // Alertas de KPIs
    state.kpis.forEach(kpi => {
      if (kpi.status === 'off-track') {
        alerts.push({
          type: 'kpi',
          severity: 'high',
          message: `KPI ${kpi.name} está fuera de objetivo`,
          data: kpi
        });
      } else if (kpi.status === 'at-risk') {
        alerts.push({
          type: 'kpi',
          severity: 'medium',
          message: `KPI ${kpi.name} está en riesgo`,
          data: kpi
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [state.metrics, state.kpis]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoCalculate && dashboardData) {
      calculateMetrics();
      if (includeKPIs) {
        calculateKPIs();
      }
    }
  }, [autoCalculate, dashboardData, calculateMetrics, calculateKPIs, includeKPIs]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshMetrics]);

  // ==================== RETORNO ====================

  return {
    state,
    calculateMetrics,
    calculateKPIs,
    refreshMetrics,
    getAllMetrics,
    getMetricsByCategory,
    getMetricById,
    getTopMetrics,
    getAllKPIs,
    getKPIsAtRisk,
    getKPIsOffTrack,
    getKPIById,
    formatMetricValue,
    getMetricTrendIcon,
    getMetricStatusColor,
    compareMetrics,
    getMetricAlerts
  };
}
