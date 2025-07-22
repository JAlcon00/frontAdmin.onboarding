// Servicio para gestión de documentos

import { apiService } from './api.service';
import type { 
  Documento, 
  DocumentoCreation, 
  DocumentoFilter,
  DocumentoTipo,
  DocumentoTipoFilter,
  EstatusDocumento,
  TipoPersona,
  PaginatedResponse
} from '../types';

export interface DocumentoSubida {
  clienteId: number;
  documentoTipoId: number;
  file: File;
  fechaDocumento: Date;
  folioSolicitud?: string;
  reemplazar?: boolean;
}

export interface DocumentoFaltante {
  documento_tipo_id: number;
  nombre: string;
  opcional: boolean;
  vigencia_dias?: number;
  descripcion?: string;
  aplica_tipo_persona: boolean;
}

export interface DocumentoCompletitud {
  completo: boolean;
  documentosFaltantes: DocumentoFaltante[];
  documentosSubidos: Documento[];
  porcentajeCompletitud: number;
}

export interface DocumentoVencimiento {
  documento_id: number;
  cliente_id: number;
  cliente_nombre: string;
  documento_tipo: string;
  fecha_vencimiento: Date;
  dias_restantes: number;
  prioridad: 'alta' | 'media' | 'baja';
}

export class DocumentoService {
  private readonly endpoint = '/documentos';

  /**
   * Validar que el documento tenga cliente válido
   */
  private validarReferenciaCliente(documento: Documento): boolean {
    if (!documento.cliente_id) {
      throw new Error(`Documento ${documento.documento_id} sin cliente_id`);
    }
    
    return true;
  }

  /**
   * Validar coherencia entre documento y cliente
   */
  private validarCoherenciaDocumentoCliente(documento: Documento, cliente?: any): boolean {
    if (!this.validarReferenciaCliente(documento)) {
      return false;
    }

    if (cliente) {
      // Validar que el cliente_id coincida
      if (documento.cliente_id !== cliente.cliente_id) {
        console.error(`Documento ${documento.documento_id} cliente_id no coincide`);
        return false;
      }

      // Validar coherencia del tipo de documento con tipo de persona
      if (cliente.tipo_persona === 'PF' && documento.documento_tipo?.nombre?.includes('Acta Constitutiva')) {
        console.error(`Persona física no debería tener acta constitutiva`);
        return false;
      }

      if (cliente.tipo_persona === 'PM' && documento.documento_tipo?.nombre?.includes('CURP')) {
        console.error(`Persona moral no debería tener CURP`);
        return false;
      }

      // Validar que el tipo de documento aplique al tipo de persona
      if (cliente.tipo_persona === 'PF' && documento.documento_tipo && !documento.documento_tipo.aplica_pf) {
        console.error(`Documento ${documento.documento_tipo.nombre} no aplica para persona física`);
        return false;
      }

      if (cliente.tipo_persona === 'PM' && documento.documento_tipo && !documento.documento_tipo.aplica_pm) {
        console.error(`Documento ${documento.documento_tipo.nombre} no aplica para persona moral`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validar que existe el cliente antes de crear documento
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
   * Crear documento con validación de cliente
   */
  async createDocumento(data: DocumentoCreation): Promise<Documento> {
    // Validar que existe cliente_id
    if (!data.cliente_id) {
      throw new Error('cliente_id es requerido para crear un documento');
    }

    // Validar que el cliente existe
    const clienteExists = await this.validarExistenciaCliente(data.cliente_id);
    if (!clienteExists) {
      throw new Error(`Cliente con ID ${data.cliente_id} no encontrado`);
    }

    try {
      const response = await apiService.post<{
        success: boolean;
        data: Documento;
      }>(this.endpoint, {
        ...data,
        include: 'cliente,documento_tipo' // Incluir datos del cliente
      });
      
      // Validar el documento creado
      this.validarReferenciaCliente(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear documento:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de documentos con filtros y validación
   */
  async getDocumentos(filtros: DocumentoFilter = {}): Promise<PaginatedResponse<Documento>> {
    try {
      const response = await apiService.getPaginated<Documento>(
        this.endpoint,
        {
          ...filtros,
          include: 'cliente,documento_tipo' // Asegurar que incluya datos del cliente
        }
      );
      
      // Validar que todos los documentos tengan cliente
      const documentosValidados = response.data.filter(documento => {
        try {
          this.validarReferenciaCliente(documento);
          
          // Si tiene datos del cliente, validar coherencia
          if (documento.cliente) {
            return this.validarCoherenciaDocumentoCliente(documento, documento.cliente);
          }
          
          return true;
        } catch (error) {
          console.error('Documento inválido:', error);
          return false;
        }
      });
      
      return {
        ...response,
        data: documentosValidados
      };
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw error;
    }
  }

  /**
   * Obtener documento por ID
   */
  async getDocumentoById(id: number): Promise<Documento> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: Documento;
      }>(`${this.endpoint}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documento:', error);
      throw error;
    }
  }

  /**
   * Actualizar documento
   */
  async updateDocumento(id: number, data: Partial<DocumentoCreation>): Promise<Documento> {
    try {
      const response = await apiService.put<{
        success: boolean;
        data: Documento;
      }>(`${this.endpoint}/${id}`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw error;
    }
  }

  /**
   * Revisar documento (aprobar/rechazar)
   */
  async reviewDocumento(id: number, data: {
    estatus: 'aceptado' | 'rechazado';
    comentario_revisor?: string;
  }): Promise<Documento> {
    try {
      const response = await apiService.patch<{
        success: boolean;
        data: Documento;
      }>(`${this.endpoint}/${id}/review`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error al revisar documento:', error);
      throw error;
    }
  }

  /**
   * Eliminar documento
   */
  async deleteDocumento(id: number): Promise<void> {
    try {
      await apiService.delete<{
        success: boolean;
        message: string;
      }>(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de documento
   */
  async getTiposDocumento(filtros: DocumentoTipoFilter = {}): Promise<DocumentoTipo[]> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: DocumentoTipo[];
      }>(`${this.endpoint}/tipos`, filtros);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener tipos de documento:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de documento por tipo de persona
   */
  async getTiposDocumentoPorPersona(tipoPersona: TipoPersona): Promise<DocumentoTipo[]> {
    try {
      return this.getTiposDocumento({
        aplica_pf: tipoPersona === 'PF',
        aplica_pfae: tipoPersona === 'PF_AE',
        aplica_pm: tipoPersona === 'PM'
      });
    } catch (error) {
      console.error('Error al obtener tipos de documento por persona:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos vencidos
   */
  async getDocumentosVencidos(): Promise<DocumentoVencimiento[]> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: DocumentoVencimiento[];
      }>(`${this.endpoint}/vencidos`);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos vencidos:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getDocumentosProximosVencer(dias: number = 30): Promise<DocumentoVencimiento[]> {
    try {
      const response = await apiService.get<{
        success: boolean;
        data: DocumentoVencimiento[];
      }>(`${this.endpoint}/proximos-vencer`, { dias });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos próximos a vencer:', error);
      throw error;
    }
  }

  /**
   * Subir documento con archivo
   */
  async subirDocumento(data: DocumentoSubida): Promise<Documento> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('cliente_id', data.clienteId.toString());
      formData.append('documento_tipo_id', data.documentoTipoId.toString());
      formData.append('fecha_documento', data.fechaDocumento.toISOString().split('T')[0]);
      
      if (data.folioSolicitud) {
        formData.append('folio_solicitud', data.folioSolicitud);
      }
      
      if (data.reemplazar) {
        formData.append('reemplazar', 'true');
      }

      const response = await apiService.uploadFile<{
        success: boolean;
        data: Documento;
      }>(`${this.endpoint}/subir`, data.file, {
        cliente_id: data.clienteId,
        documento_tipo_id: data.documentoTipoId,
        fecha_documento: data.fechaDocumento.toISOString().split('T')[0],
        folio_solicitud: data.folioSolicitud,
        reemplazar: data.reemplazar
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos faltantes para un cliente
   */
  async getDocumentosFaltantes(clienteId: number, folioSolicitud?: string): Promise<DocumentoFaltante[]> {
    try {
      const params = folioSolicitud ? { folio_solicitud: folioSolicitud } : {};
      
      const response = await apiService.get<{
        success: boolean;
        data: DocumentoFaltante[];
      }>(`${this.endpoint}/cliente/${clienteId}/faltantes`, params);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos faltantes:', error);
      throw error;
    }
  }

  /**
   * Verificar completitud de documentos para un cliente
   */
  async verificarCompletitud(clienteId: number, folioSolicitud?: string): Promise<DocumentoCompletitud> {
    try {
      const params = folioSolicitud ? { folio_solicitud: folioSolicitud } : {};
      
      const response = await apiService.get<{
        success: boolean;
        data: DocumentoCompletitud;
      }>(`${this.endpoint}/cliente/${clienteId}/completitud`, params);
      
      return response.data;
    } catch (error) {
      console.error('Error al verificar completitud:', error);
      throw error;
    }
  }

  /**
   * Regenerar URL de documento
   */
  async regenerarUrlDocumento(documentoId: number): Promise<string> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: { url: string };
      }>(`${this.endpoint}/${documentoId}/regenerar-url`);
      
      return response.data.url;
    } catch (error) {
      console.error('Error al regenerar URL documento:', error);
      throw error;
    }
  }

  /**
   * Actualizar documentos vencidos (proceso batch)
   */
  async actualizarDocumentosVencidos(): Promise<{
    procesados: number;
    actualizados: number;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        data: {
          procesados: number;
          actualizados: number;
        };
      }>(`${this.endpoint}/actualizar-vencidos`);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar documentos vencidos:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos por cliente
   */
  async getDocumentosPorCliente(clienteId: number): Promise<Documento[]> {
    try {
      const response = await this.getDocumentos({
        cliente_id: clienteId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos por cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener documentos por estatus
   */
  async getDocumentosPorEstatus(estatus: EstatusDocumento): Promise<Documento[]> {
    try {
      const response = await this.getDocumentos({
        estatus: [estatus]
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener documentos por estatus:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de documentos
   */
  async getEstadisticas(): Promise<{
    total: number;
    por_estatus: Record<EstatusDocumento, number>;
    vencidos: number;
    proximos_vencer: number;
    completitud_promedio: number;
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

  /**
   * Validar archivo antes de subir
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WebP) y PDF.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Obtener URL de previsualización de documento
   */
  getPreviewUrl(documento: Documento): string {
    return `${apiService.buildUrl('/documentos/preview', { id: documento.documento_id })}`;
  }

  /**
   * Descargar documento
   */
  async descargarDocumento(documento: Documento): Promise<void> {
    try {
      window.open(documento.archivo_url, '_blank');
    } catch (error) {
      console.error('Error al descargar documento:', error);
      throw error;
    }
  }

  /**
   * Procesar documentos en lote
   */
  async procesarDocumentosLote(documentoIds: number[], accion: 'aprobar' | 'rechazar', comentario?: string): Promise<void> {
    try {
      const estatus = accion === 'aprobar' ? 'aceptado' : 'rechazado';
      
      const promises = documentoIds.map(id => 
        this.reviewDocumento(id, {
          estatus,
          comentario_revisor: comentario
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al procesar documentos en lote:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio de documento
export const documentoService = new DocumentoService();
