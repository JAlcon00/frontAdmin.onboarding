import { useState, useCallback, useEffect } from 'react';
import type { DashboardPeriod } from './useDashboardData';

// ==================== INTERFACES ====================

export interface DashboardFilter {
  id: string;
  label: string;
  type: 'date' | 'select' | 'multiSelect' | 'range' | 'search' | 'toggle';
  value: any;
  options?: Array<{ value: any; label: string; count?: number }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  isActive: boolean;
  isRequired?: boolean;
  group?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  icon?: string;
}

export interface UseDashboardFiltersState {
  filters: DashboardFilter[];
  activeFilters: Record<string, any>;
  presets: FilterPreset[];
  currentPreset: FilterPreset | null;
  period: DashboardPeriod;
  search: string;
  isApplied: boolean;
}

export interface UseDashboardFiltersOptions {
  initialFilters?: DashboardFilter[];
  initialPresets?: FilterPreset[];
  initialPeriod?: DashboardPeriod;
  autoApply?: boolean;
  debounceMs?: number;
  persistFilters?: boolean;
  onFiltersChange?: (filters: Record<string, any>) => void;
  onPeriodChange?: (period: DashboardPeriod) => void;
  onPresetChange?: (preset: FilterPreset | null) => void;
}

export interface UseDashboardFiltersReturn {
  // Estado
  state: UseDashboardFiltersState;
  
  // Gestión de filtros
  setFilterValue: (filterId: string, value: any) => void;
  clearFilter: (filterId: string) => void;
  clearAllFilters: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
  
  // Gestión de período
  setPeriod: (period: DashboardPeriod) => void;
  setQuickPeriod: (type: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year') => void;
  setCustomPeriod: (inicio: Date, fin: Date) => void;
  
  // Búsqueda
  setSearch: (search: string) => void;
  clearSearch: () => void;
  
  // Presets
  applyPreset: (presetId: string) => void;
  saveAsPreset: (name: string, description?: string) => void;
  updatePreset: (presetId: string, updates: Partial<FilterPreset>) => void;
  deletePreset: (presetId: string) => void;
  
  // Utilidades
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
  getFilterByGroup: (group: string) => DashboardFilter[];
  getFilterValue: (filterId: string) => any;
  getFilterSummary: () => string;
  
  // Exportar/Importar
  exportFilters: () => string;
  importFilters: (filtersJson: string) => boolean;
  
  // Validación
  validateFilters: () => { isValid: boolean; errors: string[] };
}

// ==================== CONSTANTES ====================

const DEFAULT_PERIODS: Record<string, () => DashboardPeriod> = {
  today: () => ({
    inicio: new Date(new Date().setHours(0, 0, 0, 0)),
    fin: new Date(new Date().setHours(23, 59, 59, 999)),
    label: 'Hoy'
  }),
  yesterday: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      inicio: new Date(yesterday.setHours(0, 0, 0, 0)),
      fin: new Date(yesterday.setHours(23, 59, 59, 999)),
      label: 'Ayer'
    };
  },
  week: () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    return {
      inicio: new Date(startOfWeek.setHours(0, 0, 0, 0)),
      fin: new Date(),
      label: 'Esta semana'
    };
  },
  month: () => {
    const today = new Date();
    return {
      inicio: new Date(today.getFullYear(), today.getMonth(), 1),
      fin: new Date(),
      label: 'Este mes'
    };
  },
  quarter: () => {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    return {
      inicio: new Date(today.getFullYear(), quarter * 3, 1),
      fin: new Date(),
      label: 'Este trimestre'
    };
  },
  year: () => {
    const today = new Date();
    return {
      inicio: new Date(today.getFullYear(), 0, 1),
      fin: new Date(),
      label: 'Este año'
    };
  }
};

const DEFAULT_FILTERS: DashboardFilter[] = [
  {
    id: 'status',
    label: 'Estado',
    type: 'multiSelect',
    value: [],
    options: [
      { value: 'activo', label: 'Activo', count: 0 },
      { value: 'inactivo', label: 'Inactivo', count: 0 },
      { value: 'pendiente', label: 'Pendiente', count: 0 },
      { value: 'aprobado', label: 'Aprobado', count: 0 },
      { value: 'rechazado', label: 'Rechazado', count: 0 }
    ],
    isActive: false,
    group: 'general'
  },
  {
    id: 'priority',
    label: 'Prioridad',
    type: 'select',
    value: null,
    options: [
      { value: 'high', label: 'Alta' },
      { value: 'medium', label: 'Media' },
      { value: 'low', label: 'Baja' }
    ],
    isActive: false,
    group: 'general'
  },
  {
    id: 'amount',
    label: 'Monto',
    type: 'range',
    value: [0, 1000000],
    min: 0,
    max: 10000000,
    step: 10000,
    isActive: false,
    group: 'financial'
  },
  {
    id: 'completeness',
    label: 'Completitud',
    type: 'range',
    value: [0, 100],
    min: 0,
    max: 100,
    step: 5,
    isActive: false,
    group: 'quality'
  },
  {
    id: 'module',
    label: 'Módulo',
    type: 'multiSelect',
    value: [],
    options: [
      { value: 'clientes', label: 'Clientes' },
      { value: 'documentos', label: 'Documentos' },
      { value: 'solicitudes', label: 'Solicitudes' }
    ],
    isActive: false,
    group: 'general'
  }
];

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'all_data',
    name: 'Todos los datos',
    description: 'Mostrar toda la información disponible',
    filters: {},
    isDefault: true,
    icon: 'database'
  },
  {
    id: 'pending_review',
    name: 'Pendientes de revisión',
    description: 'Elementos que requieren atención',
    filters: {
      status: ['pendiente']
    },
    icon: 'clock'
  },
  {
    id: 'high_priority',
    name: 'Alta prioridad',
    description: 'Elementos con prioridad alta',
    filters: {
      priority: 'high'
    },
    icon: 'alert-triangle'
  },
  {
    id: 'financial_focus',
    name: 'Enfoque financiero',
    description: 'Métricas financieras principales',
    filters: {
      module: ['solicitudes'],
      amount: [100000, 10000000]
    },
    icon: 'dollar-sign'
  },
  {
    id: 'quality_issues',
    name: 'Problemas de calidad',
    description: 'Elementos con baja completitud',
    filters: {
      completeness: [0, 60]
    },
    icon: 'alert-circle'
  }
];

// ==================== UTILIDADES ====================

function getInitialFilters(): DashboardFilter[] {
  return DEFAULT_FILTERS.map(filter => ({
    ...filter,
    value: Array.isArray(filter.value) ? [...filter.value] : filter.value
  }));
}

function createPresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== HOOK PRINCIPAL ====================

export function useDashboardFilters(options: UseDashboardFiltersOptions = {}): UseDashboardFiltersReturn {
  const {
    initialPresets = DEFAULT_PRESETS,
    initialPeriod = DEFAULT_PERIODS.today(),
    autoApply = true,
    debounceMs = 300,
    persistFilters = true,
    onFiltersChange,
    onPeriodChange,
    onPresetChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDashboardFiltersState>({
    filters: getInitialFilters(),
    activeFilters: {},
    presets: initialPresets,
    currentPreset: initialPresets.find(p => p.isDefault) || null,
    period: initialPeriod,
    search: '',
    isApplied: false
  });

  // ==================== UTILIDADES ====================

  const buildActiveFilters = useCallback((filters: DashboardFilter[]): Record<string, any> => {
    const active: Record<string, any> = {};
    
    filters.forEach(filter => {
      if (filter.isActive && filter.value !== null && filter.value !== undefined) {
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          active[filter.id] = filter.value;
        } else if (!Array.isArray(filter.value)) {
          active[filter.id] = filter.value;
        }
      }
    });

    return active;
  }, []);

  // ==================== GESTIÓN DE FILTROS ====================

  const setFilterValue = useCallback((filterId: string, value: any) => {
    setState(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.id === filterId) {
          const isActive = value !== null && value !== undefined && 
                           (Array.isArray(value) ? value.length > 0 : true);
          
          return { ...filter, value, isActive };
        }
        return filter;
      });

      const activeFilters = buildActiveFilters(newFilters);
      
      return {
        ...prev,
        filters: newFilters,
        activeFilters,
        currentPreset: null, // Limpiar preset cuando se modifican filtros manualmente
        isApplied: autoApply
      };
    });

    if (autoApply) {
      // Debounce para búsqueda y campos de texto
      setTimeout(() => {
        const activeFilters = buildActiveFilters(
          state.filters.map(filter => 
            filter.id === filterId 
              ? { ...filter, value, isActive: value !== null && value !== undefined }
              : filter
          )
        );
        onFiltersChange?.(activeFilters);
      }, debounceMs);
    }
  }, [autoApply, buildActiveFilters, debounceMs, onFiltersChange, state.filters]);

  const clearFilter = useCallback((filterId: string) => {
    setState(prev => {
      const newFilters = prev.filters.map(filter => {
        if (filter.id === filterId) {
          const defaultValue = filter.type === 'multiSelect' ? [] :
                              filter.type === 'range' ? [filter.min || 0, filter.max || 100] :
                              null;
          return { ...filter, value: defaultValue, isActive: false };
        }
        return filter;
      });

      const activeFilters = buildActiveFilters(newFilters);
      
      return {
        ...prev,
        filters: newFilters,
        activeFilters,
        currentPreset: null,
        isApplied: autoApply
      };
    });

    if (autoApply) {
      const activeFilters = buildActiveFilters(state.filters);
      onFiltersChange?.(activeFilters);
    }
  }, [autoApply, buildActiveFilters, onFiltersChange, state.filters]);

  const clearAllFilters = useCallback(() => {
    setState(prev => {
      const newFilters = prev.filters.map(filter => {
        const defaultValue = filter.type === 'multiSelect' ? [] :
                            filter.type === 'range' ? [filter.min || 0, filter.max || 100] :
                            null;
        return { ...filter, value: defaultValue, isActive: false };
      });

      return {
        ...prev,
        filters: newFilters,
        activeFilters: {},
        currentPreset: null,
        search: '',
        isApplied: autoApply
      };
    });

    if (autoApply) {
      onFiltersChange?.({});
    }
  }, [autoApply, onFiltersChange]);

  const applyFilters = useCallback(() => {
    const activeFilters = buildActiveFilters(state.filters);
    
    setState(prev => ({
      ...prev,
      activeFilters,
      isApplied: true
    }));

    onFiltersChange?.(activeFilters);
  }, [buildActiveFilters, state.filters, onFiltersChange]);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: getInitialFilters(),
      activeFilters: {},
      currentPreset: prev.presets.find(p => p.isDefault) || null,
      search: '',
      isApplied: false
    }));

    if (autoApply) {
      onFiltersChange?.({});
    }
  }, [autoApply, onFiltersChange]);

  // ==================== GESTIÓN DE PERÍODO ====================

  const setPeriod = useCallback((period: DashboardPeriod) => {
    setState(prev => ({ ...prev, period }));
    onPeriodChange?.(period);
  }, [onPeriodChange]);

  const setQuickPeriod = useCallback((type: keyof typeof DEFAULT_PERIODS) => {
    const period = DEFAULT_PERIODS[type]();
    setPeriod(period);
  }, [setPeriod]);

  const setCustomPeriod = useCallback((inicio: Date, fin: Date) => {
    const period: DashboardPeriod = {
      inicio,
      fin,
      label: `${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`
    };
    setPeriod(period);
  }, [setPeriod]);

  // ==================== BÚSQUEDA ====================

  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search }));
    
    if (autoApply) {
      setTimeout(() => {
        onFiltersChange?.({ ...state.activeFilters, search });
      }, debounceMs);
    }
  }, [autoApply, debounceMs, onFiltersChange, state.activeFilters]);

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, search: '' }));
    
    if (autoApply) {
      onFiltersChange?.(state.activeFilters);
    }
  }, [autoApply, onFiltersChange, state.activeFilters]);

  // ==================== PRESETS ====================

  const applyPreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;

    setState(prev => {
      const newFilters = prev.filters.map(filter => {
        const presetValue = preset.filters[filter.id];
        if (presetValue !== undefined) {
          return { ...filter, value: presetValue, isActive: true };
        }
        
        // Limpiar filtros no incluidos en el preset
        const defaultValue = filter.type === 'multiSelect' ? [] :
                            filter.type === 'range' ? [filter.min || 0, filter.max || 100] :
                            null;
        return { ...filter, value: defaultValue, isActive: false };
      });

      const activeFilters = buildActiveFilters(newFilters);

      return {
        ...prev,
        filters: newFilters,
        activeFilters,
        currentPreset: preset,
        isApplied: autoApply
      };
    });

    onPresetChange?.(preset);
    
    if (autoApply) {
      const activeFilters = buildActiveFilters(state.filters);
      onFiltersChange?.(activeFilters);
    }
  }, [state.presets, state.filters, buildActiveFilters, autoApply, onPresetChange, onFiltersChange]);

  const saveAsPreset = useCallback((name: string, description?: string) => {
    const preset: FilterPreset = {
      id: createPresetId(),
      name,
      description,
      filters: state.activeFilters
    };

    setState(prev => ({
      ...prev,
      presets: [...prev.presets, preset],
      currentPreset: preset
    }));

    onPresetChange?.(preset);
  }, [state.activeFilters, onPresetChange]);

  const updatePreset = useCallback((presetId: string, updates: Partial<FilterPreset>) => {
    setState(prev => ({
      ...prev,
      presets: prev.presets.map(preset => 
        preset.id === presetId ? { ...preset, ...updates } : preset
      )
    }));
  }, []);

  const deletePreset = useCallback((presetId: string) => {
    setState(prev => {
      const newPresets = prev.presets.filter(preset => preset.id !== presetId);
      const currentPreset = prev.currentPreset?.id === presetId ? null : prev.currentPreset;
      
      return {
        ...prev,
        presets: newPresets,
        currentPreset
      };
    });
  }, []);

  // ==================== UTILIDADES ====================

  const getActiveFiltersCount = useCallback((): number => {
    return Object.keys(state.activeFilters).length + (state.search ? 1 : 0);
  }, [state.activeFilters, state.search]);

  const hasActiveFilters = useCallback((): boolean => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  const getFilterByGroup = useCallback((group: string): DashboardFilter[] => {
    return state.filters.filter(filter => filter.group === group);
  }, [state.filters]);

  const getFilterValue = useCallback((filterId: string): any => {
    const filter = state.filters.find(f => f.id === filterId);
    return filter?.value;
  }, [state.filters]);

  const getFilterSummary = useCallback((): string => {
    const activeCount = getActiveFiltersCount();
    if (activeCount === 0) return 'Sin filtros aplicados';
    if (activeCount === 1) return '1 filtro aplicado';
    return `${activeCount} filtros aplicados`;
  }, [getActiveFiltersCount]);

  // ==================== EXPORTAR/IMPORTAR ====================

  const exportFilters = useCallback((): string => {
    return JSON.stringify({
      filters: state.activeFilters,
      period: state.period,
      search: state.search,
      preset: state.currentPreset?.id
    }, null, 2);
  }, [state.activeFilters, state.period, state.search, state.currentPreset]);

  const importFilters = useCallback((filtersJson: string): boolean => {
    try {
      const imported = JSON.parse(filtersJson);
      
      if (imported.filters) {
        setState(prev => {
          const newFilters = prev.filters.map(filter => {
            const importedValue = imported.filters[filter.id];
            if (importedValue !== undefined) {
              return { ...filter, value: importedValue, isActive: true };
            }
            return filter;
          });

          return {
            ...prev,
            filters: newFilters,
            activeFilters: imported.filters,
            period: imported.period || prev.period,
            search: imported.search || '',
            currentPreset: imported.preset ? prev.presets.find(p => p.id === imported.preset) || null : null
          };
        });

        if (autoApply) {
          onFiltersChange?.(imported.filters);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error al importar filtros:', error);
    }
    
    return false;
  }, [autoApply, onFiltersChange]);

  // ==================== VALIDACIÓN ====================

  const validateFilters = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    state.filters.forEach(filter => {
      if (filter.isRequired && !filter.isActive) {
        errors.push(`El filtro "${filter.label}" es requerido`);
      }
      
      if (filter.type === 'range' && filter.isActive) {
        const [min, max] = filter.value;
        if (min > max) {
          errors.push(`Rango inválido en "${filter.label}": el valor mínimo no puede ser mayor al máximo`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state.filters]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (persistFilters) {
      // Cargar filtros persistidos del localStorage
      try {
        const savedFilters = localStorage.getItem('dashboard-filters');
        if (savedFilters) {
          importFilters(savedFilters);
        }
      } catch (error) {
        console.warn('No se pudieron cargar los filtros guardados:', error);
      }
    }
  }, [persistFilters, importFilters]);

  useEffect(() => {
    if (persistFilters && state.isApplied) {
      // Guardar filtros en localStorage
      try {
        localStorage.setItem('dashboard-filters', exportFilters());
      } catch (error) {
        console.warn('No se pudieron guardar los filtros:', error);
      }
    }
  }, [persistFilters, state.isApplied, exportFilters]);

  // ==================== RETORNO ====================

  return {
    state,
    setFilterValue,
    clearFilter,
    clearAllFilters,
    applyFilters,
    resetFilters,
    setPeriod,
    setQuickPeriod,
    setCustomPeriod,
    setSearch,
    clearSearch,
    applyPreset,
    saveAsPreset,
    updatePreset,
    deletePreset,
    getActiveFiltersCount,
    hasActiveFilters,
    getFilterByGroup,
    getFilterValue,
    getFilterSummary,
    exportFilters,
    importFilters,
    validateFilters
  };
}
