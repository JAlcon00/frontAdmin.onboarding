// Exportar todos los componentes de Cliente
export { Cliente as ClienteManager } from './Cliente';
export { ClienteList } from './ClienteList';
export { ClienteCard } from './ClienteCard';
export { ClienteForm } from './ClienteForm';
export { ClienteDetail } from './ClienteDetail';
export { ClienteStats } from './ClienteStats';
export { ClienteFilters } from './ClienteFilters';
export { ClienteOnboarding } from './ClienteOnboarding';
export { ClienteValidaciones } from './ClienteValidaciones';

// Re-exportar tipos para conveniencia
export type {
  Cliente,
  ClienteCreation,
  ClienteFormData,
  ClienteFilter,
  ClienteStats as ClienteEstadisticas,
  ClienteCompletitud,
  TipoPersona,
  IngresoCliente,
  IngresoClienteCreation
} from '../../types/cliente.types';
