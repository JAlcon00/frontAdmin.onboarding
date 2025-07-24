import React from 'react';
import { useUsuarioForm } from '../../hook/usuario/useUsuarioForm';
import { Button, ValidationAlert, LoadingSpinner } from '../shared';

const UsuarioForm: React.FC<{ onSubmit?: (data: any) => Promise<boolean>; initialData?: any; mode?: 'create' | 'edit' }> = ({ onSubmit, initialData, mode = 'create' }) => {
  const {
    state,
    setValue,
    setTouched,
    handleSubmit,
    getFieldProps,
    getRoleInfo,
    resetForm
  } = useUsuarioForm({
    initialData,
    mode,
    onSubmit
  });

  const fields = [
    { name: 'nombre', label: 'Nombre', type: 'text', autoComplete: 'given-name' },
    { name: 'apellido', label: 'Apellido', type: 'text', autoComplete: 'family-name' },
    { name: 'username', label: 'Usuario', type: 'text', autoComplete: 'username' },
    { name: 'correo', label: 'Correo', type: 'email', autoComplete: 'email' },
    { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
    { name: 'confirmarPassword', label: 'Confirmar Contraseña', type: 'password', autoComplete: 'new-password' }
  ];

  const roles = [
    { value: 'SUPER', label: 'Super Usuario' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'AUDITOR', label: 'Auditor' },
    { value: 'OPERADOR', label: 'Operador' }
  ];

  const estatusOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'suspendido', label: 'Suspendido' }
  ];

  return (
    <form
      className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 w-full max-w-lg mx-auto"
      onSubmit={async e => {
        e.preventDefault();
        await handleSubmit();
      }}
      autoComplete="off"
    >
      <h2 className="text-xl font-bold mb-6 text-center">{mode === 'edit' ? 'Editar Usuario' : 'Crear Usuario'}</h2>
      {state.errors.general && <ValidationAlert type="error" message={state.errors.general} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.name} className="mb-2">
            <label className="block text-xs font-semibold mb-1" htmlFor={f.name}>{f.label}</label>
            <input
              id={f.name}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              value={getFieldProps(f.name as any).value}
              onChange={e => setValue(f.name as any, e.target.value)}
              onBlur={() => setTouched(f.name)}
              className={`border rounded px-2 py-1 text-sm w-full ${getFieldProps(f.name as any).error ? 'border-red-500' : ''}`}
              required={f.name !== 'password' && f.name !== 'confirmarPassword' ? true : mode === 'create'}
              disabled={state.isSubmitting}
            />
            {getFieldProps(f.name as any).error && (
              <span className="text-xs text-red-500">{getFieldProps(f.name as any).error}</span>
            )}
          </div>
        ))}
        <div className="mb-2">
          <label className="block text-xs font-semibold mb-1" htmlFor="rol">Rol</label>
          <select
            id="rol"
            name="rol"
            value={state.formData.rol}
            onChange={e => setValue('rol', e.target.value)}
            onBlur={() => setTouched('rol')}
            className="border rounded px-2 py-1 text-sm w-full"
            disabled={state.isSubmitting}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 block mt-1">{getRoleInfo(state.formData.rol).description}</span>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-semibold mb-1" htmlFor="estatus">Estatus</label>
          <select
            id="estatus"
            name="estatus"
            value={state.formData.estatus}
            onChange={e => setValue('estatus', e.target.value)}
            onBlur={() => setTouched('estatus')}
            className="border rounded px-2 py-1 text-sm w-full"
            disabled={state.isSubmitting}
          >
            {estatusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-6 justify-end">
        <Button type="button" variant="secondary" onClick={resetForm} disabled={state.isSubmitting}>Limpiar</Button>
        <Button type="submit" variant="primary" disabled={state.isSubmitting || !state.isValid}>
          {state.isSubmitting ? <LoadingSpinner size="sm" /> : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Usuario')}
        </Button>
      </div>
    </form>
  );
};

export default UsuarioForm;
