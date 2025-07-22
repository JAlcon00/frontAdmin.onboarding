import { useState, useCallback, useEffect } from 'react';
import type { DashboardData } from './useDashboardData';

// ==================== INTERFACES ====================

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  source: 'clientes' | 'documentos' | 'solicitudes' | 'sistema' | 'kpi' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
  actionRequired: boolean;
  metadata?: {
    count?: number;
    threshold?: number;
    currentValue?: number;
    entityId?: string;
    entityType?: string;
    [key: string]: any;
  };
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    handler: () => void;
  }>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  source: DashboardAlert['source'];
  condition: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    value: number;
    timeWindow?: number; // minutos
  };
  severity: DashboardAlert['severity'];
  message: string;
  actionRequired: boolean;
  cooldown?: number; // minutos entre alertas del mismo tipo
}

export interface AlertStatistics {
  total: number;
  unread: number;
  resolved: number;
  byType: Record<DashboardAlert['type'], number>;
  bySeverity: Record<DashboardAlert['severity'], number>;
  bySource: Record<DashboardAlert['source'], number>;
  last24h: number;
  critical: number;
}

export interface UseDashboardAlertsState {
  alerts: DashboardAlert[];
  rules: AlertRule[];
  statistics: AlertStatistics;
  loading: boolean;
  error: string | null;
  lastCheck: Date | null;
}

export interface UseDashboardAlertsOptions {
  dashboardData?: DashboardData;
  autoCheck?: boolean;
  checkInterval?: number;
  maxAlerts?: number;
  enabledRules?: string[];
  customRules?: AlertRule[];
  onNewAlert?: (alert: DashboardAlert) => void;
  onCriticalAlert?: (alert: DashboardAlert) => void;
}

export interface UseDashboardAlertsReturn {
  // Estado
  state: UseDashboardAlertsState;
  
  // Gestión de alertas
  checkAlerts: () => Promise<void>;
  createAlert: (alert: Omit<DashboardAlert, 'id' | 'timestamp' | 'isRead' | 'isResolved'>) => void;
  markAsRead: (alertId: string) => void;
  markAsResolved: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Filtros y búsqueda
  getAlerts: (filters?: {
    type?: DashboardAlert['type'];
    severity?: DashboardAlert['severity'];
    source?: DashboardAlert['source'];
    isRead?: boolean;
    isResolved?: boolean;
  }) => DashboardAlert[];
  getUnreadAlerts: () => DashboardAlert[];
  getCriticalAlerts: () => DashboardAlert[];
  getRecentAlerts: (hours?: number) => DashboardAlert[];
  
  // Gestión de reglas
  addRule: (rule: Omit<AlertRule, 'id'>) => void;
  updateRule: (ruleId: string, updates: Partial<AlertRule>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  
  // Estadísticas
  getStatistics: () => AlertStatistics;
  getAlertTrends: () => Array<{
    date: string;
    count: number;
    critical: number;
  }>;
  
  // Exportar
  exportAlerts: (format: 'json' | 'csv') => string;
}

// ==================== CONSTANTES ====================

const DEFAULT_ALERT_RULES: Omit<AlertRule, 'id'>[] = [
  {
    name: 'Solicitudes Pendientes Altas',
    description: 'Alerta cuando hay muchas solicitudes pendientes de revisión',
    enabled: true,
    source: 'solicitudes',
    condition: {
      field: 'pendientes',
      operator: 'gt',
      value: 20
    },
    severity: 'medium',
    message: 'Hay {count} solicitudes pendientes que requieren atención',
    actionRequired: true,
    cooldown: 60
  },
  {
    name: 'Documentos Rechazados Altos',
    description: 'Alerta cuando la tasa de rechazo de documentos es alta',
    enabled: true,
    source: 'documentos',
    condition: {
      field: 'rechazados',
      operator: 'gt',
      value: 10
    },
    severity: 'medium',
    message: 'Tasa de rechazo de documentos está alta: {count} rechazados',
    actionRequired: false,
    cooldown: 30
  },
  {
    name: 'Sistema con Errores',
    description: 'Alerta cuando hay errores del sistema',
    enabled: true,
    source: 'sistema',
    condition: {
      field: 'errores',
      operator: 'gt',
      value: 5
    },
    severity: 'high',
    message: 'Se han detectado {count} errores del sistema',
    actionRequired: true,
    cooldown: 15
  },
  {
    name: 'Uptime Bajo',
    description: 'Alerta cuando la disponibilidad del sistema baja',
    enabled: true,
    source: 'sistema',
    condition: {
      field: 'uptime',
      operator: 'lt',
      value: 95
    },
    severity: 'critical',
    message: 'Disponibilidad del sistema baja: {currentValue}%',
    actionRequired: true,
    cooldown: 5
  },
  {
    name: 'Completitud Baja',
    description: 'Alerta cuando la completitud promedio de clientes es baja',
    enabled: true,
    source: 'clientes',
    condition: {
      field: 'completitudPromedio',
      operator: 'lt',
      value: 60
    },
    severity: 'medium',
    message: 'Completitud promedio de clientes baja: {currentValue}%',
    actionRequired: false,
    cooldown: 120
  }
];

const INITIAL_STATISTICS: AlertStatistics = {
  total: 0,
  unread: 0,
  resolved: 0,
  byType: { info: 0, warning: 0, error: 0, success: 0 },
  bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
  bySource: { clientes: 0, documentos: 0, solicitudes: 0, sistema: 0, kpi: 0, manual: 0 },
  last24h: 0,
  critical: 0
};

// ==================== UTILIDADES ====================

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
  switch (condition.operator) {
    case 'gt': return value > condition.value;
    case 'lt': return value < condition.value;
    case 'eq': return value === condition.value;
    case 'gte': return value >= condition.value;
    case 'lte': return value <= condition.value;
    case 'ne': return value !== condition.value;
    default: return false;
  }
}

function interpolateMessage(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

function calculateStatistics(alerts: DashboardAlert[]): AlertStatistics {
  const stats = { ...INITIAL_STATISTICS };
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  alerts.forEach(alert => {
    stats.total++;
    
    if (!alert.isRead) stats.unread++;
    if (alert.isResolved) stats.resolved++;
    
    stats.byType[alert.type]++;
    stats.bySeverity[alert.severity]++;
    stats.bySource[alert.source]++;
    
    if (alert.timestamp >= last24h) stats.last24h++;
    if (alert.severity === 'critical') stats.critical++;
  });

  return stats;
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardAlerts(options: UseDashboardAlertsOptions = {}): UseDashboardAlertsReturn {
  const {
    dashboardData,
    autoCheck = true,
    checkInterval = 30000, // 30 segundos
    maxAlerts = 100,
    enabledRules = [],
    customRules = [],
    onNewAlert,
    onCriticalAlert
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDashboardAlertsState>({
    alerts: [],
    rules: [],
    statistics: INITIAL_STATISTICS,
    loading: false,
    error: null,
    lastCheck: null
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

  // ==================== INICIALIZACIÓN ====================

  const initializeRules = useCallback(() => {
    const rules: AlertRule[] = DEFAULT_ALERT_RULES.map(rule => ({
      ...rule,
      id: generateRuleId(),
      enabled: enabledRules.length === 0 || enabledRules.includes(rule.name)
    }));

    const allRules = [...rules, ...customRules];

    setState(prev => ({
      ...prev,
      rules: allRules
    }));
  }, [enabledRules, customRules]);

  // ==================== GESTIÓN DE ALERTAS ====================

  const createAlert = useCallback((alertData: Omit<DashboardAlert, 'id' | 'timestamp' | 'isRead' | 'isResolved'>) => {
    const alert: DashboardAlert = {
      ...alertData,
      id: generateAlertId(),
      timestamp: new Date(),
      isRead: false,
      isResolved: false
    };

    setState(prev => {
      const newAlerts = [alert, ...prev.alerts].slice(0, maxAlerts);
      const newStatistics = calculateStatistics(newAlerts);

      return {
        ...prev,
        alerts: newAlerts,
        statistics: newStatistics
      };
    });

    // Notificar nueva alerta
    onNewAlert?.(alert);

    // Notificar si es crítica
    if (alert.severity === 'critical') {
      onCriticalAlert?.(alert);
    }
  }, [maxAlerts, onNewAlert, onCriticalAlert]);

  const checkAlerts = useCallback(async (): Promise<void> => {
    if (!dashboardData) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const activeRules = state.rules.filter(rule => rule.enabled);
      const now = new Date();

      for (const rule of activeRules) {
        // Verificar cooldown
        const lastAlert = state.alerts.find(alert => 
          alert.source === rule.source && 
          alert.message.includes(rule.name) &&
          now.getTime() - alert.timestamp.getTime() < (rule.cooldown || 0) * 60 * 1000
        );

        if (lastAlert) continue;

        // Obtener valor según la regla
        let currentValue: number = 0;
        switch (rule.source) {
          case 'clientes':
            if (rule.condition.field === 'completitudPromedio') {
              currentValue = dashboardData.clientes.completitudPromedio;
            }
            break;
          case 'documentos':
            if (rule.condition.field === 'rechazados') {
              currentValue = dashboardData.documentos.rechazados;
            }
            break;
          case 'solicitudes':
            if (rule.condition.field === 'pendientes') {
              currentValue = dashboardData.solicitudes.pendientes;
            }
            break;
          case 'sistema':
            if (rule.condition.field === 'uptime') {
              currentValue = dashboardData.rendimiento.uptime;
            } else if (rule.condition.field === 'errores') {
              currentValue = dashboardData.rendimiento.erroresHoy;
            }
            break;
        }

        // Evaluar condición
        if (evaluateCondition(currentValue, rule.condition)) {
          const message = interpolateMessage(rule.message, {
            count: Math.round(currentValue),
            currentValue: currentValue.toFixed(1),
            threshold: rule.condition.value
          });

          createAlert({
            type: rule.severity === 'critical' ? 'error' : 
                  rule.severity === 'high' ? 'error' : 
                  rule.severity === 'medium' ? 'warning' : 'info',
            title: rule.name,
            message,
            source: rule.source,
            severity: rule.severity,
            actionRequired: rule.actionRequired,
            metadata: {
              ruleId: rule.id,
              currentValue,
              threshold: rule.condition.value
            }
          });
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        lastCheck: now
      }));

    } catch (error) {
      handleError(error, 'verificar alertas');
    }
  }, [dashboardData, state.rules, state.alerts, handleError, createAlert]);

  const markAsRead = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ),
      statistics: calculateStatistics(
        prev.alerts.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      )
    }));
  }, []);

  const markAsResolved = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
      ),
      statistics: calculateStatistics(
        prev.alerts.map(alert => 
          alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
        )
      )
    }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => {
      const newAlerts = prev.alerts.filter(alert => alert.id !== alertId);
      return {
        ...prev,
        alerts: newAlerts,
        statistics: calculateStatistics(newAlerts)
      };
    });
  }, []);

  const clearAllAlerts = useCallback(() => {
    setState(prev => ({
      ...prev,
      alerts: [],
      statistics: INITIAL_STATISTICS
    }));
  }, []);

  // ==================== FILTROS Y BÚSQUEDA ====================

  const getAlerts = useCallback((filters?: {
    type?: DashboardAlert['type'];
    severity?: DashboardAlert['severity'];
    source?: DashboardAlert['source'];
    isRead?: boolean;
    isResolved?: boolean;
  }) => {
    let filteredAlerts = state.alerts;

    if (filters) {
      if (filters.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
      }
      if (filters.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
      }
      if (filters.source) {
        filteredAlerts = filteredAlerts.filter(alert => alert.source === filters.source);
      }
      if (filters.isRead !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.isRead === filters.isRead);
      }
      if (filters.isResolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.isResolved === filters.isResolved);
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [state.alerts]);

  const getUnreadAlerts = useCallback(() => {
    return getAlerts({ isRead: false });
  }, [getAlerts]);

  const getCriticalAlerts = useCallback(() => {
    return getAlerts({ severity: 'critical' });
  }, [getAlerts]);

  const getRecentAlerts = useCallback((hours = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return state.alerts
      .filter(alert => alert.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [state.alerts]);

  // ==================== GESTIÓN DE REGLAS ====================

  const addRule = useCallback((ruleData: Omit<AlertRule, 'id'>) => {
    const rule: AlertRule = {
      ...ruleData,
      id: generateRuleId()
    };

    setState(prev => ({
      ...prev,
      rules: [...prev.rules, rule]
    }));
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setState(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    }));
  }, []);

  // ==================== ESTADÍSTICAS ====================

  const getStatistics = useCallback(() => state.statistics, [state.statistics]);

  const getAlertTrends = useCallback(() => {
    const trends = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayAlerts = state.alerts.filter(alert => 
        alert.timestamp >= dayStart && alert.timestamp < dayEnd
      );
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: dayAlerts.length,
        critical: dayAlerts.filter(alert => alert.severity === 'critical').length
      });
    }
    
    return trends;
  }, [state.alerts]);

  // ==================== EXPORTAR ====================

  const exportAlerts = useCallback((format: 'json' | 'csv'): string => {
    if (format === 'json') {
      return JSON.stringify(state.alerts, null, 2);
    }

    // Formato CSV
    const headers = ['ID', 'Tipo', 'Título', 'Mensaje', 'Fuente', 'Severidad', 'Fecha', 'Leída', 'Resuelta'];
    const rows = state.alerts.map(alert => [
      alert.id,
      alert.type,
      alert.title,
      alert.message,
      alert.source,
      alert.severity,
      alert.timestamp.toISOString(),
      alert.isRead ? 'Sí' : 'No',
      alert.isResolved ? 'Sí' : 'No'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, [state.alerts]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    initializeRules();
  }, [initializeRules]);

  useEffect(() => {
    if (autoCheck && dashboardData) {
      checkAlerts();
    }
  }, [autoCheck, dashboardData, checkAlerts]);

  useEffect(() => {
    if (checkInterval > 0) {
      const interval = setInterval(checkAlerts, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkInterval, checkAlerts]);

  // ==================== RETORNO ====================

  return {
    state,
    checkAlerts,
    createAlert,
    markAsRead,
    markAsResolved,
    dismissAlert,
    clearAllAlerts,
    getAlerts,
    getUnreadAlerts,
    getCriticalAlerts,
    getRecentAlerts,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    getStatistics,
    getAlertTrends,
    exportAlerts
  };
}
