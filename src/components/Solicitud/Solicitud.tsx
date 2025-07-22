import React, { useState, useEffect } from 'react';
import { SolicitudList } from './SolicitudList';
import { SolicitudForm } from './SolicitudForm';
import { SolicitudDetail } from './SolicitudDetail';
import { SolicitudStats } from './SolicitudStats';
import { SolicitudFilters } from './SolicitudFilters';
import { useSolicitudManager } from '../../hook/solicitud';
import { 
  ChartBarIcon, 
  PlusIcon, 
  ViewColumnsIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import type { SolicitudCompleta } from '../../services/solicitud.service';
import type { SolicitudFilter } from '../../types';

interface SolicitudProps {
  className?: string;
}

type ViewType = 'list' | 'form' | 'detail' | 'stats';

const Solicitud: React.FC<SolicitudProps> = ({ className = '' }) => {
  const {
    state: { solicitudes, selectedSolicitud, loading, error },
    listar,
    obtener, 
    crear,
    seleccionar,
    limpiarSeleccion,
    utils
  } = useSolicitudManager();

  const [currentView, setCurrentView] = useState<ViewType>('list');

  // Cargar solicitudes al montar el componente
  useEffect(() => {
    listar();
  }, [listar]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'detail') {
      limpiarSeleccion(); // Usar limpiarSeleccion en lugar de setSelectedSolicitud(null)
    }
  };

  const handleSolicitudSelect = async (solicitud: SolicitudCompleta) => {
    try {
      const fullSolicitud = await obtener(solicitud.solicitud_id); // Usar obtener del hook
      if (fullSolicitud) {
        seleccionar(fullSolicitud); // Usar seleccionar del hook
        setCurrentView('detail');
      }
    } catch (err) {
      console.error('Error al seleccionar solicitud:', err);
    }
  };

  const handleFilterChange = async (filters: SolicitudFilter) => {
    try {
      await listar(filters); // Usar listar con filtros del hook
    } catch (err) {
      console.error('Error al aplicar filtros:', err);
    }
  };

  const handleCreateSolicitud = async (formData: any) => {
    try {
      await crear(formData); // Usar crear del hook
      setCurrentView('list');
    } catch (err) {
      console.error('Error al crear solicitud:', err);
    }
  };

  // Función para convertir SolicitudCompleta a SolicitudFormData
  const convertToFormData = (solicitud: SolicitudCompleta) => {
    const producto = solicitud.productos?.[0];
    return {
      cliente_id: solicitud.cliente_id,
      producto_codigo: producto?.producto || 'CS',
      monto_solicitado: producto?.monto || 0,
      moneda: 'MXN' as const,
      plazo_meses: producto?.plazo_meses || 12,
      tasa_interes: 0,
      finalidad: '',
      observaciones: '',
      estatus: solicitud.estatus,
      prioridad: 'media' as const,
      fecha_vencimiento: new Date(),
      asignado_a: undefined,
      requiere_garantia: false,
      tipo_garantia: undefined,
      valor_garantia: undefined,
      documentos_requeridos: [],
      documentos_recibidos: [],
      comentarios_internos: '',
      historial_estatus: []
    };
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                listar(); // Usar listar para recargar datos
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'form':
        return (
          <SolicitudForm
            onCancel={() => setCurrentView('list')}
            onSubmit={handleCreateSolicitud}
            isLoading={loading}
          />
        );
      case 'detail':
        return selectedSolicitud ? (
          <SolicitudDetail
            solicitud={convertToFormData(selectedSolicitud)}
            onClose={() => setCurrentView('list')}
            isLoading={loading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay solicitud seleccionada</p>
          </div>
        );
      case 'stats':
        // Adaptar estadísticas del hook al formato esperado por SolicitudStats
        const adaptedStats = {
          total_solicitudes: utils.estadisticas.total,
          solicitudes_iniciadas: utils.estadisticas.iniciadas,
          solicitudes_en_revision: utils.estadisticas.en_revision,
          solicitudes_aprobadas: utils.estadisticas.aprobadas,
          solicitudes_rechazadas: utils.estadisticas.rechazadas,
          solicitudes_canceladas: utils.estadisticas.canceladas,
          monto_total_solicitado: utils.estadisticas.monto_total,
          monto_total_aprobado: utils.estadisticas.monto_total, // Aproximación
          monto_promedio_solicitud: utils.estadisticas.monto_promedio,
          tiempo_promedio_aprobacion: 0, // No disponible en el hook
        };
        return (
          <SolicitudStats
            stats={adaptedStats}
            isLoading={loading}
            onRefresh={() => listar()}
          />
        );
      default:
        return (
          <SolicitudList
            solicitudes={solicitudes}
            onSolicitudSelect={handleSolicitudSelect}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className={`solicitud-container ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-600">Gestión de solicitudes de crédito</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleViewChange('list')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            disabled={loading}
          >
            <ViewColumnsIcon className="h-4 w-4 mr-2" />
            Lista
          </button>
          
          <button
            onClick={() => handleViewChange('stats')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'stats'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            disabled={loading}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Estadísticas
          </button>
          
          <button
            onClick={() => handleViewChange('form')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            disabled={loading}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Filters */}
      {currentView === 'list' && (
        <div className="mb-6">
          <SolicitudFilters 
            onFiltersChange={handleFilterChange}
            showClearButton={true}
          />
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {renderContent()}
      </div>
    </div>
  );
};

export default Solicitud;
