// Componentes del módulo de Documentos
export { DocumentoCard } from './DocumentoCard';
export { DocumentoList } from './DocumentoList';
export { DocumentoFilters } from './DocumentoFilters';
export { DocumentoForm } from './DocumentoForm';
export { DocumentoDetail } from './DocumentoDetail';
export { DocumentoStats as DocumentoStatsComponent } from './DocumentoStats';
export { DocumentoUpload as DocumentoUploadComponent } from './DocumentoUpload';
export { DocumentoValidaciones } from './DocumentoValidaciones';
export { DocumentoViewer } from './DocumentoViewer';
export { DocumentoRevision as DocumentoRevisionComponent } from './DocumentoRevision';


// Re-exportar tipos principales
export type {
  Documento as DocumentoType,
  DocumentoTipo,
  DocumentoCreation,
  DocumentoUpdate,
  DocumentoFilter,
  DocumentoStats,
  DocumentoRequerido,
  DocumentoCompletitud,
  DocumentoValidation,
  DocumentoRevision,
  DocumentoAlerta,
  DocumentoUpload,
  DocumentoUploadResponse,
  DocumentoMasivo,
  DocumentoMasivoResponse,
  EstatusDocumento
} from '../../types/documento.types';
