import { SessionController, SessionConfig } from './SessionController';
import { getPrisma } from '../plugins/prisma';

export class WppManager {
  private static instance: WppManager;
  private sessions: Map<string, SessionController> = new Map();
  private eventCallbacks: Map<string, Set<(event: any) => void>> = new Map();

  private constructor() {
    console.log('🚀 WppManager inicializado');
  }

  static getInstance(): WppManager {
    if (!WppManager.instance) {
      WppManager.instance = new WppManager();
    }
    return WppManager.instance;
  }

  async startSession(config: SessionConfig): Promise<SessionController> {
    const sessionKey = config.sessionId;

    // Verificar se já existe uma sessão ativa
    if (this.sessions.has(sessionKey)) {
      const existingSession = this.sessions.get(sessionKey)!;
      
      console.log(`⚠️ Sessão já existe: ${config.sessionName} (status: ${existingSession.getStatus()})`);
      
      // Sempre desconectar e remover, independente do status
      try {
        await existingSession.disconnect();
        console.log(`🔌 Sessão antiga desconectada: ${config.sessionName}`);
      } catch (error) {
        console.error('❌ Erro ao desconectar sessão antiga:', error);
      }
      
      this.sessions.delete(sessionKey);
      this.eventCallbacks.delete(sessionKey);
      
      // Aguardar 5 segundos para garantir que o browser fechou completamente
      console.log('⏳ Aguardando 5 segundos para limpar recursos e processos Chrome...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`🟢 Iniciando nova sessão: ${config.sessionName}`);

    // Limpar apenas processos Chrome do WhatsApp (headless) antes de iniciar
    await this.cleanupWhatsAppChromeProcesses();

    // Criar nova sessão
    const session = new SessionController(config);

    // Configurar callbacks
    session.onMessage((message) => {
      this.emitEvent(sessionKey, 'message', message);
    });

    session.onStatusChange((status) => {
      this.emitEvent(sessionKey, 'status', { sessionId: sessionKey, status });
    });

    // Iniciar sessão
    await session.start();

    // Armazenar sessão
    this.sessions.set(sessionKey, session);
    console.log(`✅ Sessão armazenada: ${sessionKey} (total: ${this.sessions.size})`);

    return session;
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    console.log(`🔴 Parando sessão: ${sessionId}`);
    
    await session.disconnect();
    this.sessions.delete(sessionId);
    this.eventCallbacks.delete(sessionId);
  }

  getSession(sessionId: string): SessionController | null {
    const session = this.sessions.get(sessionId);
    console.log(`🔍 Buscando sessão ${sessionId}: ${session ? 'ENCONTRADA' : 'NÃO ENCONTRADA'}`);
    return session || null;
  }

  getAllSessions(): Map<string, SessionController> {
    return this.sessions;
  }

  getSessionStatus(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session ? session.getStatus() : null;
  }

  getSessionQRCode(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session ? session.getQRCode() : null;
  }


  async sendMessage(sessionId: string, to: string, message: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    if (!session.isConnected()) {
      throw new Error('Sessão não está conectada');
    }

    return await session.sendMessage(to, message);
  }

  async sendFile(sessionId: string, to: string, filePath: string, filename: string, caption?: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    return await session.sendFile(to, filePath, filename, caption);
  }

  // Eventos
  onEvent(sessionId: string, eventType: string, callback: (event: any) => void): void {
    const key = `${sessionId}:${eventType}`;
    
    if (!this.eventCallbacks.has(key)) {
      this.eventCallbacks.set(key, new Set());
    }

    this.eventCallbacks.get(key)!.add(callback);
  }

  offEvent(sessionId: string, eventType: string, callback: (event: any) => void): void {
    const key = `${sessionId}:${eventType}`;
    const callbacks = this.eventCallbacks.get(key);
    
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emitEvent(sessionId: string, eventType: string, event: any): void {
    const key = `${sessionId}:${eventType}`;
    const callbacks = this.eventCallbacks.get(key);
    
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // Restaurar sessões do banco ao iniciar
  async restoreSessionsFromDatabase(): Promise<void> {
    const prisma = getPrisma();

    try {
      console.log('🔄 Restaurando sessões do banco de dados...');

      const sessions = await prisma.sessions.findMany({
        where: {
          Status: { in: [1, 2] }, // 1=CONNECTED, 2=QR_GENERATED
          Deleted_At: null
        }
      });

      console.log(`📊 Encontradas ${sessions.length} sessões para restaurar`);

      for (const dbSession of sessions) {
        try {
          const config: SessionConfig = {
            sessionId: dbSession.Id,
            companyId: dbSession.Company_Id,
            sessionName: dbSession.Session_Name,
            phoneNumber: dbSession.Phone_Number
          };

          console.log(`🔄 Restaurando: ${config.sessionName}`);
          await this.startSession(config);
        } catch (error) {
          console.error(`❌ Erro ao restaurar sessão ${dbSession.Session_Name}:`, error);
          // Marcar como desconectada
          await prisma.sessions.update({
            where: { Id: dbSession.Id },
            data: { Status: 0, Reauth_Required: true }
          });
        }
      }

      console.log('✅ Restauração de sessões concluída');
    } catch (error) {
      console.error('❌ Erro ao restaurar sessões:', error);
    }
  }

  // Limpar sessões inativas
  async cleanupInactiveSessions(): Promise<void> {
    console.log('🧹 Limpando sessões inativas...');

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isConnected()) {
        console.log(`🗑️ Removendo sessão inativa: ${sessionId}`);
        await this.stopSession(sessionId);
      }
    }
  }

  // Estatísticas
  getStats(): any {
    const total = this.sessions.size;
    const connected = Array.from(this.sessions.values()).filter(s => s.isConnected()).length;
    const disconnected = total - connected;

    return {
      total,
      connected,
      disconnected,
      sessions: Array.from(this.sessions.entries()).map(([id, session]) => ({
        id,
        status: session.getStatus()
      }))
    };
  }

  /**
   * Limpar apenas processos Chrome do WhatsApp (headless) sem afetar abas abertas
   */
  private async cleanupWhatsAppChromeProcesses(): Promise<void> {
    return new Promise((resolve) => {
      try {
        console.log('🧹 Limpando processos Chrome do WhatsApp (headless)...');
        const { exec } = require('child_process');
        
        // Comando para matar apenas Chrome com --headless e --no-sandbox (processos do WhatsApp)
        exec('wmic process where "name=\'chrome.exe\' and commandline like \'%--headless%\' and commandline like \'%--no-sandbox%\'" delete', (error: any) => {
          if (error && !error.message.includes('não foi encontrado')) {
            console.log('⚠️ Alguns processos Chrome do WhatsApp não puderam ser finalizados');
          } else {
            console.log('✅ Processos Chrome do WhatsApp limpos (suas abas abertas foram preservadas)');
          }
          resolve();
        });
      } catch (error) {
        console.log('⚠️ Erro ao limpar processos Chrome do WhatsApp:', error);
        resolve();
      }
    });
  }
}

// Singleton export
export const wppManager = WppManager.getInstance();


