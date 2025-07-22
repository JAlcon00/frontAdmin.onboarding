import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Usuario } from '../../hook/usuario';

interface UsuarioActionsProps {
  usuario: Usuario;
  onView?: (usuario: Usuario) => void;
  onEdit?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void;
}

export const UsuarioActions: React.FC<UsuarioActionsProps> = ({ usuario, onView, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onView?.(usuario)}
        className="p-1 rounded hover:bg-gray-100"
        title="Ver"
      >
        <EyeIcon className="w-5 h-5 text-blue-600" />
      </button>
      <button
        onClick={() => onEdit?.(usuario)}
        className="p-1 rounded hover:bg-gray-100"
        title="Editar"
      >
        <PencilIcon className="w-5 h-5 text-yellow-600" />
      </button>
      <button
        onClick={() => onDelete?.(usuario)}
        className="p-1 rounded hover:bg-gray-100"
        title="Eliminar"
      >
        <TrashIcon className="w-5 h-5 text-red-600" />
      </button>
    </div>
  );
};

export default UsuarioActions;
