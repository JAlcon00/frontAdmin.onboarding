//Implemeentación de la lista de usuarios 
/*
Se importara el hook de usuarios y los componentes necesarios para mostrar la lista de usuarios.
*/
import React, { useState } from 'react';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';
import UsuarioActions from './UsuarioActions';
import UsuarioDetail from './UsuarioDetail';
import UsuarioPasswordModal from './UsuarioPasswordModal';


const UsuarioList: React.FC = () => {
    const { state } = useUsuarioManager({ autoLoad: true });
    const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);


    const handleView = (userId: number) => {
        setSelectedUsuarioId(userId);
        setShowDetail(true);
    };

    const handleCloseDetail = () => {
        setShowDetail(false);
        setSelectedUsuarioId(null);
    };

    const handlePasswordChange = (userId: number) => {
        setSelectedUsuarioId(userId);
        setShowPasswordModal(true);
    };

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedUsuarioId(null);
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Lista de Usuarios</h2>
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border-b">ID</th>
                        <th className="px-4 py-2 border-b">Nombre</th>
                        <th className="px-4 py-2 border-b">Usuario</th>
                        <th className="px-4 py-2 border-b">Correo</th>
                        <th className="px-4 py-2 border-b">Rol</th>
                        <th className="px-4 py-2 border-b">Estatus</th>
                        <th className="px-4 py-2 border-b">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {state.usuarios.map(usuario => (
                        <tr key={usuario.usuario_id}>
                            <td className="px-4 py-2 border-b">{usuario.usuario_id}</td>
                            <td className="px-4 py-2 border-b">{usuario.nombre} {usuario.apellido}</td>
                            <td className="px-4 py-2 border-b">{usuario.username}</td>
                            <td className="px-4 py-2 border-b">{usuario.correo}</td>
                            <td className="px-4 py-2 border-b">{usuario.rol}</td>
                            <td className="px-4 py-2 border-b">{usuario.estatus}</td>
                            <td className="px-4 py-2 border-b">
                                <UsuarioActions usuarioId={usuario.usuario_id} />
                                <button
                                    onClick={() => handleView(usuario.usuario_id)}
                                    className="text-blue-500 hover:text-blue-700 ml-2"
                                >
                                    Ver
                                </button>
                                <button
                                    onClick={() => handlePasswordChange(usuario.usuario_id)}
                                    className="text-green-500 hover:text-green-700 ml-2"
                                >
                                    Cambiar Contraseña
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal de detalle de usuario */}
            

            {/* Modal de cambio/restauración de contraseña */}
            
        </div>
    );
                                
};

export default UsuarioList;