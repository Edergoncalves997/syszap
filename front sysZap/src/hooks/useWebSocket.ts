import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para usar WebSocket com reconexão automática
 */
export function useWebSocket() {
  const { user } = useAuth();

  // Conectar automaticamente quando o componente montar
  useEffect(() => {
    if (user) {
      websocketService.connect(user.Company_Id || undefined, user.Id);
    }

    // Desconectar quando o componente desmontar
    return () => {
      // Não desconectar aqui para manter a conexão entre páginas
      // websocketService.disconnect();
    };
  }, [user]);

  /**
   * Registrar listener para evento
   */
  const on = useCallback((eventType: string, callback: (data: any) => void) => {
    websocketService.on(eventType, callback);
    
    // Retornar função de cleanup
    return () => {
      websocketService.off(eventType, callback);
    };
  }, []);

  /**
   * Enviar mensagem
   */
  const send = useCallback((type: string, data: any) => {
    websocketService.send(type, data);
  }, []);

  /**
   * Verificar se está conectado
   */
  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    on,
    send,
    isConnected,
    websocket: websocketService
  };
}