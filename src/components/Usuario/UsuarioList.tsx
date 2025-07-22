import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useUsuarioManager } from '../../hook/usuario';
import { UsuarioActions } from './UsuarioActions';
import type { Usuario } from '../../types/usuario.types';

const rolesColors: Record<string, string> = {
  SUPER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  AUDITOR: 'bg-yellow-100 text-yellow-700',
  OPERADOR: 'bg-green-100 text-green-700',
};

const estatusColors: Record<string, string> = {
  activo: 'bg-green-100 text-green-700',
  suspendido: 'bg-red-100 text-red-700',
};

function getInitials(usuario: Usuario) {
  const nombre = usuario.nombre || '';
  const apellido = usuario.apellido || '';
  return (nombre[0] || '') + (apellido[0] || '');
}

const UsuarioList: React.FC = () => {
  // Forzamos el tipado del estado a usar Usuario canónico
  const { state, buscarUsuarios } = useUsuarioManager() as {
    state: { usuarios: Usuario[]; loading: boolean; error: string | null };
    buscarUsuarios: (search: string) => void;
  };
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    buscarUsuarios(search);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
        </div>
        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-1 items-center bg-gray-50 rounded-lg px-3 py-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o username..."
            className="flex-1 bg-transparent outline-none text-gray-900"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        <button
          type="button"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          onClick={() => setShowFilters(v => !v)}
        >
          <FunnelIcon className="w-5 h-5 mr-2" />
          Filtros
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Aquí irán los filtros avanzados (rol, estatus, etc) */}
          <span className="text-gray-500">Filtros avanzados próximamente...</span>
        </div>
      )}
      {state.loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-gray-500">Cargando usuarios...</span>
        </div>
      ) : state.error ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{state.error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {state.usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No hay usuarios registrados.</td>
                </tr>
              ) : (
                state.usuarios.map(usuario => (
                  <tr key={usuario.usuario_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{usuario.usuario_id}</td>
                    <td className="px-4 py-2 flex items-center space-x-2">
                      <div className="flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold w-8 h-8" title={usuario.nombre}>
                        {getInitials(usuario)}
                      </div>
                      <span className="text-gray-900">{usuario.nombre} {usuario.apellido}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{usuario.correo}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rolesColors[usuario.rol] || 'bg-gray-100 text-gray-700'}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estatusColors[usuario.estatus]}`}>
                        {usuario.estatus === 'activo' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <UsuarioActions usuario={usuario} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsuarioList;
