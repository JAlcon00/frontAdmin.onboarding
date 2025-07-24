import React, { useState } from 'react';
import { useAuth } from '../../hook/usuario/useAuth';
import { Button, ValidationAlert, LoadingSpinner } from '../shared';

const Auth: React.FC = () => {
  const { state, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', rememberMe: false });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    await login({
      username: form.username,
      password: form.password,
      rememberMe: form.rememberMe
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        {state.error && submitted && (
          <ValidationAlert type="error" message={state.error} />
        )}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-6 flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={form.rememberMe}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-700 dark:text-gray-200">Recordarme</label>
        </div>
        <div className="flex items-center justify-between">
          <Button type="submit" className="w-full" disabled={state.loginInProgress}>
            {state.loginInProgress ? <LoadingSpinner size="sm" /> : 'Entrar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Auth;
