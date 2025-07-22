// ==================== HOOKS PRINCIPALES ====================
export { useDashboardData } from './useDashboardData';
export { useDashboardMetrics } from './useDashboardMetrics';
export { useDashboardCharts } from './useDashboardCharts';
export { useDashboardAlerts } from './useDashboardAlerts';
export { useDashboardFilters } from './useDashboardFilters';

// ==================== TIPOS Y INTERFACES ====================

// Dashboard Data
export type {
  DashboardData,
  DashboardPeriod,
  UseDashboardDataState,
  UseDashboardDataOptions,
  UseDashboardDataReturn
} from './useDashboardData';

// Dashboard Metrics
export type {
  DashboardMetric,
  MetricCategory,
  KPI,
  UseDashboardMetricsState,
  UseDashboardMetricsOptions,
  UseDashboardMetricsReturn
} from './useDashboardMetrics';

// Dashboard Charts
export type {
  ChartDataPoint,
  ChartSeries,
  ChartConfig,
  UseDashboardChartsState,
  UseDashboardChartsOptions,
  UseDashboardChartsReturn
} from './useDashboardCharts';

// Dashboard Alerts
export type {
  DashboardAlert,
  AlertRule,
  AlertStatistics,
  UseDashboardAlertsState,
  UseDashboardAlertsOptions,
  UseDashboardAlertsReturn
} from './useDashboardAlerts';

// Dashboard Filters
export type {
  DashboardFilter,
  FilterPreset,
  UseDashboardFiltersState,
  UseDashboardFiltersOptions,
  UseDashboardFiltersReturn
} from './useDashboardFilters';

// ==================== HOOK COMPUESTO ====================

import { useDashboardData } from './useDashboardData';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useDashboardCharts } from './useDashboardCharts';
import { useDashboardAlerts } from './useDashboardAlerts';
import { useDashboardFilters } from './useDashboardFilters';
import type { 
  DashboardData, 
  UseDashboardDataOptions 
} from './useDashboardData';
import type { 
  UseDashboardMetricsOptions 
} from './useDashboardMetrics';
import type { 
  UseDashboardChartsOptions 
} from './useDashboardCharts';
import type { 
  UseDashboardAlertsOptions 
} from './useDashboardAlerts';
import type { 
  UseDashboardFiltersOptions 
} from './useDashboardFilters';

export interface UseDashboardOptions {
  // Opciones para cada hook
  dataOptions?: UseDashboardDataOptions;
  metricsOptions?: UseDashboardMetricsOptions;
  chartsOptions?: UseDashboardChartsOptions;
  alertsOptions?: UseDashboardAlertsOptions;
  filtersOptions?: UseDashboardFiltersOptions;
  
  // Configuración global
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  
  // Callbacks globales
  onDataChange?: (data: DashboardData) => void;
  onError?: (error: string, source: string) => void;
}

export interface UseDashboardReturn {
  // Estados de cada hook
  data: ReturnType<typeof useDashboardData>;
  metrics: ReturnType<typeof useDashboardMetrics>;
  charts: ReturnType<typeof useDashboardCharts>;
  alerts: ReturnType<typeof useDashboardAlerts>;
  filters: ReturnType<typeof useDashboardFilters>;
  
  // Estado global
  isLoading: boolean;
  hasErrors: boolean;
  lastUpdate: Date | null;
  
  // Acciones globales
  refreshAll: () => Promise<void>;
  resetAll: () => void;
  exportDashboard: (format: 'json' | 'csv' | 'pdf') => Promise<string>;
}

/**
 * Hook compuesto que integra todos los hooks del dashboard
 * Proporciona una interfaz unificada para gestionar el estado completo del dashboard
 */
export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const {
    dataOptions = {},
    metricsOptions = {},
    chartsOptions = {},
    alertsOptions = {},
    filtersOptions = {},
    autoRefresh = true,
    refreshInterval = 30000,
    onDataChange,
    onError
  } = options;

  // ==================== HOOKS INDIVIDUALES ====================

  const data = useDashboardData({
    autoLoad: autoRefresh,
    refreshInterval,
    onDataUpdate: onDataChange,
    onError: (error) => onError?.(error, 'data'),
    ...dataOptions
  });

  const metrics = useDashboardMetrics({
    dashboardData: data.state.data,
    autoCalculate: autoRefresh,
    refreshInterval,
    ...metricsOptions
  });

  const charts = useDashboardCharts({
    dashboardData: data.state.data,
    autoGenerate: autoRefresh,
    refreshInterval,
    ...chartsOptions
  });

  const alerts = useDashboardAlerts({
    dashboardData: data.state.data,
    autoCheck: autoRefresh,
    checkInterval: Math.min(refreshInterval, 30000), // Máximo 30s para alertas
    onNewAlert: (alert) => {
      if (alert.severity === 'critical') {
        onError?.(alert.message, 'alerts');
      }
    },
    ...alertsOptions
  });

  const filters = useDashboardFilters({
    autoApply: true,
    onFiltersChange: (filterValues) => {
      // Aplicar filtros a los datos cuando cambien
      // TODO: Implementar lógica de filtrado
      console.log('Filtros aplicados:', filterValues);
    },
    onPeriodChange: (period) => {
      // Actualizar período en otros hooks
      data.loadDataForPeriod(period);
    },
    ...filtersOptions
  });

  // ==================== ESTADO GLOBAL ====================

  const isLoading = data.state.loading || 
                   metrics.state.loading || 
                   charts.state.loading || 
                   alerts.state.loading;

  const hasErrors = !!(data.state.error || 
                      metrics.state.error || 
                      charts.state.error || 
                      alerts.state.error);

  const lastUpdate = [
    data.state.lastUpdate,
    metrics.state.lastCalculated,
    charts.state.lastGenerated,
    alerts.state.lastCheck
  ]
    .filter(date => date !== null)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null;

  // ==================== ACCIONES GLOBALES ====================

  const refreshAll = async (): Promise<void> => {
    try {
      await Promise.all([
        data.refreshData(),
        metrics.refreshMetrics(),
        charts.refreshCharts(),
        alerts.checkAlerts()
      ]);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Error al actualizar dashboard',
        'global'
      );
    }
  };

  const resetAll = (): void => {
    // Reset de filtros
    filters.resetFilters();
    
    // Limpiar alertas
    alerts.clearAllAlerts();
    
    // TODO: Implementar reset completo de otros hooks si es necesario
  };

  const exportDashboard = async (format: 'json' | 'csv' | 'pdf'): Promise<string> => {
    const dashboardExport = {
      timestamp: new Date().toISOString(),
      data: data.state.data,
      metrics: metrics.state.metrics,
      alerts: alerts.state.alerts.filter(alert => !alert.isResolved),
      filters: filters.state.activeFilters,
      period: filters.state.period,
      statistics: {
        totalMetrics: metrics.state.metrics.length,
        totalAlerts: alerts.state.statistics.total,
        unreadAlerts: alerts.state.statistics.unread,
        criticalAlerts: alerts.state.statistics.critical
      }
    };

    switch (format) {
      case 'json':
        return JSON.stringify(dashboardExport, null, 2);
      
      case 'csv':
        // Simplificado para CSV - solo métricas principales
        const csvData = [
          ['Métrica', 'Valor', 'Estado', 'Tendencia'],
          ...metrics.state.metrics.map(metric => [
            metric.title,
            metrics.formatMetricValue(metric),
            metric.status,
            metric.trend
          ])
        ];
        return csvData.map(row => row.join(',')).join('\n');
      
      case 'pdf':
        // TODO: Implementar exportación a PDF
        return JSON.stringify(dashboardExport, null, 2);
      
      default:
        throw new Error(`Formato de exportación no soportado: ${format}`);
    }
  };

  // ==================== RETORNO ====================

  return {
    data,
    metrics,
    charts,
    alerts,
    filters,
    isLoading,
    hasErrors,
    lastUpdate,
    refreshAll,
    resetAll,
    exportDashboard
  };
}
