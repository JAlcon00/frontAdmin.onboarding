import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  FunnelIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import type { DocumentoFilter, EstatusDocumento } from '../../types/documento.types';

interface DocumentoFiltersProps {
  onFiltersChange: (filters: DocumentoFilter) => void;
  initialFilters?: DocumentoFilter;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
}

export const DocumentoFilters: React.FC<DocumentoFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  onClear,
  showClearButton = true,
  className = ''
}) => {
  const [filters, setFilters] = useState<DocumentoFilter>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = (key: keyof DocumentoFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Remover filtros vacíos
    Object.keys(newFilters).forEach(k => {
      const filterKey = k as keyof DocumentoFilter;
      const filterValue = newFilters[filterKey];
      if (filterValue === undefined || filterValue === null || 
          (Array.isArray(filterValue) && filterValue.length === 0)) {
        delete newFilters[filterKey];
      }
    });

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters: DocumentoFilter = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear?.();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const estatusOptions: { value: EstatusDocumento; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { value: 'aceptado', label: 'Aceptado', icon: CheckCircleIcon, color: 'text-green-600' },
    { value: 'rechazado', label: 'Rechazado', icon: XCircleIcon, color: 'text-red-600' },
    { value: 'pendiente', label: 'Pendiente', icon: ClockIcon, color: 'text-yellow-600' },
    { value: 'vencido', label: 'Vencido', icon: ClockIcon, color: 'text-gray-600' }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        {showClearButton && hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <XMarkIcon className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtro por estatus */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Estatus
          </label>
          <div className="space-y-2">
            {estatusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.estatus?.includes(option.value);
              
              return (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentEstatus = filters.estatus || [];
                      const newEstatus = e.target.checked
                        ? [...currentEstatus, option.value]
                        : currentEstatus.filter(s => s !== option.value);
                      
                      handleFilterChange('estatus', newEstatus.length > 0 ? newEstatus : undefined);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className={`w-4 h-4 ${option.color}`} />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Filtro por cliente */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cliente ID
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="ID del cliente"
              value={filters.cliente_id || ''}
              onChange={(e) => handleFilterChange('cliente_id', e.target.value ? Number(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por tipo de documento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de documento ID
          </label>
          <div className="relative">
            <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="ID del tipo"
              value={filters.documento_tipo_id || ''}
              onChange={(e) => handleFilterChange('documento_tipo_id', e.target.value ? Number(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por fecha de subida - desde */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subido desde
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_subida_desde ? new Date(filters.fecha_subida_desde).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_subida_desde', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por fecha de subida - hasta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subido hasta
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_subida_hasta ? new Date(filters.fecha_subida_hasta).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_subida_hasta', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por fecha de expiración - desde */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Expira desde
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_expiracion_desde ? new Date(filters.fecha_expiracion_desde).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_expiracion_desde', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por fecha de expiración - hasta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Expira hasta
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_expiracion_hasta ? new Date(filters.fecha_expiracion_hasta).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_expiracion_hasta', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros especiales */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Opciones especiales
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.proximo_vencer || false}
                onChange={(e) => handleFilterChange('proximo_vencer', e.target.checked || undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Próximo a vencer</span>
            </label>
          </div>
        </div>

        {/* Días para vencimiento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Días para vencimiento
          </label>
          <input
            type="number"
            placeholder="Días"
            value={filters.dias_vencimiento || ''}
            onChange={(e) => handleFilterChange('dias_vencimiento', e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Filtros activos:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined || value === null) return null;
              
              let displayValue = '';
              if (key === 'estatus' && Array.isArray(value)) {
                displayValue = value.join(', ');
              } else if (key === 'fecha_subida_desde' || key === 'fecha_subida_hasta' || key === 'fecha_expiracion_desde' || key === 'fecha_expiracion_hasta') {
                displayValue = new Date(value).toLocaleDateString('es-MX');
              } else {
                displayValue = String(value);
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {key}: {displayValue}
                  <button
                    onClick={() => handleFilterChange(key as keyof DocumentoFilter, undefined)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentoFilters;
