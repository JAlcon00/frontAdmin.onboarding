import { useState, useCallback, useEffect } from 'react';
import { documentoService } from '../../services/documento.service';
import type { 
  Documento, 
  DocumentoFilter, 
  DocumentoTipo,
  TipoPersona
} from '../../types';

// ==================== INTERFACES ====================

export interface DocumentoFilterState extends DocumentoFilter {
  search?: string;
  sortField?: keyof Documento;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface UseDocumentoFiltersState {
  filters: DocumentoFilterState;
  appliedFilters: DocumentoFilterState;
  availableTypes: DocumentoTipo[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  resultCount: number;
  error: string | null;
}

export interface UseDocumentoFiltersOptions {
  initialFilters?: Partial<DocumentoFilterState>;
  autoApply?: boolean;
  debounceMs?: number;
  enableSearch?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  defaultPageSize?: number;
  onFiltersChange?: (filters: DocumentoFilterState) => void;
  onResultsChange?: (count: number) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: Partial<DocumentoFilterState>;
  icon?: string;
}

export interface UseDocumentoFiltersReturn {
  // Estado
  state: UseDocumentoFiltersState;
  
  // Acciones de filtros
  updateFilter: (key: keyof DocumentoFilterState, value: any) => void;
  updateMultipleFilters: (filters: Partial<DocumentoFilterState>) => void;
  clearFilter: (key: keyof DocumentoFilterState) => void;
  clearAllFilters: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
  
  // Acciones de búsqueda
  setSearch: (search: string) => void;
  clearSearch: () => void;
  
  // Acciones de ordenamiento
  setSorting: (field: keyof Documento, order?: 'asc' | 'desc') => void;
  toggleSortOrder: (field: keyof Documento) => void;
  clearSorting: () => void;
  
  // Acciones de paginación
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Presets
  presets: FilterPreset[];
  applyPreset: (presetId: string) => void;
  savePreset: (name: string, description: string) => void;
  
  // Utilidades
  getActiveFiltersCount: () => number;
  getFilterSummary: () => string;
  exportFilters: () => string;
  importFilters: (filtersJson: string) => boolean;
  
  // Validaciones
  isValidDateRange: () => boolean;
  hasConflictingFilters: () => boolean;
  
  // Acciones de tipos
  loadDocumentTypes: () => Promise<void>;
  getTypesForPersona: (tipoPersona: TipoPersona) => DocumentoTipo[];
}

// ==================== CONSTANTES ====================

const DEFAULT_FILTERS: DocumentoFilterState = {
  search: '',
  estatus: undefined,
  documento_tipo_id: undefined,
  cliente_id: undefined,
  fecha_subida_desde: undefined,
  fecha_subida_hasta: undefined,
  fecha_expiracion_desde: undefined,
  fecha_expiracion_hasta: undefined,
  proximo_vencer: false,
  dias_vencimiento: undefined,
  tipo_persona: undefined,
  sortField: 'fecha_subida',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20
};

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'pending',
    name: 'Pendientes',
    description: 'Documentos pendientes de revisión',
    filters: { estatus: ['pendiente'] },
    icon: '⏳'
  },
  {
    id: 'accepted',
    name: 'Aceptados',
    description: 'Documentos aceptados',
    filters: { estatus: ['aceptado'] },
    icon: '✅'
  },
  {
    id: 'rejected',
    name: 'Rechazados',
    description: 'Documentos rechazados',
    filters: { estatus: ['rechazado'] },
    icon: '❌'
  },
  {
    id: 'expired',
    name: 'Vencidos',
    description: 'Documentos vencidos',
    filters: { estatus: ['vencido'] },
    icon: '⏰'
  },
  {
    id: 'expiring_soon',
    name: 'Próximos a vencer',
    description: 'Documentos próximos a vencer',
    filters: { proximo_vencer: true },
    icon: '⚠️'
  },
  {
    id: 'recent',
    name: 'Recientes',
    description: 'Documentos subidos en los últimos 7 días',
    filters: {
      fecha_subida_desde: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      sortField: 'fecha_subida',
      sortOrder: 'desc'
    },
    icon: '🆕'
  }
];

// ==================== HOOK PRINCIPAL ====================

export function useDocumentoFilters(options: UseDocumentoFiltersOptions = {}) {
  const {
    initialFilters = {},
    autoApply = true,
    debounceMs = 300,
    enableSearch = true,
    enableSorting = true,
    enablePagination = true,
    defaultPageSize = 20,
    onFiltersChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseDocumentoFiltersState>(() => {
    const filters = {
      ...DEFAULT_FILTERS,
      ...(defaultPageSize && { pageSize: defaultPageSize }),
      ...initialFilters
    };

    return {
      filters,
      appliedFilters: { ...filters },
      availableTypes: [],
      isLoading: false,
      hasActiveFilters: false,
      resultCount: 0,
      error: null
    };
  });

  const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

  // ==================== UTILIDADES ====================

  const hasActiveFilters = useCallback((filters: DocumentoFilterState): boolean => {
    const defaultState = DEFAULT_FILTERS;
    
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'page' || key === 'pageSize') return false;
      if (key === 'sortField' || key === 'sortOrder') return false;
      
      const defaultValue = defaultState[key as keyof DocumentoFilterState];
      
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'boolean' && !value) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      
      return value !== defaultValue;
    });
  }, []);

  const updateHasActiveFilters = useCallback((filters: DocumentoFilterState) => {
    setState(prev => ({
      ...prev,
      hasActiveFilters: hasActiveFilters(filters)
    }));
  }, [hasActiveFilters]);

  // ==================== ACCIONES DE FILTROS ====================

  const updateFilter = useCallback((key: keyof DocumentoFilterState, value: any) => {
    setState(prev => {
      const newFilters = { ...prev.filters, [key]: value };
      
      // Reset page when changing filters (except for page and pageSize)
      if (key !== 'page' && key !== 'pageSize' && enablePagination) {
        newFilters.page = 1;
      }

      return {
        ...prev,
        filters: newFilters
      };
    });

    // Auto-apply with debounce if enabled
    if (autoApply) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      const newTimeout = setTimeout(() => {
        applyFilters();
      }, debounceMs);

      setDebounceTimeout(newTimeout);
    }
  }, [autoApply, debounceMs, debounceTimeout, enablePagination]);

  const updateMultipleFilters = useCallback((filters: Partial<DocumentoFilterState>) => {
    setState(prev => {
      const newFilters = { ...prev.filters, ...filters };
      
      // Reset page when changing filters
      if (enablePagination && !filters.page) {
        newFilters.page = 1;
      }

      return {
        ...prev,
        filters: newFilters
      };
    });

    if (autoApply) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      const newTimeout = setTimeout(() => {
        applyFilters();
      }, debounceMs);

      setDebounceTimeout(newTimeout);
    }
  }, [autoApply, debounceMs, debounceTimeout, enablePagination]);

  const clearFilter = useCallback((key: keyof DocumentoFilterState) => {
    const defaultValue = DEFAULT_FILTERS[key];
    updateFilter(key, defaultValue);
  }, [updateFilter]);

  const clearAllFilters = useCallback(() => {
    const resetFilters = {
      ...DEFAULT_FILTERS,
      ...(defaultPageSize && { pageSize: defaultPageSize })
    };

    setState(prev => ({
      ...prev,
      filters: resetFilters
    }));

    if (autoApply) {
      applyFilters();
    }
  }, [autoApply, defaultPageSize]);

  const applyFilters = useCallback(() => {
    setState(prev => {
      const appliedFilters = { ...prev.filters };
      updateHasActiveFilters(appliedFilters);
      
      if (onFiltersChange) {
        onFiltersChange(appliedFilters);
      }

      return {
        ...prev,
        appliedFilters
      };
    });
  }, [onFiltersChange, updateHasActiveFilters]);

  const resetFilters = useCallback(() => {
    const resetState = {
      ...DEFAULT_FILTERS,
      ...(defaultPageSize && { pageSize: defaultPageSize }),
      ...initialFilters
    };

    setState(prev => ({
      ...prev,
      filters: resetState,
      appliedFilters: { ...resetState }
    }));

    if (onFiltersChange) {
      onFiltersChange(resetState);
    }
  }, [defaultPageSize, initialFilters, onFiltersChange]);

  // ==================== ACCIONES DE BÚSQUEDA ====================

  const setSearch = useCallback((search: string) => {
    if (enableSearch) {
      updateFilter('search', search);
    }
  }, [enableSearch, updateFilter]);

  const clearSearch = useCallback(() => {
    if (enableSearch) {
      updateFilter('search', '');
    }
  }, [enableSearch, updateFilter]);

  // ==================== ACCIONES DE ORDENAMIENTO ====================

  const setSorting = useCallback((field: keyof Documento, order: 'asc' | 'desc' = 'desc') => {
    if (enableSorting) {
      updateMultipleFilters({
        sortField: field,
        sortOrder: order
      });
    }
  }, [enableSorting, updateMultipleFilters]);

  const toggleSortOrder = useCallback((field: keyof Documento) => {
    if (enableSorting) {
      setState(prev => {
        const newOrder = prev.filters.sortField === field 
          ? (prev.filters.sortOrder === 'asc' ? 'desc' : 'asc')
          : 'desc';

        updateMultipleFilters({
          sortField: field,
          sortOrder: newOrder
        });

        return prev;
      });
    }
  }, [enableSorting, updateMultipleFilters]);

  const clearSorting = useCallback(() => {
    if (enableSorting) {
      updateMultipleFilters({
        sortField: DEFAULT_FILTERS.sortField,
        sortOrder: DEFAULT_FILTERS.sortOrder
      });
    }
  }, [enableSorting, updateMultipleFilters]);

  // ==================== ACCIONES DE PAGINACIÓN ====================

  const setPage = useCallback((page: number) => {
    if (enablePagination) {
      updateFilter('page', Math.max(1, page));
    }
  }, [enablePagination, updateFilter]);

  const setPageSize = useCallback((size: number) => {
    if (enablePagination) {
      updateMultipleFilters({
        pageSize: Math.max(1, size),
        page: 1
      });
    }
  }, [enablePagination, updateMultipleFilters]);

  const nextPage = useCallback(() => {
    if (enablePagination) {
      setState(prev => {
        const nextPageNum = (prev.filters.page || 1) + 1;
        updateFilter('page', nextPageNum);
        return prev;
      });
    }
  }, [enablePagination, updateFilter]);

  const prevPage = useCallback(() => {
    if (enablePagination) {
      setState(prev => {
        const prevPageNum = Math.max(1, (prev.filters.page || 1) - 1);
        updateFilter('page', prevPageNum);
        return prev;
      });
    }
  }, [enablePagination, updateFilter]);

  // ==================== PRESETS ====================

  const applyPreset = useCallback((presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      updateMultipleFilters(preset.filters);
    }
  }, [updateMultipleFilters]);

  const savePreset = useCallback((name: string, description: string) => {
    // TODO: Implementar guardado de presets personalizados
    console.log('Guardando preset:', { name, description, filters: state.filters });
  }, [state.filters]);

  // ==================== UTILIDADES COMPUTADAS ====================

  const getActiveFiltersCount = useCallback((): number => {
    const filters = state.filters;
    let count = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'page' || key === 'pageSize' || key === 'sortField' || key === 'sortOrder') return;
      
      if (value !== undefined && value !== null && value !== '' && 
          !(typeof value === 'boolean' && !value) &&
          !(Array.isArray(value) && value.length === 0)) {
        count++;
      }
    });

    return count;
  }, [state.filters]);

  const getFilterSummary = useCallback((): string => {
    const active = getActiveFiltersCount();
    if (active === 0) return 'Sin filtros activos';
    if (active === 1) return '1 filtro activo';
    return `${active} filtros activos`;
  }, [getActiveFiltersCount]);

  const exportFilters = useCallback((): string => {
    return JSON.stringify(state.filters, null, 2);
  }, [state.filters]);

  const importFilters = useCallback((filtersJson: string): boolean => {
    try {
      const imported = JSON.parse(filtersJson);
      updateMultipleFilters(imported);
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al importar filtros: formato inválido'
      }));
      return false;
    }
  }, [updateMultipleFilters]);

  // ==================== VALIDACIONES ====================

  const isValidDateRange = useCallback((): boolean => {
    const filters = state.filters;
    
    // Validar rango de fecha de subida
    if (filters.fecha_subida_desde && filters.fecha_subida_hasta) {
      if (filters.fecha_subida_desde > filters.fecha_subida_hasta) {
        return false;
      }
    }

    // Validar rango de fecha de expiración
    if (filters.fecha_expiracion_desde && filters.fecha_expiracion_hasta) {
      if (filters.fecha_expiracion_desde > filters.fecha_expiracion_hasta) {
        return false;
      }
    }

    return true;
  }, [state.filters]);

  const hasConflictingFilters = useCallback((): boolean => {
    const filters = state.filters;
    
    // Conflicto: múltiples valores de estatus incompatibles
    if (filters.estatus && filters.estatus.length > 1) {
      const hasVencido = filters.estatus.includes('vencido');
      const hasPendiente = filters.estatus.includes('pendiente');
      if (hasVencido && hasPendiente) {
        return true;
      }
    }

    return false;
  }, [state.filters]);

  // ==================== ACCIONES DE TIPOS ====================

  const loadDocumentTypes = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const types = await documentoService.getTiposDocumento();
      setState(prev => ({
        ...prev,
        availableTypes: types,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al cargar tipos de documento',
        isLoading: false
      }));
    }
  }, []);

  const getTypesForPersona = useCallback((tipoPersona: TipoPersona): DocumentoTipo[] => {
    return state.availableTypes.filter(tipo => {
      switch (tipoPersona) {
        case 'PF':
          return tipo.aplica_pf;
        case 'PF_AE':
          return tipo.aplica_pfae;
        case 'PM':
          return tipo.aplica_pm;
        default:
          return true;
      }
    });
  }, [state.availableTypes]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    loadDocumentTypes();
  }, [loadDocumentTypes]);

  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // ==================== RETORNO ====================

  return {
    state,
    updateFilter,
    updateMultipleFilters,
    clearFilter,
    clearAllFilters,
    applyFilters,
    resetFilters,
    setSearch,
    clearSearch,
    setSorting,
    toggleSortOrder,
    clearSorting,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    presets: FILTER_PRESETS,
    applyPreset,
    savePreset,
    getActiveFiltersCount,
    getFilterSummary,
    exportFilters,
    importFilters,
    isValidDateRange,
    hasConflictingFilters,
    loadDocumentTypes,
    getTypesForPersona
  };
}