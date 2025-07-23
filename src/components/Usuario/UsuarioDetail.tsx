
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';


const UsuarioDetail: React.FC = () => {
  const { usuarioId } = useParams<{ usuarioId: string }>();

  const { obtenerUsuario } = useUsuarioManager({ autoLoad: false });
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    if (usuarioId) {
      const id = parseInt(usuarioId, 10);
      obtenerUsuario(id).then((data) => {
        setUsuario(data);
      });
    }
  }, [usuarioId, obtenerUsuario]);

  if (!usuario) return <div>Cargando...</div>;

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-2">Detalle del Usuario</h2>
      <p><strong>ID:</strong> {usuario.usuario_id}</p>
      <p><strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}</p>
      <p><strong>Usuario:</strong> {usuario.username}</p>
      <p><strong>Correo:</strong> {usuario.correo}</p>
      <p><strong>Rol:</strong> {usuario.rol}</p>
      <p><strong>Estatus:</strong> {usuario.estatus}</p>
      <p><strong>Creado:</strong> {usuario.created_at}</p>
      <p><strong>Actualizado:</strong> {usuario.updated_at}</p>
    </div>
  );
};

export default UsuarioDetail;
