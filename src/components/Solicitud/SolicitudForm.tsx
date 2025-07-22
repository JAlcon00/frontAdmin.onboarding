import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  UserIcon, 
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { 
  EstatusSolicitud, 
  ProductoCodigo,
  Moneda
} from '../../types/solicitud.types';

// Definir el tipo para los datos del formulario
export interface SolicitudFormData {
  cliente_id: number;
  producto_codigo: ProductoCodigo;
  monto_solicitado: number;
  moneda: Moneda;
  plazo_meses: number;
  tasa_interes: number;
  finalidad: string;
  observaciones: string;
  estatus: EstatusSolicitud;
  prioridad: 'alta' | 'media' | 'baja';
  fecha_vencimiento: Date;
  asignado_a?: number;
  requiere_garantia: boolean;
  tipo_garantia?: string;
  valor_garantia?: number;
  documentos_requeridos: string[];
  documentos_recibidos: string[];
  comentarios_internos: string;
  historial_estatus: Array<{
    estatus: EstatusSolicitud;
    fecha: Date;
    comentario?: string;
  }>;
}

interface SolicitudFormProps {
  solicitud?: Partial<SolicitudFormData>;
  onSubmit: (data: SolicitudFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

export const SolicitudForm: React.FC<SolicitudFormProps> = ({
  solicitud,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  className = ''
}) => {
  const [formData, setFormData] = useState<SolicitudFormData>({
    cliente_id: solicitud?.cliente_id || 0,
    producto_codigo: solicitud?.producto_codigo || 'CS',
    monto_solicitado: solicitud?.monto_solicitado || 0,
    moneda: solicitud?.moneda || 'MXN',
    plazo_meses: solicitud?.plazo_meses || 12,
    tasa_interes: solicitud?.tasa_interes || 0,
    finalidad: solicitud?.finalidad || '',
    observaciones: solicitud?.observaciones || '',
    estatus: solicitud?.estatus || 'iniciada',
    prioridad: solicitud?.prioridad || 'media',
    fecha_vencimiento: solicitud?.fecha_vencimiento || new Date(),
    asignado_a: solicitud?.asignado_a || undefined,
    requiere_garantia: solicitud?.requiere_garantia || false,
    tipo_garantia: solicitud?.tipo_garantia || undefined,
    valor_garantia: solicitud?.valor_garantia || undefined,
    documentos_requeridos: solicitud?.documentos_requeridos || [],
    documentos_recibidos: solicitud?.documentos_recibidos || [],
    comentarios_internos: solicitud?.comentarios_internos || '',
    historial_estatus: solicitud?.historial_estatus || []
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (solicitud) {
      setFormData({
        cliente_id: solicitud.cliente_id || 0,
        producto_codigo: solicitud.producto_codigo || 'CS',
        monto_solicitado: solicitud.monto_solicitado || 0,
        moneda: solicitud.moneda || 'MXN',
        plazo_meses: solicitud.plazo_meses || 12,
        tasa_interes: solicitud.tasa_interes || 0,
        finalidad: solicitud.finalidad || '',
        observaciones: solicitud.observaciones || '',
        estatus: solicitud.estatus || 'iniciada',
        prioridad: solicitud.prioridad || 'media',
        fecha_vencimiento: solicitud.fecha_vencimiento || new Date(),
        asignado_a: solicitud.asignado_a || undefined,
        requiere_garantia: solicitud.requiere_garantia || false,
        tipo_garantia: solicitud.tipo_garantia || undefined,
        valor_garantia: solicitud.valor_garantia || undefined,
        documentos_requeridos: solicitud.documentos_requeridos || [],
        documentos_recibidos: solicitud.documentos_recibidos || [],
        comentarios_internos: solicitud.comentarios_internos || '',
        historial_estatus: solicitud.historial_estatus || []
      });
    }
  }, [solicitud]);

  const handleInputChange = (
    field: keyof SolicitudFormData,
    value: any
  ) => {
    setFormData((prev: SolicitudFormData) => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo si existe
    if (formErrors[field as string]) {
      setFormErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones requeridas
    if (!formData.cliente_id || formData.cliente_id <= 0) {
      newErrors.cliente_id = 'El ID del cliente es requerido';
    }

    if (!formData.monto_solicitado || formData.monto_solicitado <= 0) {
      newErrors.monto_solicitado = 'El monto solicitado debe ser mayor a 0';
    }

    if (!formData.plazo_meses || formData.plazo_meses <= 0) {
      newErrors.plazo_meses = 'El plazo debe ser mayor a 0';
    }

    if (!formData.finalidad.trim()) {
      newErrors.finalidad = 'La finalidad es requerida';
    }

    if (formData.tasa_interes < 0 || formData.tasa_interes > 100) {
      newErrors.tasa_interes = 'La tasa de interés debe estar entre 0 y 100';
    }

    if (formData.requiere_garantia && !formData.tipo_garantia) {
      newErrors.tipo_garantia = 'El tipo de garantía es requerido';
    }

    if (formData.requiere_garantia && (!formData.valor_garantia || formData.valor_garantia <= 0)) {
      newErrors.valor_garantia = 'El valor de la garantía es requerido';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const productoOptions: { value: ProductoCodigo; label: string }[] = [
    { value: 'CS', label: 'Línea de Crédito' },
    { value: 'CC', label: 'Cuenta Corriente' },
    { value: 'FA', label: 'Factoraje' },
    { value: 'AR', label: 'Arrendamiento' }
  ];

  const estatusOptions: { value: EstatusSolicitud; label: string }[] = [
    { value: 'iniciada', label: 'Iniciada' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const prioridadOptions: { value: 'alta' | 'media' | 'baja'; label: string }[] = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
  ];

  const monedaOptions: { value: Moneda; label: string }[] = [
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'USD', label: 'Dólar Americano (USD)' }
  ];

  const tipoGarantiaOptions = [
    { value: 'hipotecaria', label: 'Hipotecaria' },
    { value: 'prendaria', label: 'Prendaria' },
    { value: 'fiduciaria', label: 'Fiduciaria' },
    { value: 'avalista', label: 'Avalista' }
  ];

  const currentLoading = isLoading;

  return (
    <form onSubmit={handleSubmit} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6" />
            {mode === 'create' ? 'Nueva Solicitud' : 'Editar Solicitud'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Información básica */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente ID *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.cliente_id}
                  onChange={(e) => handleInputChange('cliente_id', Number(e.target.value))}
                  className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.cliente_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ID del cliente"
                  disabled={currentLoading}
                />
              </div>
              {formErrors.cliente_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.cliente_id}
                </p>
              )}
            </div>

            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <select
                value={formData.producto_codigo}
                onChange={(e) => handleInputChange('producto_codigo', e.target.value as ProductoCodigo)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.producto_codigo ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={currentLoading}
              >
                {productoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.producto_codigo && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.producto_codigo}
                </p>
              )}
            </div>

            {/* Monto solicitado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Solicitado *
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.monto_solicitado}
                  onChange={(e) => handleInputChange('monto_solicitado', Number(e.target.value))}
                  className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.monto_solicitado ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  disabled={currentLoading}
                />
              </div>
              {formErrors.monto_solicitado && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.monto_solicitado}
                </p>
              )}
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda *
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value as Moneda)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.moneda ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={currentLoading}
              >
                {monedaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.moneda && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.moneda}
                </p>
              )}
            </div>

            {/* Plazo meses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plazo (meses) *
              </label>
              <input
                type="number"
                value={formData.plazo_meses}
                onChange={(e) => handleInputChange('plazo_meses', Number(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.plazo_meses ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12"
                min="1"
                max="360"
                disabled={currentLoading}
              />
              {formErrors.plazo_meses && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.plazo_meses}
                </p>
              )}
            </div>

            {/* Tasa de interés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Interés (%) *
              </label>
              <input
                type="number"
                value={formData.tasa_interes}
                onChange={(e) => handleInputChange('tasa_interes', Number(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.tasa_interes ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="100"
                disabled={currentLoading}
              />
              {formErrors.tasa_interes && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {formErrors.tasa_interes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estatus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estatus
              </label>
              <select
                value={formData.estatus}
                onChange={(e) => handleInputChange('estatus', e.target.value as EstatusSolicitud)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={currentLoading}
              >
                {estatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => handleInputChange('prioridad', e.target.value as 'alta' | 'media' | 'baja')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={currentLoading}
              >
                {prioridadOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.fecha_vencimiento ? new Date(formData.fecha_vencimiento).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('fecha_vencimiento', new Date(e.target.value))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={currentLoading}
                />
              </div>
            </div>

            {/* Asignado a */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignado a (Usuario ID)
              </label>
              <input
                type="number"
                value={formData.asignado_a || ''}
                onChange={(e) => handleInputChange('asignado_a', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ID del usuario"
                disabled={currentLoading}
              />
            </div>
          </div>
        </div>

        {/* Garantía */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Garantía</h3>
          <div className="space-y-4">
            {/* Requiere garantía */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiere_garantia}
                onChange={(e) => handleInputChange('requiere_garantia', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={currentLoading}
              />
              <label className="text-sm font-medium text-gray-700">
                Requiere Garantía
              </label>
            </div>

            {formData.requiere_garantia && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo garantía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Garantía *
                  </label>
                  <select
                    value={formData.tipo_garantia || ''}
                    onChange={(e) => handleInputChange('tipo_garantia', e.target.value || undefined)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.tipo_garantia ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={currentLoading}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tipoGarantiaOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.tipo_garantia && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {formErrors.tipo_garantia}
                    </p>
                  )}
                </div>

                {/* Valor garantía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de la Garantía *
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.valor_garantia || ''}
                      onChange={(e) => handleInputChange('valor_garantia', e.target.value ? Number(e.target.value) : undefined)}
                      className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.valor_garantia ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      disabled={currentLoading}
                    />
                  </div>
                  {formErrors.valor_garantia && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      {formErrors.valor_garantia}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Finalidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Finalidad *
          </label>
          <textarea
            value={formData.finalidad}
            onChange={(e) => handleInputChange('finalidad', e.target.value)}
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              formErrors.finalidad ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Descripción de la finalidad del crédito"
            disabled={currentLoading}
          />
          {formErrors.finalidad && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <ExclamationCircleIcon className="w-4 h-4" />
              {formErrors.finalidad}
            </p>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observaciones adicionales"
            disabled={currentLoading}
          />
        </div>

        {/* Comentarios internos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comentarios Internos
          </label>
          <textarea
            value={formData.comentarios_internos}
            onChange={(e) => handleInputChange('comentarios_internos', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Comentarios para uso interno"
            disabled={currentLoading}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={currentLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={currentLoading}
        >
          {currentLoading ? (
            <>
              <ClockIcon className="w-4 h-4 animate-spin" />
              {mode === 'create' ? 'Creando...' : 'Guardando...'}
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              {mode === 'create' ? 'Crear Solicitud' : 'Guardar Cambios'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SolicitudForm;
