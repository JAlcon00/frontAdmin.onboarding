
import { Dashboard } from '../components/Dashboard/Dashboard';
import { MainLayout } from '../layout/MainLayout';

export function DashboardPage() {
  // Handlers para las acciones del dashboard
  const handleViewAllSolicitudes = () => {
    console.log('Ver todas las solicitudes');
    // TODO: Navegar a la página de solicitudes
  };

  const handleViewSolicitud = (solicitud: any) => {
    console.log('Ver solicitud:', solicitud);
    // TODO: Navegar al detalle de la solicitud
  };

  const handleEditSolicitud = (solicitud: any) => {
    console.log('Editar solicitud:', solicitud);
    // TODO: Abrir modal o navegar al formulario de edición
  };

  // Handlers para acciones rápidas
  const handleNuevoCliente = () => {
    console.log('Crear nuevo cliente');
    // TODO: Navegar al formulario de cliente
  };

  const handleNuevoDocumento = () => {
    console.log('Subir nuevo documento');
    // TODO: Abrir modal de upload
  };

  const handleNuevaSolicitud = () => {
    console.log('Crear nueva solicitud');
    // TODO: Navegar al formulario de solicitud
  };

  const handleVerClientes = () => {
    console.log('Ver lista de clientes');
    // TODO: Navegar a la página de clientes
  };

  const handleVerReportes = () => {
    console.log('Ver reportes');
    // TODO: Navegar a la página de reportes
  };

  const handleConfiguracion = () => {
    console.log('Abrir configuración');
    // TODO: Navegar a configuración
  };

  const handleVerTodasActividades = () => {
    console.log('Ver todas las actividades');
    // TODO: Navegar a la página de actividades
  };

  return (
    <MainLayout>
      <Dashboard
        onViewAllSolicitudes={handleViewAllSolicitudes}
        onViewSolicitud={handleViewSolicitud}
        onEditSolicitud={handleEditSolicitud}
        onNuevoCliente={handleNuevoCliente}
        onNuevoDocumento={handleNuevoDocumento}
        onNuevaSolicitud={handleNuevaSolicitud}
        onVerClientes={handleVerClientes}
        onVerReportes={handleVerReportes}
        onConfiguracion={handleConfiguracion}
        onVerTodasActividades={handleVerTodasActividades}
      />
    </MainLayout>
  );
}

export default DashboardPage;
