import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  FunnelIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  MinusCircleIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import type { SolicitudFilter, EstatusSolicitud, ProductoCodigo } from '../../types/solicitud.types';
import { ESTATUS_SOLICITUD, PRODUCTOS } from '../../constants';

interface SolicitudFiltersProps {
  onFiltersChange: (filters: SolicitudFilter) => void;
  initialFilters?: SolicitudFilter;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
}

export const SolicitudFilters: React.FC<SolicitudFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  onClear,
  showClearButton = true,
  className = ''
}) => {
  const [filters, setFilters] = useState<SolicitudFilter>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = (key: keyof SolicitudFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Remover filtros vacíos
    Object.keys(newFilters).forEach(k => {
      const filterKey = k as keyof SolicitudFilter;
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
    const clearedFilters: SolicitudFilter = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear?.();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const estatusOptions: { value: EstatusSolicitud; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { value: 'iniciada', label: 'Iniciada', icon: ClockIcon, color: 'text-blue-600' },
    { value: 'en_revision', label: 'En Revisión', icon: ExclamationTriangleIcon, color: 'text-yellow-600' },
    { value: 'aprobada', label: 'Aprobada', icon: CheckCircleIcon, color: 'text-green-600' },
    { value: 'rechazada', label: 'Rechazada', icon: XCircleIcon, color: 'text-red-600' },
    { value: 'cancelada', label: 'Cancelada', icon: MinusCircleIcon, color: 'text-gray-600' }
  ];

  const productoOptions: { value: ProductoCodigo; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { value: 'CS', label: 'Línea de Crédito', icon: CreditCardIcon, color: 'text-blue-600' },
    { value: 'CC', label: 'Cuenta Corriente', icon: BanknotesIcon, color: 'text-green-600' },
    { value: 'FA', label: 'Factoraje', icon: DocumentTextIcon, color: 'text-purple-600' },
    { value: 'AR', label: 'Arrendamiento', icon: TruckIcon, color: 'text-orange-600' }
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

        {/* Filtro por producto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Productos
          </label>
          <div className="space-y-2">
            {productoOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.producto_codigo?.includes(option.value);
              
              return (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentProductos = filters.producto_codigo || [];
                      const newProductos = e.target.checked
                        ? [...currentProductos, option.value]
                        : currentProductos.filter(p => p !== option.value);
                      
                      handleFilterChange('producto_codigo', newProductos.length > 0 ? newProductos : undefined);
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

        {/* Filtro por fecha de creación - desde */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Creada desde
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_creacion_desde ? new Date(filters.fecha_creacion_desde).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_creacion_desde', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por fecha de creación - hasta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Creada hasta
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fecha_creacion_hasta ? new Date(filters.fecha_creacion_hasta).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('fecha_creacion_hasta', e.target.value ? new Date(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por monto mínimo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Monto mínimo
          </label>
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="0"
              value={filters.monto_minimo || ''}
              onChange={(e) => handleFilterChange('monto_minimo', e.target.value ? Number(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por monto máximo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Monto máximo
          </label>
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="0"
              value={filters.monto_maximo || ''}
              onChange={(e) => handleFilterChange('monto_maximo', e.target.value ? Number(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por moneda */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Moneda
          </label>
          <select
            value={filters.moneda?.[0] || ''}
            onChange={(e) => handleFilterChange('moneda', e.target.value ? [e.target.value as 'MXN' | 'USD'] : undefined)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las monedas</option>
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="USD">Dólar Americano (USD)</option>
          </select>
        </div>

        {/* Filtro por asignado a */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Asignado a (Usuario ID)
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="ID del usuario"
              value={filters.asignado_a || ''}
              onChange={(e) => handleFilterChange('asignado_a', e.target.value ? Number(e.target.value) : undefined)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
                displayValue = value.map(v => ESTATUS_SOLICITUD[v as EstatusSolicitud] || v).join(', ');
              } else if (key === 'producto_codigo' && Array.isArray(value)) {
                displayValue = value.map(v => PRODUCTOS[v as ProductoCodigo] || v).join(', ');
              } else if (key === 'moneda' && Array.isArray(value)) {
                displayValue = value.join(', ');
              } else if (key === 'fecha_creacion_desde' || key === 'fecha_creacion_hasta' || key === 'fecha_actualizacion_desde' || key === 'fecha_actualizacion_hasta') {
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
                    onClick={() => handleFilterChange(key as keyof SolicitudFilter, undefined)}
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

export default SolicitudFilters;
