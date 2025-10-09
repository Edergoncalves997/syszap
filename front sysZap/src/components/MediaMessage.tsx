import React, { useState } from 'react';
import { Download, Eye, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import MediaService from '../services/mediaService';

interface MediaMessageProps {
  media: {
    Id: string;
    Mime_Type: string;
    Storage_Key: string;
    Size_Bytes?: number;
  };
  caption?: string;
  direction: number; // 0=received, 1=sent
}

const MediaMessage: React.FC<MediaMessageProps> = ({ media, caption }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Gerar URL de dados
  const dataUrl = MediaService.createDataUrl(media.Mime_Type, media.Storage_Key);

  // Download da mídia
  const handleDownload = () => {
    MediaService.downloadMedia({
      id: media.Id,
      mimeType: media.Mime_Type,
      dataUrl,
      size: media.Size_Bytes,
      name: `media_${media.Id}`
    });
  };

  // Tratar erro de mídia
  const handleMediaError = (error: any) => {
    console.error('Erro ao carregar mídia:', error);
    setHasError(true);
    setErrorMessage(MediaService.getErrorMessage(error));
  };

  // Renderizar por tipo de mídia
  const renderMedia = () => {
    // Se houve erro, mostrar mensagem de erro
    if (hasError) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-red-100 rounded-lg">
          <div className="p-2 bg-red-500 text-white rounded-lg">
            ⚠️
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Erro ao carregar mídia</p>
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
            }}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Tentar novamente"
          >
            🔄
          </button>
        </div>
      );
    }

    if (MediaService.isImage(media.Mime_Type)) {
      return (
        <div className="relative group">
          <img 
            src={dataUrl}
            alt={caption || "Imagem enviada"}
            className="rounded-lg max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowFullscreen(true)}
            onError={handleMediaError}
            onLoad={() => setHasError(false)}
          />
          
          {/* Overlay com botões */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setShowFullscreen(true)}
              className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              title="Ver em tela cheia"
            >
              <Eye size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      );
    }

    if (MediaService.isVideo(media.Mime_Type)) {
      return (
        <div className="relative group">
          <video 
            controls
            className="rounded-lg max-w-full max-h-64 bg-black"
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMDAwMDAwIi8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjEyIiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuOCIvPgo8cGF0aCBkPSJNMjggMjhMMzggMzJMMjggMzZWMjhaIiBmaWxsPSIjMDAwMDAwIi8+Cjwvc3ZnPgo="
            onError={handleMediaError}
          >
            <source src={dataUrl} type={media.Mime_Type} />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );
    }

    if (MediaService.isAudio(media.Mime_Type)) {
      return (
        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          <div className="flex-1">
            <audio 
              controls 
              className="w-full"
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleMediaError}
            >
              <source src={dataUrl} type={media.Mime_Type} />
              Seu navegador não suporta áudio.
            </audio>
          </div>
        </div>
      );
    }

    // Arquivo genérico
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
        <div className={`p-2 ${MediaService.getMediaColor(media.Mime_Type)} text-white rounded-lg`}>
          {MediaService.getMediaIcon(media.Mime_Type)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Arquivo</p>
          <p className="text-xs text-gray-500">
            {media.Mime_Type} {media.Size_Bytes && `• ${MediaService.formatFileSize(media.Size_Bytes)}`}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          title="Baixar arquivo"
        >
          <Download size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Mídia */}
      <div className="mb-2">
        {renderMedia()}
        
        {/* Informações do arquivo */}
        {media.Size_Bytes && (
          <p className="text-xs text-gray-500 mt-1">
            {MediaService.formatFileSize(media.Size_Bytes)}
          </p>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-sm whitespace-pre-wrap">
          {caption}
        </p>
      )}

      {/* Modal de tela cheia para imagens */}
      {showFullscreen && media.Mime_Type?.startsWith('image/') && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all z-10"
            >
              <X size={24} className="text-gray-700" />
            </button>
            <img 
              src={dataUrl}
              alt={caption || "Imagem em tela cheia"}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {caption && (
              <p className="text-white text-center mt-4 text-lg">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaMessage;
