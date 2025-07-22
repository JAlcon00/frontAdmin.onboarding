import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ValidationAlert, CoherenciaClienteDocumentos } from '../shared';
import { clienteService } from '../../services/cliente.service';
import { documentoService } from '../../services/documento.service';
import { 
  validarCompletitudDocumentosCliente,
  obtenerErroresValidacionDocumentos
} from '../../utils/validation';

interface ValidationReport {
  clientesTotal: number;
  clientesCompletos: number;
  clientesIncompletos: number;
  clientesSinDocumentos: number;
  documentosTotal: number;
  documentosInvalidos: number;
  promedioCompletitud: number;
}

export const ValidacionCoherencia: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport>({
    clientesTotal: 0,
    clientesCompletos: 0,
    clientesIncompletos: 0,
    clientesSinDocumentos: 0,
    documentosTotal: 0,
    documentosInvalidos: 0,
    promedioCompletitud: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar clientes y documentos
      const [clientesResponse, documentosResponse] = await Promise.all([
        clienteService.getClientes(),
        documentoService.getDocumentos()
      ]);

      setClientes(clientesResponse.data);
      setDocumentos(documentosResponse.data);

      // Generar reporte de validación
      generateValidationReport(clientesResponse.data, documentosResponse.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos de validación');
    } finally {
      setLoading(false);
    }
  };

  const generateValidationReport = (clientesData: any[], documentosData: any[]) => {
    const report: ValidationReport = {
      clientesTotal: clientesData.length,
      clientesCompletos: 0,
      clientesIncompletos: 0,
      clientesSinDocumentos: 0,
      documentosTotal: documentosData.length,
      documentosInvalidos: 0,
      promedioCompletitud: 0
    };

    let totalCompletitud = 0;
    let documentosInvalidos = 0;

    clientesData.forEach(cliente => {
      const completitud = validarCompletitudDocumentosCliente(cliente, documentosData);
      totalCompletitud += completitud.porcentajeCompletitud;

      if (completitud.esCompleto) {
        report.clientesCompletos++;
      } else {
        report.clientesIncompletos++;
      }

      const documentosCliente = documentosData.filter(doc => doc.cliente_id === cliente.cliente_id);
      if (documentosCliente.length === 0) {
        report.clientesSinDocumentos++;
      }

      // Contar documentos inválidos
      const erroresDocumentos = obtenerErroresValidacionDocumentos(documentosCliente);
      documentosInvalidos += erroresDocumentos.length;
    });

    report.promedioCompletitud = Math.round(totalCompletitud / clientesData.length);
    report.documentosInvalidos = documentosInvalidos;

    setValidationReport(report);
  };

  const getClientesList = () => {
    return clientes.map(cliente => {
      const completitud = validarCompletitudDocumentosCliente(cliente, documentos);
      return {
        ...cliente,
        completitud: completitud.porcentajeCompletitud,
        esCompleto: completitud.esCompleto
      };
    }).sort((a, b) => a.completitud - b.completitud);
  };

  const getCompletitudColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletitudBgColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-green-100 border-green-200';
    if (porcentaje >= 70) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ValidationAlert
        type="error"
        message={error}
        onClose={() => setError(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Validación de Coherencia Cliente-Documentos
            </h1>
            <p className="text-gray-600">
              Revisa la coherencia entre clientes y su documentación
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{validationReport.clientesTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Completos</p>
              <p className="text-2xl font-bold text-green-600">{validationReport.clientesCompletos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Incompletos</p>
              <p className="text-2xl font-bold text-yellow-600">{validationReport.clientesIncompletos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Promedio Completitud</p>
              <p className={`text-2xl font-bold ${getCompletitudColor(validationReport.promedioCompletitud)}`}>
                {validationReport.promedioCompletitud}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de clientes */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Clientes por Completitud
            </h2>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {getClientesList().map((cliente) => (
                <div
                  key={cliente.cliente_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCliente?.cliente_id === cliente.cliente_id
                      ? 'border-blue-500 bg-blue-50'
                      : `${getCompletitudBgColor(cliente.completitud)} hover:shadow-md`
                  }`}
                  onClick={() => setSelectedCliente(cliente)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {cliente.tipo_persona === 'PF' 
                          ? `${cliente.nombre} ${cliente.apellido_paterno} ${cliente.apellido_materno}`.trim()
                          : cliente.razon_social || 'Sin razón social'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {cliente.tipo_persona === 'PF' ? 'Persona Física' : 'Persona Moral'} • {cliente.rfc}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getCompletitudColor(cliente.completitud)}`}>
                        {cliente.completitud}%
                      </p>
                      {cliente.esCompleto && (
                        <CheckCircleIcon className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle de coherencia */}
        <div>
          {selectedCliente ? (
            <CoherenciaClienteDocumentos
              cliente={selectedCliente}
              documentos={documentos}
              showDetails={true}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un cliente
              </h3>
              <p className="text-gray-500">
                Haz clic en un cliente de la lista para ver los detalles de coherencia con sus documentos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidacionCoherencia;
