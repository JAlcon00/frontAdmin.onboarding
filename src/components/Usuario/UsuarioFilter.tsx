import React from 'react';
import { useUsuarioFilters } from '../../hook/usuario/useUsuarioFilters';

const UsuarioFilter: React.FC = () => {
  const {
    state,
    setFilter,
    setSearchTerm,
    clearFilters,
    getRoleOptions,
    getStatusOptions,
    applyFilters,
  } = useUsuarioFilters();

  return (
    <form
      className="flex flex-wrap gap-4 items-end mb-4"
      onSubmit={e => {
        e.preventDefault();
        applyFilters();
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1">Rol</label>
        <select
          className="border rounded px-2 py-1"
          value={state.activeFilters.rol || ''}
          onChange={e => setFilter('rol', e.target.value || undefined)}
        >
          <option value="">Todos</option>
          {getRoleOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estatus</label>
        <select
          className="border rounded px-2 py-1"
          value={state.activeFilters.estatus || ''}
          onChange={e => setFilter('estatus', e.target.value || undefined)}
        >
          <option value="">Todos</option>
          {getStatusOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Buscar</label>
        <input
          type="text"
          className="border rounded px-2 py-1"
          placeholder="Nombre, usuario, correo..."
          value={state.activeFilters.search || ''}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
      >
        Aplicar
      </button>
      <button
        type="button"
        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
        onClick={clearFilters}
      >
        Limpiar
      </button>
    </form>
  );
};

export default UsuarioFilter;