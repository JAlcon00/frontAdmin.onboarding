import React, { useEffect } from 'react';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';
import { Card, LoadingSpinner, ValidationAlert, Badge } from '../shared';

interface UsuarioDetailProps {
  usuarioId: number;
}

const UsuarioDetail: React.FC<UsuarioDetailProps> = ({ usuarioId }) => {
  const { state, obtenerUsuario } = useUsuarioManager();
  const { usuario, loading, error } = state;

  useEffect(() => {
    if (usuarioId) {
      obtenerUsuario(usuarioId);
    }
    // eslint-disable-next-line
  }, [usuarioId]);

  if (loading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return <ValidationAlert type="error" message={error} />;
  }

  if (!usuario) {
    return <div className="text-center text-gray-500">No se encontró el usuario.</div>;
  }

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-2">Detalle del Usuario</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="font-semibold">Nombre:</span> {usuario.nombre} {usuario.apellido}
        </div>
        <div>
          <span className="font-semibold">Usuario:</span> {usuario.username}
        </div>
        <div>
          <span className="font-semibold">Correo:</span> {usuario.correo}
        </div>
        <div>
          <span className="font-semibold">Rol:</span> <Badge variant="primary">{usuario.rol}</Badge>
        </div>
        <div>
          <span className="font-semibold">Estatus:</span> <Badge variant={usuario.estatus === 'activo' ? 'success' : 'danger'}>{usuario.estatus}</Badge>
        </div>
        <div>
          <span className="font-semibold">Creado:</span> {new Date(usuario.created_at).toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Actualizado:</span> {new Date(usuario.updated_at).toLocaleString()}
        </div>
      </div>
    </Card>
  );
};

export default UsuarioDetail;
