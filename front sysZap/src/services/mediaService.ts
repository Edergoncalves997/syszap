/**
 * Serviço para gerenciar mídias do WhatsApp
 */

interface MediaInfo {
  id: string;
  mimeType: string;
  dataUrl: string;
  size?: number;
  name?: string;
}

export class MediaService {
  /**
   * Converter base64 para data URL
   */
  static createDataUrl(mimeType: string, base64Data: string): string {
    return `data:${mimeType};base64,${base64Data}`;
  }

  /**
   * Formatar tamanho do arquivo
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Baixar mídia
   */
  static downloadMedia(media: MediaInfo): void {
    const link = document.createElement('a');
    link.href = media.dataUrl;
    link.download = media.name || `media_${media.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Verificar se é uma imagem
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Verificar se é um vídeo
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Verificar se é áudio
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  /**
   * Obter ícone para tipo de mídia
   */
  static getMediaIcon(mimeType: string): string {
    if (this.isImage(mimeType)) return '🖼️';
    if (this.isVideo(mimeType)) return '🎥';
    if (this.isAudio(mimeType)) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document')) return '📄';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📋';
    return '📎';
  }

  /**
   * Obter cor para tipo de mídia
   */
  static getMediaColor(mimeType: string): string {
    if (this.isImage(mimeType)) return 'bg-green-500';
    if (this.isVideo(mimeType)) return 'bg-red-500';
    if (this.isAudio(mimeType)) return 'bg-blue-500';
    if (mimeType.includes('pdf')) return 'bg-red-600';
    if (mimeType.includes('document')) return 'bg-blue-600';
    return 'bg-gray-500';
  }

  /**
   * Validar se base64 é válido
   */
  static isValidBase64(base64: string): boolean {
    try {
      return btoa(atob(base64)) === base64;
    } catch {
      return false;
    }
  }

  /**
   * Comprimir imagem (opcional, para performance)
   */
  static compressImage(base64: string, quality: number = 0.8): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  /**
   * Gerar thumbnail para vídeo
   */
  static generateVideoThumbnail(base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Capturar frame no segundo 1
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx?.drawImage(video, 0, 0);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };
      
      video.onerror = () => {
        reject(new Error('Erro ao gerar thumbnail do vídeo'));
      };
      
      video.src = `data:video/mp4;base64,${base64}`;
    });
  }

  /**
   * Detectar se mídia é muito grande
   */
  static isMediaTooLarge(sizeBytes: number, maxSizeMB: number = 10): boolean {
    return sizeBytes > maxSizeMB * 1024 * 1024;
  }

  /**
   * Obter mensagem de erro para mídia
   */
  static getErrorMessage(error: any): string {
    if (error.message?.includes('load')) {
      return 'Erro ao carregar mídia. Verifique sua conexão.';
    }
    if (error.message?.includes('format')) {
      return 'Formato de arquivo não suportado.';
    }
    return 'Erro ao processar mídia.';
  }
}

export default MediaService;
