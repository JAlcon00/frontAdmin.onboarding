// Configuración global para Chart.js con el tema del sistema OnboardingDigital

import { Chart as ChartJS } from 'chart.js';

// Colores del sistema basados en Tailwind CSS
export const CHART_COLORS = {
  primary: {
    blue: 'rgba(59, 130, 246, 0.8)',
    green: 'rgba(16, 185, 129, 0.8)',
    red: 'rgba(245, 101, 101, 0.8)',
    yellow: 'rgba(251, 191, 36, 0.8)',
    purple: 'rgba(147, 51, 234, 0.8)',
    indigo: 'rgba(99, 102, 241, 0.8)',
    pink: 'rgba(236, 72, 153, 0.8)',
    gray: 'rgba(156, 163, 175, 0.8)',
  },
  border: {
    blue: 'rgb(59, 130, 246)',
    green: 'rgb(16, 185, 129)',
    red: 'rgb(245, 101, 101)',
    yellow: 'rgb(251, 191, 36)',
    purple: 'rgb(147, 51, 234)',
    indigo: 'rgb(99, 102, 241)',
    pink: 'rgb(236, 72, 153)',
    gray: 'rgb(156, 163, 175)',
  }
};

// Configuración por defecto para todos los gráficos
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
        color: '#374151', // text-gray-700
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      titleFont: {
        family: 'Inter, sans-serif',
        size: 14,
        weight: 'bold' as const,
      },
      bodyFont: {
        family: 'Inter, sans-serif',
        size: 12,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        color: '#6B7280', // text-gray-500
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        color: '#6B7280', // text-gray-500
      },
    },
  },
};

// Función para aplicar la configuración global a Chart.js
export const configureChartDefaults = () => {
  ChartJS.defaults.font.family = 'Inter, sans-serif';
  ChartJS.defaults.color = '#374151'; // text-gray-700
  ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';
  ChartJS.defaults.backgroundColor = 'rgba(0, 0, 0, 0.05)';
};

// Paletas de colores específicas para diferentes tipos de gráficos
export const COLOR_PALETTES = {
  productos: [
    CHART_COLORS.primary.blue,
    CHART_COLORS.primary.green,
    CHART_COLORS.primary.purple,
    CHART_COLORS.primary.yellow,
  ],
  estatus: {
    aprobada: CHART_COLORS.primary.green,
    en_revision: CHART_COLORS.primary.yellow,
    rechazada: CHART_COLORS.primary.red,
    iniciada: CHART_COLORS.primary.gray,
    cancelada: CHART_COLORS.primary.gray,
  },
  tendencias: {
    solicitudes: CHART_COLORS.primary.blue,
    aprobaciones: CHART_COLORS.primary.green,
    rechazos: CHART_COLORS.primary.red,
  },
  completitud: {
    completo: CHART_COLORS.primary.green,
    parcial: CHART_COLORS.primary.yellow,
    faltante: CHART_COLORS.primary.red,
  }
};

// Configuraciones específicas por tipo de gráfico
export const CHART_CONFIGS = {
  bar: {
    ...DEFAULT_CHART_OPTIONS,
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      ...DEFAULT_CHART_OPTIONS.scales,
      y: {
        ...DEFAULT_CHART_OPTIONS.scales.y,
        beginAtZero: true,
      },
    },
  },
  line: {
    ...DEFAULT_CHART_OPTIONS,
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  },
  doughnut: {
    ...DEFAULT_CHART_OPTIONS,
    cutout: '60%',
    plugins: {
      ...DEFAULT_CHART_OPTIONS.plugins,
      legend: {
        ...DEFAULT_CHART_OPTIONS.plugins.legend,
        position: 'right' as const,
      },
    },
  },
};

// Utilidades para formatear datos
export const formatChartData = {
  currency: (value: number) => `$${value.toLocaleString('es-MX')}`,
  percentage: (value: number) => `${value}%`,
  number: (value: number) => value.toLocaleString('es-MX'),
  date: (date: Date) => date.toLocaleDateString('es-MX', { 
    month: 'short', 
    day: 'numeric' 
  }),
};

export default {
  CHART_COLORS,
  DEFAULT_CHART_OPTIONS,
  COLOR_PALETTES,
  CHART_CONFIGS,
  formatChartData,
  configureChartDefaults,
};
