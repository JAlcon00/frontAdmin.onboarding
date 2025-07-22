import { useState, useCallback, useEffect, useMemo } from 'react';
import { clienteService } from '../../services/cliente.service';
import type { 
  Cliente, 
  ClienteCompletitud, 
  TipoPersona 
} from '../../types';

// ==================== INTERFACES ====================

export interface CampoCompletitud {
  campo: string;
  nombre: string;
  requerido: boolean;
  completado: boolean;
  valor?: any;
  error?: string;
}

export interface SeccionCompletitud {
  seccion: string;
  nombre: string;
  campos: CampoCompletitud[];
  porcentaje: number;
  completado: boolean;
  errores: string[];
}

export interface UseClienteCompletitudState {
  cliente: Cliente | null;
  completitud: ClienteCompletitud | null;
  secciones: SeccionCompletitud[];
  loading: boolean;
  error: string | null;
  porcentajeTotal: number;
  puedeProcecer: boolean;
  camposFaltantes: string[];
  proximoPaso: string | null;
  lastUpdated: Date | null;
}

export interface UseClienteCompletitudOptions {
  cliente?: Cliente;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onCompletitudChange?: (completitud: ClienteCompletitud) => void;
  onErrorChange?: (error: string | null) => void;
}

export interface UseClienteCompletitudReturn {
  // Estado
  state: UseClienteCompletitudState;
  
  // Acciones
  refreshCompletitud: () => Promise<ClienteCompletitud | null>;
  validateSeccion: (seccion: string) => Promise<boolean>;
  validateCampo: (campo: string) => boolean;
  
  // Utilidades de completitud
  utils: {
    isSeccionCompleta: (seccion: string) => boolean;
    getCamposPendientes: (seccion?: string) => CampoCompletitud[];
    getSeccionPorcentaje: (seccion: string) => number;
    getPorcentajeTotal: () => number;
    getPrimerCampoIncompleto: () => CampoCompletitud | null;
    getProximaSeccion: () => SeccionCompletitud | null;
  };
  
  // Acciones de mejora
  sugerencias: {
    camposCriticos: CampoCompletitud[];
    accionesRecomendadas: string[];
    tiempoEstimado: string;
    impactoCompletitud: number;
  };
  
  // Estado de progreso
  progreso: {
    seccionesCompletas: number;
    seccionesTotales: number;
    camposCompletos: number;
    camposTotales: number;
    ultimaActualizacion: Date | null;
  };
}

// ==================== CONSTANTES ====================

const SECCIONES_POR_TIPO: Record<TipoPersona, {
  [key: string]: {
    nombre: string;
    campos: Array<{
      campo: string;
      nombre: string;
      requerido: boolean;
    }>;
  };
}> = {
  PF: {
    datos_basicos: {
      nombre: 'Datos Básicos',
      campos: [
        { campo: 'nombre', nombre: 'Nombre', requerido: true },
        { campo: 'apellido_paterno', nombre: 'Apellido Paterno', requerido: true },
        { campo: 'apellido_materno', nombre: 'Apellido Materno', requerido: false },
        { campo: 'fecha_nacimiento', nombre: 'Fecha de Nacimiento', requerido: false },
        { campo: 'curp', nombre: 'CURP', requerido: false }
      ]
    },
    contacto: {
      nombre: 'Información de Contacto',
      campos: [
        { campo: 'correo', nombre: 'Correo Electrónico', requerido: true },
        { campo: 'telefono', nombre: 'Teléfono', requerido: false }
      ]
    },
    identificacion: {
      nombre: 'Identificación Fiscal',
      campos: [
        { campo: 'rfc', nombre: 'RFC', requerido: true }
      ]
    },
    direccion: {
      nombre: 'Dirección',
      campos: [
        { campo: 'calle', nombre: 'Calle', requerido: false },
        { campo: 'numero_exterior', nombre: 'Número Exterior', requerido: false },
        { campo: 'colonia', nombre: 'Colonia', requerido: false },
        { campo: 'codigo_postal', nombre: 'Código Postal', requerido: false },
        { campo: 'ciudad', nombre: 'Ciudad', requerido: false },
        { campo: 'estado', nombre: 'Estado', requerido: false },
        { campo: 'pais', nombre: 'País', requerido: true }
      ]
    }
  },
  PF_AE: {
    datos_basicos: {
      nombre: 'Datos Básicos',
      campos: [
        { campo: 'nombre', nombre: 'Nombre', requerido: true },
        { campo: 'apellido_paterno', nombre: 'Apellido Paterno', requerido: true },
        { campo: 'apellido_materno', nombre: 'Apellido Materno', requerido: false },
        { campo: 'fecha_nacimiento', nombre: 'Fecha de Nacimiento', requerido: false },
        { campo: 'curp', nombre: 'CURP', requerido: false },
        { campo: 'razon_social', nombre: 'Razón Social', requerido: false }
      ]
    },
    contacto: {
      nombre: 'Información de Contacto',
      campos: [
        { campo: 'correo', nombre: 'Correo Electrónico', requerido: true },
        { campo: 'telefono', nombre: 'Teléfono', requerido: false }
      ]
    },
    identificacion: {
      nombre: 'Identificación Fiscal',
      campos: [
        { campo: 'rfc', nombre: 'RFC', requerido: true }
      ]
    },
    direccion: {
      nombre: 'Dirección',
      campos: [
        { campo: 'calle', nombre: 'Calle', requerido: false },
        { campo: 'numero_exterior', nombre: 'Número Exterior', requerido: false },
        { campo: 'colonia', nombre: 'Colonia', requerido: false },
        { campo: 'codigo_postal', nombre: 'Código Postal', requerido: false },
        { campo: 'ciudad', nombre: 'Ciudad', requerido: false },
        { campo: 'estado', nombre: 'Estado', requerido: false },
        { campo: 'pais', nombre: 'País', requerido: true }
      ]
    }
  },
  PM: {
    datos_basicos: {
      nombre: 'Datos de la Empresa',
      campos: [
        { campo: 'razon_social', nombre: 'Razón Social', requerido: true },
        { campo: 'representante_legal', nombre: 'Representante Legal', requerido: true },
        { campo: 'fecha_constitucion', nombre: 'Fecha de Constitución', requerido: false }
      ]
    },
    contacto: {
      nombre: 'Información de Contacto',
      campos: [
        { campo: 'correo', nombre: 'Correo Electrónico', requerido: true },
        { campo: 'telefono', nombre: 'Teléfono', requerido: false }
      ]
    },
    identificacion: {
      nombre: 'Identificación Fiscal',
      campos: [
        { campo: 'rfc', nombre: 'RFC', requerido: true }
      ]
    },
    direccion: {
      nombre: 'Dirección Fiscal',
      campos: [
        { campo: 'calle', nombre: 'Calle', requerido: false },
        { campo: 'numero_exterior', nombre: 'Número Exterior', requerido: false },
        { campo: 'colonia', nombre: 'Colonia', requerido: false },
        { campo: 'codigo_postal', nombre: 'Código Postal', requerido: false },
        { campo: 'ciudad', nombre: 'Ciudad', requerido: false },
        { campo: 'estado', nombre: 'Estado', requerido: false },
        { campo: 'pais', nombre: 'País', requerido: true }
      ]
    }
  }
};

// ==================== HOOK PRINCIPAL ====================

export function useClienteCompletitud(options: UseClienteCompletitudOptions = {}): UseClienteCompletitudReturn {
  const {
    cliente,
    autoRefresh = false,
    refreshInterval = 30000,
    onCompletitudChange,
    onErrorChange
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseClienteCompletitudState>({
    cliente: cliente || null,
    completitud: null,
    secciones: [],
    loading: false,
    error: null,
    porcentajeTotal: 0,
    puedeProcecer: false,
    camposFaltantes: [],
    proximoPaso: null,
    lastUpdated: null
  });

  // ==================== ACCIONES ====================

  const refreshCompletitud = useCallback(async (): Promise<ClienteCompletitud | null> => {
    if (!cliente?.cliente_id) {
      setState(prev => ({ 
        ...prev, 
        error: 'No hay cliente seleccionado',
        loading: false 
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const completitudServicio = await clienteService.validarCompletitud(cliente.cliente_id);
      
      // Mapear los datos del servicio al tipo esperado
      const completitudData: ClienteCompletitud = {
        cliente_id: completitudServicio.cliente_id,
        porcentaje_completitud: completitudServicio.completitud_porcentaje || 0,
        datos_basicos_completos: completitudServicio.datos_basicos_completos,
        direccion_completa: completitudServicio.direccion_completa,
        campos_faltantes: completitudServicio.documentos_faltantes || [],
        puede_proceder_onboarding: completitudServicio.puede_proceder
      };
      
      setState(prev => ({ 
        ...prev, 
        completitud: completitudData,
        loading: false,
        lastUpdated: new Date()
      }));

      onCompletitudChange?.(completitudData);
      return completitudData;

    } catch (error: any) {
      const errorMessage = error?.message || 'Error al obtener completitud';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false 
      }));

      onErrorChange?.(errorMessage);
      return null;
    }
  }, [cliente?.cliente_id, onCompletitudChange, onErrorChange]);

  const validateSeccion = useCallback(async (seccion: string): Promise<boolean> => {
    if (!cliente) return false;

    const seccionData = SECCIONES_POR_TIPO[cliente.tipo_persona]?.[seccion];
    if (!seccionData) return false;

    return seccionData.campos
      .filter(campo => campo.requerido)
      .every(campo => {
        const valor = (cliente as any)[campo.campo];
        return valor !== null && valor !== undefined && valor !== '';
      });
  }, [cliente]);

  const validateCampo = useCallback((campo: string): boolean => {
    if (!cliente) return false;

    const valor = (cliente as any)[campo];
    return valor !== null && valor !== undefined && valor !== '';
  }, [cliente]);

  // ==================== CÁLCULO DE SECCIONES ====================

  const secciones = useMemo((): SeccionCompletitud[] => {
    if (!cliente) return [];

    const tipoSecciones = SECCIONES_POR_TIPO[cliente.tipo_persona];
    
    return Object.entries(tipoSecciones).map(([key, seccionDef]) => {
      const campos: CampoCompletitud[] = seccionDef.campos.map(campoDef => {
        const valor = (cliente as any)[campoDef.campo];
        const completado = valor !== null && valor !== undefined && valor !== '';

        return {
          campo: campoDef.campo,
          nombre: campoDef.nombre,
          requerido: campoDef.requerido,
          completado,
          valor,
          error: !completado && campoDef.requerido ? `${campoDef.nombre} es requerido` : undefined
        };
      });

      const camposCompletos = campos.filter(c => c.completado).length;
      const camposRequeridos = campos.filter(c => c.requerido);
      const camposRequeridosCompletos = camposRequeridos.filter(c => c.completado).length;
      
      // Calcular porcentaje basado en campos requeridos + opcionales
      const porcentaje = campos.length > 0 
        ? Math.round((camposCompletos / campos.length) * 100)
        : 0;

      const completado = camposRequeridos.length === 0 || 
        camposRequeridosCompletos === camposRequeridos.length;

      const errores = campos
        .filter(c => c.error)
        .map(c => c.error!)
        .filter(Boolean);

      return {
        seccion: key,
        nombre: seccionDef.nombre,
        campos,
        porcentaje,
        completado,
        errores
      };
    });
  }, [cliente]);

  // ==================== UTILIDADES ====================

  const utils = useMemo(() => ({
    isSeccionCompleta: (seccion: string): boolean => {
      return secciones.find(s => s.seccion === seccion)?.completado || false;
    },

    getCamposPendientes: (seccionFiltro?: string): CampoCompletitud[] => {
      const seccionesFiltradas = seccionFiltro 
        ? secciones.filter(s => s.seccion === seccionFiltro)
        : secciones;

      return seccionesFiltradas
        .flatMap(s => s.campos)
        .filter(c => !c.completado);
    },

    getSeccionPorcentaje: (seccion: string): number => {
      return secciones.find(s => s.seccion === seccion)?.porcentaje || 0;
    },

    getPorcentajeTotal: (): number => {
      if (secciones.length === 0) return 0;
      
      const totalCampos = secciones.reduce((sum, s) => sum + s.campos.length, 0);
      const camposCompletos = secciones.reduce((sum, s) => 
        sum + s.campos.filter(c => c.completado).length, 0
      );
      
      return totalCampos > 0 ? Math.round((camposCompletos / totalCampos) * 100) : 0;
    },

    getPrimerCampoIncompleto: (): CampoCompletitud | null => {
      for (const seccion of secciones) {
        const campoIncompleto = seccion.campos.find(c => c.requerido && !c.completado);
        if (campoIncompleto) return campoIncompleto;
      }
      
      // Si no hay campos requeridos incompletos, buscar opcionales
      for (const seccion of secciones) {
        const campoIncompleto = seccion.campos.find(c => !c.completado);
        if (campoIncompleto) return campoIncompleto;
      }
      
      return null;
    },

    getProximaSeccion: (): SeccionCompletitud | null => {
      return secciones.find(s => !s.completado) || null;
    }
  }), [secciones]);

  // ==================== SUGERENCIAS ====================

  const sugerencias = useMemo(() => {
    const camposCriticos = utils.getCamposPendientes()
      .filter(c => c.requerido)
      .slice(0, 3);

    const accionesRecomendadas: string[] = [];
    
    if (camposCriticos.length > 0) {
      accionesRecomendadas.push(
        `Completar ${camposCriticos.length} campo(s) crítico(s)`
      );
    }

    const seccionIncompleta = utils.getProximaSeccion();
    if (seccionIncompleta) {
      accionesRecomendadas.push(
        `Completar sección: ${seccionIncompleta.nombre}`
      );
    }

    const camposPendientes = utils.getCamposPendientes();
    const tiempoEstimado = camposPendientes.length <= 3 
      ? '2-5 minutos'
      : camposPendientes.length <= 6
      ? '5-10 minutos'
      : '10-15 minutos';

    const impactoCompletitud = camposPendientes.length > 0
      ? Math.round((camposPendientes.length / secciones.reduce((sum, s) => sum + s.campos.length, 0)) * 100)
      : 0;

    return {
      camposCriticos,
      accionesRecomendadas,
      tiempoEstimado,
      impactoCompletitud
    };
  }, [utils, secciones]);

  // ==================== PROGRESO ====================

  const progreso = useMemo(() => {
    const seccionesCompletas = secciones.filter(s => s.completado).length;
    const camposCompletos = secciones.reduce((sum, s) => 
      sum + s.campos.filter(c => c.completado).length, 0
    );
    const camposTotales = secciones.reduce((sum, s) => sum + s.campos.length, 0);

    return {
      seccionesCompletas,
      seccionesTotales: secciones.length,
      camposCompletos,
      camposTotales,
      ultimaActualizacion: state.lastUpdated
    };
  }, [secciones, state.lastUpdated]);

  // ==================== EFECTOS ====================

  // Actualizar estado cuando cambie el cliente
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      cliente: cliente || null,
      secciones: [],
      completitud: null
    }));
  }, [cliente]);

  // Actualizar estado derivado cuando cambien las secciones
  useEffect(() => {
    const porcentajeTotal = utils.getPorcentajeTotal();
    const camposFaltantes = utils.getCamposPendientes()
      .filter(c => c.requerido)
      .map(c => c.nombre);
    
    const proximoOaso = utils.getPrimerCampoIncompleto()?.nombre || null;
    const puedeProcecer = camposFaltantes.length === 0;

    setState(prev => ({
      ...prev,
      secciones,
      porcentajeTotal,
      camposFaltantes,
      proximoPaso: proximoOaso,
      puedeProcecer
    }));
  }, [secciones, utils]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && cliente?.cliente_id && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshCompletitud();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, cliente?.cliente_id, refreshInterval, refreshCompletitud]);

  // Cargar completitud inicial
  useEffect(() => {
    if (cliente?.cliente_id) {
      refreshCompletitud();
    }
  }, [cliente?.cliente_id, refreshCompletitud]);

  // ==================== RETORNO ====================

  return {
    state,
    refreshCompletitud,
    validateSeccion,
    validateCampo,
    utils,
    sugerencias,
    progreso
  };
}
