// Utilidades generales para la aplicación

// Generar IDs únicos
export const generarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Utilidades de debounce para búsquedas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Utilidades de clipboard
export const copiarAlPortapapeles = async (texto: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
};

// Utilidades de almacenamiento local
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error al leer del localStorage:', error);
      return null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error al escribir en localStorage:', error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar del localStorage:', error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      return false;
    }
  }
};

// Utilidades de archivos
export const descargarArchivo = (url: string, nombreArchivo: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const leerArchivoComoTexto = (archivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(archivo);
  });
};

export const leerArchivoComoDataURL = (archivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(archivo);
  });
};

// Utilidades de URL
export const construirURL = (base: string, parametros: Record<string, any>): string => {
  const url = new URL(base);
  Object.entries(parametros).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};

export const obtenerParametrosURL = (): Record<string, string> => {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// Utilidades de arrays
export const removerDuplicados = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) {
    return Array.from(new Set(array));
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const agruparPorCampo = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((grupos, item) => {
    const valor = String(item[key]);
    if (!grupos[valor]) {
      grupos[valor] = [];
    }
    grupos[valor].push(item);
    return grupos;
  }, {} as Record<string, T[]>);
};

export const ordenarPor = <T>(array: T[], key: keyof T, ascendente: boolean = true): T[] => {
  return [...array].sort((a, b) => {
    const valorA = a[key];
    const valorB = b[key];
    
    if (valorA < valorB) return ascendente ? -1 : 1;
    if (valorA > valorB) return ascendente ? 1 : -1;
    return 0;
  });
};

export const paginar = <T>(array: T[], pagina: number, limite: number): T[] => {
  const inicio = (pagina - 1) * limite;
  const fin = inicio + limite;
  return array.slice(inicio, fin);
};

// Utilidades de validación
export const esVacio = (valor: any): boolean => {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === 'string') return valor.trim().length === 0;
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === 'object') return Object.keys(valor).length === 0;
  return false;
};

export const esNumero = (valor: any): boolean => {
  return !isNaN(valor) && !isNaN(parseFloat(valor));
};

export const esEntero = (valor: any): boolean => {
  return Number.isInteger(Number(valor));
};

export const esFechaValida = (fecha: any): boolean => {
  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date.getTime());
};

// Utilidades de strings
export const capitalizar = (texto: string): string => {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

export const capitalizar_palabras = (texto: string): string => {
  return texto.split(' ').map(palabra => capitalizar(palabra)).join(' ');
};

export const slugify = (texto: string): string => {
  return texto
    .toLowerCase()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncar = (texto: string, longitud: number): string => {
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
};

export const resaltar = (texto: string, busqueda: string): string => {
  if (!busqueda) return texto;
  
  const regex = new RegExp(`(${busqueda})`, 'gi');
  return texto.replace(regex, '<mark>$1</mark>');
};

// Utilidades de colores
export const generarColorAleatorio = (): string => {
  const colores = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#EC4899', // pink
    '#6B7280'  // gray
  ];
  
  return colores[Math.floor(Math.random() * colores.length)];
};

export const hexAhsl = (hex: string): { h: number; s: number; l: number } => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// Utilidades de tiempo
export const esperar = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const formatearDuracion = (ms: number): string => {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 0) return `${dias}d ${horas % 24}h`;
  if (horas > 0) return `${horas}h ${minutos % 60}m`;
  if (minutos > 0) return `${minutos}m ${segundos % 60}s`;
  return `${segundos}s`;
};

// Utilidades de dispositivo
export const esMovil = (): boolean => {
  return window.innerWidth <= 768;
};

export const esTablet = (): boolean => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const esEscritorio = (): boolean => {
  return window.innerWidth > 1024;
};

export const obtenerTamañoPantalla = (): 'mobile' | 'tablet' | 'desktop' => {
  if (esMovil()) return 'mobile';
  if (esTablet()) return 'tablet';
  return 'desktop';
};

// Utilidades de desarrollador
export const log = {
  info: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${mensaje}`, ...args);
    }
  },
  
  error: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${mensaje}`, ...args);
    }
  },
  
  warn: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${mensaje}`, ...args);
    }
  },
  
  debug: (mensaje: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${mensaje}`, ...args);
    }
  }
};

// Utilidades de rendimiento
export const medir = async <T>(
  nombre: string,
  funcion: () => Promise<T>
): Promise<T> => {
  const inicio = performance.now();
  const resultado = await funcion();
  const fin = performance.now();
  
  log.debug(`${nombre} tomó ${fin - inicio} milisegundos`);
  return resultado;
};

// Utilidades de error
export const crearError = (mensaje: string, codigo?: string): Error => {
  const error = new Error(mensaje);
  if (codigo) {
    (error as any).code = codigo;
  }
  return error;
};

export const esErrorHttp = (error: any): boolean => {
  return error?.response?.status !== undefined;
};

export const obtenerMensajeError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'Ha ocurrido un error inesperado';
};

// Utilidades de formato JSON
export const formatearJSON = (objeto: any): string => {
  return JSON.stringify(objeto, null, 2);
};

export const esJSONValido = (texto: string): boolean => {
  try {
    JSON.parse(texto);
    return true;
  } catch {
    return false;
  }
};

// Utilidades para validación de documentos
export const validarDocumento = (archivo: File): { valido: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (!allowedTypes.includes(archivo.type)) {
    return {
      valido: false,
      error: 'Tipo de archivo no permitido. Solo se permiten JPG, PNG y PDF.'
    };
  }
  
  if (archivo.size > maxSize) {
    return {
      valido: false,
      error: 'El archivo es demasiado grande. Tamaño máximo: 10MB.'
    };
  }
  
  return { valido: true };
};

export const obtenerExtensionArchivo = (nombreArchivo: string): string => {
  return nombreArchivo.split('.').pop()?.toLowerCase() || '';
};

export const obtenerTipoArchivo = (nombreArchivo: string): 'imagen' | 'pdf' | 'otro' => {
  const extension = obtenerExtensionArchivo(nombreArchivo);
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return 'imagen';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'otro';
};

export const formatearTamañoArchivo = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utilidades para manejo de errores
export const manejarErrorApi = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';
};

export const esErrorDeRed = (error: any): boolean => {
  return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
};

export const esErrorDeAutenticacion = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Utilidades para paginación
export const calcularPaginacion = (
  paginaActual: number,
  totalPaginas: number,
  ventana: number = 5
): number[] => {
  const paginas: number[] = [];
  
  let inicio = Math.max(1, paginaActual - Math.floor(ventana / 2));
  let fin = Math.min(totalPaginas, inicio + ventana - 1);
  
  if (fin - inicio + 1 < ventana) {
    inicio = Math.max(1, fin - ventana + 1);
  }
  
  for (let i = inicio; i <= fin; i++) {
    paginas.push(i);
  }
  
  return paginas;
};

export const calcularIndicesPagina = (
  pagina: number,
  limite: number
): { inicio: number; fin: number } => {
  const inicio = (pagina - 1) * limite;
  const fin = inicio + limite;
  
  return { inicio, fin };
};

// Utilidades para URLs y navegación
export const construirUrlConParametros = (
  url: string,
  parametros: Record<string, string | number | boolean>
): string => {
  const urlObj = new URL(url, window.location.origin);
  
  Object.entries(parametros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlObj.searchParams.set(key, value.toString());
    }
  });
  
  return urlObj.toString();
};

export const obtenerParametrosUrl = (): Record<string, string> => {
  const params = new URLSearchParams(window.location.search);
  const parametros: Record<string, string> = {};
  
  params.forEach((value, key) => {
    parametros[key] = value;
  });
  
  return parametros;
};

export const navegarConParametros = (
  parametros: Record<string, string | number | boolean>
): void => {
  const url = construirUrlConParametros(window.location.pathname, parametros);
  window.history.pushState({}, '', url);
};

// Utilidades para formularios
export const validarFormulario = (
  datos: Record<string, any>,
  reglas: Record<string, (valor: any) => string | null>
): { valido: boolean; errores: Record<string, string> } => {
  const errores: Record<string, string> = {};
  
  Object.entries(reglas).forEach(([campo, validador]) => {
    const error = validador(datos[campo]);
    if (error) {
      errores[campo] = error;
    }
  });
  
  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
};

export const limpiarFormulario = (
  formulario: HTMLFormElement | null
): void => {
  if (formulario) {
    formulario.reset();
  }
};

// Utilidades para notificaciones
export const crearNotificacion = (
  tipo: 'success' | 'error' | 'warning' | 'info',
  titulo: string,
  mensaje: string,
  duracion: number = 5000
): { id: string; tipo: string; titulo: string; mensaje: string; duracion: number } => {
  return {
    id: generarId(),
    tipo,
    titulo,
    mensaje,
    duracion
  };
};

export const formatearNotificacion = (notificacion: any): string => {
  return `${notificacion.titulo}: ${notificacion.mensaje}`;
};

// Utilidades para fechas de trabajo
export const esDiaHabil = (fecha: Date): boolean => {
  const dia = fecha.getDay();
  return dia >= 1 && dia <= 5; // Lunes a viernes
};

export const agregarDiasHabiles = (fecha: Date, dias: number): Date => {
  const resultado = new Date(fecha);
  let diasAgregados = 0;
  
  while (diasAgregados < dias) {
    resultado.setDate(resultado.getDate() + 1);
    if (esDiaHabil(resultado)) {
      diasAgregados++;
    }
  }
  
  return resultado;
};

export const calcularDiasHabiles = (fechaInicio: Date, fechaFin: Date): number => {
  let dias = 0;
  const fecha = new Date(fechaInicio);
  
  while (fecha <= fechaFin) {
    if (esDiaHabil(fecha)) {
      dias++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  
  return dias;
};

// Utilidades para análisis de datos
export const agruparPor = <T>(
  array: T[],
  obtenerClave: (item: T) => string
): Record<string, T[]> => {
  return array.reduce((grupos, item) => {
    const clave = obtenerClave(item);
    if (!grupos[clave]) {
      grupos[clave] = [];
    }
    grupos[clave].push(item);
    return grupos;
  }, {} as Record<string, T[]>);
};

export const calcularEstadisticas = (numeros: number[]): {
  total: number;
  promedio: number;
  maximo: number;
  minimo: number;
  mediana: number;
} => {
  if (numeros.length === 0) {
    return { total: 0, promedio: 0, maximo: 0, minimo: 0, mediana: 0 };
  }
  
  const ordenados = [...numeros].sort((a, b) => a - b);
  const total = numeros.reduce((sum, num) => sum + num, 0);
  const promedio = total / numeros.length;
  const maximo = Math.max(...numeros);
  const minimo = Math.min(...numeros);
  
  const mitad = Math.floor(ordenados.length / 2);
  const mediana = ordenados.length % 2 === 0
    ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
    : ordenados[mitad];
  
  return { total, promedio, maximo, minimo, mediana };
};

// Utilidades para exportación de datos
export const exportarACSV = (
  datos: any[],
  columnas: { clave: string; titulo: string }[],
  nombreArchivo: string
): void => {
  const encabezados = columnas.map(col => col.titulo).join(',');
  const filas = datos.map(fila => 
    columnas.map(col => {
      const valor = fila[col.clave];
      // Escapar comillas y envolver en comillas si contiene comas
      return typeof valor === 'string' && valor.includes(',') 
        ? `"${valor.replace(/"/g, '""')}"` 
        : valor;
    }).join(',')
  );
  
  const csv = [encabezados, ...filas].join('\n');
  descargarArchivoDeTexto(csv, `${nombreArchivo}.csv`, 'text/csv');
};

export const exportarAJSON = (datos: any, nombreArchivo: string): void => {
  const json = JSON.stringify(datos, null, 2);
  descargarArchivoDeTexto(json, `${nombreArchivo}.json`, 'application/json');
};

const descargarArchivoDeTexto = (contenido: string, nombreArchivo: string, tipo: string): void => {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Utilidades para rendimiento
export const memoizar = <T extends (...args: any[]) => any>(
  fn: T,
  obtenerClave?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const clave = obtenerClave ? obtenerClave(...args) : JSON.stringify(args);
    
    if (cache.has(clave)) {
      return cache.get(clave)!;
    }
    
    const resultado = fn(...args);
    cache.set(clave, resultado);
    return resultado;
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limite: number
): T => {
  let enEspera = false;
  
  return ((...args: Parameters<T>): ReturnType<T> | void => {
    if (!enEspera) {
      const resultado = fn(...args);
      enEspera = true;
      setTimeout(() => {
        enEspera = false;
      }, limite);
      return resultado;
    }
  }) as T;
};

// Utilidades para animaciones
export const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export const animarValor = (
  valorInicial: number,
  valorFinal: number,
  duracion: number,
  callback: (valor: number) => void,
  easing: (t: number) => number = easeInOut
): void => {
  const inicioTiempo = performance.now();
  
  const animar = (tiempoActual: number) => {
    const tiempoTranscurrido = tiempoActual - inicioTiempo;
    const progreso = Math.min(tiempoTranscurrido / duracion, 1);
    const valorInterpolado = valorInicial + (valorFinal - valorInicial) * easing(progreso);
    
    callback(valorInterpolado);
    
    if (progreso < 1) {
      requestAnimationFrame(animar);
    }
  };
  
  requestAnimationFrame(animar);
};
