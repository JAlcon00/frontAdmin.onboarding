// Servicio para gestión de solicitudes

import { apiService } from './api.service';
import type { 
  Solicitud, 
  SolicitudCreation, 
  SolicitudFilter,
  SolicitudProducto,
  ProductoCodigo,
  EstatusSolicitud,
  PaginatedResponse
} from '../types';

export interface SolicitudCompleta extends Solicitud {
  productos: SolicitudProducto[];
  completitud_documentos?: number;
  documentos_pendientes?: number;
  monto_total?: number;
}

export interface SolicitudEstadisticas {
  total: number;
  por_estatus: Record<EstatusSolicitud, number>;
  por_producto: Record<ProductoCodigo, number>;
  monto_total_solicitado: number;
  monto_promedio: number;
  tiempo_promedio_procesamiento: number;
}

export interface SolicitudResumen {
  solicitud: SolicitudCompleta;
  cliente: any;
  documentos_completitud: number;
  siguiente_accion: string;
  puede_aprobar: boolean;
  observaciones: string[];
}

export class SolicitudService {
  private readonly endpoint = '/solicitudes';

  /**
   * Validar que la solicitud tenga cliente válido
   */
  private validarReferenciaCliente(solicitud: SolicitudCompleta): boolean {
    if (!solicitud.cliente_id) {
      throw new Error(`Solicitud ${solicitud.solicitud_id} sin cliente_id`);
    }
    
    if (!solicitud.cliente) {
      console.warn(`Solicitud ${solicitud.solicitud_id} sin datos de cliente cargados`);
      return false;
    }
    
    return true;
  }

  /**
   * Validar que existe el cliente antes de crear solicitud
   */
  private async validarExistenciaCliente(cliente_id: number): Promise<boolean> {
    try {
      const response = await apiService.get(`/clientes/${cliente_id}`);
      return !!response;
    } catch (error) {
      console.error(`Error al validar cliente ${cliente_id}:`, error);
      return false;
    }
  }

  /**
   * Crear nueva solicitud con productos
   */
  async createSolicitud(data: SolicitudCreation): Promise<SolicitudCompleta> {
    // Validar que existe cliente_id
    if (!data.cliente_id) {
      throw new Error('cliente_id es requerido para crear una solicitud');
    }

    // Validar que el cliente existe
    const clienteExists = await this.validarExistenciaCliente(data.cliente_id);
    if (!clienteExists) {
      throw new Error(`Cliente con ID ${data.cliente_id} no encontrado`);
    }

    try {
      const response = await apiService.post<{
        success: boolean;
        data: SolicitudCompleta;
      }>(this.endpoint, {
        ...data,
        include: 'cliente,productos' // Incluir datos del cliente en la respuesta
      });
      
      // Validar la solicitud creada
      this.validarReferenciaCliente(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de solicitudes con filtros
   */
  async getSolicitudes(filtros: SolicitudFilter = {}): Promise<PaginatedResponse<SolicitudCompleta>> {
    try {
      const response = await apiService.getPaginated<SolicitudCompleta>(
        this.endpoint,
        {
          ...filtros,
          include: 'cliente,productos,documentos' // Asegurar que incluya datos del cliente
        }
      );
      
      // Validar que todas las solicitudes tengan cliente
      const solicitudesValidadas = response.data.filter(solicitud => {
        try {
          this.validarReferenciaCliente(solicitud);
          return true;
        } catch (error) {
          console.error('Solicitud inválida:', error);
          return false;
        }
      });
      
      return {
        ...response,
        data: solicitudesValidadas
      };
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitud por ID
   */
  async getSolicitudById(id: number): Promise<SolicitudCompleta> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: SolicitudCompleta;
      }>(`${this.endpoint}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      throw error;
    }
  }

  /**
   * Actualizar solicitud
   */
  async updateSolicitud(id: number, data: { estatus?: EstatusSolicitud }): Promise<SolicitudCompleta> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: SolicitudCompleta;
      }>(`${this.endpoint}/${id}`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar solicitud:', error);
      throw error;
    }
  }

  /**
   * Eliminar solicitud
   */
  async deleteSolicitud(id: number): Promise<void> {
    try {
      await apiService.delete<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      throw error;
    }
  }

  /**
   * Agregar producto a solicitud existente
   */
  async addProductoToSolicitud(
    solicitudId: number, 
    data: { producto: ProductoCodigo; monto: number; plazo_meses: number }
  ): Promise<SolicitudProducto> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: SolicitudProducto;
      }>(`${this.endpoint}/${solicitudId}/productos`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al agregar producto a solicitud:', error);
      throw error;
    }
  }

  /**
   * Actualizar producto de solicitud
   */
  async updateProductoSolicitud(
    solicitudId: number, 
    productoId: number, 
    data: { monto?: number; plazo_meses?: number }
  ): Promise<SolicitudProducto> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: SolicitudProducto;
      }>(`${this.endpoint}/${solicitudId}/productos/${productoId}`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producto de solicitud:', error);
      throw error;
    }
  }

  /**
   * Eliminar producto de solicitud
   */
  async deleteProductoSolicitud(solicitudId: number, productoId: number): Promise<void> {
    try {
      await apiService.delete<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${solicitudId}/productos/${productoId}`);
    } catch (error) {
      console.error('Error al eliminar producto de solicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes por cliente
   */
  async getSolicitudesPorCliente(clienteId: number): Promise<SolicitudCompleta[]> {
    try {
      const response = await this.getSolicitudes({
        cliente_id: clienteId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes por cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes por estatus
   */
  async getSolicitudesPorEstatus(estatus: EstatusSolicitud): Promise<SolicitudCompleta[]> {
    try {
      const response = await this.getSolicitudes({
        estatus: [estatus]
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes por estatus:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes por producto
   */
  async getSolicitudesPorProducto(producto: ProductoCodigo): Promise<SolicitudCompleta[]> {
    try {
      const response = await this.getSolicitudes({
        producto_codigo: [producto]
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitudes por producto:', error);
      throw error;
    }
  }

  /**
   * Aprobar solicitud
   */
  async aprobarSolicitud(id: number, _observaciones?: string): Promise<SolicitudCompleta> {
    try {
      return this.updateSolicitud(id, {
        estatus: 'aprobada'
      });
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      throw error;
    }
  }

  /**
   * Rechazar solicitud
   */
  async rechazarSolicitud(id: number, _motivo?: string): Promise<SolicitudCompleta> {
    try {
      return this.updateSolicitud(id, {
        estatus: 'rechazada'
      });
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      throw error;
    }
  }

  /**
   * Cancelar solicitud
   */
  async cancelarSolicitud(id: number): Promise<SolicitudCompleta> {
    try {
      return this.updateSolicitud(id, {
        estatus: 'cancelada'
      });
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      throw error;
    }
  }

  /**
   * Enviar solicitud a revisión
   */
  async enviarARevision(id: number): Promise<SolicitudCompleta> {
    try {
      return this.updateSolicitud(id, {
        estatus: 'en_revision'
      });
    } catch (error) {
      console.error('Error al enviar solicitud a revisión:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen completo de solicitud
   */
  async getResumenSolicitud(id: number): Promise<SolicitudResumen> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: SolicitudResumen;
      }>(`${this.endpoint}/${id}/resumen`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de solicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de solicitudes
   */
  async getEstadisticas(filtros: Partial<SolicitudFilter> = {}): Promise<SolicitudEstadisticas> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: SolicitudEstadisticas;
      }>(`${this.endpoint}/estadisticas`, filtros);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes pendientes de revisión
   */
  async getSolicitudesPendientesRevision(): Promise<SolicitudCompleta[]> {
    try {
      return this.getSolicitudesPorEstatus('en_revision');
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
  }

  /**
   * Obtener solicitudes recientes
   */
  async getSolicitudesRecientes(limite: number = 10): Promise<SolicitudCompleta[]> {
    try {
      const response = await this.getSolicitudes({
        search: '',
        cliente_id: undefined,
        fecha_creacion_desde: undefined,
        fecha_creacion_hasta: undefined,
        estatus: undefined,
        producto_codigo: undefined,
        fecha_actualizacion_desde: undefined,
        fecha_actualizacion_hasta: undefined,
        monto_minimo: undefined,
        monto_maximo: undefined,
        moneda: undefined,
        asignado_a: undefined,
      });
      
      return response.data.slice(0, limite);
    } catch (error) {
      console.error('Error al obtener solicitudes recientes:', error);
      throw error;
    }
  }

  /**
   * Buscar solicitudes
   */
  async buscarSolicitudes(query: string, filtros: Partial<SolicitudFilter> = {}): Promise<PaginatedResponse<SolicitudCompleta>> {
    try {
      const params = {
        search: query,
        ...filtros
      };
      
      return this.getSolicitudes(params);
    } catch (error) {
      console.error('Error al buscar solicitudes:', error);
      throw error;
    }
  }

  /**
   * Calcular monto total de solicitud
   */
  calcularMontoTotal(solicitud: SolicitudCompleta): number {
    return solicitud.productos?.reduce((total, producto) => {
      return total + (producto.monto || 0);
    }, 0) || 0;
  }

  /**
   * Obtener productos de una solicitud
   */
  getProductosSolicitud(solicitud: SolicitudCompleta): SolicitudProducto[] {
    return solicitud.productos || [];
  }

  /**
   * Verificar si solicitud puede ser aprobada
   */
  puedeSerAprobada(solicitud: SolicitudCompleta): boolean {
    return solicitud.estatus === 'en_revision';
  }

  /**
   * Verificar si solicitud puede ser rechazada
   */
  puedeSerRechazada(solicitud: SolicitudCompleta): boolean {
    return solicitud.estatus === 'en_revision';
  }

  /**
   * Verificar si solicitud puede ser cancelada
   */
  puedeSerCancelada(solicitud: SolicitudCompleta): boolean {
    return ['iniciada', 'en_revision'].includes(solicitud.estatus);
  }

  /**
   * Verificar si solicitud puede ser editada
   */
  puedeSerEditada(solicitud: SolicitudCompleta): boolean {
    return solicitud.estatus === 'iniciada';
  }

  /**
   * Obtener siguiente acción recomendada
   */
  getSiguienteAccion(solicitud: SolicitudCompleta): string {
    switch (solicitud.estatus) {
      case 'iniciada':
        return 'Completar documentos y enviar a revisión';
      case 'en_revision':
        return 'Esperando revisión administrativa';
      case 'aprobada':
        return 'Solicitud aprobada - proceder con desembolso';
      case 'rechazada':
        return 'Solicitud rechazada - revisar observaciones';
      case 'cancelada':
        return 'Solicitud cancelada';
      default:
        return 'Estado desconocido';
    }
  }

  /**
   * Exportar solicitudes a CSV
   */
  async exportarSolicitudes(filtros: SolicitudFilter = {}): Promise<Blob> {
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
      console.error('Error al exportar solicitudes:', error);
      throw error;
    }
  }

  /**
   * Procesar solicitudes en lote
   */
  async procesarSolicitudesLote(
    solicitudIds: number[], 
    accion: 'aprobar' | 'rechazar' | 'cancelar',
    _observaciones?: string
  ): Promise<void> {
    try {
      const estatusMap = {
        aprobar: 'aprobada',
        rechazar: 'rechazada',
        cancelar: 'cancelada'
      };
      
      const estatus = estatusMap[accion] as EstatusSolicitud;
      
      const promises = solicitudIds.map(id => 
        this.updateSolicitud(id, { estatus })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al procesar solicitudes en lote:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de solicitud
export const solicitudService = new SolicitudService();
