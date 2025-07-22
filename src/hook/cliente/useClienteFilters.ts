import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from '../../utils';
import type { 
  Cliente, 
  ClienteFilter, 
  TipoPersona 
} from '../../types';

// ==================== INTERFACES ====================

export interface UseClienteFiltersState {
  filtros: ClienteFilter;
  filtrosActivos: string[];
  resultadosFiltrados: Cliente[];
  totalResultados: number;
  searchQuery: string;
  isFiltering: boolean;
}

export interface UseClienteFiltersOptions {
  clientes: Cliente[];
  onFiltersChange?: (filtros: ClienteFilter) => void;
  persistFilters?: boolean;
  storageKey?: string;
  debounceDelay?: number;
}

export interface UseClienteFiltersReturn {
  // Estado
  state: UseClienteFiltersState;
  
  // Acciones de filtros
  updateFilter: <K extends keyof ClienteFilter>(key: K, value: ClienteFilter[K]) => void;
  updateMultipleFilters: (filtros: Partial<ClienteFilter>) => void;
  clearFilter: (key: keyof ClienteFilter) => void;
  clearAllFilters: () => void;
  resetFilters: () => void;
  
  // Búsqueda
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Filtros predefinidos
  filtrosPredefinidos: {
    personasFisicas: () => void;
    personasMorales: () => void;
    clientesCompletos: () => void;
    clientesIncompletos: () => void;
    clientesRecientes: () => void;
    clientesConSolicitudes: () => void;
    clientesSinSolicitudes: () => void;
  };
  
  // Utilidades
  toggleTipoPersona: (tipo: TipoPersona) => void;
  toggleEstado: (estado: string) => void;
  isFilterActive: (key: keyof ClienteFilter) => boolean;
  getFilterValue: <K extends keyof ClienteFilter>(key: K) => ClienteFilter[K];
  
  // Resumen de filtros
  resumenFiltros: {
    total: number;
    porTipo: Record<TipoPersona, number>;
    porEstado: Record<string, number>;
    conCompletitudBaja: number;
    conSolicitudes: number;
  };
}

// ==================== CONSTANTES ====================

const FILTROS_INICIALES: ClienteFilter = {
  tipo_persona: undefined,
  estado: undefined,
  codigo_postal: undefined,
  fecha_registro_desde: undefined,
  fecha_registro_hasta: undefined,
  completitud_minima: undefined,
  tiene_solicitudes: undefined,
  search: undefined
};

const STORAGE_KEY_DEFAULT = 'cliente_filtros';

// ==================== HOOK PRINCIPAL ====================

export function useClienteFilters(options: UseClienteFiltersOptions): UseClienteFiltersReturn {
  const {
    clientes = [],
    onFiltersChange,
    persistFilters = true,
    storageKey = STORAGE_KEY_DEFAULT,
    debounceDelay = 300
  } = options;

  // ==================== ESTADO ====================

  const [filtros, setFiltros] = useState<ClienteFilter>(() => {
    if (persistFilters) {
      try {
        const savedFilters = localStorage.getItem(storageKey);
        return savedFilters ? JSON.parse(savedFilters) : FILTROS_INICIALES;
      } catch {
        return FILTROS_INICIALES;
      }
    }
    return FILTROS_INICIALES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // ==================== FILTRADO DE CLIENTES ====================

  const resultadosFiltrados = useMemo(() => {
    setIsFiltering(true);
    
    let resultado = [...clientes];

    // Filtro de tipo de persona
    if (filtros.tipo_persona && filtros.tipo_persona.length > 0) {
      resultado = resultado.filter(cliente => 
        filtros.tipo_persona!.includes(cliente.tipo_persona)
      );
    }

    // Filtro de estado
    if (filtros.estado && filtros.estado.length > 0) {
      resultado = resultado.filter(cliente => 
        cliente.estado && filtros.estado!.includes(cliente.estado)
      );
    }

    // Filtro de código postal
    if (filtros.codigo_postal) {
      resultado = resultado.filter(cliente => 
        cliente.codigo_postal?.includes(filtros.codigo_postal!)
      );
    }

    // Filtro de fecha de registro
    if (filtros.fecha_registro_desde) {
      resultado = resultado.filter(cliente => 
        new Date(cliente.created_at) >= new Date(filtros.fecha_registro_desde!)
      );
    }

    if (filtros.fecha_registro_hasta) {
      resultado = resultado.filter(cliente => 
        new Date(cliente.created_at) <= new Date(filtros.fecha_registro_hasta!)
      );
    }

    // Filtro de solicitudes
    if (filtros.tiene_solicitudes !== undefined) {
      resultado = resultado.filter(cliente => {
        const tieneSolicitudes = cliente.solicitudes && cliente.solicitudes.length > 0;
        return filtros.tiene_solicitudes ? tieneSolicitudes : !tieneSolicitudes;
      });
    }

    // Búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      resultado = resultado.filter(cliente => {
        const searchFields = [
          cliente.rfc,
          cliente.correo,
          cliente.nombre,
          cliente.apellido_paterno,
          cliente.apellido_materno,
          cliente.razon_social,
          cliente.representante_legal,
          cliente.telefono,
          cliente.curp
        ].filter(Boolean).join(' ').toLowerCase();

        return searchFields.includes(query);
      });
    }

    setTimeout(() => setIsFiltering(false), 100);
    return resultado;
  }, [clientes, filtros, searchQuery]);

  // ==================== FILTROS ACTIVOS ====================

  const filtrosActivos = useMemo(() => {
    const activos: string[] = [];
    
    if (filtros.tipo_persona && filtros.tipo_persona.length > 0) {
      activos.push(`Tipo: ${filtros.tipo_persona.join(', ')}`);
    }
    
    if (filtros.estado && filtros.estado.length > 0) {
      activos.push(`Estado: ${filtros.estado.join(', ')}`);
    }
    
    if (filtros.codigo_postal) {
      activos.push(`CP: ${filtros.codigo_postal}`);
    }
    
    if (filtros.fecha_registro_desde) {
      activos.push(`Desde: ${new Date(filtros.fecha_registro_desde).toLocaleDateString()}`);
    }
    
    if (filtros.fecha_registro_hasta) {
      activos.push(`Hasta: ${new Date(filtros.fecha_registro_hasta).toLocaleDateString()}`);
    }
    
    if (filtros.completitud_minima !== undefined) {
      activos.push(`Completitud: ${filtros.completitud_minima}%+`);
    }
    
    if (filtros.tiene_solicitudes !== undefined) {
      activos.push(filtros.tiene_solicitudes ? 'Con solicitudes' : 'Sin solicitudes');
    }
    
    if (searchQuery.trim()) {
      activos.push(`Búsqueda: "${searchQuery}"`);
    }
    
    return activos;
  }, [filtros, searchQuery]);

  // ==================== RESUMEN DE FILTROS ====================

  const resumenFiltros = useMemo(() => {
    const porTipo = resultadosFiltrados.reduce((acc, cliente) => {
      acc[cliente.tipo_persona] = (acc[cliente.tipo_persona] || 0) + 1;
      return acc;
    }, {} as Record<TipoPersona, number>);

    const porEstado = resultadosFiltrados.reduce((acc, cliente) => {
      const estado = cliente.estado || 'Sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: resultadosFiltrados.length,
      porTipo,
      porEstado,
      conCompletitudBaja: 0, // TODO: Implementar cuando tengamos completitud
      conSolicitudes: resultadosFiltrados.filter(c => c.solicitudes && c.solicitudes.length > 0).length
    };
  }, [resultadosFiltrados]);

  // ==================== ACCIONES ====================

  const updateFilter = useCallback(<K extends keyof ClienteFilter>(
    key: K, 
    value: ClienteFilter[K]
  ) => {
    setFiltros(prev => {
      const newFilters = { ...prev, [key]: value };
      
      if (persistFilters) {
        localStorage.setItem(storageKey, JSON.stringify(newFilters));
      }
      
      onFiltersChange?.(newFilters);
      return newFilters;
    });
  }, [persistFilters, storageKey, onFiltersChange]);

  const updateMultipleFilters = useCallback((newFilters: Partial<ClienteFilter>) => {
    setFiltros(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      if (persistFilters) {
        localStorage.setItem(storageKey, JSON.stringify(updatedFilters));
      }
      
      onFiltersChange?.(updatedFilters);
      return updatedFilters;
    });
  }, [persistFilters, storageKey, onFiltersChange]);

  const clearFilter = useCallback((key: keyof ClienteFilter) => {
    updateFilter(key, undefined);
  }, [updateFilter]);

  const clearAllFilters = useCallback(() => {
    setFiltros(FILTROS_INICIALES);
    setSearchQuery('');
    
    if (persistFilters) {
      localStorage.removeItem(storageKey);
    }
    
    onFiltersChange?.(FILTROS_INICIALES);
  }, [persistFilters, storageKey, onFiltersChange]);

  const resetFilters = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  // Búsqueda con debounce
  const debouncedSetSearch = useCallback(
    debounce((query: string) => {
      updateFilter('search', query || undefined);
    }, debounceDelay),
    [updateFilter, debounceDelay]
  );

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  }, [debouncedSetSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    updateFilter('search', undefined);
  }, [updateFilter]);

  // ==================== FILTROS PREDEFINIDOS ====================

  const filtrosPredefinidos = {
    personasFisicas: useCallback(() => {
      updateFilter('tipo_persona', ['PF', 'PF_AE']);
    }, [updateFilter]),

    personasMorales: useCallback(() => {
      updateFilter('tipo_persona', ['PM']);
    }, [updateFilter]),

    clientesCompletos: useCallback(() => {
      updateFilter('completitud_minima', 90);
    }, [updateFilter]),

    clientesIncompletos: useCallback(() => {
      updateFilter('completitud_minima', 50);
    }, [updateFilter]),

    clientesRecientes: useCallback(() => {
      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
      updateFilter('fecha_registro_desde', treintaDiasAtras);
    }, [updateFilter]),

    clientesConSolicitudes: useCallback(() => {
      updateFilter('tiene_solicitudes', true);
    }, [updateFilter]),

    clientesSinSolicitudes: useCallback(() => {
      updateFilter('tiene_solicitudes', false);
    }, [updateFilter])
  };

  // ==================== UTILIDADES ====================

  const toggleTipoPersona = useCallback((tipo: TipoPersona) => {
    const tiposActuales = filtros.tipo_persona || [];
    const nuevosTipos = tiposActuales.includes(tipo)
      ? tiposActuales.filter(t => t !== tipo)
      : [...tiposActuales, tipo];
    
    updateFilter('tipo_persona', nuevosTipos.length > 0 ? nuevosTipos : undefined);
  }, [filtros.tipo_persona, updateFilter]);

  const toggleEstado = useCallback((estado: string) => {
    const estadosActuales = filtros.estado || [];
    const nuevosEstados = estadosActuales.includes(estado)
      ? estadosActuales.filter(e => e !== estado)
      : [...estadosActuales, estado];
    
    updateFilter('estado', nuevosEstados.length > 0 ? nuevosEstados : undefined);
  }, [filtros.estado, updateFilter]);

  const isFilterActive = useCallback((key: keyof ClienteFilter): boolean => {
    const value = filtros[key];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  }, [filtros]);

  const getFilterValue = useCallback(<K extends keyof ClienteFilter>(
    key: K
  ): ClienteFilter[K] => {
    return filtros[key];
  }, [filtros]);

  // ==================== EFECTOS ====================

  // Sincronizar con filtros externos
  useEffect(() => {
    if (filtros.search !== searchQuery) {
      setSearchQuery(filtros.search || '');
    }
  }, [filtros.search]);

  // ==================== ESTADO COMPUTADO ====================

  const state: UseClienteFiltersState = {
    filtros,
    filtrosActivos,
    resultadosFiltrados,
    totalResultados: resultadosFiltrados.length,
    searchQuery,
    isFiltering
  };

  // ==================== RETORNO ====================

  return {
    state,
    updateFilter,
    updateMultipleFilters,
    clearFilter,
    clearAllFilters,
    resetFilters,
    setSearchQuery: handleSetSearchQuery,
    clearSearch,
    filtrosPredefinidos,
    toggleTipoPersona,
    toggleEstado,
    isFilterActive,
    getFilterValue,
    resumenFiltros
  };
}
