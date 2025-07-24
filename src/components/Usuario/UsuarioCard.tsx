import React from 'react';
import type { Usuario } from '../../hook/usuario/useUsuarioManager';
import { Button, Badge, Card } from '../shared';

import type { UsuarioActionHandlers } from './UsuarioList';

export interface UsuarioCardProps {
  usuario: Usuario;
  actions: UsuarioActionHandlers;
}

const UsuarioCard: React.FC<UsuarioCardProps> = ({ usuario, actions }) => {
  return (
    <Card className="mb-4 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="font-bold text-lg">{usuario.nombre} {usuario.apellido}</div>
        <Badge variant={usuario.estatus === 'activo' ? 'success' : 'danger'}>{usuario.estatus}</Badge>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300">Usuario: <span className="font-mono">{usuario.username}</span></div>
      <div className="text-sm text-gray-600 dark:text-gray-300">Correo: {usuario.correo}</div>
      <div className="text-sm">Rol: <Badge variant="primary">{usuario.rol}</Badge></div>
      <div className="flex gap-2 mt-2 flex-wrap">
        <Button size="xs" variant="secondary" onClick={() => actions.onVerDetalle(usuario)}>Ver</Button>
        <Button size="xs" variant="primary" onClick={() => actions.onEditar(usuario)}>Editar</Button>
        <Button size="xs" variant="warning" onClick={() => actions.onResetPassword(usuario)}>Reset Pass</Button>
        <Button size="xs" variant="danger" onClick={() => actions.onEliminar(usuario)}>Eliminar</Button>
      </div>
    </Card>
  );
};

export default UsuarioCard;
