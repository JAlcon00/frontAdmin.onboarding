import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';

const UsuarioActions: React.FC<{ usuarioId: number }> = ({ usuarioId }) => {

  const { state, obtenerUsuario, eliminarUsuario } = useUsuarioManager({ autoLoad: false });
  const usuario = state.usuarios.find(u => u.usuario_id === usuarioId);

  const handleView = async () => {
    await obtenerUsuario(usuarioId);
    // Aquí podrías abrir un modal o mostrar detalles
  };


  const handleEdit = async () => {
    await obtenerUsuario(usuarioId);
    // Aquí podrías abrir un formulario de edición
  };

  const handleDelete = async () => {
    await eliminarUsuario(usuarioId);
    // Aquí podrías mostrar una notificación o refrescar la lista
  };

  if (!usuario) return null;

  return (
    <div className="flex space-x-2">
      <button
        className="text-blue-500 hover:text-blue-700"
        onClick={handleView}
        title="Ver usuario"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
      <button
        className="text-yellow-500 hover:text-yellow-700"
        onClick={handleEdit}
        title="Editar usuario"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        className="text-red-500 hover:text-red-700"
        onClick={handleDelete}
        title="Eliminar usuario"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default UsuarioActions;