import { useEffect } from 'react';
import { MainLayout } from './layout';
import { DashboardPage } from './pages/Dashboard.page';
import { configureChartDefaults } from './components/Dashboard/chartConfig';

function App() {
  // Configurar Chart.js al inicializar la aplicación
  useEffect(() => {
    configureChartDefaults();
  }, []);

  // Datos de ejemplo del usuario logueado
  const user = {
    nombre: 'Jesus Almanza',
    rol: 'Super Administrador',
    avatar: undefined
  };

  return (
    <MainLayout user={user}>
      <DashboardPage />
    </MainLayout>
  );
}

export default App;
