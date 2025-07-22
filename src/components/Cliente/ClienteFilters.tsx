import { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { ClienteFilter, TipoPersona } from '../../types/cliente.types';
import { TIPOS_PERSONA, COLORES_ESTATUS } from '../../constants';

interface ClienteFiltersProps {
  filters: ClienteFilter;
  onFiltersChange: (filters: ClienteFilter) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Estado de México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
  'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatán', 'Zacatecas'
];

export function ClienteFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen = false,
  onToggle
}: ClienteFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ClienteFilter>(filters);

  const handleFilterChange = (key: keyof ClienteFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTipoPersonaToggle = (tipo: TipoPersona) => {
    const currentTypes = localFilters.tipo_persona || [];
    const newTypes = currentTypes.includes(tipo)
      ? currentTypes.filter(t => t !== tipo)
      : [...currentTypes, tipo];
    
    handleFilterChange('tipo_persona', newTypes.length > 0 ? newTypes : undefined);
  };

  const handleEstadoToggle = (estado: string) => {
    const currentEstados = localFilters.estado || [];
    const newEstados = currentEstados.includes(estado)
      ? currentEstados.filter(e => e !== estado)
      : [...currentEstados, estado];
    
    handleFilterChange('estado', newEstados.length > 0 ? newEstados : undefined);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.tipo_persona?.length) count++;
    if (filters.estado?.length) count++;
    if (filters.codigo_postal) count++;
    if (filters.fecha_registro_desde) count++;
    if (filters.fecha_registro_hasta) count++;
    if (filters.completitud_minima !== undefined) count++;
    if (filters.tiene_solicitudes !== undefined) count++;
    return count;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          hasActiveFilters()
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="w-5 h-5 mr-2" />
        Filtros
        {hasActiveFilters() && (
          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
            {getActiveFiltersCount()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtros Avanzados</h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar todos
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tipo de Persona */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Persona
          </label>
          <div className="space-y-2">
            {(Object.keys(TIPOS_PERSONA) as TipoPersona[]).map((tipo) => (
              <label key={tipo} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.tipo_persona?.includes(tipo) || false}
                  onChange={() => handleTipoPersonaToggle(tipo)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLORES_ESTATUS.tipoPersona[tipo]}`}>
                  {TIPOS_PERSONA[tipo]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Fechas de Registro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Fecha de Registro
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={localFilters.fecha_registro_desde ? 
                  new Date(localFilters.fecha_registro_desde).toISOString().split('T')[0] : ''
                }
                onChange={(e) => handleFilterChange(
                  'fecha_registro_desde', 
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={localFilters.fecha_registro_hasta ? 
                  new Date(localFilters.fecha_registro_hasta).toISOString().split('T')[0] : ''
                }
                onChange={(e) => handleFilterChange(
                  'fecha_registro_hasta', 
                  e.target.value ? new Date(e.target.value) : undefined
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            Ubicación
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Código Postal</label>
              <input
                type="text"
                placeholder="5 dígitos"
                value={localFilters.codigo_postal || ''}
                onChange={(e) => handleFilterChange('codigo_postal', e.target.value || undefined)}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estados</label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg">
                {ESTADOS_MEXICO.map((estado) => (
                  <label key={estado} className="flex items-center px-3 py-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={localFilters.estado?.includes(estado) || false}
                      onChange={() => handleEstadoToggle(estado)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{estado}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Completitud */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <ChartBarIcon className="w-4 h-4 inline mr-1" />
            Completitud Mínima
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={localFilters.completitud_minima || 0}
              onChange={(e) => handleFilterChange('completitud_minima', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="font-medium text-blue-600">
                {localFilters.completitud_minima || 0}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Estado de Solicitudes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estado de Solicitudes
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="solicitudes"
                checked={localFilters.tiene_solicitudes === undefined}
                onChange={() => handleFilterChange('tiene_solicitudes', undefined)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Todos</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="solicitudes"
                checked={localFilters.tiene_solicitudes === true}
                onChange={() => handleFilterChange('tiene_solicitudes', true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Con solicitudes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="solicitudes"
                checked={localFilters.tiene_solicitudes === false}
                onChange={() => handleFilterChange('tiene_solicitudes', false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sin solicitudes</span>
            </label>
          </div>
        </div>

        {/* Búsqueda de texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Búsqueda de Texto
          </label>
          <input
            type="text"
            placeholder="RFC, nombre, email..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters() && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros Activos:</h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.tipo_persona?.map((tipo) => (
              <span
                key={tipo}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLORES_ESTATUS.tipoPersona[tipo]}`}
              >
                {TIPOS_PERSONA[tipo]}
                <button
                  onClick={() => handleTipoPersonaToggle(tipo)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            ))}
            
            {localFilters.estado?.map((estado) => (
              <span
                key={estado}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {estado}
                <button
                  onClick={() => handleEstadoToggle(estado)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            ))}
            
            {localFilters.completitud_minima !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Completitud ≥ {localFilters.completitud_minima}%
                <button
                  onClick={() => handleFilterChange('completitud_minima', undefined)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
