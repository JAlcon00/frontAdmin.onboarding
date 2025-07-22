import React, { useState } from 'react';
import {
  Button,
  LoadingSpinner,
  LoadingOverlay,
  LoadingSkeleton,
  Modal,
  useModal,
  ConfirmModal,
  Badge,
  CountBadge,
  IconBadge,
  StatusBadge,
  Card,
  CardWithHeader,
  StatCard,
  EmptyCard,
  ValidationAlert,
  ThemeToggle
} from '../shared';
import {
  PlusIcon,
  UserIcon,
  DocumentIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * Componente de demostración para mostrar todos los componentes compartidos
 * Este archivo puede usarse como referencia y guía de implementación
 */
export const SharedComponentsDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const confirmModal = useModal();

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Componentes Compartidos - Demo
          </h1>
          <p className="text-gray-600">
            Biblioteca completa de componentes UI reutilizables
          </p>
        </div>

        {/* Theme Toggle */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Theme Toggle</h2>
            <ThemeToggle />
          </div>
        </Card>

        {/* Buttons */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button loading={loading} onClick={handleLoadingDemo}>
              {loading ? 'Cargando...' : 'Test Loading'}
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button size="xs" variant="primary">Extra Small</Button>
            <Button size="sm" variant="primary">Small</Button>
            <Button size="md" variant="primary">Medium</Button>
            <Button size="lg" variant="primary">Large</Button>
            <Button size="xl" variant="primary">Extra Large</Button>
          </div>

          <div className="mt-4">
            <Button 
              variant="primary" 
              leftIcon={PlusIcon}
              rightIcon={UserIcon}
              fullWidth
            >
              With Icons
            </Button>
          </div>
        </Card>

        {/* Loading Components */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Loading Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="text-sm mt-2">Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-sm mt-2">Medium</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm mt-2">Large</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-sm mt-2">Extra Large</p>
            </div>
          </div>

          <div className="mb-4">
            <Button onClick={handleOverlayDemo}>
              Show Loading Overlay
            </Button>
          </div>

          <div>
            <h3 className="font-medium mb-2">Loading Skeleton:</h3>
            <LoadingSkeleton lines={3} />
          </div>
        </Card>

        {/* Badges */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Badges</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="primary" outline>Outline Primary</Badge>
              <Badge variant="success" outline>Outline Success</Badge>
              <Badge variant="danger" outline>Outline Danger</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <CountBadge count={5} />
              <CountBadge count={125} max={99} />
              <CountBadge count={0} showZero />
            </div>

            <div className="flex flex-wrap gap-2">
              <IconBadge icon={UserIcon} variant="primary" />
              <IconBadge icon={DocumentIcon} variant="success" />
              <IconBadge icon={ChartBarIcon} variant="warning" />
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status="active" />
              <StatusBadge status="pending" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
              <StatusBadge status="completed" />
              <StatusBadge status="cancelled" />
            </div>
          </div>
        </Card>

        {/* Modals */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Modals</h2>
          <div className="space-x-4">
            <Button onClick={openModal}>Open Modal</Button>
            <Button onClick={confirmModal.openModal} variant="danger">
              Open Confirm Modal
            </Button>
          </div>
        </Card>

        {/* Cards */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card shadow="md" hover>
              <h3 className="font-semibold mb-2">Basic Card</h3>
              <p className="text-gray-600">This is a basic card with hover effect.</p>
            </Card>

            <CardWithHeader
              header={<h3 className="font-semibold">Card with Header</h3>}
              footer={<Button size="sm">Action</Button>}
            >
              <p className="text-gray-600">Card content goes here.</p>
            </CardWithHeader>

            <StatCard
              title="Total Users"
              value="1,234"
              subtitle="+20% from last month"
              icon={UserIcon}
              trend={{ value: 20, isPositive: true }}
              color="blue"
            />

            <EmptyCard
              icon={ExclamationTriangleIcon}
              title="No Data Available"
              description="There's no data to display at the moment."
              action={<Button size="sm">Add Data</Button>}
            />
          </div>
        </Card>

        {/* Validation Alerts */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Validation Alerts</h2>
          <div className="space-y-4">
            <ValidationAlert
              type="info"
              message="Información importante"
              details={["Detalle 1", "Detalle 2"]}
            />
            <ValidationAlert
              type="success"
              message="Operación exitosa"
            />
            <ValidationAlert
              type="warning"
              message="Advertencia del sistema"
              details={["Revisa la configuración", "Verifica los datos"]}
            />
            <ValidationAlert
              type="error"
              message="Error crítico"
              details={["Error de conexión", "Timeout de respuesta"]}
            />
          </div>
        </Card>

        {/* Modals */}
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title="Demo Modal"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={closeModal}>
                Aceptar
              </Button>
            </>
          }
        >
          <p>Este es el contenido del modal de demostración.</p>
          <p className="mt-2">Puedes incluir cualquier contenido aquí.</p>
        </Modal>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={confirmModal.closeModal}
          onConfirm={() => alert('Confirmado!')}
          title="Confirmar Acción"
          message="¿Estás seguro de que quieres realizar esta acción?"
          type="danger"
          confirmText="Sí, confirmar"
          cancelText="Cancelar"
        />

        <LoadingOverlay 
          show={showOverlay} 
          message="Procesando solicitud..." 
        />
      </div>
    </div>
  );
};

export default SharedComponentsDemo;
