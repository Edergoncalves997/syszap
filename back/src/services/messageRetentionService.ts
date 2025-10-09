import { getPrisma } from '../plugins/prisma';
import { wppManager } from '../whatsapp/WppManager';

export class MessageRetentionService {
  private prisma = getPrisma();

  /**
   * Busca mensagens com lógica híbrida:
   * 1. Busca no banco primeiro
   * 2. Se não encontrar e estiver fora do período de retenção, busca no WhatsApp
   * 3. Salva mensagens resgatadas com cache temporário
   */
  async getMessagesWithRetention(params: {
    clientId: string;
    sessionId: string;
    beforeDate?: Date;
    days?: number;
    limit?: number;
  }) {
    const { clientId, sessionId, beforeDate, days = 7, limit = 50 } = params;

    // 1. Buscar cliente e empresa
    const client = await this.prisma.clients.findUnique({
      where: { Id: clientId },
      include: {
        Company: {
          select: {
            Id: true,
            Retention_Days: true,
            Cache_Fetched_Days: true
          }
        }
      }
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    const retentionDays = client.Company.Retention_Days;
    const cacheDays = client.Company.Cache_Fetched_Days;

    // 2. Definir período de busca
    const referenceDate = beforeDate || new Date();
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days);

    // 3. Buscar mensagens no banco
    const chats = await this.prisma.chats.findMany({
      where: {
        Company_Id: client.Company_Id,
        Client_Id: clientId,
        Session_Id: sessionId
      },
      select: { Id: true, WA_Chat_Id: true }
    });

    if (chats.length === 0) {
      return { messages: [], hasMore: false, oldestDate: null, source: 'none' };
    }

    const chatIds = chats.map(c => c.Id);
    const chatId = chats[0]?.WA_Chat_Id || ''; // Para buscar no WhatsApp

    // 4. Buscar mensagens no banco (incluindo cache não expirado)
    const now = new Date();
    let messages = await this.prisma.messages.findMany({
      where: {
        Chat_Id: { in: chatIds },
        Created_At: {
          gte: startDate,
          lt: referenceDate
        },
        OR: [
          { Fetched_From_WhatsApp: false }, // Mensagens normais
          { 
            Fetched_From_WhatsApp: true,
            Cache_Until: { gte: now } // Cache ainda válido
          }
        ]
      },
      orderBy: { Created_At: 'desc' },
      take: limit,
      include: {
        Media: {
          select: {
            Id: true,
            Mime_Type: true,
            Storage_Key: true,
            Storage_Provider: true
          }
        }
      }
    });

    // 5. Verificar se período está fora da retenção
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);

    const isOutsideRetention = startDate < retentionCutoff;

    // NOTA: Não é possível buscar mensagens históricas do WhatsApp Web
    // Apenas retorna mensagens já armazenadas no banco de dados
    if (messages.length < limit && isOutsideRetention) {
      console.log(`⚠️ Período fora da retenção. Mensagens históricas não disponíveis via WhatsApp Web.`);
    }

    // 7. Ordenar e limitar
    messages.sort((a, b) => a.Created_At.getTime() - b.Created_At.getTime());
    messages = messages.slice(0, limit);

    const hasMore = messages.length === limit;
    const oldestDate = messages.length > 0 && messages[0] ? messages[0].Created_At : null;

    return {
      messages,
      hasMore,
      oldestDate,
      source: 'database' // Apenas banco de dados - WhatsApp Web não permite busca histórica
    };
  }



  /**
   * Limpa mensagens com cache expirado
   */
  async cleanExpiredCache(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.messages.deleteMany({
      where: {
        Fetched_From_WhatsApp: true,
        Cache_Until: { lt: now }
      }
    });

    console.log(`🗑️ ${result.count} mensagens em cache expiradas foram removidas`);
    return result.count;
  }

  /**
   * Limpa mensagens antigas fora do período de retenção
   */
  async cleanOldMessages(companyId?: string): Promise<number> {
    const companies = companyId
      ? [await this.prisma.companies.findUnique({ where: { Id: companyId } })]
      : await this.prisma.companies.findMany();

    let totalDeleted = 0;

    for (const company of companies) {
      if (!company) continue;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - company.Retention_Days);

      const result = await this.prisma.messages.deleteMany({
        where: {
          Company_Id: company.Id,
          Created_At: { lt: cutoffDate },
          Fetched_From_WhatsApp: false // Não deletar mensagens resgatadas (já têm cache_until)
        }
      });

      totalDeleted += result.count;
      console.log(`🗑️ Empresa ${company.Name}: ${result.count} mensagens antigas removidas`);
    }

    return totalDeleted;
  }

  /**
   * Cadastrar clientes de conversas já existentes na sessão
   * NOTA: Não busca mensagens históricas (impossível via WhatsApp Web)
   * Apenas cadastra clientes de conversas que já estão no banco
   */
  async syncClientsFromExistingChats(sessionId: string): Promise<{
    newClients: number;
    existingClients: number;
  }> {
    try {
      console.log(`🔄 Cadastrando clientes de conversas existentes para sessão ${sessionId}`);

      // 1. Buscar sessão e empresa
      const session = await this.prisma.sessions.findUnique({
        where: { Id: sessionId }
      });

      if (!session) {
        console.log('❌ Sessão não encontrada no banco de dados');
        throw new Error('Sessão não encontrada');
      }

      const company = await this.prisma.companies.findUnique({
        where: { Id: session.Company_Id }
      });

      if (!company) {
        throw new Error('Empresa não encontrada');
      }

      // 2. Buscar todas as conversas da sessão (individuais e grupos)
      const chats = await this.prisma.chats.findMany({
        where: {
          Session_Id: sessionId
        }
      });

      if (chats.length === 0) {
        console.log('⚠️ Nenhuma conversa encontrada para esta sessão');
        return { newClients: 0, existingClients: 0 };
      }

      console.log(`📱 Encontradas ${chats.length} conversas (individuais e grupos)`);

      let newClients = 0;
      let existingClients = 0;

      // 3. Para cada conversa, cadastrar cliente se não existir
      for (const chat of chats) {
        try {
          // Verificar se é grupo e pular (grupos não têm clientes individuais)
          const isGroupChat = chat.WA_Chat_Id.includes('@g.us');
          if (isGroupChat) {
            console.log(`⚠️ Pulando grupo: ${chat.WA_Chat_Id}`);
            continue;
          }

          const phoneNumber = this.extractPhoneFromChatId(chat.WA_Chat_Id);
          
          if (!phoneNumber) {
            console.log(`⚠️ Não foi possível extrair número do chat: ${chat.WA_Chat_Id}`);
            continue;
          }

          const existingClient = await this.prisma.clients.findFirst({
            where: {
              Company_Id: company.Id,
              WhatsApp_Number: phoneNumber,
              Deleted_At: null
            }
          });

          if (!existingClient) {
            // Buscar informações do contato no WhatsApp
            const contactInfo = await this.getContactInfoFromWhatsApp(sessionId, chat.WA_Chat_Id);
            
            // Cadastrar novo cliente com dados reais do WhatsApp
            const newClient = await this.prisma.clients.create({
              data: {
                Company_Id: company.Id,
                Name: contactInfo.name || `Cliente ${phoneNumber}`,
                WhatsApp_Number: phoneNumber,
                Profile_Pic_URL: contactInfo.profilePicUrl || null,
                WA_User_Id: chat.WA_Chat_Id,
                Is_Blocked: false,
                Language: 'pt-BR'
              }
            });
            newClients++;
            console.log(`👤 Novo cliente cadastrado: ${contactInfo.name || phoneNumber} (${phoneNumber}) - ID: ${newClient.Id}`);
          } else {
            existingClients++;
            console.log(`👤 Cliente já existe: ${phoneNumber}`);
          }

        } catch (error) {
          console.error(`❌ Erro ao processar conversa ${chat.WA_Chat_Id}:`, error);
          // Continua com a próxima conversa
        }
      }

      const result = { newClients, existingClients };
      console.log(`✅ Cadastro de clientes concluído:`, result);
      return result;

    } catch (error) {
      console.error('❌ Erro no cadastro de clientes:', error);
      throw error;
    }
  }


  /**
   * Buscar informações do contato no WhatsApp
   */
  private async getContactInfoFromWhatsApp(sessionId: string, chatId: string): Promise<{
    name: string | null;
    profilePicUrl: string | null;
  }> {
    try {
      const session = wppManager.getSession(sessionId);
      if (!session || !session.isConnected()) {
        console.log('❌ Sessão não conectada para buscar contato');
        return { name: null, profilePicUrl: null };
      }

      const client = session.getClient();
      if (!client) {
        console.log('❌ Cliente WhatsApp não disponível');
        return { name: null, profilePicUrl: null };
      }

      // Buscar informações do contato
      const contact = await client.getContact(chatId);
      if (!contact) {
        console.log('❌ Contato não encontrado no WhatsApp');
        return { name: null, profilePicUrl: null };
      }

      // Obter nome do contato (prioridade: name > pushname > formattedName)
      let contactName = null;
      if (contact.name) {
        contactName = contact.name;
      } else if (contact.pushname) {
        contactName = contact.pushname;
      } else if (contact.formattedName) {
        contactName = contact.formattedName;
      }

      // Buscar foto de perfil
      let profilePicUrl = null;
      try {
        const profilePic = await client.getProfilePicFromServer(chatId);
        if (profilePic && profilePic.eurl) {
          profilePicUrl = profilePic.eurl;
        }
      } catch (error) {
        console.log('⚠️ Não foi possível obter foto de perfil:', error instanceof Error ? error.message : String(error));
      }

      console.log(`📋 Contato encontrado: ${contactName} (${chatId})`);
      return { name: contactName, profilePicUrl };
    } catch (error) {
      console.error('❌ Erro ao buscar informações do contato:', error);
      return { name: null, profilePicUrl: null };
    }
  }

  /**
   * Extrair e formatar número de telefone do chat ID do WhatsApp
   */
  private extractPhoneFromChatId(chatId: string): string | null {
    // Formato: 5511999999999@c.us (apenas conversas individuais)
    // Grupos têm formato: @g.us e não devem ser processados aqui
    const match = chatId.match(/^(\d+)@c\.us$/);
    if (match && match[1]) {
      let number = match[1];
      
      // Formatar número brasileiro (exemplo: 5514996579156)
      // Remover prefixos desnecessários e garantir formato correto
      if (number.startsWith('55')) {
        // Número já tem código do país Brasil (55)
        number = number;
      } else if (number.length === 11) {
        // Número sem código do país, adicionar 55
        number = '55' + number;
      } else if (number.length === 10) {
        // Número com 10 dígitos (sem DDD), adicionar 55 e DDD padrão (11)
        number = '5511' + number;
      }
      
      console.log(`📱 Número extraído e formatado do chat ${chatId}: ${number}`);
      return number;
    }
    console.log(`⚠️ Formato de chat não reconhecido ou é grupo: ${chatId}`);
    return null;
  }
}

export const messageRetentionService = new MessageRetentionService();
