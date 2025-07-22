// Validadores para diferentes tipos de datos

/**
 * Valida RFC mexicano
 */
export function isValidRFC(rfc: string): boolean {
  if (!rfc) return false;
  
  // RFC para persona física: XAXX010101000 (13 caracteres)
  // RFC para persona moral: XAX010101000 (12 caracteres)
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  
  return rfcPattern.test(rfc.toUpperCase());
}

/**
 * Valida CURP mexicano
 */
export function isValidCURP(curp: string): boolean {
  if (!curp) return false;
  
  // CURP: 18 caracteres
  const curpPattern = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}$/;
  
  return curpPattern.test(curp.toUpperCase());
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Valida teléfono mexicano
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Teléfono mexicano: 10 dígitos para celular, puede tener +52
  const phonePattern = /^(\+52)?[1-9][0-9]{9}$/;
  
  return phonePattern.test(cleanPhone);
}

/**
 * Valida código postal mexicano
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;
  
  const postalCodePattern = /^[0-9]{5}$/;
  return postalCodePattern.test(postalCode);
}

/**
 * Valida que una fecha esté en un rango válido
 */
export function isValidDate(date: Date | string, minAge?: number, maxAge?: number): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  if (minAge || maxAge) {
    const today = new Date();
    const age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate()) 
      ? age - 1 
      : age;
    
    if (minAge && actualAge < minAge) return false;
    if (maxAge && actualAge > maxAge) return false;
  }
  
  return true;
}

/**
 * Valida que un texto no esté vacío y tenga longitud mínima
 */
export function isValidText(text: string, minLength: number = 1): boolean {
  return text !== null && text !== undefined && text.trim().length >= minLength;
}

/**
 * Valida un número en un rango específico
 */
export function isValidNumber(value: number | string, min?: number, max?: number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
}

/**
 * Valida que una URL sea válida
 */
export function isValidURL(url: string): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida contraseña con criterios de seguridad
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('La contraseña es requerida');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
