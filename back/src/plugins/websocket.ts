import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { wppManager } from '../whatsapp/WppManager';

interface WebSocketClient {
  id: string;
  companyId?: string;
  userId?: string;
  socket: any;
}

const clients: Map<string, WebSocketClient> = new Map();

export async function setupWebSocket(app: FastifyInstance) {
  await app.register(websocket);

  // WebSocket global para eventos do sistema
  app.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = Math.random().toString(36).substring(7);
    const query = req.query as any;
    
    console.log(`🔌 WebSocket conectado: ${clientId}`);
    console.log(`🔌 CompanyId: ${query.companyId}, UserId: ${query.userId}`);

    const client: WebSocketClient = {
      id: clientId,
      companyId: query.companyId,
      userId: query.userId,
      socket: connection.socket
    };

    clients.set(clientId, client);
    console.log(`🔌 Total de clientes conectados agora: ${clients.size}`);

    // Enviar confirmação de conexão
    if (connection.socket) {
      connection.socket.send(JSON.stringify({
        type: 'connected',
        data: { clientId }
      }));
    }

    // Listener de mensagens do cliente
    if (connection.socket) {
      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`📨 Mensagem recebida do cliente ${clientId}:`, data.type);
          
          // Pode adicionar handlers para mensagens do cliente aqui
          if (data.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem do cliente:', error);
        }
      });
    }

    // Quando desconectar
    if (connection.socket) {
      connection.socket.on('close', () => {
        console.log(`🔌 WebSocket desconectado: ${clientId}`);
        clients.delete(clientId);
      });

      connection.socket.on('error', (error: any) => {
        console.error(`❌ Erro no WebSocket ${clientId}:`, error);
      });
    }
  });

  // WebSocket específico para sessões WhatsApp (mantido para compatibilidade)
  app.get('/ws/whatsapp/:sessionId', { websocket: true }, (connection, req) => {
    const { sessionId } = req.params as { sessionId: string };
    const clientId = Math.random().toString(36).substring(7);
    
    console.log(`🔌 WebSocket conectado para sessão: ${sessionId}`);

    const client: WebSocketClient = {
      id: clientId,
      socket: connection.socket
    };

    clients.set(clientId, client);

    // Enviar status inicial
    const status = wppManager.getSessionStatus(sessionId);
    connection.socket.send(JSON.stringify({
      type: 'session_status',
      data: { sessionId, status }
    }));

    // Listener de mensagens da sessão
    const messageHandler = (message: any) => {
      connection.socket.send(JSON.stringify({
        type: 'whatsapp_message',
        data: message
      }));
    };

    const statusHandler = (statusData: any) => {
      connection.socket.send(JSON.stringify({
        type: 'session_status_change',
        data: statusData
      }));
    };

    wppManager.onEvent(sessionId, 'message', messageHandler);
    wppManager.onEvent(sessionId, 'status', statusHandler);

    // Quando desconectar
    connection.socket.on('close', () => {
      console.log(`🔌 WebSocket desconectado para sessão ${sessionId}`);
      wppManager.offEvent(sessionId, 'message', messageHandler);
      wppManager.offEvent(sessionId, 'status', statusHandler);
      clients.delete(clientId);
    });

    connection.socket.on('error', (error: any) => {
      console.error(`❌ Erro no WebSocket da sessão ${sessionId}:`, error);
    });
  });
}

// ========== FUNÇÕES DE BROADCAST ==========

/**
 * Broadcast para todos os clientes conectados
 */
export function broadcastToAll(event: any): void {
  const message = JSON.stringify(event);
  let sent = 0;
  
  clients.forEach(client => {
    if (client.socket.readyState === 1) {
      try {
        client.socket.send(message);
        sent++;
      } catch (error) {
        console.error('❌ Erro ao enviar broadcast:', error);
      }
    }
  });
  
  if (sent > 0) {
    console.log(`📡 Broadcast enviado para ${sent} clientes: ${event.type}`);
  }
}

/**
 * Broadcast para clientes de uma empresa específica
 */
export function broadcastToCompany(companyId: string, event: any): void {
  const message = JSON.stringify(event);
  let sent = 0;
  
  console.log(`📡 Tentando enviar ${event.type} para empresa ${companyId}`);
  console.log(`📡 Total de clientes conectados: ${clients.size}`);
  
  clients.forEach(client => {
    console.log(`📡 Cliente: ${client.id}, CompanyId: ${client.companyId}, Socket: ${client.socket ? 'exists' : 'null'}, ReadyState: ${client.socket?.readyState}`);
    
    if (client.companyId === companyId && client.socket && client.socket.readyState === 1) {
      try {
        client.socket.send(message);
        sent++;
        console.log(`📡 ✅ Mensagem enviada para cliente ${client.id}`);
      } catch (error) {
        console.error('❌ Erro ao enviar broadcast para empresa:', error);
      }
    }
  });
  
  if (sent > 0) {
    console.log(`📡 Broadcast enviado para ${sent} clientes da empresa ${companyId}: ${event.type}`);
  } else {
    console.log(`⚠️ Nenhum cliente conectado para empresa ${companyId}`);
  }
}

/**
 * Broadcast para um usuário específico
 */
export function broadcastToUser(userId: string, event: any): void {
  const message = JSON.stringify(event);
  let sent = 0;
  
  clients.forEach(client => {
    if (client.userId === userId && client.socket.readyState === 1) {
      try {
        client.socket.send(message);
        sent++;
      } catch (error) {
        console.error('❌ Erro ao enviar broadcast para usuário:', error);
      }
    }
  });
  
  if (sent > 0) {
    console.log(`📡 Broadcast enviado para usuário ${userId}: ${event.type}`);
  }
}

/**
 * Emitir evento de QR Code gerado
 */
export function emitQRCode(sessionId: string, companyId: string, qrCode: string): void {
  broadcastToCompany(companyId, {
    type: 'qr_code',
    data: {
      sessionId,
      qrCode,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Emitir evento de status da sessão
 */
export function emitSessionStatus(sessionId: string, companyId: string, status: any): void {
  broadcastToCompany(companyId, {
    type: 'session_status',
    data: {
      sessionId,
      status,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Emitir evento de nova mensagem
 */
export function emitNewMessage(companyId: string, message: any): void {
  broadcastToCompany(companyId, {
    type: 'new_message',
    data: {
      ...message,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Emitir evento de cliente atualizado
 */
export function emitClientUpdate(companyId: string, client: any): void {
  broadcastToCompany(companyId, {
    type: 'client_update',
    data: {
      ...client,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Emitir evento de novo cliente
 */
export function emitNewClient(companyId: string, client: any): void {
  broadcastToCompany(companyId, {
    type: 'new_client',
    data: {
      ...client,
      timestamp: new Date().toISOString()
    }
  });
}