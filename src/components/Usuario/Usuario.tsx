import React, { useState } from 'react';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';
import UsuarioList from './UsuarioList';
import type { UsuarioActionHandlers } from './UsuarioList';
import UsuarioCard from './UsuarioCard';
import UsuarioFilter from './UsuarioFilter';
import UsuarioForm from './UsuarioForm';
import UsuarioDetail from './UsuarioDetail';
import UsuarioPasswordModal from './UsuarioPasswordModal';
import UsuarioStats from './UsuarioStats';
import { Modal, Button, Card } from '../shared';

const Usuario: React.FC = () => {
  const { state, crearUsuario, actualizarUsuario, eliminarUsuario, refrescarLista } = useUsuarioManager();
  const { usuarios, loading } = state;

  // Estado para modales
  const [modalDetalle, setModalDetalle] = useState<null | number>(null);
  const [modalPassword, setModalPassword] = useState<null | { id: number; username: string }>(null);
  const [modalEdit, setModalEdit] = useState<null | any>(null);
  const [modalCreate, setModalCreate] = useState(false);
  const [vistaCards, setVistaCards] = useState(false);

  // Handlers de acciones
  const actions: UsuarioActionHandlers = {
    onVerDetalle: usuario => setModalDetalle(usuario.usuario_id),
    onEditar: usuario => setModalEdit(usuario),
    onResetPassword: usuario => setModalPassword({ id: usuario.usuario_id, username: usuario.username }),
    onEliminar: async usuario => {
      if (window.confirm(`¿Eliminar usuario ${usuario.username}?`)) {
        await eliminarUsuario(usuario.usuario_id);
        refrescarLista();
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">Gestión de Usuarios</h1>
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button variant={vistaCards ? 'secondary' : 'primary'} size="sm" onClick={() => setVistaCards(false)}>Tabla</Button>
          <Button variant={vistaCards ? 'primary' : 'secondary'} size="sm" onClick={() => setVistaCards(true)}>Cards</Button>
          <Button variant="success" size="sm" onClick={() => setModalCreate(true)}>Nuevo Usuario</Button>
        </div>
      </div>

      {/* Estadísticas de usuarios */}
      <div className="mb-6">
        <UsuarioStats />
      </div>

      <div className="mb-4">
        <UsuarioFilter />
      </div>

      <Card className="mt-2 md:mt-0">
        {vistaCards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map(usuario => (
              <UsuarioCard key={usuario.usuario_id} usuario={usuario} actions={actions} />
            ))}
            {loading && <div className="col-span-full text-center py-4">Cargando usuarios...</div>}
            {!loading && usuarios.length === 0 && <div className="col-span-full text-center py-4 text-gray-500">No hay usuarios para mostrar.</div>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <UsuarioList usuarios={usuarios} actions={actions} loading={loading} />
          </div>
        )}
      </Card>

      {/* Modal Detalle */}
      {modalDetalle !== null && (
        <Modal isOpen onClose={() => setModalDetalle(null)} title="Detalle de Usuario">
          <UsuarioDetail usuarioId={modalDetalle} />
        </Modal>
      )}

      {/* Modal Reset Password */}
      {modalPassword && (
        <UsuarioPasswordModal
          isOpen={!!modalPassword}
          onClose={() => setModalPassword(null)}
          usuarioId={modalPassword.id}
          username={modalPassword.username}
        />
      )}

      {/* Modal Editar Usuario */}
      {modalEdit && (
        <Modal isOpen onClose={() => setModalEdit(null)} title="Editar Usuario">
          <UsuarioForm
            mode="edit"
            initialData={modalEdit}
            onSubmit={async data => {
              await actualizarUsuario(modalEdit.usuario_id, data);
              setModalEdit(null);
              refrescarLista();
              return true;
            }}
          />
        </Modal>
      )}

      {/* Modal Crear Usuario */}
      {modalCreate && (
        <Modal isOpen onClose={() => setModalCreate(false)} title="Nuevo Usuario">
          <UsuarioForm
            mode="create"
            onSubmit={async data => {
              await crearUsuario(data);
              setModalCreate(false);
              refrescarLista();
              return true;
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default Usuario;
