import React from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

interface MetricCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  subtitleColor: string;
}

interface MetricsCardsProps {
  clientesData: {
    total: number;
    nuevos: number;
  };
  documentosData: {
    total: number;
    pendientes: number;
  };
  solicitudesData: {
    total: number;
    pendientes: number;
  };
  rendimientoData: {
    uptime: number;
    erroresHoy: number;
  };
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  clientesData,
  documentosData,
  solicitudesData,
  rendimientoData
}) => {
  const metrics: MetricCard[] = [
    {
      title: 'Total Clientes',
      value: clientesData.total,
      subtitle: `+${clientesData.nuevos} este mes`,
      icon: UserGroupIcon,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitleColor: 'text-green-600'
    },
    {
      title: 'Documentos',
      value: documentosData.total,
      subtitle: `${documentosData.pendientes} pendientes`,
      icon: DocumentTextIcon,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitleColor: 'text-yellow-600'
    },
    {
      title: 'Solicitudes',
      value: solicitudesData.total,
      subtitle: `${solicitudesData.pendientes} en proceso`,
      icon: ClipboardDocumentListIcon,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitleColor: 'text-blue-600'
    },
    {
      title: 'Uptime',
      value: `${rendimientoData.uptime.toFixed(1)}%`,
      subtitle: `${rendimientoData.erroresHoy} errores hoy`,
      icon: ChartBarIcon,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      subtitleColor: rendimientoData.erroresHoy > 0 ? 'text-red-600' : 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

interface MetricCardProps extends MetricCard {}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  subtitleColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <p className={`text-sm font-medium ${subtitleColor}`}>{subtitle}</p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full flex-shrink-0 ml-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricsCards;
