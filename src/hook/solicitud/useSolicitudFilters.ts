import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from '../../utils';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { 
  SolicitudFilter, 
  EstatusSolicitud,
  ProductoCodigo
} from '../../types';

// ==================== INTERFACES ====================

export interface UseSolicitudFiltersState {
  filtros: SolicitudFilter;
  filtrosActivos: string[];
  resultadosFiltrados: SolicitudCompleta[];
  totalResultados: number;
  searchQuery: string;
  isFiltering: boolean;
}

export interface UseSolicitudFiltersOptions {
  solicitudes: SolicitudCompleta[];
  onFiltersChange?: (filtros: SolicitudFilter) => void;
  persistFilters?: boolean;
  storageKey?: string;
  debounceDelay?: number;
}

export interface UseSolicitudFiltersReturn {
  // Estado
  state: UseSolicitudFiltersState;
  
  // Acciones de filtrado
  updateFilter: <K extends keyof SolicitudFilter>(key: K, value: SolicitudFilter[K]) => void;
  updateMultipleFilters: (filtros: Partial<SolicitudFilter>) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof SolicitudFilter) => void;
  
  // Búsqueda
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Filtros predefinidos
  aplicarFiltroEstatus: (estatus: EstatusSolicitud[]) => void;
  aplicarFiltroProducto: (productos: ProductoCodigo[]) => void;
  aplicarFiltroFechas: (desde: Date, hasta: Date) => void;
  aplicarFiltroMonto: (min: number, max: number) => void;
  
  // Presets de filtros
  mostrarSoloPendientes: () => void;
  mostrarSoloAprobadas: () => void;
  mostrarSoloRechazadas: () => void;
  mostrarEstesMes: () => void;
  mostrarMontoAlto: () => void;
  
  // Utilidades
  toggleEstatus: (estatus: EstatusSolicitud) => void;
  toggleProducto: (producto: ProductoCodigo) => void;
  isFilterActive: (key: keyof SolicitudFilter) => boolean;
  getFilterValue: <K extends keyof SolicitudFilter>(key: K) => SolicitudFilter[K];
  
  // Exportación/Importación
  exportarFiltros: () => string;
  importarFiltros: (filtrosJson: string) => boolean;
  
  // Resumen de filtros
  resumenFiltros: {
    total: number;
    porEstatus: Record<EstatusSolicitud, number>;
    porProducto: Record<ProductoCodigo, number>;
    montoPromedio: number;
    fechasMasRecientes: SolicitudCompleta[];
  };
}

// ==================== CONSTANTES ====================

const FILTROS_INICIALES: SolicitudFilter = {
  cliente_id: undefined,
  estatus: undefined,
  producto_codigo: undefined,
  fecha_creacion_desde: undefined,
  fecha_creacion_hasta: undefined,
  fecha_actualizacion_desde: undefined,
  fecha_actualizacion_hasta: undefined,
  monto_minimo: undefined,
  monto_maximo: undefined,
  moneda: undefined,
  asignado_a: undefined,
  search: undefined
};

const STORAGE_KEY_DEFAULT = 'solicitud_filtros';

const MONTO_ALTO_THRESHOLD = 1000000; // 1 millón

// ==================== HOOK PRINCIPAL ====================

export function useSolicitudFilters(options: UseSolicitudFiltersOptions): UseSolicitudFiltersReturn {
  const {
    solicitudes,
    onFiltersChange,
    persistFilters = false,
    storageKey = STORAGE_KEY_DEFAULT,
    debounceDelay = 300
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseSolicitudFiltersState>(() => {
    const filtrosGuardados = persistFilters 
      ? localStorage.getItem(storageKey)
      : null;
    
    const filtrosIniciales = filtrosGuardados 
      ? JSON.parse(filtrosGuardados)
      : FILTROS_INICIALES;

    return {
      filtros: filtrosIniciales,
      filtrosActivos: [],
      resultadosFiltrados: [],
      totalResultados: 0,
      searchQuery: filtrosIniciales.search || '',
      isFiltering: false
    };
  });

  // ==================== UTILIDADES DE FILTRADO ====================

  const aplicarFiltros = useCallback((filtros: SolicitudFilter, query: string): SolicitudCompleta[] => {
    let resultado = [...solicitudes];

    // Filtro por cliente
    if (filtros.cliente_id) {
      resultado = resultado.filter(sol => sol.cliente_id === filtros.cliente_id);
    }

    // Filtro por estatus
    if (filtros.estatus && filtros.estatus.length > 0) {
      resultado = resultado.filter(sol => filtros.estatus!.includes(sol.estatus));
    }

    // Filtro por producto
    if (filtros.producto_codigo && filtros.producto_codigo.length > 0) {
      resultado = resultado.filter(sol => 
        sol.productos?.some(prod => filtros.producto_codigo!.includes(prod.producto))
      );
    }

    // Filtro por fechas de creación
    if (filtros.fecha_creacion_desde) {
      resultado = resultado.filter(sol => 
        new Date(sol.fecha_creacion) >= filtros.fecha_creacion_desde!
      );
    }
    if (filtros.fecha_creacion_hasta) {
      resultado = resultado.filter(sol => 
        new Date(sol.fecha_creacion) <= filtros.fecha_creacion_hasta!
      );
    }

    // Filtro por fechas de actualización
    if (filtros.fecha_actualizacion_desde) {
      resultado = resultado.filter(sol => 
        new Date(sol.fecha_actualizacion) >= filtros.fecha_actualizacion_desde!
      );
    }
    if (filtros.fecha_actualizacion_hasta) {
      resultado = resultado.filter(sol => 
        new Date(sol.fecha_actualizacion) <= filtros.fecha_actualizacion_hasta!
      );
    }

    // Filtro por monto
    if (filtros.monto_minimo || filtros.monto_maximo) {
      resultado = resultado.filter(sol => {
        const montoTotal = sol.productos?.reduce((sum, prod) => sum + prod.monto, 0) || 0;
        
        if (filtros.monto_minimo && montoTotal < filtros.monto_minimo) return false;
        if (filtros.monto_maximo && montoTotal > filtros.monto_maximo) return false;
        
        return true;
      });
    }

    // Filtro por moneda
    if (filtros.moneda && filtros.moneda.length > 0) {
      // Asumiendo que todas las solicitudes son en MXN por ahora
      // Esto se puede expandir cuando se implemente multi-moneda
    }

    // Filtro por asignado
    if (filtros.asignado_a) {
      // TODO: Implementar cuando se agregue el campo de asignación
    }

    // Búsqueda de texto
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      resultado = resultado.filter(sol => {
        const searchFields = [
          sol.solicitud_id.toString(),
          sol.estatus,
          sol.productos?.map(p => p.producto).join(' ') || ''
        ];
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
      });
    }

    return resultado;
  }, [solicitudes]);

  const calcularFiltrosActivos = useCallback((filtros: SolicitudFilter): string[] => {
    const activos: string[] = [];
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          activos.push(key);
        } else if (!Array.isArray(value)) {
          activos.push(key);
        }
      }
    });
    
    return activos;
  }, []);

  // ==================== ACCIONES DE FILTRADO ====================

  const updateFilter = useCallback(<K extends keyof SolicitudFilter>(
    key: K, 
    value: SolicitudFilter[K]
  ) => {
    setState(prev => {
      const nuevosFiltros = { ...prev.filtros, [key]: value };
      const filtrosActivos = calcularFiltrosActivos(nuevosFiltros);
      
      if (persistFilters) {
        localStorage.setItem(storageKey, JSON.stringify(nuevosFiltros));
      }
      
      return {
        ...prev,
        filtros: nuevosFiltros,
        filtrosActivos,
        isFiltering: true
      };
    });
  }, [calcularFiltrosActivos, persistFilters, storageKey]);

  const updateMultipleFilters = useCallback((filtros: Partial<SolicitudFilter>) => {
    setState(prev => {
      const nuevosFiltros = { ...prev.filtros, ...filtros };
      const filtrosActivos = calcularFiltrosActivos(nuevosFiltros);
      
      if (persistFilters) {
        localStorage.setItem(storageKey, JSON.stringify(nuevosFiltros));
      }
      
      return {
        ...prev,
        filtros: nuevosFiltros,
        filtrosActivos,
        isFiltering: true
      };
    });
  }, [calcularFiltrosActivos, persistFilters, storageKey]);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filtros: FILTROS_INICIALES,
      filtrosActivos: [],
      searchQuery: '',
      isFiltering: false
    }));
    
    if (persistFilters) {
      localStorage.removeItem(storageKey);
    }
  }, [persistFilters, storageKey]);

  const clearFilter = useCallback((key: keyof SolicitudFilter) => {
    updateFilter(key, undefined as any);
  }, [updateFilter]);

  // ==================== BÚSQUEDA ====================

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setState(prev => ({
        ...prev,
        filtros: { ...prev.filtros, search: query },
        isFiltering: true
      }));
    }, debounceDelay),
    [debounceDelay]
  );

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    debouncedSearch(query);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      filtros: { ...prev.filtros, search: undefined }
    }));
  }, []);

  // ==================== FILTROS PREDEFINIDOS ====================

  const aplicarFiltroEstatus = useCallback((estatus: EstatusSolicitud[]) => {
    updateFilter('estatus', estatus);
  }, [updateFilter]);

  const aplicarFiltroProducto = useCallback((productos: ProductoCodigo[]) => {
    updateFilter('producto_codigo', productos);
  }, [updateFilter]);

  const aplicarFiltroFechas = useCallback((desde: Date, hasta: Date) => {
    updateMultipleFilters({
      fecha_creacion_desde: desde,
      fecha_creacion_hasta: hasta
    });
  }, [updateMultipleFilters]);

  const aplicarFiltroMonto = useCallback((min: number, max: number) => {
    updateMultipleFilters({
      monto_minimo: min,
      monto_maximo: max
    });
  }, [updateMultipleFilters]);

  // ==================== PRESETS DE FILTROS ====================

  const mostrarSoloPendientes = useCallback(() => {
    aplicarFiltroEstatus(['iniciada', 'en_revision']);
  }, [aplicarFiltroEstatus]);

  const mostrarSoloAprobadas = useCallback(() => {
    aplicarFiltroEstatus(['aprobada']);
  }, [aplicarFiltroEstatus]);

  const mostrarSoloRechazadas = useCallback(() => {
    aplicarFiltroEstatus(['rechazada']);
  }, [aplicarFiltroEstatus]);

  const mostrarEstesMes = useCallback(() => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    
    aplicarFiltroFechas(inicioMes, finMes);
  }, [aplicarFiltroFechas]);

  const mostrarMontoAlto = useCallback(() => {
    updateFilter('monto_minimo', MONTO_ALTO_THRESHOLD);
  }, [updateFilter]);

  // ==================== UTILIDADES ====================

  const toggleEstatus = useCallback((estatus: EstatusSolicitud) => {
    const estatusActuales = state.filtros.estatus || [];
    const nuevoEstatus = estatusActuales.includes(estatus)
      ? estatusActuales.filter(e => e !== estatus)
      : [...estatusActuales, estatus];
    
    updateFilter('estatus', nuevoEstatus.length > 0 ? nuevoEstatus : undefined);
  }, [state.filtros.estatus, updateFilter]);

  const toggleProducto = useCallback((producto: ProductoCodigo) => {
    const productosActuales = state.filtros.producto_codigo || [];
    const nuevosProductos = productosActuales.includes(producto)
      ? productosActuales.filter(p => p !== producto)
      : [...productosActuales, producto];
    
    updateFilter('producto_codigo', nuevosProductos.length > 0 ? nuevosProductos : undefined);
  }, [state.filtros.producto_codigo, updateFilter]);

  const isFilterActive = useCallback((key: keyof SolicitudFilter): boolean => {
    return state.filtrosActivos.includes(key);
  }, [state.filtrosActivos]);

  const getFilterValue = useCallback(<K extends keyof SolicitudFilter>(key: K): SolicitudFilter[K] => {
    return state.filtros[key];
  }, [state.filtros]);

  // ==================== EXPORTACIÓN/IMPORTACIÓN ====================

  const exportarFiltros = useCallback((): string => {
    return JSON.stringify(state.filtros, null, 2);
  }, [state.filtros]);

  const importarFiltros = useCallback((filtrosJson: string): boolean => {
    try {
      const filtros = JSON.parse(filtrosJson);
      updateMultipleFilters(filtros);
      return true;
    } catch {
      return false;
    }
  }, [updateMultipleFilters]);

  // ==================== RESULTADOS FILTRADOS ====================

  const resultadosFiltrados = useMemo(() => {
    setState(prev => ({ ...prev, isFiltering: true }));
    
    const resultados = aplicarFiltros(state.filtros, state.searchQuery);
    
    setState(prev => ({ 
      ...prev, 
      resultadosFiltrados: resultados,
      totalResultados: resultados.length,
      isFiltering: false 
    }));

    return resultados;
  }, [solicitudes, state.filtros, state.searchQuery, aplicarFiltros]);

  // ==================== RESUMEN DE FILTROS ====================

  const resumenFiltros = useMemo(() => {
    const porEstatus = resultadosFiltrados.reduce((acc, sol) => {
      acc[sol.estatus] = (acc[sol.estatus] || 0) + 1;
      return acc;
    }, {} as Record<EstatusSolicitud, number>);

    const porProducto = resultadosFiltrados.reduce((acc, sol) => {
      sol.productos?.forEach(prod => {
        acc[prod.producto] = (acc[prod.producto] || 0) + 1;
      });
      return acc;
    }, {} as Record<ProductoCodigo, number>);

    const montoTotal = resultadosFiltrados.reduce((total, sol) => 
      total + (sol.productos?.reduce((sum, prod) => sum + prod.monto, 0) || 0), 0
    );
    
    const montoPromedio = resultadosFiltrados.length > 0 ? montoTotal / resultadosFiltrados.length : 0;

    const fechasMasRecientes = [...resultadosFiltrados]
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 5);

    return {
      total: resultadosFiltrados.length,
      porEstatus,
      porProducto,
      montoPromedio,
      fechasMasRecientes
    };
  }, [resultadosFiltrados]);

  // ==================== EFECTOS ====================

  // Notificar cambios de filtros
  useEffect(() => {
    onFiltersChange?.(state.filtros);
  }, [state.filtros, onFiltersChange]);

  // ==================== RETORNO ====================

  return {
    state: {
      ...state,
      resultadosFiltrados,
      totalResultados: resultadosFiltrados.length
    },
    updateFilter,
    updateMultipleFilters,
    clearFilters,
    clearFilter,
    setSearchQuery,
    clearSearch,
    aplicarFiltroEstatus,
    aplicarFiltroProducto,
    aplicarFiltroFechas,
    aplicarFiltroMonto,
    mostrarSoloPendientes,
    mostrarSoloAprobadas,
    mostrarSoloRechazadas,
    mostrarEstesMes,
    mostrarMontoAlto,
    toggleEstatus,
    toggleProducto,
    isFilterActive,
    getFilterValue,
    exportarFiltros,
    importarFiltros,
    resumenFiltros
  };
}
