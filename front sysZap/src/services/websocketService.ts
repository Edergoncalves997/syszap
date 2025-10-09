/**
 * Serviço de WebSocket para comunicação em tempo real
 */

import { getWebSocketURL } from '../config/env';

type EventCallback = (data: any) => void;

interface EventListeners {
  [eventType: string]: Set<EventCallback>;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: EventListeners = {};
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private companyId: string | null = null;
  private userId: string | null = null;
  private isIntentionallyClosed = false;

  /**
   * Conectar ao WebSocket
   */
  connect(companyId?: string, userId?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket já está conectado');
      return;
    }

    this.companyId = companyId || null;
    this.userId = userId || null;
    this.isIntentionallyClosed = false;

    // Construir URL com query params usando configuração centralizada
    let url = getWebSocketURL();
    
    const params: string[] = [];
    if (this.companyId) params.push(`companyId=${this.companyId}`);
    if (this.userId) params.push(`userId=${this.userId}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    console.log(`🔌 Conectando ao WebSocket: ${url}`);
    console.log(`🔌 CompanyId: ${this.companyId}, UserId: ${this.userId}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.reconnectAttempts = 0;
        this.emit('_connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket mensagem recebida:', message.type);
          
          // Emitir evento para listeners específicos
          this.emit(message.type, message.data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        this.emit('_error', error);
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.emit('_disconnected', { code: event.code, reason: event.reason });
        
        // Tentar reconectar se não foi intencional
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
      this.emit('_error', error);
    }
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🔌 WebSocket desconectado intencionalmente');
  }

  /**
   * Agendar reconexão
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect(this.companyId || undefined, this.userId || undefined);
    }, delay);
  }

  /**
   * Registrar listener para evento
   */
  on(eventType: string, callback: EventCallback): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = new Set();
    }
    this.listeners[eventType].add(callback);
  }

  /**
   * Remover listener
   */
  off(eventType: string, callback: EventCallback): void {
    if (this.listeners[eventType]) {
      this.listeners[eventType].delete(callback);
    }
  }

  /**
   * Emitir evento para listeners
   */
  private emit(eventType: string, data: any): void {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Erro no listener do evento ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Enviar mensagem
   */
  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type, data });
        this.ws.send(message);
        console.log(`📤 Mensagem enviada: ${type}`);
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
      }
    } else {
      console.warn('⚠️ WebSocket não está conectado');
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obter informações da conexão
   */
  getConnectionInfo(): { companyId: string | null; userId: string | null; connected: boolean } {
    return {
      companyId: this.companyId,
      userId: this.userId,
      connected: this.isConnected()
    };
  }
}

// Instância singleton
export const websocketService = new WebSocketService();