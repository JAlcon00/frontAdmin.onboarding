

import React, { useEffect } from 'react';
import { Card, Badge, LoadingSpinner, ValidationAlert, Button } from '../shared';
import { useUsuarioStats } from '../../hook/usuario/useUsuarioStats';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const UsuarioStats: React.FC = () => {
  const { state, loadStats, setPeriod } = useUsuarioStats();
  const { stats, loading, error, period, lastUpdate } = state;

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line
  }, [period]);

  const periodOptions = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: '90d', label: '90 días' },
    { value: '1y', label: '1 año' },
  ];

  // Datos para el gráfico de tendencia de registros
  const trendData = stats?.tendenciaRegistros || [];
  const lineChartData = {
    labels: trendData.map(t => t.fecha),
    datasets: [
      {
        label: 'Registros',
        data: trendData.map(t => t.valor),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Datos para el gráfico de distribución por rol
  const roles = ['SUPER', 'ADMIN', 'AUDITOR', 'OPERADOR'] as const;
  const doughnutData = {
    labels: [...roles],
    datasets: [
      {
        label: 'Usuarios por rol',
        data: roles.map(r => stats?.distribuccionPorRol[r] ?? 0),
        backgroundColor: [
          '#2563eb', // azul
          '#f59e42', // naranja
          '#facc15', // amarillo
          '#22c55e', // verde
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Estadísticas de Usuarios</h2>
        <div className="flex gap-2">
          {periodOptions.map(opt => (
            <Button
              key={opt.value}
              size="xs"
              variant={period === opt.value ? 'primary' : 'secondary'}
              onClick={() => setPeriod(opt.value as any)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && <ValidationAlert type="error" message={error} />}

      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <div className="font-semibold mb-1">Usuarios Totales</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">{stats.totalUsuarios}</div>
            <Badge variant="success">Activos: {stats.usuariosActivos}</Badge>
            <Badge variant="danger" className="ml-2">Suspendidos: {stats.usuariosSuspendidos}</Badge>
            <div className="mt-2 text-xs text-gray-500">{stats.porcentajeActivos.toFixed(1)}% activos</div>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <div className="font-semibold mb-1">Nuevos Usuarios</div>
            <div className="flex flex-col gap-1">
              <span>Hoy: <Badge variant="primary">{stats.usuariosNuevos.hoy}</Badge></span>
              <span>Esta semana: <Badge variant="primary">{stats.usuariosNuevos.semana}</Badge></span>
              <span>Este mes: <Badge variant="primary">{stats.usuariosNuevos.mes}</Badge></span>
            </div>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 md:col-span-2">
            <div className="font-semibold mb-2">Distribución por Rol</div>
            <div className="flex flex-wrap gap-2 mt-1 mb-4">
              <Badge variant="primary">SUPER: {stats.distribuccionPorRol.SUPER}</Badge>
              <Badge variant="secondary">ADMIN: {stats.distribuccionPorRol.ADMIN}</Badge>
              <Badge variant="info">AUDITOR: {stats.distribuccionPorRol.AUDITOR}</Badge>
              <Badge variant="success">OPERADOR: {stats.distribuccionPorRol.OPERADOR}</Badge>
            </div>
            <div className="w-full md:w-1/2 mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </Card>
          <Card className="bg-gray-50 dark:bg-gray-800 md:col-span-2">
            <div className="font-semibold mb-2">Tendencia de Registros (últimos 30 días)</div>
            <div className="w-full h-64">
              <Line data={lineChartData} options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { display: true }, y: { display: true } }
              }} />
            </div>
          </Card>
          <Card className="bg-gray-50 dark:bg-gray-800 md:col-span-2">
            <div className="font-semibold mb-1">Actividad Reciente</div>
            <div className="flex flex-col gap-1">
              <span>Último día: <Badge variant="info">{stats.actividadReciente.ultimoDia}</Badge></span>
              <span>Última semana: <Badge variant="info">{stats.actividadReciente.ultimaSemana}</Badge></span>
              <span>Último mes: <Badge variant="info">{stats.actividadReciente.ultimoMes}</Badge></span>
            </div>
          </Card>
        </div>
      )}

      {lastUpdate && (
        <div className="mt-4 text-xs text-gray-400 text-right">Actualizado: {lastUpdate.toLocaleString()}</div>
      )}
    </Card>
  );
};

export default UsuarioStats;
