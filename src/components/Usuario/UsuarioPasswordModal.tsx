
import React, { useState } from 'react';
import { Modal, Button, LoadingSpinner, ValidationAlert } from '../shared';
import { useUsuarioManager } from '../../hook/usuario';

interface UsuarioPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioId: number | null;
  username?: string;
}

const UsuarioPasswordModal: React.FC<UsuarioPasswordModalProps> = ({ isOpen, onClose, usuarioId, username }) => {
  const { resetearPassword } = useUsuarioManager();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    setTempPassword(null);
    try {
      const password = await resetearPassword(usuarioId);
      setTempPassword(password);
    } catch (err: any) {
      setError(err.message || 'Error al recuperar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Recuperar contraseña${username ? ` de ${username}` : ''}`}> 
      <div className="py-2">
        <p className="mb-2 text-sm text-gray-600">¿Deseas generar una nueva contraseña temporal para este usuario?</p>
        {error && <ValidationAlert type="error" message={error} size="sm" />}
        {tempPassword && (
          <div className="my-3">
            <ValidationAlert type="success" message="Contraseña temporal generada:" details={[tempPassword]} size="md" dismissible={false} />
            <div className="mt-2 text-xs text-gray-500">Copia y entrega esta contraseña al usuario. Se le pedirá cambiarla al iniciar sesión.</div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="primary" onClick={handleResetPassword} loading={loading} disabled={loading || !!tempPassword}>
          {loading ? <LoadingSpinner size="sm" /> : 'Generar contraseña'}
        </Button>
      </div>
    </Modal>
  );
};

export default UsuarioPasswordModal;
