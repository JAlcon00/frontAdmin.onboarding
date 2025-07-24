import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout';
import { DashboardPage, ClientePage, DocumentoPage, UsuarioPage, LoginPage, SolicitudPage } from './pages';
import { configureChartDefaults } from './components/Dashboard/chartConfig';

function App() {
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
    <BrowserRouter>
      <MainLayout user={user}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientePage />} />
          <Route path="/documentos" element={<DocumentoPage />} />
          <Route path="/usuarios" element={<UsuarioPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/solicitudes" element={<SolicitudPage />} />
          {/* Puedes agregar más rutas aquí */}
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;