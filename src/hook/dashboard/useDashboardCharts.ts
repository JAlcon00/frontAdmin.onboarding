import { useState, useCallback, useEffect } from 'react';
import type { DashboardData } from './useDashboardData';

// ==================== INTERFACES ====================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut' | 'mixed';
  series: ChartSeries[];
  options?: {
    responsive?: boolean;
    legend?: boolean;
    tooltip?: boolean;
    zoom?: boolean;
    export?: boolean;
    animation?: boolean;
    grid?: boolean;
    axes?: {
      x?: { title?: string; format?: string };
      y?: { title?: string; format?: string };
    };
  };
  size?: 'small' | 'medium' | 'large' | 'full';
  priority?: 'high' | 'medium' | 'low';
}

export interface UseDashboardChartsState {
  charts: ChartConfig[];
  loading: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

export interface UseDashboardChartsOptions {
  dashboardData?: DashboardData;
  autoGenerate?: boolean;
  refreshInterval?: number;
  chartTypes?: ChartConfig['type'][];
  includeRealTime?: boolean;
  customCharts?: ChartConfig[];
  onChartsUpdate?: (charts: ChartConfig[]) => void;
}

export interface UseDashboardChartsReturn {
  // Estado
  state: UseDashboardChartsState;
  
  // Acciones de generación
  generateCharts: () => Promise<void>;
  generateChart: (type: ChartConfig['type'], data: DashboardData) => ChartConfig;
  refreshCharts: () => Promise<void>;
  
  // Obtener gráficos
  getAllCharts: () => ChartConfig[];
  getChartById: (id: string) => ChartConfig | undefined;
  getChartsByType: (type: ChartConfig['type']) => ChartConfig[];
  getChartsForDashboard: () => ChartConfig[];
  
  // Manipulación de datos
  prepareLineChartData: (data: any[], xField: string, yField: string) => ChartDataPoint[];
  preparePieChartData: (data: Record<string, number>) => ChartDataPoint[];
  prepareBarChartData: (data: any[], xField: string, yField: string) => ChartDataPoint[];
  
  // Configuración
  updateChartConfig: (chartId: string, config: Partial<ChartConfig>) => void;
  addCustomChart: (chart: ChartConfig) => void;
  removeChart: (chartId: string) => void;
  
  // Exportar
  exportChart: (chartId: string, format: 'png' | 'svg' | 'pdf') => Promise<string>;
  exportAllCharts: (format: 'png' | 'svg' | 'pdf') => Promise<string[]>;
}

// ==================== CONSTANTES ====================

const DEFAULT_CHART_OPTIONS: ChartConfig['options'] = {
  responsive: true,
  legend: true,
  tooltip: true,
  zoom: false,
  export: true,
  animation: true,
  grid: true
};

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

// ==================== UTILIDADES ====================

function generateChartId(type: string, suffix: string): string {
  return `chart_${type}_${suffix}`;
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardCharts(options: UseDashboardChartsOptions = {}): UseDashboardChartsReturn {
  const {
    dashboardData,
    autoGenerate = true,
    refreshInterval,
    chartTypes = ['line', 'bar', 'pie', 'doughnut'],
    customCharts = [],
    onChartsUpdate
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDashboardChartsState>({
    charts: [],
    loading: false,
    error: null,
    lastGenerated: null
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

  // ==================== PREPARACIÓN DE DATOS ====================

  const prepareLineChartData = useCallback((data: any[], xField: string, yField: string): ChartDataPoint[] => {
    return data.map(item => ({
      x: item[xField],
      y: typeof item[yField] === 'number' ? item[yField] : 0,
      label: item[xField]?.toString()
    }));
  }, []);

  const preparePieChartData = useCallback((data: Record<string, number>): ChartDataPoint[] => {
    return Object.entries(data).map(([key, value], index) => ({
      x: key,
      y: value,
      label: key,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, []);

  const prepareBarChartData = useCallback((data: any[], xField: string, yField: string): ChartDataPoint[] => {
    return data.map((item, index) => ({
      x: item[xField],
      y: typeof item[yField] === 'number' ? item[yField] : 0,
      label: item[xField]?.toString(),
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, []);

  // ==================== GENERACIÓN DE GRÁFICOS ====================

  const generateChart = useCallback((type: ChartConfig['type'], data: DashboardData): ChartConfig => {
    switch (type) {
      case 'pie':
        // Gráfico de distribución de estatus de solicitudes
        return {
          id: generateChartId('pie', 'solicitudes_estatus'),
          title: 'Distribución de Solicitudes por Estatus',
          type: 'pie',
          series: [{
            id: 'solicitudes_estatus',
            name: 'Solicitudes',
            data: preparePieChartData({
              'Pendientes': data.solicitudes.pendientes,
              'Aprobadas': data.solicitudes.aprobadas,
              'Rechazadas': data.solicitudes.rechazadas
            })
          }],
          options: {
            ...DEFAULT_CHART_OPTIONS,
            legend: true
          },
          size: 'medium',
          priority: 'high'
        };

      case 'doughnut':
        // Gráfico de distribución de documentos
        return {
          id: generateChartId('doughnut', 'documentos_estatus'),
          title: 'Estado de Documentos',
          type: 'doughnut',
          series: [{
            id: 'documentos_estatus',
            name: 'Documentos',
            data: preparePieChartData({
              'Pendientes': data.documentos.pendientes,
              'Aprobados': data.documentos.aprobados,
              'Rechazados': data.documentos.rechazados
            })
          }],
          options: {
            ...DEFAULT_CHART_OPTIONS,
            legend: true
          },
          size: 'medium',
          priority: 'high'
        };

      case 'bar':
        // Gráfico de barras de métricas generales
        return {
          id: generateChartId('bar', 'metricas_generales'),
          title: 'Métricas Generales',
          type: 'bar',
          series: [{
            id: 'metricas',
            name: 'Cantidad',
            data: prepareBarChartData([
              { categoria: 'Clientes', valor: data.clientes.total },
              { categoria: 'Documentos', valor: data.documentos.total },
              { categoria: 'Solicitudes', valor: data.solicitudes.total }
            ], 'categoria', 'valor')
          }],
          options: {
            ...DEFAULT_CHART_OPTIONS,
            axes: {
              x: { title: 'Categoría' },
              y: { title: 'Cantidad', format: 'number' }
            }
          },
          size: 'large',
          priority: 'high'
        };

      case 'line':
        // Gráfico de línea de tendencias (datos mock por ahora)
        const today = new Date();
        const weekDataLine = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          weekDataLine.push({
            fecha: date.toLocaleDateString('es-ES', { weekday: 'short' }),
            solicitudes: Math.floor(Math.random() * 20) + 5,
            documentos: Math.floor(Math.random() * 15) + 3
          });
        }

        return {
          id: generateChartId('line', 'tendencias_semanal'),
          title: 'Tendencias de la Semana',
          type: 'line',
          series: [
            {
              id: 'solicitudes_tendencia',
              name: 'Solicitudes',
              data: prepareLineChartData(weekDataLine, 'fecha', 'solicitudes'),
              color: CHART_COLORS[0]
            },
            {
              id: 'documentos_tendencia',
              name: 'Documentos',
              data: prepareLineChartData(weekDataLine, 'fecha', 'documentos'),
              color: CHART_COLORS[1]
            }
          ],
          options: {
            ...DEFAULT_CHART_OPTIONS,
            axes: {
              x: { title: 'Día' },
              y: { title: 'Cantidad', format: 'number' }
            }
          },
          size: 'large',
          priority: 'medium'
        };

      case 'area':
        // Gráfico de área para montos
        const todayArea = new Date();
        const weekDataArea = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(todayArea.getTime() - i * 24 * 60 * 60 * 1000);
          weekDataArea.push({
            fecha: date.toLocaleDateString('es-ES', { weekday: 'short' })
          });
        }
        
        return {
          id: generateChartId('area', 'montos_acumulados'),
          title: 'Montos Acumulados',
          type: 'area',
          series: [{
            id: 'montos',
            name: 'Monto Total',
            data: weekDataArea.map((item: any, index: number) => ({
              x: item.fecha,
              y: data.solicitudes.montoTotal * (0.8 + index * 0.05), // Mock progression
              label: item.fecha
            })),
            color: CHART_COLORS[2]
          }],
          options: {
            ...DEFAULT_CHART_OPTIONS,
            axes: {
              x: { title: 'Período' },
              y: { title: 'Monto', format: 'currency' }
            }
          },
          size: 'large',
          priority: 'medium'
        };

      default:
        throw new Error(`Tipo de gráfico no soportado: ${type}`);
    }
  }, [prepareLineChartData, preparePieChartData, prepareBarChartData]);

  const generateCharts = useCallback(async (): Promise<void> => {
    if (!dashboardData) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const charts: ChartConfig[] = [];

      // Generar gráficos según los tipos habilitados
      for (const type of chartTypes) {
        try {
          const chart = generateChart(type, dashboardData);
          charts.push(chart);
        } catch (error) {
          console.warn(`No se pudo generar gráfico de tipo ${type}:`, error);
        }
      }

      // Agregar gráficos personalizados
      charts.push(...customCharts);

      setState(prev => ({
        ...prev,
        charts,
        loading: false,
        lastGenerated: new Date()
      }));

      onChartsUpdate?.(charts);

    } catch (error) {
      handleError(error, 'generar gráficos');
    }
  }, [dashboardData, chartTypes, customCharts, generateChart, handleError, onChartsUpdate]);

  const refreshCharts = useCallback(async (): Promise<void> => {
    await generateCharts();
  }, [generateCharts]);

  // ==================== OBTENER GRÁFICOS ====================

  const getAllCharts = useCallback(() => state.charts, [state.charts]);

  const getChartById = useCallback((id: string) => {
    return state.charts.find(chart => chart.id === id);
  }, [state.charts]);

  const getChartsByType = useCallback((type: ChartConfig['type']) => {
    return state.charts.filter(chart => chart.type === type);
  }, [state.charts]);

  const getChartsForDashboard = useCallback(() => {
    return state.charts
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        return bPriority - aPriority;
      });
  }, [state.charts]);

  // ==================== CONFIGURACIÓN ====================

  const updateChartConfig = useCallback((chartId: string, config: Partial<ChartConfig>) => {
    setState(prev => ({
      ...prev,
      charts: prev.charts.map(chart => 
        chart.id === chartId ? { ...chart, ...config } : chart
      )
    }));
  }, []);

  const addCustomChart = useCallback((chart: ChartConfig) => {
    setState(prev => ({
      ...prev,
      charts: [...prev.charts, chart]
    }));
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setState(prev => ({
      ...prev,
      charts: prev.charts.filter(chart => chart.id !== chartId)
    }));
  }, []);

  // ==================== EXPORTAR ====================

  const exportChart = useCallback(async (chartId: string, format: 'png' | 'svg' | 'pdf'): Promise<string> => {
    // TODO: Implementar exportación real de gráficos
    // Por ahora retornamos un string mock
    return `data:${format};base64,mock_chart_data_${chartId}`;
  }, []);

  const exportAllCharts = useCallback(async (format: 'png' | 'svg' | 'pdf'): Promise<string[]> => {
    const exports = [];
    for (const chart of state.charts) {
      const exported = await exportChart(chart.id, format);
      exports.push(exported);
    }
    return exports;
  }, [state.charts, exportChart]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoGenerate && dashboardData) {
      generateCharts();
    }
  }, [autoGenerate, dashboardData, generateCharts]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refreshCharts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshCharts]);

  // ==================== RETORNO ====================

  return {
    state,
    generateCharts,
    generateChart,
    refreshCharts,
    getAllCharts,
    getChartById,
    getChartsByType,
    getChartsForDashboard,
    prepareLineChartData,
    preparePieChartData,
    prepareBarChartData,
    updateChartConfig,
    addCustomChart,
    removeChart,
    exportChart,
    exportAllCharts
  };
}
