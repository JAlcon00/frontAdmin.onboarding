import { useState } from 'react';
import { useClienteManager } from '../../hook/cliente/useClienteManager';
import { useClienteStats } from '../../hook/cliente/useClienteStats';
import { ClienteList } from './ClienteList';
import { ClienteForm } from './ClienteForm';
import { ClienteDetail } from './ClienteDetail';
import { ClienteStats } from './ClienteStats';
import type { Cliente } from '../../types/cliente.types';

export function Cliente() {
  const [vista, setVista] = useState<'lista' | 'crear' | 'editar' | 'detalle' | 'estadisticas'>('lista');
  
  // Hook principal de gestión de clientes
  const clienteManager = useClienteManager();
  
  // Hook de estadísticas (solo se usa cuando se necesita)
  const clienteStats = useClienteStats();

  const handleCrear = () => {
    setVista('crear');
    clienteManager.actions.seleccionar(null);
  };

  const handleEditar = (cliente: Cliente) => {
    setVista('editar');
    clienteManager.actions.seleccionar(cliente);
  };

  const handleVerDetalle = (cliente: Cliente) => {
    setVista('detalle');
    clienteManager.actions.seleccionar(cliente);
  };

  const handleVolver = () => {
    setVista('lista');
    clienteManager.actions.seleccionar(null);
  };

  const handleClienteEliminado = async (clienteId: number) => {
    const success = await clienteManager.operations.eliminar(clienteId);
    if (success) {
      // Si era el cliente seleccionado, limpiar selección
      if (clienteManager.state.selectedCliente?.cliente_id === clienteId) {
        clienteManager.actions.seleccionar(null);
      }
      // Refrescar la lista
      await clienteManager.actions.refrescar();
    }
  };

  return (
    <div className="space-y-6">
      {vista === 'lista' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
              <p className="text-gray-600">
                Administra la información de tus clientes
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setVista('estadisticas')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Ver Estadísticas
              </button>
              <button
                onClick={handleCrear}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Nuevo Cliente
              </button>
            </div>
          </div>
          
          <ClienteList
            onCreateCliente={handleCrear}
            onViewCliente={handleVerDetalle}
            onEditCliente={handleEditar}
            onDeleteCliente={(cliente) => handleClienteEliminado(cliente.cliente_id)}
          />
        </>
      )}

      {vista === 'crear' && (
        <ClienteForm
          onSubmit={clienteManager.operations.crear}
          onCancel={handleVolver}
        />
      )}

      {vista === 'editar' && clienteManager.state.selectedCliente && (
        <ClienteForm
          cliente={clienteManager.state.selectedCliente}
          onSubmit={(data) => 
            clienteManager.operations.actualizar(
              clienteManager.state.selectedCliente!.cliente_id, 
              data
            )
          }
          onCancel={handleVolver}
        />
      )}

      {vista === 'detalle' && clienteManager.state.selectedCliente && (
        <ClienteDetail
          cliente={clienteManager.state.selectedCliente}
          onEdit={() => handleEditar(clienteManager.state.selectedCliente!)}
          onClose={handleVolver}
        />
      )}

      {vista === 'estadisticas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Clientes</h1>
            <button
              onClick={handleVolver}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Volver a Lista
            </button>
          </div>
          <ClienteStats 
            estadisticas={clienteStats.state.estadisticas || {
              total_clientes: 0,
              clientes_activos: 0,
              clientes_inactivos: 0,
              clientes_pendientes_aprobacion: 0,
              clientes_rechazados: 0,
              porcentaje_completitud_promedio: 0,
              clientes_por_tipo: { fisica: 0, moral: 0 },
              onboarding_completados_mes: 0,
              tendencia_mensual: []
            }}
            loading={clienteStats.state.loading}
            error={clienteStats.state.error}
          />
        </div>
      )}
    </div>
  );
}
