import React from 'react';
import { useUsuarioFilters } from '../../hook/usuario/useUsuarioFilters';
import { Button } from '../shared';

const UsuarioFilter: React.FC = () => {
  const {
    state,
    setFilter,
    setSearchTerm,
    clearFilters,
    getRoleOptions,
    getStatusOptions,
    getSortOptions,
    setSortConfig,
    clearSort
  } = useUsuarioFilters();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'search') setSearchTerm(value);
    else setFilter(name as any, value || undefined);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, direction] = e.target.value.split(':');
    if (field) setSortConfig(field, direction as 'asc' | 'desc');
    else clearSort();
  };

  return (
    <form className="flex flex-wrap gap-4 items-end bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
      <div>
        <label className="block text-xs font-semibold mb-1">Rol</label>
        <select
          name="rol"
          value={state.activeFilters.rol || ''}
          onChange={handleInputChange}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          {getRoleOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Estatus</label>
        <select
          name="estatus"
          value={state.activeFilters.estatus || ''}
          onChange={handleInputChange}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          {getStatusOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Buscar</label>
        <input
          type="text"
          name="search"
          value={state.searchTerm}
          onChange={handleInputChange}
          placeholder="Nombre, usuario, correo..."
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Ordenar por</label>
        <select
          name="sort"
          value={state.sortConfig ? `${state.sortConfig.field}:${state.sortConfig.direction}` : ''}
          onChange={handleSortChange}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Sin orden</option>
          {getSortOptions().map(opt => (
            <React.Fragment key={opt.value}>
              <option value={`${opt.value}:asc`}>{opt.label} (asc)</option>
              <option value={`${opt.value}:desc`}>{opt.label} (desc)</option>
            </React.Fragment>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={clearFilters}>Limpiar</Button>
      </div>
    </form>
  );
};

export default UsuarioFilter;
