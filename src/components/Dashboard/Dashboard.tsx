import { useDashboardData } from '../../hook/dashboard/useDashboardData';
import { MetricsCards } from './MetricsCards';
import { ActividadReciente } from './ActividadReciente';
import { EstadisticasRapidas } from './EstadisticasRapidas';
import { SolicitudesRecientesTable } from './SolicitudesRecientesTable';
import { 
  ProductosMasSolicitados,
  TendenciasMensuales,
  DistribucionEstatus,
  CompletitudDocumentos
} from './DashboardCharts';
// Importar componentes de estadísticas detalladas
import { ClienteStats } from '../Cliente/ClienteStats';
import { DocumentoStats } from '../Documento/DocumentoStats';
import { SolicitudStats } from '../Solicitud/SolicitudStats';

interface DashboardProps {
  onViewAllSolicitudes?: () => void;
  onViewSolicitud?: (solicitud: any) => void;
  onEditSolicitud?: (solicitud: any) => void;
  onNuevoCliente?: () => void;
  onNuevoDocumento?: () => void;
  onNuevaSolicitud?: () => void;
  onVerClientes?: () => void;
  onVerReportes?: () => void;
  onConfiguracion?: () => void;
  onVerTodasActividades?: () => void;
}

export function Dashboard({
  onViewSolicitud,
  onEditSolicitud,
  onNuevoCliente,
  onNuevoDocumento,
  onNuevaSolicitud,
  onVerClientes,
  onVerReportes,
  onConfiguracion,
  onVerTodasActividades
}: DashboardProps) {
  const dashboardData = useDashboardData({ autoLoad: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Vista general del sistema de onboarding</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Última actualización: {dashboardData.getLastUpdateFormatted()}</span>
            {dashboardData.isDataStale() && (
              <span className="text-orange-600">(Datos desactualizados)</span>
            )}
          </div>
        </div>
      </div>

      {/* Métricas principales usando componente modular */}
      <MetricsCards
        clientesData={dashboardData.getClientesData()}
        documentosData={dashboardData.getDocumentosData()}
        solicitudesData={dashboardData.getSolicitudesData()}
        rendimientoData={dashboardData.getRendimientoData()}
      />

      {/* Acciones rápidas usando componente modular */}
      <EstadisticasRapidas
        onNuevoCliente={onNuevoCliente}
        onNuevoDocumento={onNuevoDocumento}
        onNuevaSolicitud={onNuevaSolicitud}
        onVerClientes={onVerClientes}
        onVerReportes={onVerReportes}
        onConfiguracion={onConfiguracion}
        badges={{
          clientesPendientes: dashboardData.getClientesData().nuevos,
          documentosPendientes: dashboardData.getDocumentosData().pendientes,
          solicitudesPendientes: dashboardData.getSolicitudesData().pendientes
        }}
        permisos={{
          crearCliente: true,
          subirDocumento: true,
          crearSolicitud: true,
          verReportes: true,
          configuracion: false // Cambiar según rol del usuario
        }}
      />

      {/* Layout de dos columnas para contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad reciente usando componente modular */}
        <ActividadReciente
          actividades={dashboardData.getActividadData().actividadReciente.map(actividad => ({
            id: actividad.id.toString(),
            tipo: 'cliente' as const, // Default type
            accion: 'Actividad del sistema',
            descripcion: actividad.descripcion,
            fecha: actividad.fecha,
            usuario: actividad.usuario,
            prioridad: 'media' as const
          }))}
          loading={dashboardData.state.loading}
          onVerTodas={onVerTodasActividades}
          maxItems={8}
        />

        {/* Solicitudes recientes - Placeholder por ahora */}
        <SolicitudesRecientesTable
          solicitudes={[]} // Se completará cuando tengamos datos reales
          loading={dashboardData.state.loading}
          onVerSolicitud={onViewSolicitud}
          onEditarSolicitud={onEditSolicitud}
          maxItems={5}
          showActions={true}
        />
      </div>

      {/* Sección de Gráficas y Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más solicitados */}
        <ProductosMasSolicitados
          datos={{
            labels: ['Crédito Simple', 'Cuenta Corriente', 'Factoraje', 'Arrendamiento'],
            cantidades: [25, 18, 12, 8],
            montos: [2500000, 1800000, 3200000, 4500000]
          }}
          loading={dashboardData.state.loading}
        />

        {/* Distribución por estatus */}
        <DistribucionEstatus
          datos={{
            estatus: ['Aprobadas', 'En Revisión', 'Rechazadas', 'Iniciadas'],
            cantidades: [
              dashboardData.getSolicitudesData().aprobadas || 45,
              dashboardData.getSolicitudesData().pendientes || 25,
              dashboardData.getSolicitudesData().rechazadas || 15,
              15 // Iniciadas - calculado
            ]
          }}
          loading={dashboardData.state.loading}
        />
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencias mensuales */}
        <div className="lg:col-span-2">
          <TendenciasMensuales
            datos={{
              meses: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
              solicitudes: [12, 19, 15, 25, 22, 30],
              aprobaciones: [8, 15, 12, 20, 18, 25]
            }}
            loading={dashboardData.state.loading}
          />
        </div>

        {/* Completitud de documentos */}
        <CompletitudDocumentos
          datos={{
            completitud: 75,
            documentosCompletos: dashboardData.getDocumentosData().total - dashboardData.getDocumentosData().pendientes,
            documentosTotal: dashboardData.getDocumentosData().total
          }}
          loading={dashboardData.state.loading}
        />
      </div>

      {/* Sección de Estadísticas Detalladas */}
      <div className="space-y-6">
        {/* Header de la sección */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Estadísticas Detalladas</h2>
          <div className="text-sm text-gray-500">
            Análisis profundo por módulo
          </div>
        </div>

        {/* Estadísticas de Clientes */}
        <ClienteStats
          estadisticas={{
            total_clientes: dashboardData.getClientesData().total,
            clientes_activos: dashboardData.getClientesData().activos || 0,
            clientes_inactivos: dashboardData.getClientesData().inactivos || 0,
            clientes_pendientes_aprobacion: 0, // Calcular desde datos reales
            clientes_rechazados: 0, // Calcular desde datos reales
            porcentaje_completitud_promedio: dashboardData.getClientesData().completitudPromedio || 0,
            onboarding_completados_mes: dashboardData.getClientesData().nuevos || 0,
            clientes_por_tipo: {
              fisica: dashboardData.getClientesData().total - 0, // La mayoría son físicas por defecto
              moral: 0 // Calcular desde datos reales
            },
            tendencia_mensual: [
              { mes: 'Jun', nuevos_clientes: 8, onboarding_completados: 6 },
              { mes: 'Jul', nuevos_clientes: 12, onboarding_completados: 10 },
              { mes: 'Ago', nuevos_clientes: 15, onboarding_completados: 12 },
              { mes: 'Sep', nuevos_clientes: 18, onboarding_completados: 16 },
              { mes: 'Oct', nuevos_clientes: 22, onboarding_completados: 20 },
              { mes: 'Nov', nuevos_clientes: dashboardData.getClientesData().nuevos, onboarding_completados: Math.floor(dashboardData.getClientesData().nuevos * 0.9) }
            ]
          }}
          loading={dashboardData.state.loading}
          error={dashboardData.state.error}
        />

        {/* Estadísticas de Documentos */}
        <DocumentoStats
          stats={{
            total_documentos: dashboardData.getDocumentosData().total,
            documentos_pendientes: dashboardData.getDocumentosData().pendientes,
            documentos_aceptados: dashboardData.getDocumentosData().aprobados || 0,
            documentos_rechazados: dashboardData.getDocumentosData().rechazados || 0,
            documentos_vencidos: 0, // Calcular desde datos reales
            documentos_proximos_vencer: 0, // Calcular desde datos reales
            subidos_recientes: 0, // Calcular desde datos reales
            clientes_con_documentos: 0, // Calcular desde datos reales
            tipos_documento_utilizados: 12,
            porcentaje_completitud: dashboardData.getDocumentosData().total > 0 ? 
              Math.round(((dashboardData.getDocumentosData().total - dashboardData.getDocumentosData().pendientes) / dashboardData.getDocumentosData().total) * 100) : 0,
            documentos_por_cliente: dashboardData.getClientesData().total > 0 ? 
              Math.round(dashboardData.getDocumentosData().total / dashboardData.getClientesData().total) : 0
          }}
          loading={dashboardData.state.loading}
          error={dashboardData.state.error}
          showTrends={true}
          showDetailed={true}
        />

        {/* Estadísticas de Solicitudes */}
        <SolicitudStats
          stats={{
            total_solicitudes: dashboardData.getSolicitudesData().total,
            solicitudes_iniciadas: 0, // Calcular desde datos reales
            solicitudes_en_revision: dashboardData.getSolicitudesData().pendientes,
            solicitudes_aprobadas: dashboardData.getSolicitudesData().aprobadas,
            solicitudes_rechazadas: dashboardData.getSolicitudesData().rechazadas,
            solicitudes_canceladas: 0, // Calcular desde datos reales
            monto_total_solicitado: dashboardData.getSolicitudesData().montoTotal || 0,
            monto_total_aprobado: 0, // Calcular desde datos reales
            tiempo_promedio_aprobacion: 0 // Calcular desde datos reales
          }}
          isLoading={dashboardData.state.loading}
        />
      </div>

      {/* Estado del sistema - Manejo de errores */}
      {dashboardData.state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-red-700">
              Error al cargar datos del dashboard: {dashboardData.state.error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
