import { ClienteManager } from '../components/Cliente';
import { MainLayout } from '../layout/MainLayout';

export function ClientePage() {
  return (
    <MainLayout>
      <ClienteManager />
    </MainLayout>
  );
}
