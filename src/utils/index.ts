// Exportaciones principales de utilidades
export * from './formatters';
export * from './helpers';
export * from './validators';
export * from './validation';

// Re-exportar los más comunes para facilitar el uso
export {
  formatearFecha,
  formatearMoneda,
  formatearNombreCompleto,
  formatearTipoPersona,
  formatearEstatusSolicitud,
  formatearEstatusDocumento,
  validarRFC,
  validarEmail,
  calcularEdad,
  estaVencido,
  puedeEditarSolicitud
} from './formatters';

// Re-exportar utilidades de validación
export {
  validarSolicitudConCliente,
  validarDocumentoConCliente,
  filtrarSolicitudesValidas,
  obtenerSolicitudesInvalidas,
  obtenerErroresValidacion,
  obtenerNombreCliente,
  validarIntegridadSolicitud
} from './validation';

export {
  debounce,
  storage,
  copiarAlPortapapeles,
  descargarArchivo,
  removerDuplicados,
  ordenarPor,
  paginar,
  esVacio,
  capitalizar,
  truncar,
  log,
  obtenerMensajeError
} from './helpers';
