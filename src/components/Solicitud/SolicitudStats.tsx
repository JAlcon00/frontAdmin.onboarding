import React from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  MinusCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import type { SolicitudStats as SolicitudStatsType } from '../../types/solicitud.types';

interface SolicitudStatsProps {
  stats: SolicitudStatsType;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const SolicitudStats: React.FC<SolicitudStatsProps> = ({
  stats,
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const getTrendIcon = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    } else if (numValue < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const statCards = [
    {
      title: 'Total Solicitudes',
      value: formatNumber(stats.total_solicitudes),
      icon: <ChartBarIcon className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Monto Total Solicitado',
      value: formatCurrency(stats.monto_total_solicitado),
      icon: <CurrencyDollarIcon className="w-6 h-6 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      iconBg: 'bg-green-100'
    },
    {
      title: 'Monto Total Aprobado',
      value: formatCurrency(stats.monto_total_aprobado),
      icon: <CheckCircleIcon className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100'
    },
    {
      title: 'Tiempo Promedio de Aprobación',
      value: `${stats.tiempo_promedio_aprobacion} días`,
      icon: <CalendarIcon className="w-6 h-6 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100'
    }
  ];

  const statusCards = [
    {
      title: 'Iniciadas',
      value: stats.solicitudes_iniciadas,
      percentage: getPercentage(stats.solicitudes_iniciadas, stats.total_solicitudes),
      icon: <ClockIcon className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      title: 'En Revisión',
      value: stats.solicitudes_en_revision,
      percentage: getPercentage(stats.solicitudes_en_revision, stats.total_solicitudes),
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Aprobadas',
      value: stats.solicitudes_aprobadas,
      percentage: getPercentage(stats.solicitudes_aprobadas, stats.total_solicitudes),
      icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700'
    },
    {
      title: 'Rechazadas',
      value: stats.solicitudes_rechazadas,
      percentage: getPercentage(stats.solicitudes_rechazadas, stats.total_solicitudes),
      icon: <XMarkIcon className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700'
    },
    {
      title: 'Canceladas',
      value: stats.solicitudes_canceladas,
      percentage: getPercentage(stats.solicitudes_canceladas, stats.total_solicitudes),
      icon: <MinusCircleIcon className="w-5 h-5 text-gray-600" />,
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700'
    }
  ];

  const tasaAprobacion = getPercentage(stats.solicitudes_aprobadas, stats.total_solicitudes);
  const tasaRechazo = getPercentage(stats.solicitudes_rechazadas, stats.total_solicitudes);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Estadísticas de Solicitudes
          </h2>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${card.color} ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución por estatus */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribución por Estatus
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${card.color} ${isLoading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {card.icon}
                <span className={`text-sm font-medium ${card.textColor}`}>
                  {card.title}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(card.value)}
                </p>
                <p className="text-sm text-gray-600">
                  {card.percentage}% del total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tasa de aprobación */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Tasa de Aprobación
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {tasaAprobacion}%
              </span>
              {getTrendIcon(tasaAprobacion)}
            </div>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.solicitudes_aprobadas)} de {formatNumber(stats.total_solicitudes)} solicitudes
            </p>
          </div>
        </div>

        {/* Tasa de rechazo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XMarkIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Tasa de Rechazo
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">
                {tasaRechazo}%
              </span>
              {getTrendIcon(tasaRechazo)}
            </div>
            <p className="text-sm text-gray-600">
              {formatNumber(stats.solicitudes_rechazadas)} de {formatNumber(stats.total_solicitudes)} solicitudes
            </p>
          </div>
        </div>

        {/* Eficiencia de aprobación */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Tiempo Promedio
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {stats.tiempo_promedio_aprobacion}
              </span>
              <span className="text-sm text-gray-600">días</span>
            </div>
            <p className="text-sm text-gray-600">
              Tiempo promedio de aprobación
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de barras de progreso */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Progreso de Solicitudes
        </h3>
        <div className="space-y-4">
          {statusCards.map((card, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {card.icon}
                  <span className="text-sm font-medium text-gray-900">
                    {card.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {formatNumber(card.value)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {card.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    card.title === 'Iniciadas' ? 'bg-blue-600' :
                    card.title === 'En Revisión' ? 'bg-yellow-600' :
                    card.title === 'Aprobadas' ? 'bg-green-600' :
                    card.title === 'Rechazadas' ? 'bg-red-600' :
                    'bg-gray-600'
                  }`}
                  style={{ width: `${card.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumen Financiero
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Solicitado</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.monto_total_solicitado)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Aprobado</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monto_total_aprobado)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Ratio de Aprobación</p>
            <p className="text-2xl font-bold text-purple-600">
              {getPercentage(stats.monto_total_aprobado, stats.monto_total_solicitado)}%
            </p>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg font-medium text-gray-900">
              Cargando estadísticas...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudStats;
