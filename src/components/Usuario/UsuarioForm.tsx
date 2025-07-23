
import React from 'react';
import { useUsuarioForm } from '../../hook/usuario/useUsuarioForm';

interface UsuarioFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<import('../../hook/usuario/useUsuarioManager').Usuario>;
  onSubmit: (data: any) => Promise<boolean>;
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({ mode = 'create', initialData, onSubmit }) => {
  const {
    state,
    setValue,
    setTouched,
    getFieldProps,
    handleSubmit,
    resetForm,
  } = useUsuarioForm({
    mode,
    initialData,
    onSubmit,
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValue(field as any, e.target.value);
  };

  const handleBlur = (field: string) => () => setTouched(field);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  return (
    <form className="space-y-4 max-w-md" onSubmit={submitForm}>
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('nombre')}
          onChange={handleInputChange('nombre')}
          onBlur={handleBlur('nombre')}
        />
        {state.errors.nombre && <span className="text-red-500 text-xs">{state.errors.nombre}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Apellido</label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('apellido')}
          onChange={handleInputChange('apellido')}
          onBlur={handleBlur('apellido')}
        />
        {state.errors.apellido && <span className="text-red-500 text-xs">{state.errors.apellido}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Usuario</label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('username')}
          onChange={handleInputChange('username')}
          onBlur={handleBlur('username')}
        />
        {state.errors.username && <span className="text-red-500 text-xs">{state.errors.username}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          type="email"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('correo')}
          onChange={handleInputChange('correo')}
          onBlur={handleBlur('correo')}
        />
        {state.errors.correo && <span className="text-red-500 text-xs">{state.errors.correo}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rol</label>
        <select
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('rol')}
          onChange={handleInputChange('rol')}
          onBlur={handleBlur('rol')}
        >
          <option value="SUPER">Super Usuario</option>
          <option value="ADMIN">Administrador</option>
          <option value="AUDITOR">Auditor</option>
          <option value="OPERADOR">Operador</option>
        </select>
        {state.errors.rol && <span className="text-red-500 text-xs">{state.errors.rol}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estatus</label>
        <select
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('estatus')}
          onChange={handleInputChange('estatus')}
          onBlur={handleBlur('estatus')}
        >
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
        </select>
        {state.errors.estatus && <span className="text-red-500 text-xs">{state.errors.estatus}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('password')}
          onChange={handleInputChange('password')}
          onBlur={handleBlur('password')}
        />
        {state.errors.password && <span className="text-red-500 text-xs">{state.errors.password}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
        <input
          type="password"
          className="border rounded px-2 py-1 w-full"
          {...getFieldProps('confirmarPassword')}
          onChange={handleInputChange('confirmarPassword')}
          onBlur={handleBlur('confirmarPassword')}
        />
        {state.errors.confirmarPassword && <span className="text-red-500 text-xs">{state.errors.confirmarPassword}</span>}
      </div>
      {state.errors.general && <div className="text-red-600 text-sm">{state.errors.general}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={state.isSubmitting}
        >
          {mode === 'edit' ? 'Actualizar' : 'Crear'}
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
  );
};

export default UsuarioForm;
