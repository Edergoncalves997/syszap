import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';

export async function chatsRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /chats - Listar todos os chats
	app.get('/chats', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Chats'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.chats.findMany({ 
			take: 50, 
			orderBy: { Last_Message_At: 'desc' },
			include: {
				Client: { select: { Id: true, Name: true, WhatsApp_Number: true } },
				Session: { select: { Id: true, Session_Name: true, Phone_Number: true } }
			}
		});
	});

	// GET /chats/:id - Buscar chat por ID
	app.get('/chats/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Chats'], 
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
			const chat = await prisma.chats.findUnique({ 
				where: { Id: params.id },
				include: {
					Client: true,
					Session: true
				}
			});
			if (!chat) return (reply as any).status(404).send({ message: 'Chat não encontrado' });
			return chat;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /clients/:clientId/chats - Listar chats por cliente
	app.get('/clients/:clientId/chats', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Chats'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					clientId: { type: 'string', format: 'uuid' }
				},
				required: ['clientId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ clientId: z.string().uuid() }).parse((req as any).params);
			const chats = await prisma.chats.findMany({ 
				where: { Client_Id: params.clientId },
				orderBy: { Last_Message_At: 'desc' }
			});
			return chats;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /sessions/:sessionId/chats - Listar chats por sessão
	app.get('/sessions/:sessionId/chats', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Chats'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					sessionId: { type: 'string', format: 'uuid' }
				},
				required: ['sessionId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ sessionId: z.string().uuid() }).parse((req as any).params);
			const chats = await prisma.chats.findMany({ 
				where: { Session_Id: params.sessionId },
				orderBy: { Last_Message_At: 'desc' },
				include: {
					Client: { select: { Id: true, Name: true, WhatsApp_Number: true } }
				}
			});
			return chats;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}



