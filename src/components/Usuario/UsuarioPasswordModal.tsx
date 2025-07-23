import React from 'react';
import { useUsuarioForm } from '../../hook/usuario/useUsuarioForm';

interface UsuarioPasswordModalProps {
  usuarioId: number;
  open: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void;
  cambiarPassword: (usuarioId: number, passwordActual: string, passwordNuevo: string) => Promise<boolean>;
  resetearPassword: (usuarioId: number) => Promise<string>;
}

const UsuarioPasswordModal: React.FC<UsuarioPasswordModalProps> = ({
  usuarioId,
  open,
  onClose,
  onPasswordChanged,
  cambiarPassword,
  resetearPassword
}) => {
  const {
    state,
    setValue,
    setTouched,
    getFieldProps,
    handleSubmit,
    resetForm
  } = useUsuarioForm({
    mode: 'password',
    onSubmit: async (data) => {
      const { passwordActual, passwordNuevo } = data as import('../../hook/usuario/useUsuarioForm').PasswordFormData;
      const ok = await cambiarPassword(usuarioId, passwordActual, passwordNuevo);
      if (ok) {
        onPasswordChanged?.();
        onClose();
      }
      return ok;
    }
  });

  const [resetResult, setResetResult] = React.useState<string | null>(null);
  const [resetLoading, setResetLoading] = React.useState(false);

  const handleResetPassword = async () => {
    setResetLoading(true);
    try {
      const tempPassword = await resetearPassword(usuarioId);
      setResetResult(tempPassword);
    } catch (e) {
      setResetResult('Error al resetear la contraseña');
    } finally {
      setResetLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-bold mb-4">Restaurar/Cambiar Contraseña</h2>
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña actual</label>
            <input
              type="password"
              className="border rounded px-2 py-1 w-full"
              {...getFieldProps('passwordActual')}
              onChange={e => setValue('passwordActual', e.target.value)}
              onBlur={() => setTouched('passwordActual')}
            />
            {state.errors.passwordActual && <span className="text-red-500 text-xs">{state.errors.passwordActual}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input
              type="password"
              className="border rounded px-2 py-1 w-full"
              {...getFieldProps('passwordNuevo')}
              onChange={e => setValue('passwordNuevo', e.target.value)}
              onBlur={() => setTouched('passwordNuevo')}
            />
            {state.errors.passwordNuevo && <span className="text-red-500 text-xs">{state.errors.passwordNuevo}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="border rounded px-2 py-1 w-full"
              {...getFieldProps('confirmarPassword')}
              onChange={e => setValue('confirmarPassword', e.target.value)}
              onBlur={() => setTouched('confirmarPassword')}
            />
            {state.errors.confirmarPassword && <span className="text-red-500 text-xs">{state.errors.confirmarPassword}</span>}
          </div>
          {state.errors.general && <div className="text-red-600 text-sm">{state.errors.general}</div>}
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={state.isSubmitting}
            >
              Cambiar contraseña
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              onClick={resetForm}
              disabled={state.isSubmitting}
            >
              Limpiar
            </button>
          </div>
        </form>
        <div className="my-4 border-t pt-4">
          <button
            type="button"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            Restaurar contraseña (genera temporal)
          </button>
          {resetResult && (
            <div className="mt-2 text-sm text-green-700 break-all">
              Contraseña temporal: <span className="font-mono">{resetResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsuarioPasswordModal;
