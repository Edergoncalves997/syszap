import api from './api';
import { SendMessageData } from '../types/api';

export const whatsappService = {
  // Iniciar sessão WhatsApp (gera QR Code)
  async startSession(sessionId: string): Promise<{ message: string; status: string; qrCode?: string }> {
    const { data } = await api.post(`/whatsapp/sessions/${sessionId}/start`);
    return data;
  },

  // Obter QR Code
  async getQRCode(sessionId: string): Promise<{ qrCode: string; expiresAt?: string }> {
    const { data } = await api.get(`/whatsapp/sessions/${sessionId}/qr`);
    return data;
  },

  // Obter status da sessão
  async getSessionStatus(sessionId: string): Promise<{ sessionId: string; status: string; isConnected: boolean }> {
    const { data } = await api.get(`/whatsapp/sessions/${sessionId}/status`);
    return data;
  },

  // Parar sessão
  async stopSession(sessionId: string): Promise<{ message: string }> {
    const { data } = await api.post(`/whatsapp/sessions/${sessionId}/stop`);
    return data;
  },

  // Enviar mensagem
  async sendMessage(messageData: SendMessageData): Promise<{ message: string; result: any }> {
    const { data } = await api.post('/whatsapp/messages/send', messageData);
    return data;
  },

  // Listar chats da sessão
  async getChats(sessionId: string): Promise<{ chats: any[] }> {
    const { data } = await api.get(`/whatsapp/sessions/${sessionId}/chats`);
    return data;
  },

  // Mensagens de um chat
  async getChatMessages(sessionId: string, chatId: string, limit: number = 50): Promise<{ messages: any[]; total: number }> {
    const { data } = await api.get(`/whatsapp/sessions/${sessionId}/chats/${chatId}/messages`, {
      params: { limit }
    });
    return data;
  },

  // Estatísticas gerais
  async getStats(): Promise<{ total: number; connected: number; disconnected: number; sessions: any[] }> {
    const { data } = await api.get('/whatsapp/stats');
    return data;
  },

  // Sincronizar chats
  async syncSession(sessionId: string): Promise<{ message: string; totalChats: number }> {
    const { data } = await api.post(`/whatsapp/sessions/${sessionId}/sync`);
    return data;
  },
};



