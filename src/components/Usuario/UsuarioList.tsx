import React from 'react';
import type { Usuario } from '../../hook/usuario/useUsuarioManager';
import { Button, Badge } from '../shared';

export interface UsuarioActionHandlers {
  onVerDetalle: (usuario: Usuario) => void;
  onEditar: (usuario: Usuario) => void;
  onResetPassword: (usuario: Usuario) => void;
  onEliminar: (usuario: Usuario) => void;
}

export interface UsuarioListProps {
  usuarios: Usuario[];
  actions: UsuarioActionHandlers;
  loading?: boolean;
}

const UsuarioList: React.FC<UsuarioListProps> = ({ usuarios, actions, loading }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Usuario</th>
            <th className="px-4 py-2">Correo</th>
            <th className="px-4 py-2">Rol</th>
            <th className="px-4 py-2">Estatus</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(usuario => (
            <tr key={usuario.usuario_id} className="border-b">
              <td className="px-4 py-2">{usuario.usuario_id}</td>
              <td className="px-4 py-2">{usuario.nombre} {usuario.apellido}</td>
              <td className="px-4 py-2">{usuario.username}</td>
              <td className="px-4 py-2">{usuario.correo}</td>
              <td className="px-4 py-2"><Badge variant="primary">{usuario.rol}</Badge></td>
              <td className="px-4 py-2"><Badge variant={usuario.estatus === 'activo' ? 'success' : 'danger'}>{usuario.estatus}</Badge></td>
              <td className="px-4 py-2 flex gap-2 flex-wrap">
                <Button size="xs" variant="secondary" onClick={() => actions.onVerDetalle(usuario)}>Ver</Button>
                <Button size="xs" variant="primary" onClick={() => actions.onEditar(usuario)}>Editar</Button>
                <Button size="xs" variant="warning" onClick={() => actions.onResetPassword(usuario)}>Reset Pass</Button>
                <Button size="xs" variant="danger" onClick={() => actions.onEliminar(usuario)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="text-center py-4">Cargando usuarios...</div>}
      {!loading && usuarios.length === 0 && <div className="text-center py-4 text-gray-500">No hay usuarios para mostrar.</div>}
    </div>
  );
};

export default UsuarioList;
