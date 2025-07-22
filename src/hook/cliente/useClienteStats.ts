import { useState, useCallback, useEffect, useMemo } from 'react';
import { clienteService } from '../../services/cliente.service';
import type { 
  Cliente, 
  ClienteEstadisticas, 
  TipoPersona 
} from '../../types';

// ==================== INTERFACES ====================

export interface ClienteMetrica {
  label: string;
  valor: number;
  cambio?: number;
  porcentajeCambio?: number;
  tendencia?: 'subiendo' | 'bajando' | 'estable';
  formato?: 'numero' | 'porcentaje' | 'moneda';
}

export interface ClienteDistribucion {
  categoria: string;
  valor: number;
  porcentaje: number;
  color?: string;
}

export interface ClienteTendencia {
  periodo: string;
  valor: number;
  fecha: Date;
}

export interface UseClienteStatsState {
  estadisticas: ClienteEstadisticas | null;
  metricas: ClienteMetrica[];
  distribuciones: {
    porTipo: ClienteDistribucion[];
    porEstado: ClienteDistribucion[];
    porMes: ClienteDistribucion[];
  };
  tendencias: {
    registros: ClienteTendencia[];
    completitud: ClienteTendencia[];
    onboarding: ClienteTendencia[];
  };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseClienteStatsOptions {
  clientes?: Cliente[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeHistorical?: boolean;
  onStatsChange?: (stats: ClienteEstadisticas) => void;
}

export interface UseClienteStatsReturn {
  // Estado
  state: UseClienteStatsState;
  
  // Acciones
  refreshStats: () => Promise<void>;
  calculateLocalStats: (clientes: Cliente[]) => void;
  
  // Utilidades de análisis
  analytics: {
    getTrendencia: (metrica: string) => 'subiendo' | 'bajando' | 'estable';
    getTopEstados: (limit?: number) => ClienteDistribucion[];
    getMetricaPorPeriodo: (metrica: string, periodo: 'dia' | 'semana' | 'mes') => number;
    compararPeriodos: (metrica: string, periodoActual: Date, periodoAnterior: Date) => number;
  };
  
  // Exportación de datos
  export: {
    toCSV: () => string;
    toJSON: () => string;
    getResumen: () => Record<string, any>;
  };
  
  // Predicciones simples
  predicciones: {
    clientesProximoMes: number;
    tendenciaCompletitud: 'mejorando' | 'empeorando' | 'estable';
    recomendaciones: string[];
  };
}

// ==================== CONSTANTES ====================

const COLORES_TIPOS: Record<TipoPersona, string> = {
  PF: '#3B82F6',
  PF_AE: '#10B981',
  PM: '#F59E0B'
};

const METRICAS_INICIALES: ClienteMetrica[] = [
  { label: 'Total Clientes', valor: 0, formato: 'numero' },
  { label: 'Completitud Promedio', valor: 0, formato: 'porcentaje' },
  { label: 'Nuevos este mes', valor: 0, formato: 'numero' },
  { label: 'Onboarding Completados', valor: 0, formato: 'numero' }
];

// ==================== HOOK PRINCIPAL ====================

export function useClienteStats(options: UseClienteStatsOptions = {}): UseClienteStatsReturn {
  const {
    clientes = [],
    autoRefresh = false,
    refreshInterval = 60000,
    includeHistorical: _includeHistorical = true,
    onStatsChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseClienteStatsState>({
    estadisticas: null,
    metricas: METRICAS_INICIALES,
    distribuciones: {
      porTipo: [],
      porEstado: [],
      porMes: []
    },
    tendencias: {
      registros: [],
      completitud: [],
      onboarding: []
    },
    loading: false,
    error: null,
    lastUpdated: null
  });

  // ==================== ACCIONES ====================

  const refreshStats = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const estadisticasServicio = await clienteService.getEstadisticas();
      
      // Mapear estadísticas del servicio al tipo esperado
      const estadisticas: ClienteEstadisticas = {
        total_clientes: estadisticasServicio.total || 0,
        clientes_activos: estadisticasServicio.total || 0,
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
      
      setState(prev => ({ 
        ...prev, 
        estadisticas,
        loading: false,
        lastUpdated: new Date()
      }));

      onStatsChange?.(estadisticas);

    } catch (error: any) {
      const errorMessage = error?.message || 'Error al cargar estadísticas';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false 
      }));
    }
  }, [onStatsChange]);

  const calculateLocalStats = useCallback((clientesData: Cliente[]): void => {
    // Calcular estadísticas locales basadas en los clientes proporcionados
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    const total = clientesData.length;
    const nuevosEsteMes = clientesData.filter(c => 
      new Date(c.created_at) >= inicioMes
    ).length;

    // Distribución por tipo
    const tiposPersona: TipoPersona[] = ['PF', 'PF_AE', 'PM'];
    const distribuccionTipo = tiposPersona.map(tipo => {
      const count = clientesData.filter(c => c.tipo_persona === tipo).length;
      return {
        categoria: tipo,
        valor: count,
        porcentaje: total > 0 ? Math.round((count / total) * 100) : 0,
        color: COLORES_TIPOS[tipo]
      };
    }).filter(d => d.valor > 0);

    // Distribución por estado
    const estadosUnicos = [...new Set(clientesData.map(c => c.estado).filter(Boolean))];
    const distribuccionEstado = estadosUnicos.map(estado => {
      const count = clientesData.filter(c => c.estado === estado).length;
      return {
        categoria: estado || 'Sin estado',
        valor: count,
        porcentaje: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });

    // Distribución por mes (últimos 6 meses)
    const distribuccionMes: ClienteDistribucion[] = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const fechaSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
      
      const count = clientesData.filter(c => {
        const fechaCreacion = new Date(c.created_at);
        return fechaCreacion >= fecha && fechaCreacion < fechaSiguiente;
      }).length;

      distribuccionMes.push({
        categoria: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        valor: count,
        porcentaje: total > 0 ? Math.round((count / total) * 100) : 0
      });
    }

    // Actualizar métricas
    const nuevasMetricas: ClienteMetrica[] = [
      { 
        label: 'Total Clientes', 
        valor: total, 
        formato: 'numero' 
      },
      { 
        label: 'Completitud Promedio', 
        valor: 75, // TODO: Calcular cuando tengamos completitud
        formato: 'porcentaje' 
      },
      { 
        label: 'Nuevos este mes', 
        valor: nuevosEsteMes, 
        formato: 'numero' 
      },
      { 
        label: 'Con Solicitudes', 
        valor: clientesData.filter(c => c.solicitudes && c.solicitudes.length > 0).length, 
        formato: 'numero' 
      }
    ];

    setState(prev => ({
      ...prev,
      metricas: nuevasMetricas,
      distribuciones: {
        porTipo: distribuccionTipo,
        porEstado: distribuccionEstado,
        porMes: distribuccionMes
      },
      lastUpdated: new Date()
    }));
  }, []);

  // ==================== UTILIDADES DE ANÁLISIS ====================

  const analytics = useMemo(() => ({
    getTrendencia: (_metrica: string): 'subiendo' | 'bajando' | 'estable' => {
      // Simplificado - en una implementación real analizaríamos datos históricos
      const random = Math.random();
      return random > 0.6 ? 'subiendo' : random > 0.3 ? 'estable' : 'bajando';
    },

    getTopEstados: (limit: number = 5): ClienteDistribucion[] => {
      return state.distribuciones.porEstado
        .sort((a, b) => b.valor - a.valor)
        .slice(0, limit);
    },

    getMetricaPorPeriodo: (_metrica: string, _periodo: 'dia' | 'semana' | 'mes'): number => {
      // Simplificado - retornar datos mock
      return Math.floor(Math.random() * 100);
    },

    compararPeriodos: (_metrica: string, _periodoActual: Date, _periodoAnterior: Date): number => {
      // Simplificado - calcular diferencia porcentual mock
      return Math.floor(Math.random() * 20) - 10;
    }
  }), [state.distribuciones]);

  // ==================== EXPORTACIÓN ====================

  const exportFunctions = useMemo(() => ({
    toCSV: (): string => {
      const headers = ['Métrica', 'Valor', 'Cambio'];
      const rows = state.metricas.map(m => [
        m.label,
        m.valor.toString(),
        m.cambio?.toString() || '0'
      ]);
      
      return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    },

    toJSON: (): string => {
      return JSON.stringify({
        metricas: state.metricas,
        distribuciones: state.distribuciones,
        lastUpdated: state.lastUpdated
      }, null, 2);
    },

    getResumen: (): Record<string, any> => {
      return {
        totalClientes: state.metricas.find(m => m.label === 'Total Clientes')?.valor || 0,
        completitudPromedio: state.metricas.find(m => m.label === 'Completitud Promedio')?.valor || 0,
        nuevosEsteMes: state.metricas.find(m => m.label === 'Nuevos este mes')?.valor || 0,
        distribuccionTipo: state.distribuciones.porTipo,
        ultimaActualizacion: state.lastUpdated
      };
    }
  }), [state]);

  // ==================== PREDICCIONES ====================

  const predicciones = useMemo(() => {
    const nuevosEsteMes = state.metricas.find(m => m.label === 'Nuevos este mes')?.valor || 0;
    const completitudPromedio = state.metricas.find(m => m.label === 'Completitud Promedio')?.valor || 0;

    const clientesProximoMes = Math.round(nuevosEsteMes * 1.1); // 10% de crecimiento estimado

    const tendenciaCompletitud: 'mejorando' | 'empeorando' | 'estable' = 
      completitudPromedio > 80 ? 'mejorando' : 
      completitudPromedio < 60 ? 'empeorando' : 'estable';

    const recomendaciones: string[] = [];
    
    if (completitudPromedio < 70) {
      recomendaciones.push('Implementar recordatorios para completar perfiles');
    }
    
    if (nuevosEsteMes < 5) {
      recomendaciones.push('Aumentar campañas de adquisición de clientes');
    }

    const distribPorTipo = state.distribuciones.porTipo;
    const soloUnTipo = distribPorTipo.length === 1;
    if (soloUnTipo) {
      recomendaciones.push('Diversificar tipos de cliente');
    }

    return {
      clientesProximoMes,
      tendenciaCompletitud,
      recomendaciones
    };
  }, [state.metricas, state.distribuciones]);

  // ==================== EFECTOS ====================

  // Calcular estadísticas cuando cambien los clientes
  useEffect(() => {
    if (clientes.length > 0) {
      calculateLocalStats(clientes);
    }
  }, [clientes, calculateLocalStats]);

  // Auto-refresh de estadísticas del servidor
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshStats]);

  // Cargar estadísticas iniciales del servidor
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ==================== RETORNO ====================

  return {
    state,
    refreshStats,
    calculateLocalStats,
    analytics,
    export: exportFunctions,
    predicciones
  };
}
