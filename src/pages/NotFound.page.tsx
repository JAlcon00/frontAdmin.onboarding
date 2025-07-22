import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mt-2">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Link>
          
          <div className="text-sm text-gray-500">
            <button 
              onClick={() => window.history.back()} 
              className="text-blue-600 hover:text-blue-500"
            >
              ← Volver atrás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
