/**
 * @fileoverview Hook principal para la gestión completa de usuarios
 * @module hook/usuario/useUsuarioManager
 * @description Proporciona funcionalidades CRUD para usuarios, gestión de estados,
 * paginación, filtros y operaciones en lote
 */

import { useState, useCallback, useEffect } from 'react';

// ==================== INTERFACES Y TIPOS ====================

export interface Usuario {
  usuario_id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus: 'activo' | 'suspendido';
  created_at: string;
  updated_at: string;
}

export interface UsuarioCreacion {
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  password: string;
  rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus: 'activo' | 'suspendido';
}

export interface UsuarioActualizacion {
  nombre?: string;
  apellido?: string;
  username?: string;
  correo?: string;
  password?: string;
  rol?: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus?: 'activo' | 'suspendido';
}

export interface FiltrosUsuario {
  rol?: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus?: 'activo' | 'suspendido';
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginacionUsuario {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UseUsuarioManagerState {
  usuarios: Usuario[];
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  paginacion: PaginacionUsuario;
  filtrosActivos: FiltrosUsuario;
  operacionEnProgreso: boolean;
  ultimaActualizacion: Date | null;
}

export interface UseUsuarioManagerOptions {
  autoLoad?: boolean;
  defaultFilters?: FiltrosUsuario;
  enableRealTime?: boolean;
  onUsuarioCreado?: (usuario: Usuario) => void;
  onUsuarioActualizado?: (usuario: Usuario) => void;
  onUsuarioEliminado?: (usuarioId: number) => void;
  onError?: (error: string) => void;
}

export interface UseUsuarioManagerReturn {
  // Estado
  state: UseUsuarioManagerState;
  
  // Operaciones CRUD
  cargarUsuarios: (filtros?: FiltrosUsuario) => Promise<void>;
  obtenerUsuario: (id: number) => Promise<Usuario | null>;
  crearUsuario: (usuario: UsuarioCreacion) => Promise<Usuario | null>;
  actualizarUsuario: (id: number, datos: UsuarioActualizacion) => Promise<Usuario | null>;
  eliminarUsuario: (id: number) => Promise<boolean>;
  
  // Operaciones en lote
  eliminarUsuariosSeleccionados: (ids: number[]) => Promise<number>;
  cambiarEstatusEnLote: (ids: number[], estatus: 'activo' | 'suspendido') => Promise<number>;
  cambiarRolEnLote: (ids: number[], rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => Promise<number>;
  
  // Gestión de filtros y paginación
  aplicarFiltros: (filtros: FiltrosUsuario) => void;
  limpiarFiltros: () => void;
  cambiarPagina: (page: number) => void;
  cambiarLimitePorPagina: (limit: number) => void;
  
  // Utilidades
  refrescarLista: () => Promise<void>;
  buscarUsuarios: (termino: string) => Promise<void>;
  obtenerUsuariosPorRol: (rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => Usuario[];
  obtenerUsuariosActivos: () => Usuario[];
  obtenerEstadisticas: () => {
    total: number;
    activos: number;
    suspendidos: number;
    porRol: Record<string, number>;
  };
  
  // Validaciones
  validarUsername: (username: string, excludeId?: number) => Promise<boolean>;
  validarCorreo: (correo: string, excludeId?: number) => Promise<boolean>;
  
  // Autenticación relacionada
  cambiarPassword: (usuarioId: number, passwordActual: string, passwordNuevo: string) => Promise<boolean>;
  resetearPassword: (usuarioId: number) => Promise<string>; // Retorna password temporal
}

// ==================== CONFIGURACIÓN INICIAL ====================

const estadoInicial: UseUsuarioManagerState = {
  usuarios: [],
  usuario: null,
  loading: false,
  error: null,
  paginacion: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  filtrosActivos: {},
  operacionEnProgreso: false,
  ultimaActualizacion: null
};

// ==================== HOOK PRINCIPAL ====================

export function useUsuarioManager(options: UseUsuarioManagerOptions = {}): UseUsuarioManagerReturn {
  const {
    autoLoad = true,
    defaultFilters = {},
    onUsuarioCreado,
    onUsuarioActualizado,
    onUsuarioEliminado,
    onError
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseUsuarioManagerState>({
    ...estadoInicial,
    filtrosActivos: defaultFilters
  });

  // ==================== FUNCIONES AUXILIARES ====================

  const manejarError = useCallback((error: unknown, contexto: string) => {
    const mensaje = error instanceof Error ? error.message : `Error en ${contexto}`;
    setState(prev => ({ ...prev, error: mensaje, loading: false, operacionEnProgreso: false }));
    onError?.(mensaje);
    console.error(`Error en ${contexto}:`, error);
  }, [onError]);

  const actualizarPaginacion = useCallback((total: number, page: number, limit: number) => {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }, []);

  // ==================== OPERACIONES CRUD ====================

  const cargarUsuarios = useCallback(async (filtros: FiltrosUsuario = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const filtrosFinales = { ...state.filtrosActivos, ...filtros };
      const queryParams = new URLSearchParams();
      
      Object.entries(filtrosFinales).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/usuarios?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: data.usuarios || [],
        paginacion: actualizarPaginacion(
          data.total || 0,
          data.page || 1,
          data.limit || 10
        ),
        filtrosActivos: filtrosFinales,
        loading: false,
        ultimaActualizacion: new Date()
      }));

    } catch (error) {
      manejarError(error, 'cargar usuarios');
    }
  }, [state.filtrosActivos, actualizarPaginacion, manejarError]);

  const obtenerUsuario = useCallback(async (id: number): Promise<Usuario | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/usuarios/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setState(prev => ({ ...prev, loading: false }));
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const usuario = await response.json();
      setState(prev => ({ 
        ...prev, 
        usuario, 
        loading: false,
        ultimaActualizacion: new Date()
      }));

      return usuario;

    } catch (error) {
      manejarError(error, 'obtener usuario');
      return null;
    }
  }, [manejarError]);

  const crearUsuario = useCallback(async (usuarioData: UsuarioCreacion): Promise<Usuario | null> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuarioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const nuevoUsuario = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: [nuevoUsuario, ...prev.usuarios],
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      onUsuarioCreado?.(nuevoUsuario);
      return nuevoUsuario;

    } catch (error) {
      manejarError(error, 'crear usuario');
      return null;
    }
  }, [onUsuarioCreado, manejarError]);

  const actualizarUsuario = useCallback(async (id: number, datos: UsuarioActualizacion): Promise<Usuario | null> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const usuarioActualizado = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: prev.usuarios.map(u => 
          u.usuario_id === id ? usuarioActualizado : u
        ),
        usuario: prev.usuario?.usuario_id === id ? usuarioActualizado : prev.usuario,
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      onUsuarioActualizado?.(usuarioActualizado);
      return usuarioActualizado;

    } catch (error) {
      manejarError(error, 'actualizar usuario');
      return null;
    }
  }, [onUsuarioActualizado, manejarError]);

  const eliminarUsuario = useCallback(async (id: number): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      setState(prev => ({
        ...prev,
        usuarios: prev.usuarios.filter(u => u.usuario_id !== id),
        usuario: prev.usuario?.usuario_id === id ? null : prev.usuario,
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      onUsuarioEliminado?.(id);
      return true;

    } catch (error) {
      manejarError(error, 'eliminar usuario');
      return false;
    }
  }, [onUsuarioEliminado, manejarError]);

  // ==================== OPERACIONES EN LOTE ====================

  const eliminarUsuariosSeleccionados = useCallback(async (ids: number[]): Promise<number> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch('/api/usuarios/batch/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const { deletedCount } = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: prev.usuarios.filter(u => !ids.includes(u.usuario_id)),
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      return deletedCount;

    } catch (error) {
      manejarError(error, 'eliminar usuarios en lote');
      return 0;
    }
  }, [manejarError]);

  const cambiarEstatusEnLote = useCallback(async (ids: number[], estatus: 'activo' | 'suspendido'): Promise<number> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch('/api/usuarios/batch/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, estatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const { updatedCount } = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: prev.usuarios.map(u => 
          ids.includes(u.usuario_id) ? { ...u, estatus } : u
        ),
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      return updatedCount;

    } catch (error) {
      manejarError(error, 'cambiar estatus en lote');
      return 0;
    }
  }, [manejarError]);

  const cambiarRolEnLote = useCallback(async (ids: number[], rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR'): Promise<number> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch('/api/usuarios/batch/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, rol }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const { updatedCount } = await response.json();
      
      setState(prev => ({
        ...prev,
        usuarios: prev.usuarios.map(u => 
          ids.includes(u.usuario_id) ? { ...u, rol } : u
        ),
        operacionEnProgreso: false,
        ultimaActualizacion: new Date()
      }));

      return updatedCount;

    } catch (error) {
      manejarError(error, 'cambiar rol en lote');
      return 0;
    }
  }, [manejarError]);

  // ==================== GESTIÓN DE FILTROS Y PAGINACIÓN ====================

  const aplicarFiltros = useCallback((filtros: FiltrosUsuario) => {
    setState(prev => ({
      ...prev,
      filtrosActivos: { ...prev.filtrosActivos, ...filtros, page: 1 }
    }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setState(prev => ({
      ...prev,
      filtrosActivos: { page: 1, limit: prev.filtrosActivos.limit || 10 }
    }));
  }, []);

  const cambiarPagina = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      filtrosActivos: { ...prev.filtrosActivos, page }
    }));
  }, []);

  const cambiarLimitePorPagina = useCallback((limit: number) => {
    setState(prev => ({
      ...prev,
      filtrosActivos: { ...prev.filtrosActivos, limit, page: 1 }
    }));
  }, []);

  // ==================== UTILIDADES ====================

  const refrescarLista = useCallback(async () => {
    await cargarUsuarios(state.filtrosActivos);
  }, [cargarUsuarios, state.filtrosActivos]);

  const buscarUsuarios = useCallback(async (termino: string) => {
    await cargarUsuarios({ ...state.filtrosActivos, search: termino, page: 1 });
  }, [cargarUsuarios, state.filtrosActivos]);

  const obtenerUsuariosPorRol = useCallback((rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => {
    return state.usuarios.filter(usuario => usuario.rol === rol);
  }, [state.usuarios]);

  const obtenerUsuariosActivos = useCallback(() => {
    return state.usuarios.filter(usuario => usuario.estatus === 'activo');
  }, [state.usuarios]);

  const obtenerEstadisticas = useCallback(() => {
    const total = state.usuarios.length;
    const activos = state.usuarios.filter(u => u.estatus === 'activo').length;
    const suspendidos = total - activos;
    
    const porRol = state.usuarios.reduce((acc, usuario) => {
      acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, activos, suspendidos, porRol };
  }, [state.usuarios]);

  // ==================== VALIDACIONES ====================

  const validarUsername = useCallback(async (username: string, excludeId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/usuarios/validate/username?username=${encodeURIComponent(username)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
      const { available } = await response.json();
      return available;
    } catch (error) {
      console.error('Error validando username:', error);
      return false;
    }
  }, []);

  const validarCorreo = useCallback(async (correo: string, excludeId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/usuarios/validate/email?email=${encodeURIComponent(correo)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
      const { available } = await response.json();
      return available;
    } catch (error) {
      console.error('Error validando correo:', error);
      return false;
    }
  }, []);

  // ==================== AUTENTICACIÓN RELACIONADA ====================

  const cambiarPassword = useCallback(async (usuarioId: number, passwordActual: string, passwordNuevo: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch(`/api/usuarios/${usuarioId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nuevo: passwordNuevo,
          confirmar_password: passwordNuevo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      setState(prev => ({ ...prev, operacionEnProgreso: false }));
      return true;

    } catch (error) {
      manejarError(error, 'cambiar contraseña');
      return false;
    }
  }, [manejarError]);

  const resetearPassword = useCallback(async (usuarioId: number): Promise<string> => {
    try {
      setState(prev => ({ ...prev, operacionEnProgreso: true, error: null }));

      const response = await fetch(`/api/usuarios/${usuarioId}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const { temporaryPassword } = await response.json();
      setState(prev => ({ ...prev, operacionEnProgreso: false }));
      
      return temporaryPassword;

    } catch (error) {
      manejarError(error, 'resetear contraseña');
      return '';
    }
  }, [manejarError]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoLoad) {
      cargarUsuarios();
    }
  }, [autoLoad, cargarUsuarios]);

  // Efecto para recargar cuando cambien los filtros activos
  useEffect(() => {
    if (Object.keys(state.filtrosActivos).length > 0) {
      cargarUsuarios();
    }
  }, [state.filtrosActivos, cargarUsuarios]);

  // ==================== RETORNO ====================

  return {
    state,
    cargarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    eliminarUsuariosSeleccionados,
    cambiarEstatusEnLote,
    cambiarRolEnLote,
    aplicarFiltros,
    limpiarFiltros,
    cambiarPagina,
    cambiarLimitePorPagina,
    refrescarLista,
    buscarUsuarios,
    obtenerUsuariosPorRol,
    obtenerUsuariosActivos,
    obtenerEstadisticas,
    validarUsername,
    validarCorreo,
    cambiarPassword,
    resetearPassword
  };
}
