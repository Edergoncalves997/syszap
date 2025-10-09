import { getPrisma } from '../plugins/prisma';
import { wppManager } from '../whatsapp/WppManager';
import { emitNewMessage } from '../plugins/websocket';
import crypto from 'crypto';

/**
 * Estados do Ticket:
 * 0 = AGUARDANDO_CLIENTE (aguardando escolha de fila)
 * 1 = AGUARDANDO_ATENDENTE (na fila, esperando ser assumido)
 * 2 = EM_ATENDIMENTO (assumido por um atendente)
 * 3 = FINALIZADO
 * 4 = CANCELADO
 */

interface TicketContext {
  companyId: string;
  sessionId: string;
  clientId: string;
  chatId: string;
  clientNumber: string;
}

export class TicketService {
  private prisma = getPrisma();

  /**
   * Verifica se existe ticket aberto para o cliente
   */
  async getOpenTicket(clientId: string): Promise<any | null> {
    return this.prisma.tickets.findFirst({
      where: {
        Client_Id: clientId,
        Status: { in: [0, 1, 2] }, // Qualquer status que não seja finalizado/cancelado
        Deleted_At: null
      },
      include: {
        Queue: true,
        User: true
      },
      orderBy: {
        Created_At: 'desc'
      }
    });
  }

  /**
   * Cria um novo ticket e envia mensagem de saudação com opções de filas
   */
  async createTicketAndSendGreeting(context: TicketContext): Promise<any> {
    try {
      console.log(`🎫 Criando novo ticket para cliente ${context.clientId}`);

      // Buscar filas ativas da empresa
      const queues = await this.prisma.queues.findMany({
        where: {
          Company_Id: context.companyId,
          Is_Active: true,
          Deleted_At: null
        },
        orderBy: {
          Created_At: 'asc'
        }
      });

      if (queues.length === 0) {
        console.log('⚠️ Nenhuma fila ativa encontrada para a empresa');
        return null;
      }

      // Criar ticket sem atendente (User_Id NULL) com status AGUARDANDO_CLIENTE (0)
      // O atendente será atribuído quando aceitar o ticket
      const ticket = await this.prisma.tickets.create({
        data: {
          Company_Id: context.companyId,
          Client_Id: context.clientId,
          User_Id: null, // Sem atendente inicialmente
          Chat_Id: context.chatId,
          Subject: 'Novo atendimento',
          Status: 0, // AGUARDANDO_CLIENTE
          Priority: 1
        }
      });

      console.log(`✅ Ticket criado: ${ticket.Id}`);

      // Montar mensagem de saudação com opções de filas
      let greetingMessage = '🤖 *Olá! Bem-vindo ao nosso atendimento.*\n\n';
      greetingMessage += 'Por favor, escolha uma das opções abaixo digitando o *número* correspondente:\n\n';

      queues.forEach((queue, index) => {
        greetingMessage += `*${index + 1}* - ${queue.Name}\n`;
      });

      greetingMessage += '\n_Digite apenas o número da opção desejada._';

      // Enviar mensagem via WhatsApp
      const session = wppManager.getSession(context.sessionId);
      if (session && session.isConnected()) {
        await session.sendMessage(context.clientNumber, greetingMessage);
        console.log(`📤 Mensagem de saudação enviada para ${context.clientNumber}`);
      } else {
        console.log('⚠️ Sessão não está conectada, mensagem não enviada');
      }

      return ticket;
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  }

  /**
   * Processa a resposta do cliente e direciona para a fila escolhida
   */
  async processClientResponse(ticketId: string, message: string, companyId: string): Promise<boolean> {
    try {
      const ticket = await this.prisma.tickets.findUnique({
        where: { Id: ticketId },
        include: {
          Client: true
        }
      });

      if (!ticket || ticket.Status !== 0) {
        return false; // Ticket não está aguardando resposta
      }

      // Extrair número da mensagem
      const option = parseInt(message.trim());
      
      if (isNaN(option) || option < 1) {
        return false; // Resposta inválida
      }

      // Buscar filas ativas
      const queues = await this.prisma.queues.findMany({
        where: {
          Company_Id: companyId,
          Is_Active: true,
          Deleted_At: null
        },
        orderBy: {
          Created_At: 'asc'
        }
      });

      // Verificar se a opção é válida
      if (option > queues.length) {
        return false; // Opção inválida
      }

      const selectedQueue = queues[option - 1];
      if (!selectedQueue) {
        return false; // Fila não encontrada
      }

      // Buscar um atendente disponível na fila
      const queueUsers = await this.prisma.user_Queues.findMany({
        where: {
          Queue_Id: selectedQueue.Id
        },
        include: {
          User: true
        }
      });

      // Selecionar primeiro usuário disponível ou manter o padrão
      const assignedUser = queueUsers.length > 0 && queueUsers[0]
        ? queueUsers[0].User_Id
        : ticket.User_Id;

      // Atualizar ticket
      await this.prisma.tickets.update({
        where: { Id: ticketId },
        data: {
          Queue_Id: selectedQueue.Id,
          User_Id: assignedUser,
          Status: 1, // AGUARDANDO_ATENDENTE
          Subject: `Atendimento - ${selectedQueue.Name}`,
          Last_Message_At: new Date()
        }
      });

      console.log(`✅ Ticket ${ticketId} direcionado para fila ${selectedQueue.Name}`);

      // Enviar mensagem de confirmação
      const chat = await this.prisma.chats.findUnique({
        where: { Id: ticket.Chat_Id! },
        include: { Session: true }
      });

      if (chat) {
        const session = wppManager.getSession(chat.Session_Id);
        if (session && session.isConnected()) {
          const confirmMessage = selectedQueue.Greeting_Message || 
            `✅ Você foi direcionado para *${selectedQueue.Name}*.\n\nEm breve um de nossos atendentes irá responder.`;
          
          await session.sendMessage(ticket.Client.WhatsApp_Number + '@c.us', confirmMessage);
          console.log(`📤 Mensagem de confirmação enviada`);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao processar resposta do cliente:', error);
      return false;
    }
  }

  /**
   * Assume um ticket (atendente pega o ticket da fila)
   * Permite assumir tickets com Status 0 (aguardando cliente) ou Status 1 (aguardando atendente)
   */
  async assumeTicket(ticketId: string, userId: string): Promise<any> {
    try {
      const ticket = await this.prisma.tickets.findUnique({
        where: { Id: ticketId }
      });

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Permitir assumir tickets com Status 0 (aguardando cliente) ou Status 1 (aguardando atendente)
      if (ticket.Status !== 0 && ticket.Status !== 1) {
        throw new Error('Ticket não pode ser assumido. Status inválido.');
      }

      // Se o ticket já tem um atendente, verificar se é o mesmo usuário
      if (ticket.User_Id && ticket.User_Id !== userId) {
        throw new Error('Ticket já está sendo atendido por outro usuário');
      }

      // Atualizar ticket
      const updated = await this.prisma.tickets.update({
        where: { Id: ticketId },
        data: {
          User_Id: userId,
          Status: 2, // EM_ATENDIMENTO
          Last_Message_At: new Date()
        },
        include: {
          Client: true,
          Queue: true,
          User: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      });

      console.log(`✅ Ticket ${ticketId} assumido por ${userId} (Status anterior: ${ticket.Status})`);
      return updated;
    } catch (error) {
      console.error('❌ Erro ao assumir ticket:', error);
      throw error;
    }
  }

  /**
   * Finaliza um ticket
   */
  async finishTicket(ticketId: string, userId: string, resolutionText?: string): Promise<any> {
    try {
      const ticket = await this.prisma.tickets.findUnique({
        where: { Id: ticketId }
      });

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      if (ticket.Status === 3) {
        throw new Error('Ticket já está finalizado');
      }

      // Atualizar ticket
      const updated = await this.prisma.tickets.update({
        where: { Id: ticketId },
        data: {
          Status: 3, // FINALIZADO
          Resolution_Text: resolutionText || null,
          Last_Message_At: new Date()
        },
        include: {
          Client: true,
          Queue: true,
          User: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      });

      console.log(`✅ Ticket ${ticketId} finalizado`);
      return updated;
    } catch (error) {
      console.error('❌ Erro ao finalizar ticket:', error);
      throw error;
    }
  }

  /**
   * Lista tickets da fila para um atendente
   * Mostra apenas tickets que o usuário está atendendo OU que não têm atendente
   */
  async getQueueTicketsForUser(userId: string, status?: number): Promise<any[]> {
    try {
      // Buscar filas do usuário
      const userQueues = await this.prisma.user_Queues.findMany({
        where: { User_Id: userId },
        select: { Queue_Id: true }
      });

      const queueIds = userQueues.map(uq => uq.Queue_Id);

      // Buscar apenas tickets que:
      // 1. O usuário está atendendo (User_Id = userId) OU
      // 2. Não tem atendente (User_Id = null) e está em uma fila que o usuário atende OU
      // 3. Não tem atendente e ainda não escolheu fila (Queue_Id = null)
      const where: any = {
        Deleted_At: null,
        OR: [
          { User_Id: userId }, // Tickets que o usuário está atendendo
          { 
            User_Id: null, // Tickets sem atendente
            OR: [
              { Queue_Id: { in: queueIds } }, // Em filas que o usuário atende
              { Queue_Id: null } // Sem fila (aguardando escolha)
            ]
          }
        ]
      };

      if (status !== undefined) {
        where.Status = status;
      } else {
        // Por padrão, mostrar apenas tickets não finalizados
        where.Status = { in: [0, 1, 2] }; // AGUARDANDO_CLIENTE, AGUARDANDO_ATENDENTE ou EM_ATENDIMENTO
      }

      const tickets = await this.prisma.tickets.findMany({
        where,
        include: {
          Client: {
            select: {
              Id: true,
              Name: true,
              WhatsApp_Number: true,
              Profile_Pic_URL: true // Incluir foto do perfil
            }
          },
          Queue: {
            select: {
              Id: true,
              Name: true
            }
          },
          User: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        },
        orderBy: {
          Created_At: 'asc' // Mais antigos primeiro (FIFO)
        }
      });

      return tickets;
    } catch (error) {
      console.error('❌ Erro ao buscar tickets da fila:', error);
      throw error;
    }
  }

  /**
   * Transfere ticket para outra fila
   */
  async transferTicket(ticketId: string, newQueueId: string, userId: string): Promise<any> {
    try {
      const ticket = await this.prisma.tickets.findUnique({
        where: { Id: ticketId }
      });

      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      // Verificar se a nova fila existe
      const newQueue = await this.prisma.queues.findUnique({
        where: { Id: newQueueId }
      });

      if (!newQueue) {
        throw new Error('Fila não encontrada');
      }

      // Buscar usuário disponível na nova fila
      const queueUsers = await this.prisma.user_Queues.findMany({
        where: { Queue_Id: newQueueId }
      });

      const assignedUser = queueUsers.length > 0 && queueUsers[0]
        ? queueUsers[0].User_Id 
        : userId;

      // Atualizar ticket
      const updated = await this.prisma.tickets.update({
        where: { Id: ticketId },
        data: {
          Queue_Id: newQueueId,
          User_Id: assignedUser,
          Status: 1, // AGUARDANDO_ATENDENTE
          Subject: `Atendimento - ${newQueue.Name} (Transferido)`,
          Last_Message_At: new Date()
        },
        include: {
          Client: true,
          Queue: true,
          User: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      });

      console.log(`✅ Ticket ${ticketId} transferido para fila ${newQueue.Name}`);
      return updated;
    } catch (error) {
      console.error('❌ Erro ao transferir ticket:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem de atendimento via WhatsApp
   */
  async sendMessage(ticketId: string, userId: string, message: string) {
    try {
      // Buscar o ticket
      const ticket = await this.prisma.tickets.findFirst({
        where: {
          Id: ticketId,
          Deleted_At: null,
          Status: 2, // EM_ATENDIMENTO
          User_Id: userId // Apenas o usuário que está atendendo
        },
        include: {
          Client: true
        }
      });

      if (!ticket) {
        throw new Error('Ticket não encontrado ou não está em atendimento');
      }

      // Buscar o usuário para pegar o nome
      const userData = await this.prisma.users.findUnique({
        where: { Id: userId }
      });

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      // Adicionar prefixo com nome do atendente
      const messageWithPrefix = `*${userData.Name}:* ${message}`;

      // Buscar o chat para enviar via WhatsApp
      const chat = await this.prisma.chats.findUnique({
        where: { Id: ticket.Chat_Id! },
        include: { Session: true }
      });

      if (chat) {
        const session = wppManager.getSession(chat.Session_Id);
        if (session && session.isConnected()) {
          // Enviar mensagem via WhatsApp
          await session.sendMessage(ticket.Client.WhatsApp_Number + '@c.us', messageWithPrefix);
          console.log(`📤 Mensagem enviada via WhatsApp para ${ticket.Client.WhatsApp_Number}`);
          
          // Aguardar um pouco para evitar conflito com o processamento automático
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log('⚠️ Sessão não está conectada, mensagem não enviada via WhatsApp');
        }
      }

      // Salvar mensagem no banco
      const savedMessage = await this.prisma.messages.create({
        data: {
          Id: crypto.randomUUID(),
          Company_Id: ticket.Company_Id,
          Session_Id: chat!.Session_Id,
          Chat_Id: ticket.Chat_Id!,
          Direction: 1, // OUT
          Type: 0, // TEXT
          Body: messageWithPrefix,
          WA_Message_Id: crypto.randomUUID(),
          Status: 1, // SENT
          Created_At: new Date()
        },
        include: {
          Media: true
        }
      });

      // Emitir evento WebSocket para atualizar a interface em tempo real
      emitNewMessage(ticket.Company_Id, {
        ...savedMessage,
        Chat: { WA_Chat_Id: chat!.WA_Chat_Id },
        Client: { Name: ticket.Client.Name, WhatsApp_Number: ticket.Client.WhatsApp_Number }
      });

      console.log(`📤 Mensagem salva e emitida via WebSocket: ${savedMessage.Id}`);

      return {
        message: messageWithPrefix,
        messageId: savedMessage.Id,
        sentAt: savedMessage.Created_At
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
