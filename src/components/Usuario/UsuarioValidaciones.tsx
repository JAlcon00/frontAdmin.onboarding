import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button, Badge, Card, LoadingSpinner, ValidationAlert } from '../shared';
import { useUsuarioManager } from '../../hook/usuario';
import { useUsuarioValidation } from '../../hook/usuario/useUsuarioValidation';

// Componente principal de validaciones de usuario
const UsuarioValidaciones: React.FC = () => {
  const { state } = useUsuarioManager();
  const { usuarios, loading } = state;
  const {
    validateUserBatch,
    getValidationSummary,
    exportValidationResults
  } = useUsuarioValidation();

  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<Map<number, any>>(new Map());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && usuarios && usuarios.length > 0) {
      setProcessing(true);
      // Adaptar fechas a tipo Date para validación
      const usuariosAdaptados = usuarios.map(u => ({
        ...u,
        created_at: new Date(u.created_at),
        updated_at: new Date(u.updated_at),
      }));
      validateUserBatch(usuariosAdaptados).then(results => {
        setBatchResults(results);
        getValidationSummary(usuariosAdaptados).then(setSummary);
        setProcessing(false);
      });
    }
  }, [usuarios, loading, validateUserBatch, getValidationSummary]);

  if (loading || processing) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-500">Validando usuarios...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
          Validación de Usuarios
        </h2>
        <Button size="sm" onClick={() => setShowSummary(s => !s)}>
          {showSummary ? 'Ocultar resumen' : 'Ver resumen'}
        </Button>
      </div>

      {showSummary && summary && (
        <div className="mb-4">
          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="font-semibold mb-2">Resumen de validación</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <Badge variant="primary">Total: {summary.totalUsers}</Badge>
              <Badge variant="success">Válidos: {summary.validUsers}</Badge>
              <Badge variant="danger">Errores: {summary.usersWithErrors}</Badge>
              <Badge variant="warning">Advertencias: {summary.usersWithWarnings}</Badge>
            </div>
            {summary.commonIssues && summary.commonIssues.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Problemas más comunes:</div>
                <ul className="list-disc pl-5 text-sm">
                  {summary.commonIssues.map((issue: any, idx: number) => (
                    <li key={idx}>
                      {issue.issue} <span className="text-xs text-gray-500">({issue.count} usuarios)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Validación</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {usuarios && usuarios.length > 0 && usuarios.map(user => {
              const result = batchResults.get(user.usuario_id);
              return (
                <tr key={user.usuario_id}>
                  <td className="px-2 py-2 text-xs">{user.usuario_id}</td>
                  <td className="px-2 py-2 text-xs">{user.username}</td>
                  <td className="px-2 py-2 text-xs">{user.correo}</td>
                  <td className="px-2 py-2 text-xs">{user.rol}</td>
                  <td className="px-2 py-2 text-xs">{user.estatus}</td>
                  <td className="px-2 py-2">
                    {result ? (
                      <div className="space-y-1">
                        {result.isValid && result.warnings.length === 0 && (
                          <ValidationAlert type="success" message="Válido" size="sm" dismissible={false} />
                        )}
                        {result.errors.length > 0 && (
                          <ValidationAlert
                            type="error"
                            message={`Errores: ${result.errors.length}`}
                            details={result.errors.map((e: any) => `${e.field}: ${e.message}`)}
                            size="sm"
                            dismissible={false}
                          />
                        )}
                        {result.warnings.length > 0 && (
                          <ValidationAlert
                            type="warning"
                            message={`Advertencias: ${result.warnings.length}`}
                            details={result.warnings.map((w: any) => `${w.field}: ${w.message}`)}
                            size="sm"
                            dismissible={false}
                          />
                        )}
                        {result.suggestions.length > 0 && (
                          <ValidationAlert
                            type="info"
                            message={`Sugerencias: ${result.suggestions.length}`}
                            details={result.suggestions.map((s: any) => `${s.field}: ${s.suggestion}`)}
                            size="sm"
                            dismissible={false}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin datos</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => {
          const blob = new Blob([exportValidationResults()], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `usuarios-validacion-${new Date().toISOString()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          Exportar resultados
        </Button>
      </div>
    </Card>
  );
};

export default UsuarioValidaciones;
