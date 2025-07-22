import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Configuración de colores del sistema
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#8B5CF6',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#6B7280'
};

// ==================== PRODUCTOS MÁS SOLICITADOS ====================

interface ProductosMasSolicitadosProps {
  datos: {
    labels: string[];
    cantidades: number[];
    montos: number[];
  };
  loading?: boolean;
}

export const ProductosMasSolicitados: React.FC<ProductosMasSolicitadosProps> = ({
  datos,
  loading = false
}) => {
  const chartData = {
    labels: datos.labels,
    datasets: [
      {
        label: 'Cantidad de Solicitudes',
        data: datos.cantidades,
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.accent,
          CHART_COLORS.warning
        ],
        borderColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.accent,
          CHART_COLORS.warning
        ],
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const montoIndex = context.dataIndex;
            const monto = datos.montos[montoIndex];
            return `Monto: $${monto.toLocaleString('es-MX')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        },
        ticks: {
          color: '#6B7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Productos Más Solicitados
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

// ==================== TENDENCIAS MENSUALES ====================

interface TendenciasMensualesProps {
  datos: {
    meses: string[];
    solicitudes: number[];
    aprobaciones: number[];
  };
  loading?: boolean;
}

export const TendenciasMensuales: React.FC<TendenciasMensualesProps> = ({
  datos,
  loading = false
}) => {
  const chartData = {
    labels: datos.meses,
    datasets: [
      {
        label: 'Solicitudes',
        data: datos.solicitudes,
        borderColor: CHART_COLORS.primary,
        backgroundColor: `${CHART_COLORS.primary}20`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      },
      {
        label: 'Aprobaciones',
        data: datos.aprobaciones,
        borderColor: CHART_COLORS.secondary,
        backgroundColor: `${CHART_COLORS.secondary}20`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS.secondary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#374151'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        },
        ticks: {
          color: '#6B7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tendencias Mensuales
      </h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

// ==================== DISTRIBUCIÓN POR ESTATUS ====================

interface DistribucionEstatusProps {
  datos: {
    estatus: string[];
    cantidades: number[];
  };
  loading?: boolean;
}

export const DistribucionEstatus: React.FC<DistribucionEstatusProps> = ({
  datos,
  loading = false
}) => {
  const chartData = {
    labels: datos.estatus,
    datasets: [
      {
        data: datos.cantidades,
        backgroundColor: [
          CHART_COLORS.secondary,
          CHART_COLORS.warning,
          CHART_COLORS.danger,
          CHART_COLORS.info
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#374151',
          padding: 20
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Distribución por Estatus
      </h3>
      <div className="h-64">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

// ==================== COMPLETITUD DE DOCUMENTOS ====================

interface CompletitudDocumentosProps {
  datos: {
    completitud: number;
    documentosCompletos: number;
    documentosTotal: number;
  };
  loading?: boolean;
}

export const CompletitudDocumentos: React.FC<CompletitudDocumentosProps> = ({
  datos,
  loading = false
}) => {
  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 80) return CHART_COLORS.secondary;
    if (percentage >= 60) return CHART_COLORS.warning;
    return CHART_COLORS.danger;
  };

  const color = getColorByPercentage(datos.completitud);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Completitud de Documentos
      </h3>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Círculo de progreso */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Círculo de fondo */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="#F3F4F6"
              strokeWidth="8"
              fill="none"
            />
            {/* Círculo de progreso */}
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(datos.completitud * 314) / 100} 314`}
              className="transition-all duration-500 ease-in-out"
            />
          </svg>
          
          {/* Porcentaje en el centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {datos.completitud}%
              </div>
              <div className="text-xs text-gray-500">
                Completo
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="text-center space-y-1">
          <p className="text-sm text-gray-600">
            {datos.documentosCompletos} de {datos.documentosTotal} documentos
          </p>
          <p className="text-xs text-gray-500">
            {datos.documentosTotal - datos.documentosCompletos} pendientes
          </p>
        </div>

        {/* Barra de progreso alternativa */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${datos.completitud}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
