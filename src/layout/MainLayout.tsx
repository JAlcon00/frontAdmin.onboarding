import { useState } from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

interface MainLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  user?: {
    nombre: string;
    rol: string;
    avatar?: string;
  };
}

export function MainLayout({ children, showFooter = true, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header 
        onToggleSidebar={toggleSidebar}
        user={user}
      />

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {/* Área de contenido principal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>

          {/* Footer (opcional) */}
          {showFooter && (
            <Footer className="flex-shrink-0" />
          )}
        </main>
      </div>
    </div>
  );
}

// Layout simplificado sin sidebar para páginas como login
export function SimpleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

// Layout con solo header (para páginas que no necesitan sidebar)
export function HeaderOnlyLayout({ children, user }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
