import React from 'react';
import type { Usuario } from '../../hook/usuario';
import { UserIcon } from '@heroicons/react/24/outline';

interface UsuarioAvatarProps {
  usuario: Usuario;
  size?: number;
}

export const UsuarioAvatar: React.FC<UsuarioAvatarProps> = ({ usuario, size = 32 }) => {
  // Si hay imagen, mostrarla. Si no, mostrar iniciales. Si no, icono.
  const initials = usuario.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  return (
    <div
      className="flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold"
      style={{ width: size, height: size, fontSize: size / 2 }}
      title={usuario.nombre}
    >
      {/* Aquí podrías mostrar una imagen si existe: usuario.avatarUrl */}
      {initials || <UserIcon className="w-5 h-5" />}
    </div>
  );
};

export default UsuarioAvatar;
