/**
 * @fileoverview Hook para autenticación y auditoría de sesiones
 * @module hook/usuario/useAuth
 * @description Proporciona funcionalidades de login, logout, gestión de sesiones y auditoría
 */

import { useState, useCallback, useEffect } from 'react';

// ==================== INTERFACES Y TIPOS ====================

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    ip?: string;
  };
}

export interface AuthUser {
  usuario_id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  rol: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR';
  estatus: 'activo' | 'suspendido';
  permisos: string[];
  ultimoLogin: string;
  sesionIniciada: string;
}

export interface SessionInfo {
  sessionId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    ip: string;
    location?: string;
  };
  createdAt: string;
  lastActivity: string;
}

export interface LoginAttempt {
  attempt_id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  timestamp: string;
  location?: string;
  device_fingerprint?: string;
}

export interface SessionActivity {
  activity_id: number;
  session_id: string;
  usuario_id: number;
  action: 'login' | 'logout' | 'refresh' | 'access' | 'error';
  details: string;
  ip_address: string;
  timestamp: string;
  resource_accessed?: string;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutos
  sessionTimeout: number; // en minutos
  requireMFA: boolean;
  allowMultipleSessions: boolean;
  logoutOnSuspicious: boolean;
}

export interface UseAuthState {
  // Estado de autenticación
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: SessionInfo | null;
  loading: boolean;
  error: string | null;
  
  // Estado de login
  loginInProgress: boolean;
  loginAttempts: number;
  isLockedOut: boolean;
  lockoutExpiresAt: Date | null;
  
  // Auditoría y sesiones
  activeSessions: SessionInfo[];
  recentAttempts: LoginAttempt[];
  sessionActivity: SessionActivity[];
  securitySettings: SecuritySettings;
  
  // Estado de seguridad
  suspiciousActivity: boolean;
  mfaRequired: boolean;
  passwordExpired: boolean;
  accountLocked: boolean;
}

export interface UseAuthOptions {
  autoCheckSession?: boolean;
  sessionCheckInterval?: number;
  enableAuditing?: boolean;
  enableMFA?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  onLoginSuccess?: (user: AuthUser) => void;
  onLoginFailure?: (error: string, attempts: number) => void;
  onLogout?: () => void;
  onSessionExpired?: () => void;
  onSuspiciousActivity?: (activity: string) => void;
}

export interface UseAuthReturn {
  // Estado
  state: UseAuthState;
  
  // Autenticación principal
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: (sessionId?: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Gestión de sesiones
  checkSession: () => Promise<boolean>;
  getActiveSessions: () => Promise<SessionInfo[]>;
  terminateSession: (sessionId: string) => Promise<boolean>;
  terminateAllSessions: () => Promise<boolean>;
  
  // Auditoría
  getLoginHistory: (limit?: number) => Promise<LoginAttempt[]>;
  getSessionActivity: (sessionId?: string) => Promise<SessionActivity[]>;
  reportSuspiciousActivity: (details: string) => Promise<void>;
  
  // Validaciones y verificaciones
  validateCredentials: (username: string, password: string) => Promise<{
    valid: boolean;
    user?: AuthUser;
    reason?: string;
  }>;
  checkAccountStatus: (username: string) => Promise<{
    active: boolean;
    locked: boolean;
    suspended: boolean;
    passwordExpired: boolean;
  }>;
  
  // Configuración de seguridad
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<boolean>;
  resetLoginAttempts: (username?: string) => Promise<boolean>;
  unlockAccount: (username: string) => Promise<boolean>;
  
  // Utilidades
  hasPermission: (permission: string) => boolean;
  hasRole: (role: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR') => boolean;
  getRemainingSessionTime: () => number; // en minutos
  exportAuditLog: (startDate: string, endDate: string) => Promise<string>;
  
  // Información del dispositivo
  getDeviceFingerprint: () => string;
  isNewDevice: () => boolean;
}

// ==================== CONFIGURACIÓN INICIAL ====================

const estadoInicial: UseAuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  loading: false,
  error: null,
  loginInProgress: false,
  loginAttempts: 0,
  isLockedOut: false,
  lockoutExpiresAt: null,
  activeSessions: [],
  recentAttempts: [],
  sessionActivity: [],
  securitySettings: {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 480, // 8 horas
    requireMFA: false,
    allowMultipleSessions: true,
    logoutOnSuspicious: true
  },
  suspiciousActivity: false,
  mfaRequired: false,
  passwordExpired: false,
  accountLocked: false
};

// ==================== HOOK PRINCIPAL ====================

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    autoCheckSession = true,
    sessionCheckInterval = 60000, // 1 minuto
    enableAuditing = true,
    enableMFA = false,
    maxLoginAttempts = 5,
    lockoutDuration = 15,
    onLoginSuccess,
    onLoginFailure,
    onLogout,
    onSessionExpired,
    onSuspiciousActivity
  } = options;

  // ==================== ESTADO ====================

  const [state, setState] = useState<UseAuthState>(() => {
    // Intentar recuperar sesión del localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedSession = localStorage.getItem('userSession');
        const storedUser = localStorage.getItem('userData');
        
        if (storedSession && storedUser) {
          const session = JSON.parse(storedSession);
          const user = JSON.parse(storedUser);
          
          // Verificar que la sesión no haya expirado
          if (new Date(session.expiresAt) > new Date()) {
            return {
              ...estadoInicial,
              isAuthenticated: true,
              user,
              session,
              securitySettings: {
                ...estadoInicial.securitySettings,
                maxLoginAttempts,
                lockoutDuration,
                requireMFA: enableMFA
              }
            };
          }
        }
      } catch (error) {
        console.warn('Error recuperando sesión:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('userSession');
        localStorage.removeItem('userData');
      }
    }
    
    return {
      ...estadoInicial,
      securitySettings: {
        ...estadoInicial.securitySettings,
        maxLoginAttempts,
        lockoutDuration,
        requireMFA: enableMFA
      }
    };
  });

  // ==================== FUNCIONES AUXILIARES ====================

  const manejarError = useCallback((error: unknown, contexto: string) => {
    const mensaje = error instanceof Error ? error.message : `Error en ${contexto}`;
    setState(prev => ({ ...prev, error: mensaje, loading: false, loginInProgress: false }));
    console.error(`Error en ${contexto}:`, error);
  }, []);

  const almacenarSesion = useCallback((user: AuthUser, session: SessionInfo) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userSession', JSON.stringify(session));
      } catch (error) {
        console.warn('Error almacenando sesión:', error);
      }
    }
  }, []);

  const limpiarSesion = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData');
      localStorage.removeItem('userSession');
      localStorage.removeItem('deviceFingerprint');
    }
  }, []);

  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return { userAgent: '', platform: '' };
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth
    };
  }, []);

  const registrarActividad = useCallback(async (
    action: SessionActivity['action'],
    details: string,
    resourceAccessed?: string
  ) => {
    if (!enableAuditing || !state.session) return;

    try {
      await fetch('/api/auth/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          session_id: state.session.sessionId,
          action,
          details,
          resource_accessed: resourceAccessed,
          device_info: getDeviceInfo()
        })
      });
    } catch (error) {
      console.warn('Error registrando actividad:', error);
    }
  }, [enableAuditing, state.session, getDeviceInfo]);

  // ==================== AUTENTICACIÓN PRINCIPAL ====================

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(prev => ({ 
      ...prev, 
      loginInProgress: true, 
      error: null 
    }));

    try {
      // Verificar si hay bloqueo activo
      if (state.isLockedOut && state.lockoutExpiresAt && new Date() < state.lockoutExpiresAt) {
        const remainingTime = Math.ceil((state.lockoutExpiresAt.getTime() - Date.now()) / 60000);
        throw new Error(`Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos.`);
      }

      const deviceInfo = getDeviceInfo();
      const loginData = {
        ...credentials,
        deviceInfo: {
          ...deviceInfo,
          ...credentials.deviceInfo
        }
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Incrementar intentos fallidos
        const newAttempts = state.loginAttempts + 1;
        const isNowLockedOut = newAttempts >= state.securitySettings.maxLoginAttempts;
        
        setState(prev => ({
          ...prev,
          loginAttempts: newAttempts,
          isLockedOut: isNowLockedOut,
          lockoutExpiresAt: isNowLockedOut 
            ? new Date(Date.now() + state.securitySettings.lockoutDuration * 60000)
            : null,
          loginInProgress: false,
          error: data.message || 'Credenciales inválidas'
        }));

        onLoginFailure?.(data.message || 'Credenciales inválidas', newAttempts);
        throw new Error(data.message || 'Credenciales inválidas');
      }

      const { user, session } = data;

      // Verificar estado de la cuenta
      if (user.estatus === 'suspendido') {
        throw new Error('La cuenta está suspendida. Contacte al administrador.');
      }

      // Almacenar sesión
      almacenarSesion(user, session);

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        session,
        loginInProgress: false,
        loginAttempts: 0,
        isLockedOut: false,
        lockoutExpiresAt: null,
        error: null
      }));

      // Registrar actividad exitosa
      await registrarActividad('login', 'Inicio de sesión exitoso');

      onLoginSuccess?.(user);
      return true;

    } catch (error) {
      manejarError(error, 'inicio de sesión');
      return false;
    }
  }, [
    state.isLockedOut, 
    state.lockoutExpiresAt, 
    state.loginAttempts, 
    state.securitySettings,
    getDeviceInfo,
    almacenarSesion,
    registrarActividad,
    onLoginSuccess,
    onLoginFailure,
    manejarError
  ]);

  const logout = useCallback(async (sessionId?: string) => {
    try {
      const targetSessionId = sessionId || state.session?.sessionId;
      
      if (targetSessionId && state.session?.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.session.token}`
          },
          body: JSON.stringify({ sessionId: targetSessionId })
        });
      }

      // Registrar actividad antes de limpiar
      await registrarActividad('logout', 'Cierre de sesión');

      // Limpiar estado y almacenamiento
      limpiarSesion();
      setState(prev => ({
        ...estadoInicial,
        securitySettings: prev.securitySettings
      }));

      onLogout?.();

    } catch (error) {
      console.warn('Error en logout:', error);
      // Limpiar estado local incluso si falla el logout en servidor
      limpiarSesion();
      setState(prev => ({
        ...estadoInicial,
        securitySettings: prev.securitySettings
      }));
      onLogout?.();
    }
  }, [state.session, registrarActividad, limpiarSesion, onLogout]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!state.session?.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: state.session.refreshToken
        }),
      });

      if (!response.ok) {
        // Si falla el refresh, cerrar sesión
        await logout();
        onSessionExpired?.();
        return false;
      }

      const { session: newSession } = await response.json();
      
      setState(prev => ({
        ...prev,
        session: newSession
      }));

      // Actualizar en localStorage
      if (state.user) {
        almacenarSesion(state.user, newSession);
      }

      await registrarActividad('refresh', 'Token renovado');
      return true;

    } catch (error) {
      manejarError(error, 'renovación de token');
      await logout();
      onSessionExpired?.();
      return false;
    }
  }, [state.session, state.user, logout, almacenarSesion, registrarActividad, onSessionExpired, manejarError]);

  // ==================== GESTIÓN DE SESIONES ====================

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Intentar renovar token
          const refreshed = await refreshToken();
          if (!refreshed) {
            await logout();
            onSessionExpired?.();
            return false;
          }
          return true;
        }
        throw new Error('Error verificando sesión');
      }

      const data = await response.json();
      
      // Actualizar información del usuario si cambió
      if (data.user && JSON.stringify(data.user) !== JSON.stringify(state.user)) {
        setState(prev => ({ ...prev, user: data.user }));
        if (state.session) {
          almacenarSesion(data.user, state.session);
        }
      }

      return true;

    } catch (error) {
      manejarError(error, 'verificación de sesión');
      return false;
    }
  }, [state.session, state.user, refreshToken, logout, almacenarSesion, onSessionExpired, manejarError]);

  const getActiveSessions = useCallback(async (): Promise<SessionInfo[]> => {
    if (!state.session?.token) return [];

    try {
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo sesiones activas');
      }

      const sessions = await response.json();
      setState(prev => ({ ...prev, activeSessions: sessions }));
      
      return sessions;

    } catch (error) {
      manejarError(error, 'obtener sesiones activas');
      return [];
    }
  }, [state.session, manejarError]);

  const terminateSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error terminando sesión');
      }

      setState(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.sessionId !== sessionId)
      }));

      await registrarActividad('logout', `Sesión ${sessionId} terminada manualmente`);
      return true;

    } catch (error) {
      manejarError(error, 'terminar sesión');
      return false;
    }
  }, [state.session, registrarActividad, manejarError]);

  const terminateAllSessions = useCallback(async (): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch('/api/auth/sessions/terminate-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error terminando todas las sesiones');
      }

      // Mantener solo la sesión actual
      setState(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.sessionId === state.session?.sessionId)
      }));

      await registrarActividad('logout', 'Todas las sesiones terminadas');
      return true;

    } catch (error) {
      manejarError(error, 'terminar todas las sesiones');
      return false;
    }
  }, [state.session, registrarActividad, manejarError]);

  // ==================== AUDITORÍA ====================

  const getLoginHistory = useCallback(async (limit: number = 50): Promise<LoginAttempt[]> => {
    if (!state.session?.token) return [];

    try {
      const response = await fetch(`/api/auth/login-history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo historial de login');
      }

      const attempts = await response.json();
      setState(prev => ({ ...prev, recentAttempts: attempts }));
      
      return attempts;

    } catch (error) {
      manejarError(error, 'obtener historial de login');
      return [];
    }
  }, [state.session, manejarError]);

  const getSessionActivity = useCallback(async (sessionId?: string): Promise<SessionActivity[]> => {
    if (!state.session?.token) return [];

    try {
      const url = sessionId 
        ? `/api/auth/activity/${sessionId}`
        : '/api/auth/activity';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo actividad de sesión');
      }

      const activity = await response.json();
      setState(prev => ({ ...prev, sessionActivity: activity }));
      
      return activity;

    } catch (error) {
      manejarError(error, 'obtener actividad de sesión');
      return [];
    }
  }, [state.session, manejarError]);

  const reportSuspiciousActivity = useCallback(async (details: string): Promise<void> => {
    if (!state.session?.token) return;

    try {
      await fetch('/api/auth/suspicious-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          details,
          deviceInfo: getDeviceInfo()
        })
      });

      setState(prev => ({ ...prev, suspiciousActivity: true }));
      onSuspiciousActivity?.(details);

    } catch (error) {
      console.warn('Error reportando actividad sospechosa:', error);
    }
  }, [state.session, getDeviceInfo, onSuspiciousActivity]);

  // ==================== VALIDACIONES ====================

  const validateCredentials = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          valid: false,
          reason: data.message || 'Credenciales inválidas'
        };
      }

      const data = await response.json();
      return {
        valid: true,
        user: data.user
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'Error de conexión'
      };
    }
  }, []);

  const checkAccountStatus = useCallback(async (username: string) => {
    try {
      const response = await fetch(`/api/auth/account-status?username=${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        throw new Error('Error verificando estado de cuenta');
      }

      return await response.json();

    } catch (error) {
      console.warn('Error verificando estado de cuenta:', error);
      return {
        active: false,
        locked: false,
        suspended: false,
        passwordExpired: false
      };
    }
  }, []);

  // ==================== UTILIDADES ====================

  const hasPermission = useCallback((permission: string): boolean => {
    return state.user?.permisos?.includes(permission) || false;
  }, [state.user]);

  const hasRole = useCallback((role: 'SUPER' | 'ADMIN' | 'AUDITOR' | 'OPERADOR'): boolean => {
    return state.user?.rol === role;
  }, [state.user]);

  const getRemainingSessionTime = useCallback((): number => {
    if (!state.session?.expiresAt) return 0;
    
    const now = new Date().getTime();
    const expiresAt = new Date(state.session.expiresAt).getTime();
    const remaining = Math.max(0, expiresAt - now);
    
    return Math.floor(remaining / 60000); // en minutos
  }, [state.session]);

  const getDeviceFingerprint = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    const stored = localStorage.getItem('deviceFingerprint');
    if (stored) return stored;
    
    const deviceInfo = getDeviceInfo();
    const fingerprint = btoa(JSON.stringify(deviceInfo)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    localStorage.setItem('deviceFingerprint', fingerprint);
    return fingerprint;
  }, [getDeviceInfo]);

  const isNewDevice = useCallback((): boolean => {
    const fingerprint = getDeviceFingerprint();
    // En producción, esto verificaría contra una lista de dispositivos conocidos
    return !localStorage.getItem('knownDevice_' + fingerprint);
  }, [getDeviceFingerprint]);

  const exportAuditLog = useCallback(async (startDate: string, endDate: string): Promise<string> => {
    if (!state.session?.token) return '';

    try {
      const response = await fetch(`/api/auth/audit-export?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${state.session.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error exportando log de auditoría');
      }

      return await response.text();

    } catch (error) {
      manejarError(error, 'exportar log de auditoría');
      return '';
    }
  }, [state.session, manejarError]);

  // ==================== CONFIGURACIÓN ====================

  const updateSecuritySettings = useCallback(async (settings: Partial<SecuritySettings>): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch('/api/auth/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Error actualizando configuración de seguridad');
      }

      setState(prev => ({
        ...prev,
        securitySettings: { ...prev.securitySettings, ...settings }
      }));

      return true;

    } catch (error) {
      manejarError(error, 'actualizar configuración de seguridad');
      return false;
    }
  }, [state.session, manejarError]);

  const resetLoginAttempts = useCallback(async (username?: string): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch('/api/auth/reset-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        throw new Error('Error reseteando intentos de login');
      }

      if (!username || username === state.user?.username) {
        setState(prev => ({
          ...prev,
          loginAttempts: 0,
          isLockedOut: false,
          lockoutExpiresAt: null
        }));
      }

      return true;

    } catch (error) {
      manejarError(error, 'resetear intentos de login');
      return false;
    }
  }, [state.session, state.user, manejarError]);

  const unlockAccount = useCallback(async (username: string): Promise<boolean> => {
    if (!state.session?.token) return false;

    try {
      const response = await fetch('/api/auth/unlock-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        throw new Error('Error desbloqueando cuenta');
      }

      return true;

    } catch (error) {
      manejarError(error, 'desbloquear cuenta');
      return false;
    }
  }, [state.session, manejarError]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (autoCheckSession && state.isAuthenticated) {
      checkSession();
    }
  }, [autoCheckSession, state.isAuthenticated, checkSession]);

  useEffect(() => {
    if (autoCheckSession && sessionCheckInterval > 0 && state.isAuthenticated) {
      const interval = setInterval(() => {
        checkSession();
      }, sessionCheckInterval);

      return () => clearInterval(interval);
    }
  }, [autoCheckSession, sessionCheckInterval, state.isAuthenticated, checkSession]);

  // Verificar si el token está próximo a expirar
  useEffect(() => {
    if (state.session?.expiresAt) {
      const checkExpiration = () => {
        const now = new Date().getTime();
        const expiresAt = new Date(state.session!.expiresAt).getTime();
        const timeUntilExpiry = expiresAt - now;
        
        // Si queda menos de 5 minutos, intentar renovar
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          refreshToken();
        }
      };

      const interval = setInterval(checkExpiration, 60000); // Verificar cada minuto
      return () => clearInterval(interval);
    }
  }, [state.session, refreshToken]);

  // ==================== RETORNO ====================

  return {
    state,
    login,
    logout,
    refreshToken,
    checkSession,
    getActiveSessions,
    terminateSession,
    terminateAllSessions,
    getLoginHistory,
    getSessionActivity,
    reportSuspiciousActivity,
    validateCredentials,
    checkAccountStatus,
    updateSecuritySettings,
    resetLoginAttempts,
    unlockAccount,
    hasPermission,
    hasRole,
    getRemainingSessionTime,
    exportAuditLog,
    getDeviceFingerprint,
    isNewDevice
  };
}
