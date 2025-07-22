import { useState, useEffect } from 'react';
import {
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { Cliente, ClienteFormData, TipoPersona } from '../../types/cliente.types';
import { TIPOS_PERSONA, VALIDACIONES, MENSAJES_ERROR } from '../../constants';

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (data: ClienteFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isEditing?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function ClienteForm({
  cliente,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  isEditing = false
}: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    tipo_persona: 'PF',
    correo: '',
    telefono: '',
    pais: 'México',
    rfc: '',
    // Persona Física
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: undefined,
    curp: '',
    // Persona Moral
    razon_social: '',
    representante_legal: '',
    fecha_constitucion: undefined,
    // Dirección
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad: '',
    estado: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos del cliente para edición
  useEffect(() => {
    if (cliente && isEditing) {
      setFormData({
        tipo_persona: cliente.tipo_persona,
        correo: cliente.correo,
        telefono: cliente.telefono || '',
        pais: cliente.pais,
        rfc: cliente.rfc,
        // Persona Física
        nombre: cliente.nombre || '',
        apellido_paterno: cliente.apellido_paterno || '',
        apellido_materno: cliente.apellido_materno || '',
        fecha_nacimiento: cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento) : undefined,
        curp: cliente.curp || '',
        // Persona Moral
        razon_social: cliente.razon_social || '',
        representante_legal: cliente.representante_legal || '',
        fecha_constitucion: cliente.fecha_constitucion ? new Date(cliente.fecha_constitucion) : undefined,
        // Dirección
        calle: cliente.calle || '',
        numero_exterior: cliente.numero_exterior || '',
        numero_interior: cliente.numero_interior || '',
        colonia: cliente.colonia || '',
        codigo_postal: cliente.codigo_postal || '',
        ciudad: cliente.ciudad || '',
        estado: cliente.estado || ''
      });
    }
  }, [cliente, isEditing]);

  const handleInputChange = (field: keyof ClienteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo al modificarlo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validaciones comunes
    if (!formData.correo) {
      newErrors.correo = MENSAJES_ERROR.REQUERIDO;
    } else if (!VALIDACIONES.EMAIL.test(formData.correo)) {
      newErrors.correo = MENSAJES_ERROR.EMAIL_INVALIDO;
    }

    if (!formData.rfc) {
      newErrors.rfc = MENSAJES_ERROR.REQUERIDO;
    } else {
      const rfcPattern = formData.tipo_persona === 'PM' 
        ? VALIDACIONES.RFC.PM 
        : VALIDACIONES.RFC.PF;
      if (!rfcPattern.test(formData.rfc)) {
        newErrors.rfc = MENSAJES_ERROR.RFC_INVALIDO;
      }
    }

    if (formData.telefono && !VALIDACIONES.TELEFONO.test(formData.telefono)) {
      newErrors.telefono = MENSAJES_ERROR.TELEFONO_INVALIDO;
    }

    if (formData.codigo_postal && !VALIDACIONES.CODIGO_POSTAL.test(formData.codigo_postal)) {
      newErrors.codigo_postal = MENSAJES_ERROR.CODIGO_POSTAL_INVALIDO;
    }

    // Validaciones específicas por tipo de persona
    if (formData.tipo_persona === 'PM') {
      if (!formData.razon_social) {
        newErrors.razon_social = MENSAJES_ERROR.REQUERIDO;
      }
    } else {
      if (!formData.nombre) {
        newErrors.nombre = MENSAJES_ERROR.REQUERIDO;
      }
      if (!formData.apellido_paterno) {
        newErrors.apellido_paterno = MENSAJES_ERROR.REQUERIDO;
      }
      if (formData.curp && !VALIDACIONES.CURP.test(formData.curp)) {
        newErrors.curp = MENSAJES_ERROR.CURP_INVALIDO;
      }
    }

    // Validar edad mínima para personas físicas
    if (formData.tipo_persona !== 'PM' && formData.fecha_nacimiento) {
      const edad = new Date().getFullYear() - new Date(formData.fecha_nacimiento).getFullYear();
      if (edad < 18) {
        newErrors.fecha_nacimiento = MENSAJES_ERROR.EDAD_MINIMA;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getIconForTipoPersona = (tipo: TipoPersona) => {
    switch (tipo) {
      case 'PF': return UserIcon;
      case 'PF_AE': return UserGroupIcon;
      case 'PM': return BuildingOfficeIcon;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Error general */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Tipo de Persona */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Persona *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(TIPOS_PERSONA) as TipoPersona[]).map((tipo) => {
              const IconComponent = getIconForTipoPersona(tipo);
              return (
                <label
                  key={tipo}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.tipo_persona === tipo
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo_persona"
                    value={tipo}
                    checked={formData.tipo_persona === tipo}
                    onChange={(e) => handleInputChange('tipo_persona', e.target.value as TipoPersona)}
                    className="sr-only"
                  />
                  <IconComponent className="w-6 h-6 mr-3 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {TIPOS_PERSONA[tipo]}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Datos Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persona Moral */}
          {formData.tipo_persona === 'PM' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social *
                </label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) => handleInputChange('razon_social', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.razon_social ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de la empresa"
                />
                {errors.razon_social && (
                  <p className="mt-1 text-sm text-red-600">{errors.razon_social}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representante Legal
                </label>
                <input
                  type="text"
                  value={formData.representante_legal}
                  onChange={(e) => handleInputChange('representante_legal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del representante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Constitución
                </label>
                <input
                  type="date"
                  value={formData.fecha_constitucion ? formData.fecha_constitucion.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('fecha_constitucion', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Persona Física */}
          {formData.tipo_persona !== 'PM' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre(s)"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={formData.apellido_paterno}
                  onChange={(e) => handleInputChange('apellido_paterno', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apellido_paterno ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Apellido paterno"
                />
                {errors.apellido_paterno && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellido_paterno}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  value={formData.apellido_materno}
                  onChange={(e) => handleInputChange('apellido_materno', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Apellido materno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento ? formData.fecha_nacimiento.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value ? new Date(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha_nacimiento && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha_nacimiento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CURP
                </label>
                <input
                  type="text"
                  value={formData.curp}
                  onChange={(e) => handleInputChange('curp', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.curp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="CURP (18 caracteres)"
                  maxLength={18}
                />
                {errors.curp && (
                  <p className="mt-1 text-sm text-red-600">{errors.curp}</p>
                )}
              </div>
            </>
          )}

          {/* RFC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFC *
            </label>
            <input
              type="text"
              value={formData.rfc}
              onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                errors.rfc ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={formData.tipo_persona === 'PM' ? 'RFC (12 caracteres)' : 'RFC (13 caracteres)'}
              maxLength={formData.tipo_persona === 'PM' ? 12 : 13}
            />
            {errors.rfc && (
              <p className="mt-1 text-sm text-red-600">{errors.rfc}</p>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.correo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ejemplo@correo.com"
              />
              {errors.correo && (
                <p className="mt-1 text-sm text-red-600">{errors.correo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10 dígitos"
                maxLength={10}
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Dirección</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calle
              </label>
              <input
                type="text"
                value={formData.calle}
                onChange={(e) => handleInputChange('calle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre de la calle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número Exterior
              </label>
              <input
                type="text"
                value={formData.numero_exterior}
                onChange={(e) => handleInputChange('numero_exterior', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Núm. ext."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número Interior
              </label>
              <input
                type="text"
                value={formData.numero_interior}
                onChange={(e) => handleInputChange('numero_interior', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Núm. int."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colonia
              </label>
              <input
                type="text"
                value={formData.colonia}
                onChange={(e) => handleInputChange('colonia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Colonia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Postal
              </label>
              <input
                type="text"
                value={formData.codigo_postal}
                onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.codigo_postal ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5 dígitos"
                maxLength={5}
              />
              {errors.codigo_postal && (
                <p className="mt-1 text-sm text-red-600">{errors.codigo_postal}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Estado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) => handleInputChange('pais', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="País"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
}
