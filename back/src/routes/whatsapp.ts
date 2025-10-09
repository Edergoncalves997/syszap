import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { wppManager } from '../whatsapp/WppManager';

export async function whatsappRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  // POST /whatsapp/sessions/:id/start - Iniciar sessão WhatsApp
  app.post('/whatsapp/sessions/:id/start', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      // Buscar sessão no banco
      const session = await prisma.sessions.findFirst({
        where: {
          Id: params.id,
          Deleted_At: null
        }
      });

      if (!session) {
        return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
      }

      // Iniciar sessão WPP
      const wppSession = await wppManager.startSession({
        sessionId: session.Id,
        companyId: session.Company_Id,
        sessionName: session.Session_Name,
        phoneNumber: session.Phone_Number
      });

      // Verificar status da sessão antes de aguardar QR Code
      const currentStatus = wppSession.getStatus();
      console.log(`📊 Status atual da sessão: ${currentStatus}`);

      // Se já está conectado, não precisa de QR Code
      if (currentStatus === 'isLogged' || currentStatus === 'inChat') {
        console.log('✅ Sessão já conectada, não precisa de QR Code');
        return {
          message: 'Sessão já conectada',
          status: wppSession.getStatus(),
          qrCode: null
        };
      }

      // Aguardar QR Code ser gerado (timeout de 60 segundos)
      console.log('⏳ Aguardando geração do QR Code...');
      const qrCode = await wppSession.waitForQRCode(60000);

      if (qrCode) {
        console.log('✅ QR Code gerado e retornado ao frontend');
        return {
          message: 'QR Code gerado com sucesso',
          status: wppSession.getStatus(),
          qrCode: qrCode
        };
      } else {
        console.log('⚠️ QR Code não foi gerado no timeout, mas sessão está iniciando');
        return {
          message: 'Sessão iniciando... Busque o QR Code em alguns segundos',
          status: wppSession.getStatus(),
          qrCode: null
        };
      }
    } catch (error: any) {
      console.error('Erro ao iniciar sessão:', error);
      return (reply as any).status(500).send({ 
        message: 'Erro ao iniciar sessão',
        error: error.message 
      });
    }
  });

  // GET /whatsapp/sessions/:id/qr - Obter QR Code
  app.get('/whatsapp/sessions/:id/qr', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      // Buscar QR code no manager
      const qrCode = wppManager.getSessionQRCode(params.id);

      if (!qrCode) {
        // Buscar no banco
        const session = await prisma.sessions.findUnique({
          where: { Id: params.id },
          select: { QR_SVG: true, QR_Expires_At: true, Status: true }
        });

        if (!session?.QR_SVG) {
          return (reply as any).status(404).send({ message: 'QR Code não disponível' });
        }

        // Verificar se expirou
        if (session.QR_Expires_At && new Date(session.QR_Expires_At) < new Date()) {
          return (reply as any).status(410).send({ message: 'QR Code expirado. Inicie a sessão novamente.' });
        }

        return { qrCode: session.QR_SVG, expiresAt: session.QR_Expires_At };
      }

      return { qrCode };
    } catch (error: any) {
      return (reply as any).status(400).send({ message: 'ID inválido' });
    }
  });

  // GET /whatsapp/sessions/:id/status - Status da sessão
  app.get('/whatsapp/sessions/:id/status', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      const status = wppManager.getSessionStatus(params.id);
      const session = wppManager.getSession(params.id);

      return {
        sessionId: params.id,
        status: status || 'not_started',
        isConnected: session?.isConnected() || false
      };
    } catch (error: any) {
      return (reply as any).status(400).send({ message: 'ID inválido' });
    }
  });

  // POST /whatsapp/sessions/:id/stop - Parar sessão
  app.post('/whatsapp/sessions/:id/stop', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      await wppManager.stopSession(params.id);

      return { message: 'Sessão desconectada com sucesso' };
    } catch (error: any) {
      return (reply as any).status(500).send({ 
        message: error.message || 'Erro ao parar sessão' 
      });
    }
  });

  // POST /whatsapp/messages/send - Enviar mensagem
  app.post('/whatsapp/messages/send', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', format: 'uuid' },
          to: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['sessionId', 'to', 'message']
      }
    }
  }, async (req, reply) => {
    try {
      const body = z.object({
        sessionId: z.string().uuid(),
        to: z.string().min(1),
        message: z.string().min(1)
      }).parse(req.body);

      // Formatar número se necessário
      let formattedTo = body.to;
      if (!formattedTo.includes('@')) {
        formattedTo = `${formattedTo}@c.us`;
      }

      const result = await wppManager.sendMessage(body.sessionId, formattedTo, body.message);

      return {
        message: 'Mensagem enviada com sucesso',
        result: {
          id: result.id,
          to: formattedTo
        }
      };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      return (reply as any).status(500).send({ 
        message: error.message || 'Erro ao enviar mensagem' 
      });
    }
  });

  // GET /whatsapp/sessions/:id/chats - Listar chats da sessão
  app.get('/whatsapp/sessions/:id/chats', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      const session = wppManager.getSession(params.id);

      if (!session) {
        return (reply as any).status(404).send({ message: 'Sessão não encontrada ou não iniciada' });
      }

      if (!session.isConnected()) {
        return (reply as any).status(400).send({ message: 'Sessão não está conectada' });
      }

      const chats = await session.getChats();

      return { chats };
    } catch (error: any) {
      return (reply as any).status(500).send({ 
        message: error.message || 'Erro ao buscar chats' 
      });
    }
  });

  // GET /whatsapp/sessions/:id/chats/:chatId/messages - Mensagens de um chat
  app.get('/whatsapp/sessions/:id/chats/:chatId/messages', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          chatId: { type: 'string' }
        },
        required: ['id', 'chatId']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50 }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ 
        id: z.string().uuid(),
        chatId: z.string()
      }).parse((req as any).params);

      const query = z.object({
        limit: z.number().int().min(1).max(200).optional().default(50)
      }).parse((req as any).query);

      const session = wppManager.getSession(params.id);

      if (!session) {
        return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
      }

      const messages = await session.getChatMessages(params.chatId, query.limit);

      return { messages, total: messages.length };
    } catch (error: any) {
      return (reply as any).status(500).send({ 
        message: error.message || 'Erro ao buscar mensagens' 
      });
    }
  });

  // GET /whatsapp/stats - Estatísticas das sessões
  app.get('/whatsapp/stats', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }]
    }
  }, async () => {
    return wppManager.getStats();
  });

  // POST /whatsapp/sessions/:id/sync - Sincronizar contatos e chats
  app.post('/whatsapp/sessions/:id/sync', {
    preHandler: requireManagerOrAdmin(),
    schema: {
      tags: ['WhatsApp'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse((req as any).params);

      const session = wppManager.getSession(params.id);

      if (!session) {
        return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
      }

      if (!session.isConnected()) {
        return (reply as any).status(400).send({ message: 'Sessão não está conectada' });
      }

      // Buscar chats do WhatsApp
      const chats = await session.getChats();

      return {
        message: 'Sincronização iniciada',
        totalChats: chats.length
      };
    } catch (error: any) {
      return (reply as any).status(500).send({ 
        message: error.message || 'Erro ao sincronizar' 
      });
    }
  });
}


