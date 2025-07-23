
import React, { useState } from 'react';
import { useUsuarioValidation } from '../../hook/usuario/useUsuarioValidation';
import { useUsuarioManager } from '../../hook/usuario/useUsuarioManager';

const UsuarioValidaciones: React.FC = () => {
  const { state: usuarioState } = useUsuarioManager({ autoLoad: true });
  const { validateUser, getValidationSummary } = useUsuarioValidation();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userValidation, setUserValidation] = useState<any>(null);
  const [batchSummary, setBatchSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  const handleValidateUser = async (userId: number) => {
    setLoading(true);
    const user = usuarioState.usuarios.find(u => u.usuario_id === userId);
    if (user) {
      // Adaptar campos para validación tipada
      const userForValidation = {
        ...user,
        password_hash: '',
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at)
      };
      const result = await validateUser(userForValidation);
      setUserValidation(result);
      setSelectedUserId(userId);
    }
    setLoading(false);
  };

  const handleBatchValidation = async () => {
    setLoading(true);
    // Adaptar campos para validación tipada
    const usuariosForValidation = usuarioState.usuarios.map(u => ({
      ...u,
      password_hash: '',
      created_at: new Date(u.created_at),
      updated_at: new Date(u.updated_at)
    }));
    const summary = await getValidationSummary(usuariosForValidation);
    setBatchSummary(summary);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Validaciones de Usuarios</h2>
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          onClick={handleBatchValidation}
          disabled={loading}
        >
          Validar todos los usuarios
        </button>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Validar usuario individual</h3>
        <select
          className="border rounded px-2 py-1 mr-2"
          value={selectedUserId || ''}
          onChange={e => handleValidateUser(Number(e.target.value))}
        >
          <option value="">Selecciona un usuario</option>
          {usuarioState.usuarios.map(u => (
            <option key={u.usuario_id} value={u.usuario_id}>
              {u.nombre} {u.apellido} ({u.username})
            </option>
          ))}
        </select>
      </div>
      {userValidation && selectedUserId && (
        <div className="mb-6 border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Resultado de validación para usuario #{selectedUserId}</h4>
          {userValidation.isValid ? (
            <div className="text-green-700">Usuario válido</div>
          ) : (
            <div className="text-red-700">Usuario con errores</div>
          )}
          {userValidation.errors.length > 0 && (
            <ul className="text-red-600 text-sm mt-2">
              {userValidation.errors.map((err: any, idx: number) => (
                <li key={idx}>{err.field}: {err.message}</li>
              ))}
            </ul>
          )}
          {userValidation.warnings.length > 0 && (
            <ul className="text-yellow-600 text-sm mt-2">
              {userValidation.warnings.map((warn: any, idx: number) => (
                <li key={idx}>{warn.field}: {warn.message}</li>
              ))}
            </ul>
          )}
          {userValidation.suggestions.length > 0 && (
            <ul className="text-blue-600 text-sm mt-2">
              {userValidation.suggestions.map((sug: any, idx: number) => (
                <li key={idx}>{sug.field}: {sug.suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {batchSummary && (
        <div className="border rounded p-4 bg-gray-100">
          <h4 className="font-semibold mb-2">Resumen de validación masiva</h4>
          <div>Total de usuarios: {batchSummary.totalUsers}</div>
          <div>Usuarios válidos: {batchSummary.validUsers}</div>
          <div>Usuarios con errores: {batchSummary.usersWithErrors}</div>
          <div>Usuarios con advertencias: {batchSummary.usersWithWarnings}</div>
          {batchSummary.commonIssues && batchSummary.commonIssues.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold">Problemas comunes:</div>
              <ul className="list-disc ml-6">
                {batchSummary.commonIssues.map((issue: any, idx: number) => (
                  <li key={idx}>{issue.issue} (Afecta a {issue.count} usuarios)</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsuarioValidaciones;
