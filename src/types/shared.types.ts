// Tipos compartidos y constantes del sistema

// Tipos de respuesta comunes
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp?: Date;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: string[];
  code?: string;
  timestamp?: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// Tipos de filtros y ordenamiento
export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Tipos de estados de carga
export interface LoadingState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Tipos de notificaciones
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Tipos de alertas del sistema
export interface SystemAlert {
  id: string;
  type: 'documentos_vencidos' | 'solicitudes_pendientes' | 'sistema_mantenimiento';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  count?: number;
  action?: {
    label: string;
    url: string;
  };
  created_at: Date;
  acknowledged: boolean;
}

// Tipos de métricas y estadísticas
export interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: number[];
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Tipos de configuración
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    tokenExpiry: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    compressionEnabled: boolean;
  };
  notifications: {
    autoCloseDelay: number;
    maxNotifications: number;
  };
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
}

// Tipos de formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  disabled?: boolean;
  hidden?: boolean;
  defaultValue?: any;
  helpText?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Tipos de tablas
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  hidden?: (row: T) => boolean;
}

// Tipos de navegación
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: NavigationItem[];
  badge?: {
    text: string;
    variant: 'primary' | 'secondary' | 'warning' | 'danger';
  };
  requiredPermission?: string;
  requiredRole?: string;
}

// Tipos de breadcrumbs
export interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

// Tipos de archivo
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  url?: string;
  thumbnail?: string;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

// Tipos de búsqueda
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
  suggestions?: string[];
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// Tipos de exportación
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  columns?: string[];
  filters?: Record<string, any>;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Tipos de modo de visualización
export type ViewMode = 'table' | 'cards' | 'list';

// Tipos de tema
export type Theme = 'light' | 'dark' | 'system';

// Tipos de idioma
export type Language = 'es' | 'en';
