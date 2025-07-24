import React, { useState } from 'react';
import { DocumentoList } from './DocumentoList';
import DocumentoStats from './DocumentoStats';
import { DocumentoFilters } from './DocumentoFilters';
import { DocumentoForm } from './DocumentoForm';
import { DocumentoDetail } from './DocumentoDetail';
import { DocumentoValidaciones } from './DocumentoValidaciones';
import { Card, Modal, Button } from '../shared';
import type { Documento as DocumentoType } from '../../types/documento.types';

// Componente principal del módulo de Documentos
const Documento: React.FC = () => {
  // Estado para modales y acciones
  const [modalDetalle, setModalDetalle] = useState<DocumentoType | null>(null);
  const [modalEdit, setModalEdit] = useState<DocumentoType | null>(null);
  const [modalCreate, setModalCreate] = useState(false);
  const [showValidaciones, setShowValidaciones] = useState(false);

  // Simulación de datos (reemplazar por hook real)
  const documentos: DocumentoType[] = [];
  const loading = false;

  // Handlers de acciones
  const handleView = (doc: DocumentoType) => setModalDetalle(doc);
  const handleEdit = (doc: DocumentoType) => setModalEdit(doc);
  const handleDelete = (_id: number) => {
    // Lógica de borrado
  };
  const handleDownload = (_doc: DocumentoType) => {
    // Lógica de descarga
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">Gestión de Documentos</h1>
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button variant="primary" size="sm" onClick={() => setModalCreate(true)}>Nuevo Documento</Button>
          <Button variant={showValidaciones ? 'primary' : 'secondary'} size="sm" onClick={() => setShowValidaciones(v => !v)}>
            {showValidaciones ? 'Ocultar Validaciones' : 'Validaciones'}
          </Button>
        </div>
      </div>

      {/* Estadísticas de documentos */}
      <div className="mb-6">
        <DocumentoStats documentos={documentos} />
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <DocumentoFilters onFiltersChange={() => {}} />
      </div>

      {/* Lista de documentos */}
      <Card className="mt-2 md:mt-0">
        <DocumentoList
          documentos={documentos}
          loading={loading}
          onDocumentoView={handleView}
          onDocumentoEdit={handleEdit}
          onDocumentoDelete={handleDelete}
          onDocumentoDownload={handleDownload}
        />
      </Card>

      {/* Validaciones */}
      {showValidaciones && (
        <div className="mt-8">
          <DocumentoValidaciones />
        </div>
      )}

      {/* Modal Detalle */}
      {modalDetalle && (
        <Modal isOpen onClose={() => setModalDetalle(null)} title="Detalle de Documento">
          <DocumentoDetail documento={modalDetalle} />
        </Modal>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <Modal isOpen onClose={() => setModalEdit(null)} title="Editar Documento">
          <DocumentoForm documento={modalEdit} isEditing onSubmit={() => {}} onCancel={() => setModalEdit(null)} />
        </Modal>
      )}

      {/* Modal Crear */}
      {modalCreate && (
        <Modal isOpen onClose={() => setModalCreate(false)} title="Nuevo Documento">
          <DocumentoForm onSubmit={() => {}} onCancel={() => setModalCreate(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Documento;
