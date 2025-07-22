import React from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  UserIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import type { Documento, DocumentoStats as DocumentoStatsType } from '../../types/documento.types';

// Interfaz extendida para estadísticas completas
interface DocumentoStatsExtended extends DocumentoStatsType {
  subidos_recientes?: number;
  clientes_con_documentos?: number;
  tipos_documento_utilizados?: number;
  porcentaje_completitud?: number;
  documentos_por_cliente?: number;
}

interface DocumentoStatsProps {
  documentos?: Documento[];
  stats?: DocumentoStatsExtended;
  loading?: boolean;
  error?: string | null;
  showTrends?: boolean;
  showDetailed?: boolean;
  className?: string;
}

export const DocumentoStats: React.FC<DocumentoStatsProps> = ({
  documentos = [],
  stats,
  loading = false,
  error = null,
  showTrends = false,
  showDetailed = true,
  className = ''
}) => {
  // Calcular estadísticas si no se proporcionan
  const calculateStats = (): DocumentoStatsExtended => {
    if (stats) return stats;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalDocumentos = documentos.length;
    const documentos_pendientes = documentos.filter(d => d.estatus === 'pendiente').length;
    const documentos_aceptados = documentos.filter(d => d.estatus === 'aceptado').length;
    const documentos_rechazados = documentos.filter(d => d.estatus === 'rechazado').length;
    const documentos_vencidos = documentos.filter(d => {
      return d.fecha_expiracion && new Date(d.fecha_expiracion) < now;
    }).length;

    const documentos_proximos_vencer = documentos.filter(d => {
      if (!d.fecha_expiracion) return false;
      const fechaExp = new Date(d.fecha_expiracion);
      const treintaDias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return fechaExp > now && fechaExp <= treintaDias;
    }).length;

    const subidos_recientes = documentos.filter(d => {
      return new Date(d.fecha_subida) >= thirtyDaysAgo;
    }).length;

    const clientesUnicos = new Set(documentos.map(d => d.cliente_id)).size;
    const tiposUnicos = new Set(documentos.map(d => d.documento_tipo_id)).size;

    return {
      total_documentos: totalDocumentos,
      documentos_pendientes,
      documentos_aceptados,
      documentos_rechazados,
      documentos_vencidos,
      documentos_proximos_vencer,
      subidos_recientes,
      clientes_con_documentos: clientesUnicos,
      tipos_documento_utilizados: tiposUnicos,
      porcentaje_completitud: totalDocumentos > 0 ? Math.round((documentos_aceptados / totalDocumentos) * 100) : 0,
      documentos_por_cliente: totalDocumentos > 0 ? Math.round(totalDocumentos / clientesUnicos) : 0
    };
  };

  const calculatedStats = calculateStats();

  const statCards = [
    {
      title: 'Total Documentos',
      value: calculatedStats.total_documentos,
      icon: DocumentTextIcon,
      color: 'text-blue-600 bg-blue-100',
      description: 'Documentos en el sistema'
    },
    {
      title: 'Pendientes',
      value: calculatedStats.documentos_pendientes,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Esperando revisión'
    },
    {
      title: 'Aceptados',
      value: calculatedStats.documentos_aceptados,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
      description: 'Documentos aprobados'
    },
    {
      title: 'Rechazados',
      value: calculatedStats.documentos_rechazados,
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100',
      description: 'Requieren corrección'
    }
  ];

  const additionalStats = [
    {
      title: 'Vencidos',
      value: calculatedStats.documentos_vencidos,
      icon: ExclamationCircleIcon,
      color: 'text-red-600 bg-red-100',
      description: 'Documentos vencidos'
    },
    {
      title: 'Próximos a Vencer',
      value: calculatedStats.documentos_proximos_vencer,
      icon: ExclamationTriangleIcon,
      color: 'text-orange-600 bg-orange-100',
      description: 'Vencen en 30 días'
    },
    {
      title: 'Subidos Recientemente',
      value: calculatedStats.subidos_recientes || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-600 bg-blue-100',
      description: 'Últimos 30 días'
    },
    {
      title: 'Clientes con Documentos',
      value: calculatedStats.clientes_con_documentos || 0,
      icon: UserIcon,
      color: 'text-purple-600 bg-purple-100',
      description: 'Clientes únicos'
    }
  ];

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <ExclamationCircleIcon className="w-5 h-5 mr-2" />
          <span>Error al cargar estadísticas: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Estadísticas de Documentos
          </h2>
        </div>
        
        {showTrends && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ArrowTrendingUpIcon className="w-4 h-4" />
            <span>Últimos 30 días</span>
          </div>
        )}
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estadísticas adicionales */}
      {showDetailed && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información Detallada
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {additionalStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Métricas de rendimiento */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Métricas de Rendimiento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {calculatedStats.porcentaje_completitud || 0}%
                </p>
                <p className="text-sm text-gray-600">Tasa de Aceptación</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {calculatedStats.tipos_documento_utilizados || 0}
                </p>
                <p className="text-sm text-gray-600">Tipos de Documento</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {calculatedStats.documentos_por_cliente || 0}
                </p>
                <p className="text-sm text-gray-600">Docs por Cliente</p>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {(calculatedStats.documentos_vencidos > 0 || calculatedStats.documentos_proximos_vencer > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Atención Requerida
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {calculatedStats.documentos_vencidos > 0 && (
                      <span className="block">
                        {calculatedStats.documentos_vencidos} documento(s) vencido(s)
                      </span>
                    )}
                    {calculatedStats.documentos_proximos_vencer > 0 && (
                      <span className="block">
                        {calculatedStats.documentos_proximos_vencer} documento(s) próximo(s) a vencer
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentoStats;
