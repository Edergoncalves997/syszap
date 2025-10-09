import * as wpp from '@wppconnect-team/wppconnect';
import { getPrisma } from '../plugins/prisma';
import { ticketService } from '../services/ticketService';
import { emitQRCode, emitSessionStatus, emitNewMessage, emitClientUpdate, emitNewClient } from '../plugins/websocket';

export interface SessionConfig {
  sessionId: string;
  companyId: string;
  sessionName: string;
  phoneNumber: string;
}

export class SessionController {
  private client: wpp.Whatsapp | null = null;
  private config: SessionConfig;
  private qrCode: string | null = null;
  private status: 'disconnected' | 'connecting' | 'qr' | 'connected' = 'disconnected';
  private onMessageCallback?: (message: any) => void;
  private onStatusChangeCallback?: (status: string) => void;
  private qrCodeResolve?: (qrCode: string) => void;
  private qrCodePromise: Promise<string> | null = null;

  constructor(config: SessionConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    try {
      this.status = 'connecting';
      this.notifyStatusChange('connecting');

      console.log(`🟡 Iniciando sessão: ${this.config.sessionName}`);

      // Criar Promise que será resolvida quando o QR Code for gerado
      this.qrCodePromise = new Promise((resolve) => {
        this.qrCodeResolve = resolve;
      });

      this.client = await wpp.create({
        session: this.config.sessionId,
        catchQR: (base64Qr, asciiQR, attempts) => {
          console.log(`📱 QR Code gerado (tentativa ${attempts})`);
          this.qrCode = base64Qr;
          this.status = 'qr';
          this.notifyStatusChange('qr');
          this.saveQRCode(base64Qr);
          
          // Emitir evento WebSocket para QR Code
          emitQRCode(this.config.sessionId, this.config.companyId, base64Qr);
          
          // Resolver a Promise com o QR Code
          if (this.qrCodeResolve) {
            this.qrCodeResolve(base64Qr);
          }
        },
        statusFind: (statusSession, session) => {
          console.log(`📊 Status: ${statusSession} - ${session}`);
          
          if (statusSession === 'isLogged' || statusSession === 'qrReadSuccess') {
            this.status = 'connected';
            this.notifyStatusChange('connected');
            this.updateSessionStatus(1); // 1 = CONNECTED
            
            // Emitir evento WebSocket de status
            emitSessionStatus(this.config.sessionId, this.config.companyId, 'connected');
            
            console.log(`✅ Sessão conectada: ${this.config.sessionName}`);
          } else if (statusSession === 'notLogged') {
            this.status = 'disconnected';
            this.notifyStatusChange('disconnected');
            this.updateSessionStatus(0); // 0 = DISCONNECTED
            
            // Emitir evento WebSocket de status
            emitSessionStatus(this.config.sessionId, this.config.companyId, 'disconnected');
          }
        },
        logQR: false,
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        autoClose: 120000, // 2 minutos
        createPathFileToken: true,
      });

      // Configurar listeners de mensagens
      this.setupMessageListeners();

      console.log(`✅ Cliente WPP criado: ${this.config.sessionName}`);
    } catch (error) {
      console.error(`❌ Erro ao iniciar sessão ${this.config.sessionName}:`, error);
      this.status = 'disconnected';
      this.notifyStatusChange('disconnected');
      this.updateSessionStatus(0);
      throw error;
    }
  }

  private setupMessageListeners(): void {
    if (!this.client) return;

    // Listener de mensagens recebidas
    this.client.onMessage(async (message) => {
      console.log(`📨 Nova mensagem recebida:`, message.from);
      
      try {
        // Processar mensagem
        await this.processIncomingMessage(message);
        
        // Callback customizado
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });

    // Listener de status de ACK
    this.client.onAck(async (ack) => {
      console.log(`✓ ACK recebido:`, ack.id._serialized, ack.ack);
      await this.updateMessageAck(ack);
    });
  }

  private async processIncomingMessage(message: any): Promise<void> {
    const prisma = getPrisma();

    try {
      // Ignorar mensagens de status (notificações do WhatsApp)
      if (message.type === 'notification' || message.isStatus || message.isNotification) {
        console.log('⚠️ Mensagem de status ignorada:', message.type);
        return;
      }
      // 1. Buscar ou criar chat
      let chat = await prisma.chats.findFirst({
        where: {
          Company_Id: this.config.companyId,
          Session_Id: this.config.sessionId,
          WA_Chat_Id: message.from
        }
      });

      if (!chat) {
        // Criar novo chat
        chat = await prisma.chats.create({
          data: {
            Company_Id: this.config.companyId,
            Session_Id: this.config.sessionId,
            WA_Chat_Id: message.from,
            Type: message.isGroupMsg ? 1 : 0, // 0=INDIVIDUAL, 1=GROUP
            Is_Archived: false,
            Is_Muted: false,
            Unread_Count: 0
          }
        });
      }

      // 2. Buscar ou criar cliente
      const contactNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      let client = await prisma.clients.findFirst({
        where: {
          Company_Id: this.config.companyId,
          WhatsApp_Number: contactNumber
        }
      });

      if (!client && !message.isGroupMsg) {
        // Criar novo cliente
        const profilePicUrl = await this.getProfilePicUrl(message.from);
        
        client = await prisma.clients.create({
          data: {
            Company_Id: this.config.companyId,
            Name: message.notifyName || message.from,
            WhatsApp_Number: contactNumber,
            WA_User_Id: message.author || message.from,
            Profile_Pic_URL: profilePicUrl,
            Is_Blocked: false,
            Last_Contact_At: new Date()
          }
        });

        console.log(`✅ Novo cliente cadastrado: ${client.Name} (${contactNumber})${profilePicUrl ? ' com foto de perfil' : ''}`);

        // Emitir evento WebSocket de novo cliente
        emitNewClient(this.config.companyId, client);

        // Atualizar chat com cliente
        await prisma.chats.update({
          where: { Id: chat.Id },
          data: { Client_Id: client.Id }
        });
      } else if (client && !message.isGroupMsg) {
        // Cliente já existe - verificar se as informações estão atualizadas
        await this.updateClientInfo(client, message);
      }

      // 3. Processar mídia se houver
      let mediaId: string | null = null;
      
      if (message.hasMedia) {
        try {
          console.log(`📸 Baixando mídia da mensagem ${message.id}...`);
          const media = await message.downloadMedia();
          
          if (media) {
            // Salvar mídia no banco
            const mediaRecord = await prisma.media.create({
              data: {
                Company_Id: this.config.companyId,
                Storage_Provider: 'base64', // Armazenando em Base64
                Storage_Key: media.data, // Base64 da mídia
                Mime_Type: media.mimetype || 'application/octet-stream',
                Size_Bytes: Buffer.from(media.data, 'base64').length
              }
            });
            
            mediaId = mediaRecord.Id;
            console.log(`✅ Mídia salva: ${mediaRecord.Id}`);
          }
        } catch (error) {
          console.error('❌ Erro ao baixar mídia:', error);
        }
      }

      // 4. Salvar mensagem
      const savedMessage = await prisma.messages.create({
        data: {
          Company_Id: this.config.companyId,
          Session_Id: this.config.sessionId,
          Chat_Id: chat.Id,
          WA_Message_Id: message.id,
          Direction: 0, // 0 = IN (recebida)
          Type: this.getMessageType(message),
          Body: message.body || null,
          Caption: message.caption || null,
          Media_Id: mediaId,
          Status: 3, // 3 = RECEIVED
          WA_Timestamp: message.timestamp ? new Date(message.timestamp * 1000) : null
        }
      });

      // 5. Atualizar chat
      await prisma.chats.update({
        where: { Id: chat.Id },
        data: {
          Last_Message_At: new Date(),
          Unread_Count: { increment: 1 }
        }
      });

      console.log(`✅ Mensagem salva: ${message.id}${mediaId ? ' (com mídia)' : ''}`);

      // Buscar dados completos da mensagem incluindo mídia
      const messageWithMedia = await prisma.messages.findUnique({
        where: { Id: savedMessage.Id },
        include: {
          Media: true
        }
      });

      // Emitir evento WebSocket de nova mensagem
      emitNewMessage(this.config.companyId, {
        ...messageWithMedia,
        Chat: { WA_Chat_Id: chat.WA_Chat_Id },
        Client: client ? { Name: client.Name, WhatsApp_Number: client.WhatsApp_Number } : null
      });

      console.log(`📡 WebSocket emitido para empresa ${this.config.companyId}:`, {
        messageId: messageWithMedia?.Id,
        direction: messageWithMedia?.Direction,
        body: messageWithMedia?.Body?.substring(0, 50) + '...',
        fromMe: message.fromMe
      });

      // 6. AUTOMAÇÃO DE TICKETS
      // Apenas processar se for mensagem de texto de cliente individual (não grupo) e não for mensagem enviada por nós
      if (client && !message.isGroupMsg && message.fromMe === false && message.type === 'chat') {
        await this.handleTicketAutomation(client.Id, chat.Id, message.body || '');
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  private getMessageType(message: any): number {
    // 0=TEXT, 1=IMAGE, 2=AUDIO, 3=VIDEO, 4=DOCUMENT, 5=LOCATION, 6=CONTACT, 7=STICKER
    if (message.type === 'chat') return 0;
    if (message.type === 'image') return 1;
    if (message.type === 'ptt' || message.type === 'audio') return 2;
    if (message.type === 'video') return 3;
    if (message.type === 'document') return 4;
    if (message.type === 'location') return 5;
    if (message.type === 'vcard') return 6;
    if (message.type === 'sticker') return 7;
    return 0;
  }

  /**
   * Automação de Tickets
   * - Se não houver ticket aberto: cria um e envia mensagem de saudação
   * - Se houver ticket aguardando resposta (status 0): processa a escolha da fila
   */
  private async handleTicketAutomation(clientId: string, chatId: string, messageBody: string): Promise<void> {
    try {
      // Verificar se existe ticket aberto
      const openTicket = await ticketService.getOpenTicket(clientId);

      if (!openTicket) {
        // Não há ticket aberto -> Criar novo e enviar saudação
        console.log(`🎫 Criando novo ticket para cliente ${clientId}`);
        
        const prisma = getPrisma();
        const client = await prisma.clients.findUnique({
          where: { Id: clientId }
        });

        if (!client) return;

        await ticketService.createTicketAndSendGreeting({
          companyId: this.config.companyId,
          sessionId: this.config.sessionId,
          clientId: clientId,
          chatId: chatId,
          clientNumber: client.WhatsApp_Number + '@c.us'
        });
      } else if (openTicket.Status === 0) {
        // Ticket está aguardando escolha da fila -> Verificar se já tem atendente
        if (openTicket.User_Id) {
          console.log(`✅ Ticket ${openTicket.Id} já tem atendente (${openTicket.User_Id}), não enviando mensagens automáticas`);
          return; // Não processar mais - ticket já assumido
        }

        console.log(`🔄 Processando escolha de fila para ticket ${openTicket.Id}`);
        
        const processed = await ticketService.processClientResponse(
          openTicket.Id,
          messageBody,
          this.config.companyId
        );

        if (!processed) {
          // Resposta inválida -> Reenviar opções apenas se não tiver atendente
          const prisma = getPrisma();
          const updatedTicket = await prisma.tickets.findUnique({
            where: { Id: openTicket.Id }
          });

          if (updatedTicket && !updatedTicket.User_Id) {
            console.log('⚠️ Resposta inválida do cliente, reenviando opções...');
            
            const client = await prisma.clients.findUnique({
              where: { Id: clientId }
            });

            if (!client) return;

            const queues = await prisma.queues.findMany({
              where: {
                Company_Id: this.config.companyId,
                Is_Active: true,
                Deleted_At: null
              },
              orderBy: {
                Created_At: 'asc'
              }
            });

            let errorMessage = '❌ *Opção inválida.*\n\n';
            errorMessage += 'Por favor, escolha uma das opções abaixo digitando o *número* correspondente:\n\n';

            queues.forEach((queue, index) => {
              errorMessage += `*${index + 1}* - ${queue.Name}\n`;
            });

            errorMessage += '\n_Digite apenas o número da opção desejada._';

            await this.sendMessage(client.WhatsApp_Number + '@c.us', errorMessage);
          } else {
            console.log('✅ Ticket já tem atendente, não reenviando opções');
          }
        }
      }
      // Se o ticket está em outro status (1=AGUARDANDO_ATENDENTE, 2=EM_ATENDIMENTO), não faz nada
      // As mensagens já estão sendo salvas normalmente
    } catch (error) {
      console.error('❌ Erro na automação de tickets:', error);
    }
  }

  private async updateMessageAck(ack: any): Promise<void> {
    const prisma = getPrisma();
    
    try {
      await prisma.messages.updateMany({
        where: {
          WA_Message_Id: ack.id._serialized,
          Company_Id: this.config.companyId
        },
        data: {
          Status: ack.ack // 0=ERROR, 1=PENDING, 2=SERVER, 3=DEVICE, 4=READ, 5=PLAYED
        }
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar ACK:', error);
    }
  }

  private async saveQRCode(base64Qr: string): Promise<void> {
    const prisma = getPrisma();
    
    try {
      await prisma.sessions.update({
        where: { Id: this.config.sessionId },
        data: {
          QR_SVG: base64Qr,
          QR_Expires_At: new Date(Date.now() + 60000), // 1 minuto
          Status: 2 // 2 = QR_GENERATED
        }
      });
    } catch (error) {
      console.error('❌ Erro ao salvar QR Code:', error);
    }
  }

  private async updateSessionStatus(status: number): Promise<void> {
    const prisma = getPrisma();
    
    try {
      await prisma.sessions.update({
        where: { Id: this.config.sessionId },
        data: {
          Status: status,
          Last_Heartbeat: new Date(),
          Reauth_Required: false
        }
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    }
  }

  /**
   * Buscar URL da foto de perfil do WhatsApp
   */
  private async getProfilePicUrl(contactId: string): Promise<string | null> {
    if (!this.client || this.status !== 'connected') {
      return null;
    }

    try {
      const profilePic = await this.client.getProfilePicFromServer(contactId);
      if (profilePic) {
        console.log(`📸 Foto de perfil obtida para ${contactId}`);
        // O método retorna um objeto com a propriedade 'eurl' ou 'imgFull'
        return (profilePic as any).eurl || (profilePic as any).imgFull || null;
      }
      return null;
    } catch (error) {
      console.log(`⚠️ Não foi possível obter foto de perfil para ${contactId}`);
      return null;
    }
  }

  /**
   * Atualizar informações do cliente (nome e foto de perfil)
   */
  private async updateClientInfo(client: any, message: any): Promise<void> {
    const prisma = getPrisma();
    
    try {
      const updates: any = {
        Last_Contact_At: new Date()
      };
      let hasChanges = false;

      // Verificar se o nome mudou
      const currentName = message.notifyName || message.from;
      if (currentName && currentName !== client.Name && currentName !== message.from) {
        updates.Name = currentName;
        hasChanges = true;
        console.log(`📝 Nome do cliente atualizado: ${client.Name} → ${currentName}`);
      }

      // Buscar foto de perfil atualizada
      const profilePicUrl = await this.getProfilePicUrl(message.from);
      if (profilePicUrl && profilePicUrl !== client.Profile_Pic_URL) {
        updates.Profile_Pic_URL = profilePicUrl;
        hasChanges = true;
        console.log(`📸 Foto de perfil do cliente atualizada: ${client.Name}`);
      }

      // Atualizar apenas se houver mudanças (além do Last_Contact_At)
      if (hasChanges || !client.Last_Contact_At) {
        const updatedClient = await prisma.clients.update({
          where: { Id: client.Id },
          data: updates
        });
        
        if (hasChanges) {
          console.log(`✅ Informações do cliente atualizadas: ${client.Name}`);
          
          // Emitir evento WebSocket de cliente atualizado
          emitClientUpdate(this.config.companyId, updatedClient);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar informações do cliente:', error);
    }
  }

  async sendMessage(to: string, message: string): Promise<any> {
    if (!this.client || this.status !== 'connected') {
      throw new Error('Sessão não conectada');
    }

    try {
      const result = await this.client.sendText(to, message);
      console.log(`✅ Mensagem enviada para ${to}`);
      
      // Salvar mensagem enviada
      await this.saveOutgoingMessage(to, message, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  private async saveOutgoingMessage(to: string, body: string, result: any): Promise<void> {
    const prisma = getPrisma();
    
    try {
      // Buscar chat
      let chat = await prisma.chats.findFirst({
        where: {
          Company_Id: this.config.companyId,
          Session_Id: this.config.sessionId,
          WA_Chat_Id: to
        }
      });

      if (!chat) {
        // Criar chat se não existir
        chat = await prisma.chats.create({
          data: {
            Company_Id: this.config.companyId,
            Session_Id: this.config.sessionId,
            WA_Chat_Id: to,
            Type: 0,
            Is_Archived: false,
            Is_Muted: false,
            Unread_Count: 0
          }
        });
      }

      // Salvar mensagem
      await prisma.messages.create({
        data: {
          Company_Id: this.config.companyId,
          Session_Id: this.config.sessionId,
          Chat_Id: chat.Id,
          WA_Message_Id: result.id || `${Date.now()}`,
          Direction: 1, // 1 = OUT (enviada)
          Type: 0, // TEXT
          Body: body,
          Status: 1, // 1 = PENDING
          WA_Timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem enviada:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      this.status = 'disconnected';
      this.qrCode = null;
      this.notifyStatusChange('disconnected');
      await this.updateSessionStatus(0);
      console.log(`🔴 Sessão desconectada: ${this.config.sessionName}`);
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      throw error;
    }
  }

  getQRCode(): string | null {
    console.log(`🔍 Buscando QR Code para sessão ${this.config.sessionName}: ${this.qrCode ? 'Encontrado' : 'Não encontrado'}`);
    return this.qrCode;
  }


  getStatus(): string {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback: (status: string) => void): void {
    this.onStatusChangeCallback = callback;
  }

  private notifyStatusChange(status: string): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  async getChats(): Promise<any[]> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Sessão não conectada');
    }

    try {
      const chats = await this.client.getAllChats();
      return chats;
    } catch (error) {
      console.error('❌ Erro ao buscar chats:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string, limit: number = 50): Promise<any[]> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Sessão não conectada');
    }

    try {
      const messages = await this.client.getAllMessagesInChat(chatId, true, false);
      return messages.slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  async sendFile(to: string, filePath: string, filename: string, caption?: string): Promise<any> {
    if (!this.client || !this.isConnected()) {
      throw new Error('Sessão não conectada');
    }

    try {
      const result = await this.client.sendFile(to, filePath, filename, caption || '');
      console.log(`✅ Arquivo enviado para ${to}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo:', error);
      throw error;
    }
  }

  getClient(): wpp.Whatsapp | null {
    return this.client;
  }

  async waitForQRCode(timeout: number = 30000): Promise<string | null> {
    // Se já tem QR Code, retorna imediatamente
    if (this.qrCode) {
      return this.qrCode;
    }

    // Se não tem promise, significa que não está inicializando
    if (!this.qrCodePromise) {
      return null;
    }

    try {
      // Aguarda QR Code ou timeout
      const result = await Promise.race([
        this.qrCodePromise,
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao aguardar QR Code')), timeout)
        )
      ]);
      
      return result;
    } catch (error) {
      console.error('⏰ Timeout ao aguardar QR Code:', error);
      return null;
    }
  }
}


