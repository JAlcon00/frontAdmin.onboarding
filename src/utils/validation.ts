import type { SolicitudCompleta } from '../services/solicitud.service';

/**
 * Validar que una solicitud tenga cliente válido
 * @param solicitud - La solicitud a validar
 * @returns true si la solicitud tiene cliente válido, false en caso contrario
 */
export const validarSolicitudConCliente = (solicitud: SolicitudCompleta): boolean => {
  return !!(solicitud.cliente_id && solicitud.cliente);
};

/**
 * Validar que un documento tenga cliente válido
 * @param documento - El documento a validar
 * @returns true si el documento tiene cliente válido, false en caso contrario
 */
export const validarDocumentoConCliente = (documento: any): boolean => {
  return !!(documento.cliente_id && documento.cliente_id > 0);
};

/**
 * Validar coherencia entre documento y cliente
 * @param documento - El documento a validar
 * @param cliente - Los datos del cliente (opcional)
 * @returns true si hay coherencia, false en caso contrario
 */
export const validarCoherenciaDocumentoCliente = (documento: any, cliente?: any): boolean => {
  // Validar que tenga cliente_id
  if (!validarDocumentoConCliente(documento)) {
    return false;
  }

  // Si se proporcionan datos del cliente, validar coherencia
  if (cliente) {
    // Validar que el cliente_id coincida
    if (documento.cliente_id !== cliente.cliente_id) {
      return false;
    }

    // Validar coherencia del tipo de documento con tipo de persona
    if (cliente.tipo_persona === 'PF' && documento.documento_tipo?.nombre?.includes('Acta Constitutiva')) {
      return false; // Persona física no debería tener acta constitutiva
    }

    if (cliente.tipo_persona === 'PM' && documento.documento_tipo?.nombre?.includes('CURP')) {
      return false; // Persona moral no debería tener CURP
    }

    // Validar que el tipo de documento aplique al tipo de persona
    if (cliente.tipo_persona === 'PF' && documento.documento_tipo && !documento.documento_tipo.aplica_pf) {
      return false;
    }

    if (cliente.tipo_persona === 'PM' && documento.documento_tipo && !documento.documento_tipo.aplica_pm) {
      return false;
    }
  }

  return true;
};

/**
 * Obtener errores de validación para documentos
 * @param documentos - Array de documentos a validar
 * @returns Array de mensajes de error de validación
 */
export const obtenerErroresValidacionDocumentos = (documentos: any[]): string[] => {
  const errors: string[] = [];
  
  documentos.forEach(documento => {
    if (!documento.cliente_id) {
      errors.push(`Documento ${documento.documento_id || 'sin ID'} sin cliente_id`);
    }
    
    if (!documento.documento_tipo) {
      errors.push(`Documento ${documento.documento_id || 'sin ID'} sin tipo de documento`);
    }

    if (!documento.nombre_archivo) {
      errors.push(`Documento ${documento.documento_id || 'sin ID'} sin archivo`);
    }

    if (documento.cliente && !validarCoherenciaDocumentoCliente(documento, documento.cliente)) {
      errors.push(`Documento ${documento.documento_id || 'sin ID'} incoherente con datos del cliente`);
    }
  });
  
  return errors;
};

/**
 * Validar completitud de documentos de un cliente
 * @param cliente - Los datos del cliente
 * @param documentos - Array de documentos del cliente
 * @returns Objeto con resultado de validación
 */
export const validarCompletitudDocumentosCliente = (cliente: any, documentos: any[]): {
  esCompleto: boolean;
  documentosFaltantes: string[];
  documentosInvalidos: string[];
  porcentajeCompletitud: number;
} => {
  const documentosRequeridos = cliente.tipo_persona === 'PF' 
    ? ['INE', 'Comprobante de Ingresos', 'Comprobante de Domicilio']
    : ['RFC', 'Acta Constitutiva', 'Comprobante de Domicilio Fiscal', 'Estados Financieros'];

  const documentosCliente = documentos.filter(doc => doc.cliente_id === cliente.cliente_id);
  const tiposDocumentosCliente = documentosCliente
    .map(doc => doc.documento_tipo?.nombre)
    .filter(Boolean);

  const documentosFaltantes = documentosRequeridos.filter(tipo => 
    !tiposDocumentosCliente.some(tipoDoc => tipoDoc?.includes(tipo))
  );
  
  const documentosInvalidos = documentosCliente.filter(doc => 
    !validarCoherenciaDocumentoCliente(doc, cliente)
  );

  const porcentajeCompletitud = Math.round(
    ((documentosRequeridos.length - documentosFaltantes.length) / documentosRequeridos.length) * 100
  );

  return {
    esCompleto: documentosFaltantes.length === 0 && documentosInvalidos.length === 0,
    documentosFaltantes,
    documentosInvalidos: documentosInvalidos.map(doc => 
      `${doc.documento_tipo?.nombre || 'Documento'} inválido`
    ),
    porcentajeCompletitud
  };
};

/**
 * Filtrar solicitudes válidas con cliente
 * @param solicitudes - Array de solicitudes a filtrar
 * @returns Array de solicitudes que tienen cliente válido
 */
export const filtrarSolicitudesValidas = (solicitudes: SolicitudCompleta[]): SolicitudCompleta[] => {
  return solicitudes.filter(validarSolicitudConCliente);
};

/**
 * Obtener solicitudes inválidas sin cliente
 * @param solicitudes - Array de solicitudes a validar
 * @returns Array de solicitudes que no tienen cliente válido
 */
export const obtenerSolicitudesInvalidas = (solicitudes: SolicitudCompleta[]): SolicitudCompleta[] => {
  return solicitudes.filter(s => !validarSolicitudConCliente(s));
};

/**
 * Obtener errores de validación para solicitudes
 * @param solicitudes - Array de solicitudes a validar
 * @returns Array de mensajes de error de validación
 */
export const obtenerErroresValidacion = (solicitudes: SolicitudCompleta[]): string[] => {
  const errors: string[] = [];
  
  solicitudes.forEach(solicitud => {
    if (!solicitud.cliente_id) {
      errors.push(`Solicitud #${solicitud.solicitud_id} sin cliente_id`);
    }
    
    if (!solicitud.cliente) {
      errors.push(`Solicitud #${solicitud.solicitud_id} sin datos de cliente`);
    }
  });
  
  return errors;
};

/**
 * Obtener nombre del cliente con validación
 * @param solicitud - La solicitud de la cual obtener el nombre del cliente
 * @returns Nombre del cliente o mensaje de error
 */
export const obtenerNombreCliente = (solicitud: SolicitudCompleta): string => {
  if (!validarSolicitudConCliente(solicitud)) {
    console.warn(`Solicitud ${solicitud.solicitud_id} sin cliente referenciado`);
    return '⚠️ Cliente no encontrado';
  }
  
  if (solicitud.cliente!.tipo_persona === 'PM') {
    return solicitud.cliente!.razon_social || '⚠️ Sin razón social';
  }
  
  const nombre = solicitud.cliente!.nombre || '';
  const apellidoPaterno = solicitud.cliente!.apellido_paterno || '';
  const apellidoMaterno = solicitud.cliente!.apellido_materno || '';
  
  return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || '⚠️ Sin nombre';
};

/**
 * Validar integridad de datos de solicitud
 * @param solicitud - La solicitud a validar
 * @returns Objeto con resultado de validación y errores
 */
export const validarIntegridadSolicitud = (solicitud: SolicitudCompleta): {
  esValida: boolean;
  errores: string[];
} => {
  const errores: string[] = [];
  
  // Validar cliente
  if (!solicitud.cliente_id) {
    errores.push('Sin cliente_id');
  }
  
  if (!solicitud.cliente) {
    errores.push('Sin datos de cliente');
  }
  
  // Validar productos
  if (!solicitud.productos || solicitud.productos.length === 0) {
    errores.push('Sin productos asociados');
  }
  
  // Validar campos requeridos
  if (!solicitud.estatus) {
    errores.push('Sin estatus definido');
  }
  
  if (!solicitud.fecha_creacion) {
    errores.push('Sin fecha de creación');
  }
  
  return {
    esValida: errores.length === 0,
    errores
  };
};
