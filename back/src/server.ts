import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { companiesRoutes } from './routes/companies';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { clientsRoutes } from './routes/clients';
import { queuesRoutes } from './routes/queues';
import { categoriesRoutes } from './routes/categories';
import { ticketsRoutes } from './routes/tickets';
import { sessionsRoutes } from './routes/sessions';
import { chatsRoutes } from './routes/chats';
import { messagesRoutes } from './routes/messages';
import { mediaRoutes } from './routes/media';
import { whatsappRoutes } from './routes/whatsapp';
import { userQueuesRoutes } from './routes/userQueues';
import { wppManager } from './whatsapp/WppManager';
import { setupWebSocket } from './plugins/websocket';
import { maintenanceJobs } from './jobs/maintenanceJobs';

const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } });

async function bootstrap() {
  await app.register(cors, { 
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
  await app.register(swagger, {
    openapi: {
      info: { title: 'SysZap API', version: '1.0.0', description: 'API do SysZap (Auth, Users, Companies)' },
      servers: [{ url: 'http://localhost:3000', description: 'Dev' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Autenticação e perfil' },
        { name: 'Users', description: 'Gestão de usuários' },
        { name: 'Companies', description: 'Gestão de empresas' },
        { name: 'Clients', description: 'Gestão de clientes' },
        { name: 'Queues', description: 'Gestão de filas de atendimento' },
        { name: 'User Queues', description: 'Vínculo usuários-filas' },
        { name: 'Categories', description: 'Gestão de categorias' },
        { name: 'Tickets', description: 'Gestão de tickets' },
        { name: 'Sessions', description: 'Gestão de sessões WhatsApp' },
        { name: 'Chats', description: 'Gestão de conversas' },
        { name: 'Messages', description: 'Gestão de mensagens' },
        { name: 'Media', description: 'Gestão de mídias' },
        { name: 'WhatsApp', description: 'Integração WhatsApp (WPPConnect)' },
      ],
    },
  });
  await app.register(swaggerUI, { routePrefix: '/docs', uiConfig: { docExpansion: 'list' } });

  // Registrar WebSocket
  await setupWebSocket(app);

  app.get('/health', async () => ({ status: 'ok' }));
  
  // Rotas de autenticação e usuários
  await app.register(authRoutes);
  await app.register(usersRoutes);
  
  // Rotas de gestão empresarial
  await app.register(companiesRoutes);
  await app.register(clientsRoutes);
  await app.register(queuesRoutes);
  await app.register(userQueuesRoutes);
  await app.register(categoriesRoutes);
  
  // Rotas de tickets e atendimento
  await app.register(ticketsRoutes);
  
  // Rotas de WhatsApp
  await app.register(sessionsRoutes);
  await app.register(chatsRoutes);
  await app.register(messagesRoutes);
  await app.register(mediaRoutes);
  await app.register(whatsappRoutes);

  // Restaurar sessões WhatsApp ao iniciar
  console.log('🔄 Restaurando sessões WhatsApp...');
  setTimeout(async () => {
    try {
      await wppManager.restoreSessionsFromDatabase();
      console.log('✅ Sessões WhatsApp restauradas');
    } catch (error) {
      console.error('❌ Erro ao restaurar sessões:', error);
    }
  }, 2000); // Aguarda 2s para garantir que tudo está pronto

  // Iniciar jobs de manutenção (limpeza de cache e mensagens antigas)
  maintenanceJobs.startAll();

  const port = Number(process.env.PORT || 3000);
  const host = '0.0.0.0';
  await app.listen({ port, host });
  
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Documentação em http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  app.log.error(err);
  process.exit(1);
});


