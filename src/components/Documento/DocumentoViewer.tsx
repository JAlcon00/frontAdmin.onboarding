import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PhotoIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Modal } from '../shared/Modal';
import type { Documento, DocumentoTipo } from '../../types/documento.types';

interface DocumentoViewerProps {
  documento: Documento;
  documentoTipo?: DocumentoTipo;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (documento: Documento) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
  className?: string;
}

type ViewMode = 'fit' | 'width' | 'height' | 'actual';

export const DocumentoViewer: React.FC<DocumentoViewerProps> = ({
  documento,
  documentoTipo,
  isOpen,
  onClose,
  onDownload,
  onPrevious,
  onNext,
  showNavigation = false,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Reset state when document changes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setImageError(false);
      setViewMode('fit');
      setZoom(1);
      setIsFullscreen(false);
    }
  }, [documento.documento_id, isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (onNext) onNext();
          break;
        case 'f':
        case 'F':
          setIsFullscreen(!isFullscreen);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          setZoom(1);
          setViewMode('actual');
          break;
        case 'i':
        case 'I':
          setShowInfo(!showInfo);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, onPrevious, onNext, showInfo]);

  // Determine file type
  const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'unknown' => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return 'image';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return 'document';
    }
    return 'unknown';
  };

  const fileType = getFileType(documento.archivo_url);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
    setViewMode('actual');
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
    setViewMode('actual');
  };

  const handleZoomReset = () => {
    setZoom(1);
    setViewMode('fit');
  };

  // View mode controls (comentado por ahora)
  // const handleViewModeChange = (mode: ViewMode) => {
  //   setViewMode(mode);
  //   if (mode !== 'actual') {
  //     setZoom(1);
  //   }
  // };

  // Format file size (comentado por ahora)
  // const formatFileSize = (bytes: number): string => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptado': return 'success';
      case 'rechazado': return 'danger';
      case 'vencido': return 'warning';
      default: return 'secondary';
    }
  };

  // Render image viewer
  const renderImageViewer = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}
      
      {imageError ? (
        <div className="text-center text-white">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Error al cargar la imagen</p>
          <p className="text-sm text-gray-400">
            El archivo podría estar dañado o no disponible
          </p>
        </div>
      ) : (
        <img
          src={documento.archivo_url}
          alt={`Documento ${documento.documento_id}`}
          className={`
            max-w-full max-h-full object-contain transition-transform duration-200
            ${viewMode === 'width' ? 'w-full h-auto' : ''}
            ${viewMode === 'height' ? 'w-auto h-full' : ''}
            ${viewMode === 'actual' ? '' : ''}
          `}
          style={{
            transform: viewMode === 'actual' ? `scale(${zoom})` : undefined
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );

  // Render PDF viewer
  const renderPdfViewer = () => (
    <div className="w-full h-full">
      <iframe
        src={documento.archivo_url}
        className="w-full h-full border-0"
        title={`PDF Documento ${documento.documento_id}`}
      />
    </div>
  );

  // Render document preview
  const renderDocumentPreview = () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <DocumentTextIcon className="h-24 w-24 mx-auto text-gray-400 mb-6" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Vista previa no disponible
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Este tipo de documento no se puede previsualizar en el navegador
        </p>
        {onDownload && (
          <Button
            variant="primary"
            onClick={() => onDownload(documento)}
            leftIcon={ArrowDownTrayIcon}
          >
            Descargar documento
          </Button>
        )}
      </div>
    </div>
  );

  // Render unknown file type
  const renderUnknownFile = () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <ExclamationTriangleIcon className="h-24 w-24 mx-auto text-gray-400 mb-6" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tipo de archivo no compatible
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          No se puede mostrar una vista previa de este archivo
        </p>
        {onDownload && (
          <Button
            variant="primary"
            onClick={() => onDownload(documento)}
            leftIcon={ArrowDownTrayIcon}
          >
            Descargar archivo
          </Button>
        )}
      </div>
    </div>
  );

  // Render content based on file type
  const renderContent = () => {
    switch (fileType) {
      case 'image':
        return renderImageViewer();
      case 'pdf':
        return renderPdfViewer();
      case 'document':
        return renderDocumentPreview();
      default:
        return renderUnknownFile();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size={isFullscreen ? 'full' : 'xl'}
      className={className}
      showCloseButton={false}
    >
      <div className="relative w-full h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {fileType === 'image' ? (
                <PhotoIcon className="h-6 w-6 text-gray-500" />
              ) : (
                <DocumentTextIcon className="h-6 w-6 text-gray-500" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {documentoTipo?.nombre || 'Documento'}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {documento.documento_id}
                </p>
              </div>
            </div>
            
            <Badge variant={getStatusColor(documento.estatus)}>
              {documento.estatus}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Navigation */}
            {showNavigation && (
              <>
                {onPrevious && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevious}
                    leftIcon={ChevronLeftIcon}
                  >
                    Anterior
                  </Button>
                )}
                {onNext && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNext}
                    rightIcon={ChevronRightIcon}
                  >
                    Siguiente
                  </Button>
                )}
              </>
            )}

            {/* Controls for images */}
            {fileType === 'image' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.25}
                >
                  <MagnifyingGlassMinusIcon className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-gray-500 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                >
                  <MagnifyingGlassPlusIcon className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomReset}
                  title="Ajustar a ventana"
                >
                  Ajustar
                </Button>
              </>
            )}

            {/* Info button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              title="Información del documento"
            >
              <InformationCircleIcon className="h-4 w-4" />
            </Button>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" />
              )}
            </Button>

            {/* Download */}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(documento)}
                title="Descargar"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
            )}

            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Cerrar"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {renderContent()}

          {/* Document info overlay */}
          {showInfo && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Información del Documento
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="text-gray-900">{documentoTipo?.nombre || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado:</span>
                  <Badge variant={getStatusColor(documento.estatus)} size="sm">
                    {documento.estatus}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha documento:</span>
                  <span className="text-gray-900">
                    {formatDate(documento.fecha_documento)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha subida:</span>
                  <span className="text-gray-900">
                    {formatDate(documento.fecha_subida)}
                  </span>
                </div>
                
                {documento.fecha_expiracion && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expira:</span>
                    <span className="text-gray-900">
                      {formatDate(documento.fecha_expiracion)}
                    </span>
                  </div>
                )}
                
                {documento.comentario_revisor && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">Comentarios:</span>
                    <p className="text-gray-900 text-xs break-words">
                      {documento.comentario_revisor}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts help */}
        {isFullscreen && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <span>ESC: Cerrar</span>
              <span>F: Pantalla completa</span>
              <span>←→: Navegar</span>
              <span>+/-: Zoom</span>
              <span>0: Ajustar</span>
              <span>I: Info</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentoViewer;
