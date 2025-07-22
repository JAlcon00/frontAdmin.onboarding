// Constantes del sistema de onboarding digital

import type { TipoPersona, EstatusDocumento, EstatusSolicitud, ProductoCodigo, RolUsuario } from '../types';

// Tipos de persona
export const TIPOS_PERSONA: Record<TipoPersona, string> = {
  PF: 'Persona Física',
  PF_AE: 'Persona Física con Actividad Empresarial',
  PM: 'Persona Moral'
};

// Productos financieros
export const PRODUCTOS: Record<ProductoCodigo, string> = {
  CS: 'Línea de Crédito',
  CC: 'Cuenta Corriente',
  FA: 'Factoraje',
  AR: 'Arrendamiento'
};

// Productos disponibles por tipo de persona
export const PRODUCTOS_POR_TIPO: Record<TipoPersona, ProductoCodigo[]> = {
  PF: ['CS', 'CC'],
  PF_AE: ['CS', 'CC', 'FA', 'AR'],
  PM: ['CS', 'CC', 'FA', 'AR']
};

// Estados de solicitud
export const ESTATUS_SOLICITUD: Record<EstatusSolicitud, string> = {
  iniciada: 'Iniciada',
  en_revision: 'En Revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada'
};

// Estados de documento
export const ESTATUS_DOCUMENTO: Record<EstatusDocumento, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  vencido: 'Vencido'
};

// Roles de usuario
export const ROLES_USUARIO: Record<RolUsuario, string> = {
  SUPER: 'Super Administrador',
  ADMIN: 'Administrador',
  AUDITOR: 'Auditor',
  OPERADOR: 'Operador'
};

// Colores para estados (Tailwind CSS)
export const COLORES_ESTATUS = {
  // Solicitudes
  solicitud: {
    iniciada: 'bg-blue-100 text-blue-800 border-blue-200',
    en_revision: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    aprobada: 'bg-green-100 text-green-800 border-green-200',
    rechazada: 'bg-red-100 text-red-800 border-red-200',
    cancelada: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  // Documentos
  documento: {
    pendiente: 'bg-gray-100 text-gray-800 border-gray-200',
    aceptado: 'bg-green-100 text-green-800 border-green-200',
    rechazado: 'bg-red-100 text-red-800 border-red-200',
    vencido: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  // Roles
  rol: {
    SUPER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    AUDITOR: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    OPERADOR: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  // Tipos de persona
  tipoPersona: {
    PF: 'bg-blue-100 text-blue-800 border-blue-200',
    PF_AE: 'bg-purple-100 text-purple-800 border-purple-200',
    PM: 'bg-green-100 text-green-800 border-green-200'
  }
};

// Iconos para diferentes elementos
export const ICONOS = {
  // Tipos de persona
  tipoPersona: {
    PF: 'UserIcon',
    PF_AE: 'UserGroupIcon',
    PM: 'BuildingOfficeIcon'
  },
  // Productos
  producto: {
    CS: 'CreditCardIcon',
    CC: 'BanknotesIcon',
    FA: 'DocumentTextIcon',
    AR: 'TruckIcon'
  },
  // Estados de solicitud
  estatusSolicitud: {
    iniciada: 'ClockIcon',
    en_revision: 'EyeIcon',
    aprobada: 'CheckCircleIcon',
    rechazada: 'XCircleIcon',
    cancelada: 'MinusCircleIcon'
  },
  // Estados de documento
  estatusDocumento: {
    pendiente: 'ClockIcon',
    aceptado: 'CheckCircleIcon',
    rechazado: 'XCircleIcon',
    vencido: 'ExclamationTriangleIcon'
  },
  // Roles
  rol: {
    SUPER: 'StarIcon',
    ADMIN: 'CogIcon',
    AUDITOR: 'EyeIcon',
    OPERADOR: 'UserIcon'
  }
};

// Configuración de paginación
export const PAGINACION = {
  LIMITE_DEFAULT: 10,
  LIMITE_MAXIMO: 100,
  OPCIONES_LIMITE: [10, 25, 50, 100]
};

// Configuración de archivos
export const ARCHIVOS = {
  TAMANO_MAXIMO: 10 * 1024 * 1024, // 10MB
  TIPOS_PERMITIDOS: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ],
  EXTENSIONES_PERMITIDAS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif']
};

// Configuración de validaciones
export const VALIDACIONES = {
  RFC: {
    PF: /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/,
    PM: /^[A-Z]{3}[0-9]{6}[A-Z0-9]{3}$/
  },
  CURP: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/,
  TELEFONO: /^[0-9]{10}$/,
  CODIGO_POSTAL: /^[0-9]{5}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Mensajes de error comunes
export const MENSAJES_ERROR = {
  REQUERIDO: 'Este campo es requerido',
  EMAIL_INVALIDO: 'El formato del email no es válido',
  RFC_INVALIDO: 'El formato del RFC no es válido',
  CURP_INVALIDO: 'El formato del CURP no es válido',
  TELEFONO_INVALIDO: 'El teléfono debe tener 10 dígitos',
  CODIGO_POSTAL_INVALIDO: 'El código postal debe tener 5 dígitos',
  PASSWORD_CORTA: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_NO_COINCIDE: 'Las contraseñas no coinciden',
  ARCHIVO_MUY_GRANDE: 'El archivo es demasiado grande',
  ARCHIVO_TIPO_INVALIDO: 'Tipo de archivo no permitido',
  FECHA_INVALIDA: 'Fecha no válida',
  MONTO_INVALIDO: 'El monto debe ser mayor a 0',
  EDAD_MINIMA: 'Debe ser mayor de 18 años'
};

// Rutas de la aplicación
export const RUTAS = {
  DASHBOARD: '/',
  SOLICITUDES: '/solicitudes',
  SOLICITUD_DETALLE: '/solicitudes/:id',
  CLIENTES: '/clientes',
  CLIENTE_DETALLE: '/clientes/:id',
  DOCUMENTOS: '/documentos',
  USUARIOS: '/usuarios',
  REPORTES: '/reportes',
  CONFIGURACION: '/configuracion',
  PERFIL: '/perfil',
  LOGIN: '/login',
  LOGOUT: '/logout'
};

// Configuración de notificaciones
export const NOTIFICACIONES = {
  DURACION_DEFAULT: 5000, // 5 segundos
  DURACION_ERROR: 10000, // 10 segundos
  DURACION_SUCCESS: 3000, // 3 segundos
  MAXIMO_NOTIFICACIONES: 5
};

// Configuración de alertas del sistema
export const ALERTAS_SISTEMA = {
  DOCUMENTOS_VENCIDOS: {
    DIAS_ANTICIPACION: 30,
    SEVERIDAD: 'medium' as const
  },
  SOLICITUDES_PENDIENTES: {
    DIAS_LIMITE: 7,
    SEVERIDAD: 'high' as const
  }
};

// Estados de completitud
export const COMPLETITUD = {
  MINIMA_PARA_PROCEDER: 80,
  COLORES: {
    BAJA: 'bg-red-200 text-red-800',
    MEDIA: 'bg-yellow-200 text-yellow-800',
    ALTA: 'bg-green-200 text-green-800'
  }
};

// Configuración de reportes
export const REPORTES = {
  FORMATOS_EXPORTACION: ['csv', 'xlsx', 'pdf'],
  LIMITE_REGISTROS: 10000,
  TIEMPO_EXPIRACION: 24 * 60 * 60 * 1000 // 24 horas
};

// Configuración de la API
export const API = {
  TIMEOUT: 10000, // 10 segundos
  REINTENTOS: 3,
  DELAY_REINTENTOS: 1000 // 1 segundo
};

// Configuración de fechas
export const FECHAS = {
  FORMATO_FECHA: 'dd/MM/yyyy',
  FORMATO_FECHA_HORA: 'dd/MM/yyyy HH:mm',
  FORMATO_FECHA_COMPLETA: 'EEEE, dd \'de\' MMMM \'de\' yyyy',
  ZONA_HORARIA: 'America/Mexico_City'
};

// Sectores económicos comunes
export const SECTORES_ECONOMICOS = {
  AGRICULTURA: 'Agricultura, ganadería y pesca',
  MINERIA: 'Minería e industrias extractivas',
  MANUFACTURA: 'Industrias manufactureras',
  ELECTRICIDAD: 'Electricidad, gas y agua',
  CONSTRUCCION: 'Construcción',
  COMERCIO: 'Comercio al por mayor y menor',
  TRANSPORTE: 'Transporte y almacenamiento',
  ALOJAMIENTO: 'Alojamiento y servicios de comida',
  INFORMACION: 'Información y comunicaciones',
  FINANCIERO: 'Actividades financieras y de seguros',
  INMOBILIARIO: 'Actividades inmobiliarias',
  PROFESIONAL: 'Actividades profesionales y técnicas',
  ADMINISTRATIVO: 'Actividades administrativas y de apoyo',
  ADMINISTRACION: 'Administración pública',
  EDUCACION: 'Educación',
  SALUD: 'Salud y asistencia social',
  ARTE: 'Arte, entretenimiento y recreación',
  OTROS: 'Otros servicios'
} as const;

// Giros comerciales comunes por sector
export const GIROS_POR_SECTOR = {
  COMERCIO: [
    'Abarrotes y alimentos',
    'Ropa y calzado',
    'Electrónicos y tecnología',
    'Farmacia y productos médicos',
    'Ferretería y construcción',
    'Automotriz',
    'Libros y papelería',
    'Otros'
  ],
  MANUFACTURA: [
    'Alimentos y bebidas',
    'Textil y confección',
    'Productos químicos',
    'Productos metálicos',
    'Maquinaria y equipo',
    'Muebles y madera',
    'Otros'
  ],
  SERVICIOS: [
    'Consultoría',
    'Tecnología de la información',
    'Servicios financieros',
    'Servicios de salud',
    'Servicios educativos',
    'Servicios de limpieza',
    'Otros'
  ]
} as const;

// Configuración de productos financieros
export const CONFIGURACION_PRODUCTOS = {
  CS: {
    nombre: 'Línea de Crédito',
    monto_minimo: 10000,
    monto_maximo: 1000000,
    plazo_minimo: 1,
    plazo_maximo: 36,
    tasa_base: 0.12
  },
  CC: {
    nombre: 'Cuenta Corriente',
    monto_minimo: 50000,
    monto_maximo: 5000000,
    plazo_minimo: 12,
    plazo_maximo: 60,
    tasa_base: 0.10
  },
  FA: {
    nombre: 'Factoraje',
    monto_minimo: 100000,
    monto_maximo: 10000000,
    plazo_minimo: 1,
    plazo_maximo: 6,
    tasa_base: 0.15
  },
  AR: {
    nombre: 'Arrendamiento',
    monto_minimo: 100000,
    monto_maximo: 10000000,
    plazo_minimo: 12,
    plazo_maximo: 60,
    tasa_base: 0.08
  }
} as const;

// Tipos de documentos por persona
export const DOCUMENTOS_POR_TIPO_PERSONA = {
  PF: [
    'INE/IFE',
    'Comprobante de Domicilio',
    'Comprobante de Ingresos',
    'CURP',
    'RFC',
    'Pasivos Bancarios',
    'Carátula Estado de Cuenta'
  ],
  PF_AE: [
    'INE/IFE',
    'Comprobante de Domicilio',
    'Comprobante de Ingresos',
    'CURP',
    'RFC',
    'Pasivos Bancarios',
    'Carátula Estado de Cuenta',
    'Declaración de Impuestos (2 últimas)',
    'Cédula de Identificación Fiscal'
  ],
  PM: [
    'Acta Constitutiva',
    'Poder Notarial',
    'RFC',
    'Comprobante de Domicilio Fiscal',
    'Comprobante de Ingresos',
    'Carátula Estado de Cuenta (PM)',
    'Pasivos Bancarios (PM)',
    'Declaración de Impuestos (2 últimas)',
    'INE del Representante Legal'
  ]
} as const;

// Vigencia de documentos (en días)
export const VIGENCIA_DOCUMENTOS = {
  INE: null, // No caduca
  COMPROBANTE_DOMICILIO: 90,
  COMPROBANTE_INGRESOS: 30,
  CURP: null,
  RFC: null,
  PASIVOS_BANCARIOS: 30,
  ESTADO_CUENTA: 30,
  DECLARACION_IMPUESTOS: 365,
  ACTA_CONSTITUTIVA: null,
  PODER_NOTARIAL: null,
  CEDULA_FISCAL: null
} as const;

// Configuración de alertas
export const CONFIGURACION_ALERTAS = {
  DOCUMENTOS_VENCIDOS: {
    DIAS_ANTICIPACION: 30,
    SEVERIDAD: 'medium' as const,
    COLOR: 'text-orange-600'
  },
  DOCUMENTOS_RECHAZADOS: {
    SEVERIDAD: 'high' as const,
    COLOR: 'text-red-600'
  },
  SOLICITUDES_PENDIENTES: {
    DIAS_LIMITE: 7,
    SEVERIDAD: 'high' as const,
    COLOR: 'text-red-600'
  },
  COMPLETITUD_BAJA: {
    PORCENTAJE_MINIMO: 70,
    SEVERIDAD: 'medium' as const,
    COLOR: 'text-yellow-600'
  }
} as const;

// Configuración de monedas
export const CONFIGURACION_MONEDAS = {
  MXN: {
    codigo: 'MXN',
    simbolo: '$',
    nombre: 'Peso Mexicano',
    decimales: 2
  },
  USD: {
    codigo: 'USD',
    simbolo: '$',
    nombre: 'Dólar Americano',
    decimales: 2
  }
} as const;

// Configuración de plazos por producto
export const PLAZOS_POR_PRODUCTO = {
  CS: [1, 3, 6, 12, 18, 24, 36],
  CC: [12, 18, 24, 36, 48, 60],
  FA: [1, 2, 3, 4, 5, 6],
  AR: [12, 18, 24, 36, 48, 60]
} as const;

// Configuración de formatos de archivo
export const FORMATOS_ARCHIVO = {
  PDF: {
    extension: '.pdf',
    mime: 'application/pdf',
    icon: 'DocumentIcon'
  },
  JPG: {
    extension: '.jpg',
    mime: 'image/jpeg',
    icon: 'PhotoIcon'
  },
  JPEG: {
    extension: '.jpeg',
    mime: 'image/jpeg',
    icon: 'PhotoIcon'
  },
  PNG: {
    extension: '.png',
    mime: 'image/png',
    icon: 'PhotoIcon'
  }
} as const;

// Configuración de búsqueda
export const BUSQUEDA = {
  MINIMO_CARACTERES: 3,
  DELAY_BUSQUEDA: 300, // 300ms
  MAXIMO_RESULTADOS: 50
};
