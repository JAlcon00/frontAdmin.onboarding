/**
 * @fileoverview Hook para manejo de filtros de usuarios
 * @module hook/usuario/useUsuarioFilters
 * @description Proporciona funcionalidades de filtrado, búsqueda y presets para usuarios
 */

import { useState, useCallback, useEffect } from 'react';

// ==================== INTERFACES Y TIPOS ====================

export interface UsuarioFilterState {
  rol?: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus?: 'activo' | 'suspendido';
  search?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  sortBy?: 'nombre' | 'apellido' | 'username' | 'correo' | 'rol' | 'estatus' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: UsuarioFilterState;
  isDefault?: boolean;
  isSystem?: boolean;
}

export interface UseUsuarioFiltersState {
  activeFilters: UsuarioFilterState;
  appliedFilters: UsuarioFilterState;
  searchTerm: string;
  presets: FilterPreset[];
  activePreset: string | null;
  hasActiveFilters: boolean;
  filtersCount: number;
  sortConfig: {
    field: string;
    direction: 'asc' | 'desc';
  } | null;
}

export interface UseUsuarioFiltersOptions {
  defaultFilters?: UsuarioFilterState;
  enablePresets?: boolean;
  enableLocalStorage?: boolean;
  storageKey?: string;
  autoApply?: boolean;
  debounceMs?: number;
  onFiltersChange?: (filters: UsuarioFilterState) => void;
  onPresetChange?: (preset: FilterPreset | null) => void;
}

export interface UseUsuarioFiltersReturn {
  // Estado
  state: UseUsuarioFiltersState;
  
  // Gestión de filtros
  setFilter: (key: keyof UsuarioFilterState, value: any) => void;
  updateFilters: (filters: Partial<UsuarioFilterState>) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  // Búsqueda
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  
  // Ordenamiento
  setSortConfig: (field: string, direction?: 'asc' | 'desc') => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;
  
  // Presets
  savePreset: (name: string, description: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  updatePreset: (presetId: string, updates: Partial<FilterPreset>) => void;
  
  // Utilidades
  getFilterSummary: () => string[];
  getFilterCount: () => number;
  exportFilters: () => string;
  importFilters: (filtersJson: string) => boolean;
  
  // Información de filtros
  getRoleOptions: () => Array<{ value: string; label: string; count?: number }>;
  getStatusOptions: () => Array<{ value: string; label: string; count?: number }>;
  getSortOptions: () => Array<{ value: string; label: string }>;
}

// ==================== CONFIGURACIÓN INICIAL ====================

const estadoInicial: UseUsuarioFiltersState = {
  activeFilters: {},
  appliedFilters: {},
  searchTerm: '',
  presets: [],
  activePreset: null,
  hasActiveFilters: false,
  filtersCount: 0,
  sortConfig: null
};

const presetsDefault: FilterPreset[] = [
  {
    id: 'usuarios-activos',
    name: 'Usuarios Activos',
    description: 'Usuarios con estatus activo',
    filters: { estatus: 'activo' },
    isSystem: true
  },
  {
    id: 'usuarios-suspendidos',
    name: 'Usuarios Suspendidos',
    description: 'Usuarios con estatus suspendido',
    filters: { estatus: 'suspendido' },
    isSystem: true
  },
  {
    id: 'administradores',
    name: 'Administradores',
    description: 'Usuarios con rol de administrador o superior',
    filters: { rol: 'ADMIN' },
    isSystem: true
  },
  {
    id: 'operadores',
    name: 'Operadores',
    description: 'Usuarios con rol de operador',
    filters: { rol: 'OPERADOR' },
    isSystem: true
  },
  {
    id: 'auditores',
    name: 'Auditores',
    description: 'Usuarios con rol de auditor',
    filters: { rol: 'AUDITOR' },
    isSystem: true
  }
];

// ==================== HOOK PRINCIPAL ====================

export function useUsuarioFilters(options: UseUsuarioFiltersOptions = {}): UseUsuarioFiltersReturn {
  const {
    defaultFilters = {},
    enablePresets = true,
    enableLocalStorage = true,
    storageKey = 'usuarioFilters',
    autoApply = true,
    onFiltersChange,
    onPresetChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseUsuarioFiltersState>(() => {
    let initialState = { ...estadoInicial };
    
    // Cargar desde localStorage si está habilitado
    if (enableLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          initialState = {
            ...initialState,
            activeFilters: { ...defaultFilters, ...parsed.activeFilters },
            appliedFilters: { ...parsed.appliedFilters },
            searchTerm: parsed.searchTerm || '',
            presets: enablePresets ? [...presetsDefault, ...(parsed.presets || [])] : [],
            activePreset: parsed.activePreset
          };
        }
      } catch (error) {
        console.warn('Error loading filters from localStorage:', error);
      }
    }
    
    if (!initialState.presets.length && enablePresets) {
      initialState.presets = presetsDefault;
    }
    
    return initialState;
  });

  // ==================== FUNCIONES AUXILIARES ====================

  const calcularEstadoFiltros = useCallback((filters: UsuarioFilterState): { hasActiveFilters: boolean; filtersCount: number } => {
    const filterEntries = Object.entries(filters).filter(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      return value !== undefined && value !== null && value !== '';
    });
    
    return {
      hasActiveFilters: filterEntries.length > 0,
      filtersCount: filterEntries.length
    };
  }, []);

  const guardarEnStorage = useCallback((newState: UseUsuarioFiltersState) => {
    if (enableLocalStorage && typeof window !== 'undefined') {
      try {
        const toStore = {
          activeFilters: newState.activeFilters,
          appliedFilters: newState.appliedFilters,
          searchTerm: newState.searchTerm,
          presets: newState.presets.filter(p => !p.isSystem),
          activePreset: newState.activePreset
        };
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch (error) {
        console.warn('Error saving filters to localStorage:', error);
      }
    }
  }, [enableLocalStorage, storageKey]);

  // ==================== GESTIÓN DE FILTROS ====================

  const setFilter = useCallback((key: keyof UsuarioFilterState, value: any) => {
    setState(prev => {
      const newActiveFilters = { ...prev.activeFilters, [key]: value };
      const estadoFiltros = calcularEstadoFiltros(newActiveFilters);
      
      const newState = {
        ...prev,
        activeFilters: newActiveFilters,
        activePreset: null, // Clear preset when manual filter is applied
        ...estadoFiltros
      };
      
      if (autoApply) {
        newState.appliedFilters = newActiveFilters;
        onFiltersChange?.(newActiveFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, calcularEstadoFiltros, guardarEnStorage, onFiltersChange]);

  const updateFilters = useCallback((filters: Partial<UsuarioFilterState>) => {
    setState(prev => {
      const newActiveFilters = { ...prev.activeFilters, ...filters };
      const estadoFiltros = calcularEstadoFiltros(newActiveFilters);
      
      const newState = {
        ...prev,
        activeFilters: newActiveFilters,
        activePreset: null,
        ...estadoFiltros
      };
      
      if (autoApply) {
        newState.appliedFilters = newActiveFilters;
        onFiltersChange?.(newActiveFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, calcularEstadoFiltros, guardarEnStorage, onFiltersChange]);

  const applyFilters = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        appliedFilters: prev.activeFilters
      };
      
      onFiltersChange?.(prev.activeFilters);
      guardarEnStorage(newState);
      return newState;
    });
  }, [onFiltersChange, guardarEnStorage]);

  const clearFilters = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        activeFilters: {},
        appliedFilters: autoApply ? {} : prev.appliedFilters,
        activePreset: null,
        hasActiveFilters: false,
        filtersCount: 0,
        sortConfig: null
      };
      
      if (autoApply) {
        onFiltersChange?.({});
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, onFiltersChange, guardarEnStorage]);

  const resetFilters = useCallback(() => {
    setState(prev => {
      const estadoFiltros = calcularEstadoFiltros(defaultFilters);
      
      const newState = {
        ...prev,
        activeFilters: defaultFilters,
        appliedFilters: autoApply ? defaultFilters : prev.appliedFilters,
        activePreset: null,
        ...estadoFiltros,
        sortConfig: null
      };
      
      if (autoApply) {
        onFiltersChange?.(defaultFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [defaultFilters, autoApply, calcularEstadoFiltros, onFiltersChange, guardarEnStorage]);

  // ==================== BÚSQUEDA ====================

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => {
      const newActiveFilters = { ...prev.activeFilters, search: term };
      const estadoFiltros = calcularEstadoFiltros(newActiveFilters);
      
      const newState = {
        ...prev,
        searchTerm: term,
        activeFilters: newActiveFilters,
        activePreset: null,
        ...estadoFiltros
      };
      
      if (autoApply) {
        newState.appliedFilters = newActiveFilters;
        onFiltersChange?.(newActiveFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, calcularEstadoFiltros, onFiltersChange, guardarEnStorage]);

  const clearSearch = useCallback(() => {
    setFilter('search', '');
    setState(prev => ({ ...prev, searchTerm: '' }));
  }, [setFilter]);

  // ==================== ORDENAMIENTO ====================

  const setSortConfig = useCallback((field: string, direction: 'asc' | 'desc' = 'asc') => {
    const sortConfig = { field, direction };
    
    setState(prev => {
      const newActiveFilters = {
        ...prev.activeFilters,
        sortBy: field as any,
        sortOrder: direction
      };
      
      const newState = {
        ...prev,
        activeFilters: newActiveFilters,
        sortConfig
      };
      
      if (autoApply) {
        newState.appliedFilters = newActiveFilters;
        onFiltersChange?.(newActiveFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, onFiltersChange, guardarEnStorage]);

  const toggleSort = useCallback((field: string) => {
    setState(prev => {
      const currentDirection = prev.sortConfig?.field === field ? prev.sortConfig.direction : null;
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      
      setSortConfig(field, newDirection);
      return prev;
    });
  }, [setSortConfig]);

  const clearSort = useCallback(() => {
    setState(prev => {
      const newActiveFilters = { ...prev.activeFilters };
      delete newActiveFilters.sortBy;
      delete newActiveFilters.sortOrder;
      
      const newState = {
        ...prev,
        activeFilters: newActiveFilters,
        sortConfig: null
      };
      
      if (autoApply) {
        newState.appliedFilters = newActiveFilters;
        onFiltersChange?.(newActiveFilters);
      }
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [autoApply, onFiltersChange, guardarEnStorage]);

  // ==================== PRESETS ====================

  const savePreset = useCallback((name: string, description: string) => {
    if (!enablePresets) return;
    
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      filters: state.activeFilters,
      isDefault: false,
      isSystem: false
    };
    
    setState(prev => {
      const newState = {
        ...prev,
        presets: [...prev.presets, newPreset]
      };
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [enablePresets, state.activeFilters, guardarEnStorage]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return;
    
    setState(prev => {
      const estadoFiltros = calcularEstadoFiltros(preset.filters);
      
      const newState = {
        ...prev,
        activeFilters: preset.filters,
        appliedFilters: autoApply ? preset.filters : prev.appliedFilters,
        activePreset: presetId,
        ...estadoFiltros
      };
      
      if (autoApply) {
        onFiltersChange?.(preset.filters);
      }
      
      onPresetChange?.(preset);
      guardarEnStorage(newState);
      return newState;
    });
  }, [state.presets, autoApply, calcularEstadoFiltros, onFiltersChange, onPresetChange, guardarEnStorage]);

  const deletePreset = useCallback((presetId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        presets: prev.presets.filter(p => p.id !== presetId && !p.isSystem),
        activePreset: prev.activePreset === presetId ? null : prev.activePreset
      };
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [guardarEnStorage]);

  const updatePreset = useCallback((presetId: string, updates: Partial<FilterPreset>) => {
    setState(prev => {
      const newState = {
        ...prev,
        presets: prev.presets.map(p => 
          p.id === presetId && !p.isSystem ? { ...p, ...updates } : p
        )
      };
      
      guardarEnStorage(newState);
      return newState;
    });
  }, [guardarEnStorage]);

  // ==================== UTILIDADES ====================

  const getFilterSummary = useCallback((): string[] => {
    const summary: string[] = [];
    const filters = state.appliedFilters;
    
    if (filters.rol) {
      summary.push(`Rol: ${filters.rol}`);
    }
    
    if (filters.estatus) {
      summary.push(`Estatus: ${filters.estatus === 'activo' ? 'Activo' : 'Suspendido'}`);
    }
    
    if (filters.search) {
      summary.push(`Búsqueda: "${filters.search}"`);
    }
    
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? 'descendente' : 'ascendente';
      summary.push(`Ordenado por: ${filters.sortBy} (${direction})`);
    }
    
    return summary;
  }, [state.appliedFilters]);

  const getFilterCount = useCallback((): number => {
    return state.filtersCount;
  }, [state.filtersCount]);

  const exportFilters = useCallback((): string => {
    return JSON.stringify({
      activeFilters: state.activeFilters,
      presets: state.presets.filter(p => !p.isSystem)
    }, null, 2);
  }, [state.activeFilters, state.presets]);

  const importFilters = useCallback((filtersJson: string): boolean => {
    try {
      const imported = JSON.parse(filtersJson);
      
      if (imported.activeFilters) {
        updateFilters(imported.activeFilters);
      }
      
      if (imported.presets && Array.isArray(imported.presets)) {
        setState(prev => {
          const systemPresets = prev.presets.filter(p => p.isSystem);
          const newState = {
            ...prev,
            presets: [...systemPresets, ...imported.presets]
          };
          
          guardarEnStorage(newState);
          return newState;
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error importing filters:', error);
      return false;
    }
  }, [updateFilters, guardarEnStorage]);

  // ==================== INFORMACIÓN DE FILTROS ====================

  const getRoleOptions = useCallback(() => [
    { value: 'SUPER', label: 'Super Usuario' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'AUDITOR', label: 'Auditor' },
    { value: 'OPERADOR', label: 'Operador' }
  ], []);

  const getStatusOptions = useCallback(() => [
    { value: 'activo', label: 'Activo' },
    { value: 'suspendido', label: 'Suspendido' }
  ], []);

  const getSortOptions = useCallback(() => [
    { value: 'nombre', label: 'Nombre' },
    { value: 'apellido', label: 'Apellido' },
    { value: 'username', label: 'Usuario' },
    { value: 'correo', label: 'Correo' },
    { value: 'rol', label: 'Rol' },
    { value: 'estatus', label: 'Estatus' },
    { value: 'created_at', label: 'Fecha Creación' },
    { value: 'updated_at', label: 'Última Actualización' }
  ], []);

  // ==================== EFECTOS ====================

  useEffect(() => {
    // Inicializar con filtros por defecto si es necesario
    if (Object.keys(defaultFilters).length > 0 && Object.keys(state.activeFilters).length === 0) {
      updateFilters(defaultFilters);
    }
  }, [defaultFilters]); // Solo ejecutar cuando cambien los filtros por defecto

  // ==================== RETORNO ====================

  return {
    state,
    setFilter,
    updateFilters,
    applyFilters,
    clearFilters,
    resetFilters,
    setSearchTerm,
    clearSearch,
    setSortConfig,
    toggleSort,
    clearSort,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    getFilterSummary,
    getFilterCount,
    exportFilters,
    importFilters,
    getRoleOptions,
    getStatusOptions,
    getSortOptions
  };
}
