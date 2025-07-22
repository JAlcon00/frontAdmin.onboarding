// Servicio para gestión de clientes

import { apiService } from './api.service';
import type { 
  Cliente, 
  ClienteCreation, 
  ClienteFilter,
  IngresoCliente,
  IngresoClienteCreation,
  TipoPersona,
  PaginatedResponse
} from '../types';

export interface ClienteCompletitud {
  cliente_id: number;
  completitud_porcentaje: number;
  datos_basicos_completos: boolean;
  direccion_completa: boolean;
  documentos_completos: boolean;
  documentos_faltantes: string[];
  documentos_vencidos: number;
  documentos_pendientes: number;
  documentos_rechazados: number;
  puede_proceder: boolean;
  siguiente_accion: string;
  mensaje: string;
}

export interface ClienteEstadisticas {
  total: number;
  por_tipo_persona: Record<TipoPersona, number>;
  por_estado: Record<string, number>;
  completitud_promedio: number;
  ultimos_registros: Cliente[];
}

export interface ClienteRecurrente {
  es_cliente_recurrente: boolean;
  documentos_vencidos: any[];
  puede_reutilizar_documentos: boolean;
  mensaje: string;
}

export class ClienteService {
  private readonly endpoint = '/clientes';

  /**
   * Crear nuevo cliente
   */
  async createCliente(data: ClienteCreation): Promise<Cliente> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: Cliente;
      }>(this.endpoint, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de clientes con filtros
   */
  async getClientes(filtros: ClienteFilter = {}): Promise<PaginatedResponse<Cliente>> {
    try {
      const response = await apiService.getPaginated<Cliente>(
        this.endpoint,
        filtros
      );
      
      return response;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   */
  async getClienteById(id: number): Promise<Cliente> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Cliente;
      }>(`${this.endpoint}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  /**
   * Actualizar cliente
   */
  async updateCliente(id: number, data: Partial<ClienteCreation>): Promise<Cliente> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: Cliente;
      }>(`${this.endpoint}/${id}`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  /**
   * Eliminar cliente
   */
  async deleteCliente(id: number): Promise<void> {
    try {
      await apiService.delete<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  /**
   * Buscar cliente por RFC
   */
  async buscarPorRFC(rfc: string): Promise<Cliente | null> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Cliente | null;
      }>(`${this.endpoint}/buscar/rfc/${rfc}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al buscar cliente por RFC:', error);
      throw error;
    }
  }

  /**
   * Evaluar cliente recurrente
   */
  async evaluarClienteRecurrente(rfc: string): Promise<ClienteRecurrente> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: ClienteRecurrente;
      }>(`${this.endpoint}/evaluar/rfc/${rfc}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al evaluar cliente recurrente:', error);
      throw error;
    }
  }

  /**
   * Validar completitud de cliente
   */
  async validarCompletitud(id: number): Promise<ClienteCompletitud> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: ClienteCompletitud;
      }>(`${this.endpoint}/${id}/completitud`);
      
      return response.data;
    } catch (error) {
      console.error('Error al validar completitud:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de onboarding
   */
  async getEstadoOnboarding(id: number): Promise<{
    etapa_actual: string;
    completitud_porcentaje: number;
    puede_avanzar: boolean;
    acciones_pendientes: string[];
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: any;
      }>(`${this.endpoint}/${id}/onboarding`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener estado onboarding:', error);
      throw error;
    }
  }

  /**
   * Verificar proceso de onboarding
   */
  async verificarProcesoOnboarding(id: number): Promise<{
    puede_proceder: boolean;
    motivos: string[];
    completitud: number;
  }> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: any;
      }>(`${this.endpoint}/${id}/onboarding/verificar`);
      
      return response.data;
    } catch (error) {
      console.error('Error al verificar proceso onboarding:', error);
      throw error;
    }
  }

  /**
   * Crear ingreso de cliente
   */
  async createIngresoCliente(clienteId: number, data: IngresoClienteCreation): Promise<IngresoCliente> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: IngresoCliente;
      }>(`${this.endpoint}/${clienteId}/ingresos`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear ingreso cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener ingresos de cliente
   */
  async getIngresosCliente(clienteId: number): Promise<IngresoCliente[]> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: IngresoCliente[];
      }>(`${this.endpoint}/${clienteId}/ingresos`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener ingresos cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getEstadisticas(): Promise<ClienteEstadisticas> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: ClienteEstadisticas;
      }>(`${this.endpoint}/estadisticas`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes con texto libre
   */
  async buscarClientes(query: string, filtros: Partial<ClienteFilter> = {}): Promise<PaginatedResponse<Cliente>> {
    try {
      const params = {
        search: query,
        ...filtros
      };
      
      return this.getClientes(params);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes por tipo de persona
   */
  async getClientesPorTipo(tipoPersona: TipoPersona): Promise<Cliente[]> {
    try {
      const response = await this.getClientes({
        tipo_persona: [tipoPersona]
      });
      
      // Si hay más páginas, obtener todas
      let allClientes = response.data;
      let currentPage = 1;
      
      while (currentPage < response.pagination.totalPages) {
        currentPage++;
        const nextPage = await this.getClientes({
          tipo_persona: [tipoPersona]
        });
        allClientes = [...allClientes, ...nextPage.data];
      }
      
      return allClientes;
    } catch (error) {
      console.error('Error al obtener clientes por tipo:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes con documentos vencidos
   */
  async getClientesConDocumentosVencidos(): Promise<Cliente[]> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Cliente[];
      }>(`${this.endpoint}/documentos-vencidos`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener clientes con documentos vencidos:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes con completitud baja
   */
  async getClientesCompletitudBaja(umbral: number = 70): Promise<Cliente[]> {
    try {
      const response = await this.getClientes({
        completitud_minima: 0, // Obtener todos los que estén por debajo del umbral
      });
      
      // Filtrar por completitud en el frontend
      const clientesConCompletitud = await Promise.all(
        response.data.map(async (cliente) => {
          const completitud = await this.validarCompletitud(cliente.cliente_id);
          return { cliente, completitud: completitud.completitud_porcentaje };
        })
      );
      
      return clientesConCompletitud
        .filter(({ completitud }) => completitud < umbral)
        .map(({ cliente }) => cliente);
    } catch (error) {
      console.error('Error al obtener clientes con completitud baja:', error);
      throw error;
    }
  }

  /**
   * Exportar clientes a CSV
   */
  async exportarClientes(filtros: ClienteFilter = {}): Promise<Blob> {
    try {
      const params = {
        ...filtros,
        export: 'csv'
      };
      
      const response = await apiService.get<Blob>(
        `${this.endpoint}/export`,
        params
      );
      
      return response;
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      throw error;
    }
  }

  /**
   * Validar RFC único
   */
  async validarRFCUnico(rfc: string, excludeId?: number): Promise<boolean> {
    try {
      const cliente = await this.buscarPorRFC(rfc);
      
      if (!cliente) return true;
      
      // Si existe pero es el mismo cliente que estamos editando
      if (excludeId && cliente.cliente_id === excludeId) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al validar RFC único:', error);
      return false;
    }
  }

  /**
   * Obtener resumen ejecutivo de cliente
   */
  async getResumenEjecutivo(id: number): Promise<{
    cliente: Cliente;
    completitud: ClienteCompletitud;
    estadoOnboarding: any;
    ultimaActividad: Date;
    solicitudesActivas: number;
    documentosVencidos: number;
  }> {
    try {
      const [cliente, completitud, estadoOnboarding] = await Promise.all([
        this.getClienteById(id),
        this.validarCompletitud(id),
        this.getEstadoOnboarding(id)
      ]);

      return {
        cliente,
        completitud,
        estadoOnboarding,
        ultimaActividad: new Date(cliente.updated_at),
        solicitudesActivas: 0, // TODO: Implementar cuando esté el servicio de solicitudes
        documentosVencidos: completitud.documentos_vencidos
      };
    } catch (error) {
      console.error('Error al obtener resumen ejecutivo:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de cliente
export const clienteService = new ClienteService();
