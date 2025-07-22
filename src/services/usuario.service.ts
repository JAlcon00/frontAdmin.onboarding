// Servicio para gestión de usuarios y autenticación

import { apiService } from './api.service';
import type {
  Usuario,
  UsuarioCreation,
  UsuarioUpdate,
  UsuarioAuth,
  UsuarioFilter,
  RolUsuario,
  UsuarioLogin,
  UsuarioPasswordChange
} from '../types/usuario.types';

// Si tienes un tipo global para paginación, ajústalo aquí:
import type { PaginatedResponse } from '../types';


// LoginRequest ya existe como UsuarioLogin en los types canónicos
export type LoginRequest = UsuarioLogin;


// LoginResponse alineado a la respuesta documentada
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    usuario: UsuarioAuth;
  };
}


// ChangePasswordRequest alineado a UsuarioPasswordChange
export type ChangePasswordRequest = UsuarioPasswordChange;

export class UsuarioService {
  private readonly endpoint = '/usuarios';

  /**
   * Autenticar usuario
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        `${this.endpoint}/login`,
        credentials
      );
      
      // Guardar token en el servicio API
      if (response.data.token) {
        apiService.setToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      // Limpiar token del servicio API
      apiService.clearToken();
      
      // Limpiar datos del usuario en localStorage
      localStorage.removeItem('current_user');
      
      // Redirigir a login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<UsuarioAuth> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: UsuarioAuth;
      }>(`${this.endpoint}/profile`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUsuario(data: UsuarioCreation): Promise<Usuario> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: Usuario;
      }>(this.endpoint, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios con filtros
   */
  async getUsuarios(filtros: UsuarioFilter = {}): Promise<PaginatedResponse<Usuario>> {
    try {
      const response = await apiService.getPaginated<Usuario>(
        this.endpoint,
        filtros
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUsuarioById(id: number): Promise<Usuario> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Usuario;
      }>(`${this.endpoint}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUsuario(id: number, data: UsuarioUpdate): Promise<Usuario> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: Usuario;
      }>(`${this.endpoint}/${id}`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(id: number, data: ChangePasswordRequest): Promise<void> {
    try {
      await apiService.patch<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${id}/change-password`, data);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }

  /**
   * Suspender/eliminar usuario
   */
  async deleteUsuario(id: number): Promise<void> {
    try {
      await apiService.delete<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return apiService.getToken() !== null;
  }

  /**
   * Obtener información del usuario actual del localStorage
   */
  getCurrentUser(): UsuarioAuth | null {
    try {
      const userData = localStorage.getItem('current_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  /**
   * Guardar información del usuario actual en localStorage
   */
  setCurrentUser(user: UsuarioAuth): void {
    try {
      localStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error al guardar usuario actual:', error);
    }
  }

  /**
   * Verificar si el usuario tiene permisos específicos
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Mapeo de permisos por rol
    // Usa los permisos canónicos si están definidos en los types
    const rolePermissions: Record<RolUsuario, string[]> = {
      SUPER: ['all'],
      ADMIN: ['create', 'read', 'update', 'delete', 'review'],
      AUDITOR: ['read', 'review'],
      OPERADOR: ['create', 'read', 'update']
    };
    
    const userPermissions = rolePermissions[user.usuario.rol] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }

  /**
   * Verificar si el usuario tiene uno de los roles especificados
   */
  hasRole(roles: RolUsuario[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return roles.includes(user.usuario.rol);
  }

  /**
   * Verificar si el usuario puede acceder a un recurso específico
   */
  canAccess(resource: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Lógica de permisos específica por recurso
    switch (resource) {
      case 'usuarios':
        return this.hasRole(['SUPER', 'ADMIN']) || 
               (action === 'read' && this.hasRole(['AUDITOR']));
      
      case 'clientes':
        return this.hasRole(['SUPER', 'ADMIN', 'OPERADOR']) || 
               (action === 'read' && this.hasRole(['AUDITOR']));
      
      case 'documentos':
        return this.hasRole(['SUPER', 'ADMIN', 'OPERADOR']) || 
               (action === 'read' && this.hasRole(['AUDITOR']));
      
      case 'solicitudes':
        return this.hasRole(['SUPER', 'ADMIN', 'OPERADOR']) || 
               (action === 'read' && this.hasRole(['AUDITOR']));
      
      default:
        return false;
    }
  }

  /**
   * Obtener estadísticas de usuarios (solo para admins)
   */
  async getEstadisticasUsuarios(): Promise<{
    total: number;
    activos: number;
    por_rol: Record<string, number>;
    ultimas_actividades: any[];
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: any;
      }>(`${this.endpoint}/estadisticas`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de usuario
export const usuarioService = new UsuarioService();
