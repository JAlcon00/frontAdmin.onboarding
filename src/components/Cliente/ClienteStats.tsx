import {
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import type { ClienteEstadisticas } from '../../types/cliente.types';
import { TIPOS_PERSONA, COLORES_ESTATUS } from '../../constants';

interface ClienteStatsProps {
  estadisticas: ClienteEstadisticas;
  loading?: boolean;
  error?: string | null;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, trend, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          {trend.isPositive ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

export function ClienteStats({ estadisticas, loading = false, error = null }: ClienteStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ChartBarIcon className="w-5 h-5 text-red-500 mr-2" />
          <div className="text-red-800 font-medium">Error al cargar estadísticas</div>
        </div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
      </div>
    );
  }

  const formatPorcentaje = (valor: number) => {
    return `${Math.round(valor)}%`;
  };

  const formatNumber = (valor: number) => {
    return new Intl.NumberFormat('es-MX').format(valor);
  };

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clientes"
          value={formatNumber(estadisticas.total_clientes)}
          icon={UserIcon}
          color="bg-blue-100 text-blue-600"
          subtitle="Clientes registrados"
        />

        <StatCard
          title="Clientes Activos"
          value={formatNumber(estadisticas.clientes_activos)}
          icon={ArrowTrendingUpIcon}
          color="bg-green-100 text-green-600"
          subtitle="Con solicitudes activas"
        />

        <StatCard
          title="Completitud Promedio"
          value={formatPorcentaje(estadisticas.porcentaje_completitud_promedio)}
          icon={ChartBarIcon}
          color="bg-yellow-100 text-yellow-600"
          subtitle="Datos completos"
        />

        <StatCard
          title="Onboarding Completados"
          value={formatNumber(estadisticas.onboarding_completados_mes)}
          icon={ArrowTrendingUpIcon}
          color="bg-purple-100 text-purple-600"
          subtitle="Este mes"
        />
      </div>

      {/* Distribución por tipo de persona */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribución por Tipo de Persona
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Personas Físicas */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${COLORES_ESTATUS.tipoPersona.PF}`}>
              <UserIcon className="w-8 h-8" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(estadisticas.clientes_por_tipo.fisica)}
            </div>
            <div className="text-sm text-gray-600">
              {TIPOS_PERSONA.PF}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticas.total_clientes > 0 
                ? `${Math.round((estadisticas.clientes_por_tipo.fisica / estadisticas.total_clientes) * 100)}%`
                : '0%'
              } del total
            </div>
          </div>

          {/* Personas Morales */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${COLORES_ESTATUS.tipoPersona.PM}`}>
              <BuildingOfficeIcon className="w-8 h-8" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(estadisticas.clientes_por_tipo.moral)}
            </div>
            <div className="text-sm text-gray-600">
              {TIPOS_PERSONA.PM}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticas.total_clientes > 0 
                ? `${Math.round((estadisticas.clientes_por_tipo.moral / estadisticas.total_clientes) * 100)}%`
                : '0%'
              } del total
            </div>
          </div>

          {/* Total */}
          <div className="text-center border-l border-gray-200 pl-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-gray-100 text-gray-600">
              <UserGroupIcon className="w-8 h-8" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(estadisticas.total_clientes)}
            </div>
            <div className="text-sm text-gray-600">
              Total de Clientes
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Registrados en el sistema
            </div>
          </div>
        </div>
      </div>

      {/* Estados de clientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Estados de Clientes
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-semibold text-green-900">
              {formatNumber(estadisticas.clientes_activos)}
            </div>
            <div className="text-sm text-green-600">Activos</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900">
              {formatNumber(estadisticas.clientes_inactivos)}
            </div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-semibold text-yellow-900">
              {formatNumber(estadisticas.clientes_pendientes_aprobacion)}
            </div>
            <div className="text-sm text-yellow-600">Pendientes</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-semibold text-red-900">
              {formatNumber(estadisticas.clientes_rechazados)}
            </div>
            <div className="text-sm text-red-600">Rechazados</div>
          </div>
        </div>
      </div>

      {/* Tendencia mensual */}
      {estadisticas.tendencia_mensual && estadisticas.tendencia_mensual.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tendencia Mensual
          </h3>
          
          <div className="overflow-x-auto">
            <div className="flex space-x-4 min-w-max">
              {estadisticas.tendencia_mensual.slice(-6).map((mes, index) => (
                <div key={index} className="text-center min-w-0 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {mes.mes}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-blue-900">
                        {mes.nuevos_clientes}
                      </div>
                      <div className="text-xs text-blue-600">Nuevos</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-lg font-semibold text-green-900">
                        {mes.onboarding_completados}
                      </div>
                      <div className="text-xs text-green-600">Completados</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
