// Servicio base para configuración de API y interceptores

import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { PaginatedResponse } from '../types';

export class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors(): void {
    // Request interceptor - agregar token a todas las requests
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        // Log de requests en desarrollo
        if (import.meta.env.DEV) {
          console.log(`🔵 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - manejo de errores globales
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log de responses en desarrollo
        if (import.meta.env.DEV) {
          console.log(`🟢 ${response.status} ${response.config.url}`, response.data);
        }
        
        return response;
      },
      (error: AxiosError) => {
        // Log de errores
        console.error('❌ Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data,
        });

        // Manejo de errores específicos
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.setToken(token);
    }
  }

  private handleUnauthorized(): void {
    this.clearToken();
    // Redirigir a login
    window.location.href = '/login';
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  public getToken(): string | null {
    return this.token;
  }

  // Métodos HTTP genéricos
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  // Método para upload de archivos
  async uploadFile<T>(url: string, file: File, additionalData?: any): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await this.api.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Método para generar URL con parámetros
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.api.defaults.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    return url.toString();
  }

  // Método para manejar respuestas paginadas
  async getPaginated<T>(
    url: string, 
    params?: any
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(url, params);
  }

  // Método para obtener información del sistema
  async getSystemInfo(): Promise<any> {
    return this.get('/info');
  }

  // Método para verificar salud del sistema
  async getHealthCheck(): Promise<any> {
    return this.get('/health');
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();
