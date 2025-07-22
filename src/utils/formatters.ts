// Utilidades para formateo de datos basadas en los tipos del sistema

import type { 
  Cliente, 
  Solicitud, 
  Usuario, 
  TipoPersona, 
  EstatusDocumento, 
  EstatusSolicitud,
  ProductoCodigo,
  RolUsuario,
  DocumentoTipo,
  Documento,
  IngresoCliente,
  DocumentoRequerido,
  DocumentoAlerta
} from '../types';

// Interfaces para funciones de cálculo
interface ProductoCalculadora {
  tabla_amortizacion: {
    numero_pago: number;
    fecha_pago: Date;
    saldo_inicial: number;
    pago_capital: number;
    pago_interes: number;
    pago_total: number;
    saldo_final: number;
  }[];
}

import {
  TIPOS_PERSONA,
  PRODUCTOS,
  ESTATUS_SOLICITUD,
  ESTATUS_DOCUMENTO,
  ROLES_USUARIO,
  SECTORES_ECONOMICOS,
  GIROS_POR_SECTOR,
  CONFIGURACION_PRODUCTOS,
  PRODUCTOS_POR_TIPO,
  PLAZOS_POR_PRODUCTO
} from '../constants';

// Formateo de fechas
export const formatearFecha = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatearFechaHora = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatearFechaRelativa = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diferencia = ahora.getTime() - date.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
  return `Hace ${Math.floor(dias / 365)} años`;
};

// Formateo de moneda
export const formatearMoneda = (monto: number, moneda: 'MXN' | 'USD' = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2
  }).format(monto);
};

// Formateo de números
export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-MX').format(numero);
};

export const formatearPorcentaje = (numero: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(numero / 100);
};

// Formateo de texto
export const formatearRFC = (rfc: string): string => {
  return rfc.toUpperCase();
};

export const formatearCURP = (curp: string): string => {
  return curp.toUpperCase();
};

export const formatearTelefono = (telefono: string): string => {
  // Formato: (555) 123-4567
  const numeros = telefono.replace(/\D/g, '');
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 3)}) ${numeros.slice(3, 6)}-${numeros.slice(6)}`;
  }
  return telefono;
};

// Formateo de nombres
export const formatearNombreCompleto = (cliente: Cliente): string => {
  if (cliente.tipo_persona === 'PM') {
    return cliente.razon_social || 'Sin nombre';
  }
  
  const nombre = cliente.nombre || '';
  const apellidoPaterno = cliente.apellido_paterno || '';
  const apellidoMaterno = cliente.apellido_materno || '';
  
  return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Sin nombre';
};

export const formatearNombreCorto = (cliente: Cliente): string => {
  if (cliente.tipo_persona === 'PM') {
    return cliente.razon_social || 'Sin nombre';
  }
  
  const nombre = cliente.nombre || '';
  const apellidoPaterno = cliente.apellido_paterno || '';
  
  return `${nombre} ${apellidoPaterno}`.trim() || 'Sin nombre';
};

export const formatearNombreUsuario = (usuario: Usuario): string => {
  return `${usuario.nombre} ${usuario.apellido}`;
};

// Formateo de direcciones
export const formatearDireccion = (cliente: Cliente): string => {
  const partes = [
    cliente.calle,
    cliente.numero_exterior,
    cliente.colonia,
    cliente.ciudad,
    cliente.estado,
    cliente.codigo_postal
  ].filter(Boolean);
  
  return partes.join(', ') || 'Sin dirección';
};

// Formateo de estados y etiquetas
export const formatearTipoPersona = (tipo: TipoPersona): string => {
  return TIPOS_PERSONA[tipo] || tipo;
};

export const formatearProducto = (codigo: ProductoCodigo): string => {
  return PRODUCTOS[codigo] || codigo;
};

export const formatearEstatusSolicitud = (estatus: EstatusSolicitud): string => {
  return ESTATUS_SOLICITUD[estatus] || estatus;
};

export const formatearEstatusDocumento = (estatus: EstatusDocumento): string => {
  return ESTATUS_DOCUMENTO[estatus] || estatus;
};

export const formatearRolUsuario = (rol: RolUsuario): string => {
  return ROLES_USUARIO[rol] || rol;
};

// Utilidades de validación
export const validarRFC = (rfc: string, tipoPersona: TipoPersona): boolean => {
  if (tipoPersona === 'PM') {
    return /^[A-Z]{3}[0-9]{6}[A-Z0-9]{3}$/.test(rfc);
  }
  return /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/.test(rfc);
};

export const validarCURP = (curp: string): boolean => {
  return /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(curp);
};

export const validarEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validarTelefono = (telefono: string): boolean => {
  const numeros = telefono.replace(/\D/g, '');
  return numeros.length === 10;
};

export const validarCodigoPostal = (cp: string): boolean => {
  return /^[0-9]{5}$/.test(cp);
};

// Utilidades de cálculo
export const calcularEdad = (fechaNacimiento: Date): number => {
  const hoy = new Date();
  const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const diaActual = hoy.getDate();
  
  if (mesActual < fechaNacimiento.getMonth() || 
      (mesActual === fechaNacimiento.getMonth() && diaActual < fechaNacimiento.getDate())) {
    return edad - 1;
  }
  
  return edad;
};

export const calcularDiasHastaVencimiento = (fechaVencimiento: Date): number => {
  const hoy = new Date();
  const diferencia = fechaVencimiento.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

export const calcularTiempoEnProceso = (fechaInicio: Date): number => {
  const hoy = new Date();
  const diferencia = hoy.getTime() - fechaInicio.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

export const calcularPorcentajeCompletitud = (total: number, completados: number): number => {
  if (total === 0) return 0;
  return Math.round((completados / total) * 100);
};

// Utilidades de estado
export const estaVencido = (fechaVencimiento: Date): boolean => {
  return new Date() > fechaVencimiento;
};

export const estaProximoAVencer = (fechaVencimiento: Date, diasAnticipacion: number = 30): boolean => {
  const diasRestantes = calcularDiasHastaVencimiento(fechaVencimiento);
  return diasRestantes <= diasAnticipacion && diasRestantes > 0;
};

export const puedeEditarSolicitud = (solicitud: Solicitud): boolean => {
  return solicitud.estatus === 'iniciada';
};

export const puedeAprobarSolicitud = (solicitud: Solicitud): boolean => {
  return solicitud.estatus === 'en_revision';
};

export const puedeRechazarSolicitud = (solicitud: Solicitud): boolean => {
  return solicitud.estatus === 'en_revision';
};

export const puedeCancelarSolicitud = (solicitud: Solicitud): boolean => {
  return ['iniciada', 'en_revision'].includes(solicitud.estatus);
};

// Utilidades de ordenamiento
export const ordenarPorFecha = <T extends { fecha_creacion: Date }>(items: T[], ascendente: boolean = true): T[] => {
  return [...items].sort((a, b) => {
    const fechaA = new Date(a.fecha_creacion).getTime();
    const fechaB = new Date(b.fecha_creacion).getTime();
    return ascendente ? fechaA - fechaB : fechaB - fechaA;
  });
};

export const ordenarPorNombre = (clientes: Cliente[], ascendente: boolean = true): Cliente[] => {
  return [...clientes].sort((a, b) => {
    const nombreA = formatearNombreCompleto(a).toLowerCase();
    const nombreB = formatearNombreCompleto(b).toLowerCase();
    return ascendente ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
  });
};

// Utilidades de filtrado
export const filtrarPorEstatus = <T extends { estatus: string }>(items: T[], estatus: string[]): T[] => {
  if (estatus.length === 0) return items;
  return items.filter(item => estatus.includes(item.estatus));
};

export const filtrarPorTipoPersona = (clientes: Cliente[], tipos: TipoPersona[]): Cliente[] => {
  if (tipos.length === 0) return clientes;
  return clientes.filter(cliente => tipos.includes(cliente.tipo_persona));
};

export const filtrarPorFecha = <T extends { fecha_creacion: Date }>(
  items: T[], 
  fechaDesde?: Date, 
  fechaHasta?: Date
): T[] => {
  return items.filter(item => {
    const fecha = new Date(item.fecha_creacion);
    
    if (fechaDesde && fecha < fechaDesde) return false;
    if (fechaHasta && fecha > fechaHasta) return false;
    
    return true;
  });
};

// Utilidades de búsqueda
export const buscarEnTexto = (texto: string, busqueda: string): boolean => {
  return texto.toLowerCase().includes(busqueda.toLowerCase());
};

export const buscarCliente = (cliente: Cliente, busqueda: string): boolean => {
  const campos = [
    cliente.rfc,
    cliente.correo,
    formatearNombreCompleto(cliente),
    cliente.telefono,
    cliente.curp
  ].filter(Boolean);
  
  return campos.some(campo => buscarEnTexto(campo!, busqueda));
};

export const buscarSolicitud = (solicitud: Solicitud, busqueda: string): boolean => {
  const campos = [
    solicitud.solicitud_id.toString(),
    solicitud.estatus,
    solicitud.cliente?.rfc,
    solicitud.cliente ? formatearNombreCompleto(solicitud.cliente) : ''
  ].filter(Boolean);
  
  return campos.some(campo => buscarEnTexto(campo!, busqueda));
};

// Utilidades de agrupación
export const agruparPorEstatus = <T extends { estatus: string }>(items: T[]): Record<string, T[]> => {
  return items.reduce((grupos, item) => {
    const estatus = item.estatus;
    if (!grupos[estatus]) {
      grupos[estatus] = [];
    }
    grupos[estatus].push(item);
    return grupos;
  }, {} as Record<string, T[]>);
};

export const agruparPorTipoPersona = (clientes: Cliente[]): Record<TipoPersona, Cliente[]> => {
  return clientes.reduce((grupos, cliente) => {
    const tipo = cliente.tipo_persona;
    if (!grupos[tipo]) {
      grupos[tipo] = [];
    }
    grupos[tipo].push(cliente);
    return grupos;
  }, {} as Record<TipoPersona, Cliente[]>);
};

// Utilidades de exportación
export const prepararDatosParaExportar = (datos: any[]): any[] => {
  return datos.map(item => {
    const itemLimpio = { ...item };
    
    // Eliminar campos innecesarios
    delete itemLimpio.password_hash;
    delete itemLimpio.created_at;
    delete itemLimpio.updated_at;
    
    // Formatear fechas
    Object.keys(itemLimpio).forEach(key => {
      if (itemLimpio[key] instanceof Date) {
        itemLimpio[key] = formatearFecha(itemLimpio[key]);
      }
    });
    
    return itemLimpio;
  });
};

// Utilidades de colores
export const obtenerColorPorCompletitud = (porcentaje: number): string => {
  if (porcentaje >= 80) return 'text-green-600';
  if (porcentaje >= 60) return 'text-yellow-600';
  if (porcentaje >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const obtenerColorPorUrgencia = (dias: number): string => {
  if (dias <= 0) return 'text-red-600';
  if (dias <= 7) return 'text-orange-600';
  if (dias <= 30) return 'text-yellow-600';
  return 'text-green-600';
};

// Utilidades para DocumentoTipo
export const aplicaATipoPersona = (documentoTipo: DocumentoTipo, tipoPersona: TipoPersona): boolean => {
  switch (tipoPersona) {
    case 'PF':
      return documentoTipo.aplica_pf;
    case 'PF_AE':
      return documentoTipo.aplica_pfae;
    case 'PM':
      return documentoTipo.aplica_pm;
    default:
      return false;
  }
};

export const formatearVigenciaDocumento = (vigenciaDias?: number): string => {
  if (!vigenciaDias) return 'Una vez (no caduca)';
  if (vigenciaDias === 30) return '30 días naturales';
  if (vigenciaDias === 90) return '3 meses';
  if (vigenciaDias === 365) return '1 año';
  if (vigenciaDias === 730) return '2 años';
  return `${vigenciaDias} días`;
};

export const calcularFechaExpiracionDocumento = (fechaDocumento: Date, vigenciaDias?: number): Date | null => {
  if (!vigenciaDias) return null;
  
  const fecha = new Date(fechaDocumento);
  fecha.setDate(fecha.getDate() + vigenciaDias);
  return fecha;
};

export const esDocumentoUnaVez = (documentoTipo: DocumentoTipo): boolean => {
  return !documentoTipo.vigencia_dias;
};

export const necesitaRenovacionPorSolicitud = (documentoTipo: DocumentoTipo): boolean => {
  const documentosRenovables = [
    'Comprobante de Ingresos',
    'Pasivos Bancarios',
    'Carátula Estado de Cuenta',
    'Declaración de Impuestos (2 últimas)',
    'Carátula Estado de Cuenta (PM)',
    'Pasivos Bancarios (PM)'
  ];
  
  return documentosRenovables.includes(documentoTipo.nombre);
};

// Utilidades para IngresoCliente
export const calcularIngresoMensual = (ingresoAnual: number): number => {
  return ingresoAnual / 12;
};

export const formatearIngresoCliente = (ingreso: IngresoCliente): string => {
  const mensual = calcularIngresoMensual(ingreso.ingreso_anual);
  return `${formatearMoneda(mensual, ingreso.moneda as 'MXN' | 'USD')} mensual`;
};

export const validarIngresoMinimo = (ingreso: number, producto: ProductoCodigo): boolean => {
  const minimosRequeridos = {
    CS: 10000,
    CC: 50000,
    FA: 100000,
    AR: 100000
  };
  
  return ingreso >= minimosRequeridos[producto];
};

export const calcularCapacidadPago = (ingresoMensual: number, factorEndeudamiento: number = 0.3): number => {
  return ingresoMensual * factorEndeudamiento;
};

export const obtenerSectoresComunes = (): string[] => {
  return Object.values(SECTORES_ECONOMICOS);
};

export const obtenerGirosPorSector = (sector: string): readonly string[] => {
  const sectoresMap: Record<string, readonly string[]> = {
    'Comercio al por mayor y menor': GIROS_POR_SECTOR.COMERCIO,
    'Industrias manufactureras': GIROS_POR_SECTOR.MANUFACTURA,
    'Otros servicios': GIROS_POR_SECTOR.SERVICIOS
  };
  
  return sectoresMap[sector] || ['Otros'] as readonly string[];
};

// Utilidades para SolicitudProducto
export const obtenerNombreProducto = (producto: ProductoCodigo): string => {
  return PRODUCTOS[producto] || producto;
};

export const calcularPagoMensualEstimado = (
  monto: number, 
  plazoMeses: number, 
  tasaAnual: number = 0.12
): number => {
  const tasaMensual = tasaAnual / 12;
  const factor = Math.pow(1 + tasaMensual, plazoMeses);
  return (monto * tasaMensual * factor) / (factor - 1);
};

export const calcularTotalAPagar = (
  monto: number, 
  plazoMeses: number, 
  tasaAnual: number = 0.12
): number => {
  const pagoMensual = calcularPagoMensualEstimado(monto, plazoMeses, tasaAnual);
  return pagoMensual * plazoMeses;
};

export const calcularTotalIntereses = (
  monto: number, 
  plazoMeses: number, 
  tasaAnual: number = 0.12
): number => {
  const totalAPagar = calcularTotalAPagar(monto, plazoMeses, tasaAnual);
  return totalAPagar - monto;
};

export const validarMontoProducto = (monto: number, producto: ProductoCodigo): boolean => {
  const config = CONFIGURACION_PRODUCTOS[producto];
  return monto >= config.monto_minimo && monto <= config.monto_maximo;
};

export const validarPlazoProducto = (plazoMeses: number, producto: ProductoCodigo): boolean => {
  const config = CONFIGURACION_PRODUCTOS[producto];
  return plazoMeses >= config.plazo_minimo && plazoMeses <= config.plazo_maximo;
};

export const obtenerPlazosDisponibles = (producto: ProductoCodigo): readonly number[] => {
  return PLAZOS_POR_PRODUCTO[producto] || [];
};

export const esProductoDisponibleParaTipo = (producto: ProductoCodigo, tipoPersona: TipoPersona): boolean => {
  const productosDisponibles = PRODUCTOS_POR_TIPO[tipoPersona];
  return productosDisponibles.includes(producto);
};

export const calcularTablaAmortizacion = (
  monto: number,
  plazoMeses: number,
  tasaAnual: number = 0.12
): ProductoCalculadora['tabla_amortizacion'] => {
  const tasaMensual = tasaAnual / 12;
  const pagoMensual = calcularPagoMensualEstimado(monto, plazoMeses, tasaAnual);
  
  const tabla: ProductoCalculadora['tabla_amortizacion'] = [];
  let saldo = monto;
  
  for (let i = 1; i <= plazoMeses; i++) {
    const pagoInteres = saldo * tasaMensual;
    const pagoCapital = pagoMensual - pagoInteres;
    const nuevoSaldo = saldo - pagoCapital;
    
    const fechaPago = new Date();
    fechaPago.setMonth(fechaPago.getMonth() + i);
    
    tabla.push({
      numero_pago: i,
      fecha_pago: fechaPago,
      saldo_inicial: saldo,
      pago_capital: pagoCapital,
      pago_interes: pagoInteres,
      pago_total: pagoMensual,
      saldo_final: nuevoSaldo
    });
    
    saldo = nuevoSaldo;
  }
  
  return tabla;
};

// Utilidades para completitud de documentos
export const calcularCompletitudDocumentos = (
  documentosRequeridos: DocumentoRequerido[]
): number => {
  const total = documentosRequeridos.length;
  const completados = documentosRequeridos.filter(doc => doc.esta_completo).length;
  
  return calcularPorcentajeCompletitud(total, completados);
};

export const obtenerDocumentosFaltantes = (
  documentosRequeridos: DocumentoRequerido[]
): string[] => {
  return documentosRequeridos
    .filter(doc => !doc.esta_completo)
    .map(doc => doc.documento_tipo.nombre);
};

export const obtenerDocumentosVencidos = (
  documentosRequeridos: DocumentoRequerido[]
): DocumentoRequerido[] => {
  return documentosRequeridos.filter(doc => doc.esta_vencido);
};

export const obtenerDocumentosProximosVencer = (
  documentosRequeridos: DocumentoRequerido[],
  diasAnticipacion: number = 30
): DocumentoRequerido[] => {
  return documentosRequeridos.filter(doc => 
    doc.dias_para_vencimiento !== undefined && 
    doc.dias_para_vencimiento <= diasAnticipacion && 
    doc.dias_para_vencimiento > 0
  );
};

export const puedeProcedeseConOnboarding = (
  documentosRequeridos: DocumentoRequerido[]
): boolean => {
  const obligatorios = documentosRequeridos.filter(doc => doc.es_obligatorio);
  const obligatoriosCompletos = obligatorios.filter(doc => doc.esta_completo && !doc.esta_vencido);
  
  return obligatoriosCompletos.length === obligatorios.length;
};

// Utilidades para alertas del sistema
export const generarAlertaDocumento = (
  documento: Documento,
  cliente: Cliente,
  documentoTipo: DocumentoTipo
): DocumentoAlerta | null => {
  const fechaVencimiento = documento.fecha_expiracion;
  const diasRestantes = fechaVencimiento ? calcularDiasHastaVencimiento(fechaVencimiento) : null;
  
  if (documento.estatus === 'vencido' || (diasRestantes !== null && diasRestantes <= 0)) {
    return {
      documento_id: documento.documento_id,
      cliente_id: cliente.cliente_id,
      cliente_nombre: formatearNombreCompleto(cliente),
      documento_tipo: documentoTipo.nombre,
      tipo_alerta: 'vencido',
      mensaje: `El documento ${documentoTipo.nombre} ha vencido`,
      prioridad: 'alta',
      fecha_alerta: new Date()
    };
  }
  
  if (diasRestantes !== null && diasRestantes <= 30) {
    return {
      documento_id: documento.documento_id,
      cliente_id: cliente.cliente_id,
      cliente_nombre: formatearNombreCompleto(cliente),
      documento_tipo: documentoTipo.nombre,
      tipo_alerta: 'vencimiento_proximo',
      mensaje: `El documento ${documentoTipo.nombre} vence en ${diasRestantes} días`,
      dias_restantes: diasRestantes,
      prioridad: diasRestantes <= 7 ? 'alta' : 'media',
      fecha_alerta: new Date()
    };
  }
  
  if (documento.estatus === 'rechazado') {
    return {
      documento_id: documento.documento_id,
      cliente_id: cliente.cliente_id,
      cliente_nombre: formatearNombreCompleto(cliente),
      documento_tipo: documentoTipo.nombre,
      tipo_alerta: 'rechazado',
      mensaje: `El documento ${documentoTipo.nombre} ha sido rechazado`,
      prioridad: 'alta',
      fecha_alerta: new Date()
    };
  }
  
  return null;
};
