import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useClienteManager } from '../../hook/cliente';
import type { Cliente, TipoPersona } from '../../types/cliente.types';
import { TIPOS_PERSONA } from '../../constants';

interface ClienteListProps {
  onCreateCliente?: () => void;
  onViewCliente?: (cliente: Cliente) => void;
  onEditCliente?: (cliente: Cliente) => void;
  onDeleteCliente?: (cliente: Cliente) => void;
  filtroTipoPersona?: TipoPersona | null;
  viewMode?: 'table' | 'cards';
}

export const ClienteList: React.FC<ClienteListProps> = ({
  onCreateCliente,
  onViewCliente,
  onEditCliente,
  onDeleteCliente,
  filtroTipoPersona,
  viewMode = 'table'
}) => {
  const {
    state: { clientes, loading, error },
    actions: { buscar },
    operations: { eliminar }
  } = useClienteManager();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localViewMode, setLocalViewMode] = useState(viewMode);

  // Filtrar clientes localmente
  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = searchTerm === '' || 
      cliente.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.nombre && cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.apellido_paterno && cliente.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.razon_social && cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = !filtroTipoPersona || cliente.tipo_persona === filtroTipoPersona;
    return matchesSearch && matchesTipo;
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Búsqueda en tiempo real
    if (value.length > 2 || value.length === 0) {
      buscar(value);
    }
  };

  const handleDeleteCliente = async (cliente: Cliente) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${cliente.nombre || cliente.razon_social}?`)) {
      const success = await eliminar(cliente.cliente_id);
      if (success && onDeleteCliente) {
        onDeleteCliente(cliente);
      }
    }
  };

  const getIconForTipoPersona = (tipo: TipoPersona) => {
    switch (tipo) {
      case 'PF': return UserIcon;
      case 'PF_AE': return UserGroupIcon;
      case 'PM': return BuildingOfficeIcon;
      default: return UserIcon;
    }
  };

  const getNombreCompleto = (cliente: Cliente) => {
    if (cliente.tipo_persona === 'PM') {
      return cliente.razon_social || 'Sin nombre';
    }
    return `${cliente.nombre || ''} ${cliente.apellido_paterno || ''} ${cliente.apellido_materno || ''}`.trim() || 'Sin nombre';
  };

  const getClienteTypeIcon = (tipo: string) => {
    return tipo === 'persona_fisica' ? '👤' : '🏢';
  };

  const getCompletitudColor = (completitud: number) => {
    if (completitud >= 80) return 'text-green-600';
    if (completitud >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <UserGroupIcon className="w-8 h-8 mr-3 text-blue-600" />
            Clientes
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({clientesFiltrados.length})
            </span>
          </h1>
          <p className="text-secondary mt-1">
            Gestión de clientes del sistema de onboarding
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Toggle de vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLocalViewMode('table')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                localViewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setLocalViewMode('cards')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                localViewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
          </div>

          {onCreateCliente && (
            <button
              onClick={onCreateCliente}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-card border border-card rounded-lg shadow-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RFC, email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Persona
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200"
                >
                  Todos
                </button>
                {(Object.keys(TIPOS_PERSONA) as TipoPersona[]).map((tipo) => (
                  <button
                    key={tipo}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    {TIPOS_PERSONA[tipo]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de clientes */}
      <div className="bg-card border border-card rounded-lg shadow-card">
        {error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">Error al cargar los clientes</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-secondary">
              {searchTerm || filtroTipoPersona ? 'No se encontraron clientes con esos criterios' : 'No se encontraron clientes'}
            </p>
            {onCreateCliente && !searchTerm && !filtroTipoPersona && (
              <button
                onClick={onCreateCliente}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear primer cliente
              </button>
            )}
          </div>
        ) : localViewMode === 'cards' ? (
          /* Vista de Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientesFiltrados.map((cliente) => {
              const IconComponent = getIconForTipoPersona(cliente.tipo_persona);
              
              return (
                <div
                  key={cliente.cliente_id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewCliente?.(cliente)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {getNombreCompleto(cliente)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {TIPOS_PERSONA[cliente.tipo_persona] || cliente.tipo_persona}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">RFC:</span>
                        <span className="ml-2 font-mono text-gray-900">{cliente.rfc}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 text-gray-900 truncate">{cliente.correo}</span>
                      </div>
                      {cliente.telefono && (
                        <div>
                          <span className="text-gray-500">Teléfono:</span>
                          <span className="ml-2 text-gray-900">{cliente.telefono}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Registrado:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCliente?.(cliente);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                      
                      {onEditCliente && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCliente(cliente);
                          }}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Editar
                        </button>
                      )}
                      
                      {onDeleteCliente && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                              handleDeleteCliente(cliente);
                            }
                          }}
                          className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      RFC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Completitud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-border">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.cliente_id} className="hover:bg-table-row-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">
                            {getClienteTypeIcon(cliente.tipo_persona)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-primary">
                              {getNombreCompleto(cliente)}
                            </div>
                            <div className="text-sm text-secondary">
                              {cliente.correo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-secondary font-mono">
                          {cliente.rfc}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary capitalize">
                          {cliente.tipo_persona?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: '0%' }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getCompletitudColor(0)}`}>
                            0%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          bg-green-100 text-green-800
                        `}>
                          Activo
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {onViewCliente && (
                            <button
                              onClick={() => onViewCliente(cliente)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Ver cliente"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onEditCliente && (
                            <button
                              onClick={() => onEditCliente(cliente)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Editar cliente"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteCliente && (
                            <button
                              onClick={() => handleDeleteCliente(cliente)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar cliente"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-table-border">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.cliente_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="text-2xl mr-3">
                        {getClienteTypeIcon(cliente.tipo_persona)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-primary truncate">
                          {getNombreCompleto(cliente)}
                        </h4>
                        <p className="text-xs text-secondary font-mono mt-1">
                          {cliente.rfc}
                        </p>
                      </div>
                    </div>
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      bg-green-100 text-green-800
                    `}>
                      Activo
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">Completitud:</span>
                      <span className={`font-medium ${getCompletitudColor(0)}`}>
                        0%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-secondary">
                      {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                    </span>
                    <div className="flex items-center space-x-3">
                      {onViewCliente && (
                        <button
                          onClick={() => onViewCliente(cliente)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onEditCliente && (
                        <button
                          onClick={() => onEditCliente(cliente)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteCliente && (
                        <button
                          onClick={() => handleDeleteCliente(cliente)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClienteList;
