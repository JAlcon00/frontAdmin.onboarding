import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { useDashboardData } from './hook/dashboard/useDashboardData';

// Componente de prueba para verificar el Dashboard y el hook
export function TestDashboard() {
  const [showDetails, setShowDetails] = useState(false);
  
  // Probar el hook directamente
  const dashboardHook = useDashboardData({
    autoLoad: true,
    refreshInterval: 30000, // 30 segundos
    onDataUpdate: (data) => {
      console.log('✅ Dashboard data updated:', data);
    },
    onError: (error) => {
      console.error('❌ Dashboard error:', error);
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Debug Panel */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Debug Dashboard Hook</h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                dashboardHook.state.loading ? 'bg-yellow-100 text-yellow-800' : 
                dashboardHook.state.error ? 'bg-red-100 text-red-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {dashboardHook.state.loading ? 'Cargando' : 
                 dashboardHook.state.error ? 'Error' : 'OK'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Última actualización:</span>
              <div className="text-gray-600">{dashboardHook.getLastUpdateFormatted()}</div>
            </div>
            
            <div>
              <span className="font-medium">Datos actuales:</span>
              <div className="text-gray-600">
                {dashboardHook.isDataStale() ? '🟡 Desactualizados' : '🟢 Frescos'}
              </div>
            </div>
            
            <div>
              <span className="font-medium">Período:</span>
              <div className="text-gray-600">{dashboardHook.state.currentPeriod.label}</div>
            </div>
          </div>

          {dashboardHook.state.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 text-sm">Error: {dashboardHook.state.error}</p>
            </div>
          )}

          {showDetails && (
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="font-medium mb-2">Datos de Clientes:</h3>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(dashboardHook.getClientesData(), null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Datos de Documentos:</h3>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(dashboardHook.getDocumentosData(), null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Datos de Solicitudes:</h3>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(dashboardHook.getSolicitudesData(), null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => dashboardHook.refreshData()}
              disabled={dashboardHook.state.loading}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Refrescar
            </button>
            
            <button
              onClick={() => {
                const exported = dashboardHook.exportData('json');
                console.log('📊 Datos exportados (JSON):', exported);
              }}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              📊 Exportar JSON
            </button>
            
            <button
              onClick={() => {
                const exported = dashboardHook.exportData('csv');
                console.log('📊 Datos exportados (CSV):', exported);
              }}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              📊 Exportar CSV
            </button>
          </div>
        </div>

        {/* Dashboard Component */}
        <Dashboard 
          onViewAllSolicitudes={() => {
            console.log('🔍 Navegando a todas las solicitudes');
            alert('Navegación a solicitudes (demo)');
          }}
        />
      </div>
    </div>
  );
}

export default TestDashboard;
