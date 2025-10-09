import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { messageRetentionService } from '../services/messageRetentionService';

export async function messagesRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /messages - Listar todas as mensagens (paginado)
	app.get('/messages', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
			security: [{ bearerAuth: [] }],
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', default: 50 },
					offset: { type: 'integer', default: 0 },
					companyId: { type: 'string', format: 'uuid' }
				}
			}
		} 
	}, async (req) => {
		const query = z.object({
			limit: z.number().int().min(1).max(100).optional().default(50),
			offset: z.number().int().min(0).optional().default(0),
			companyId: z.string().uuid().optional()
		}).parse((req as any).query);

		const user = (req as any).user;

		// Construir filtro baseado nas permissões do usuário
		const where: any = {};
		
		// MANAGER só pode ver mensagens de sua empresa
		if (user.role === 1) {
			where.Company_Id = user.companyId;
		}
		// ADMIN pode filtrar por empresa específica ou ver todas
		else if (user.role === 0 && query.companyId) {
			where.Company_Id = query.companyId;
		}

		return prisma.messages.findMany({ 
			where,
			take: query.limit,
			skip: query.offset,
			orderBy: { Created_At: 'desc' },
			include: {
				Media: {
					select: {
						Id: true,
						Mime_Type: true,
						Storage_Key: true,
						Storage_Provider: true
					}
				},
				Chat: {
					select: {
						WA_Chat_Id: true,
						Client: {
							select: {
								Name: true,
								WhatsApp_Number: true
							}
						}
					}
				}
			}
		});
	});

	// GET /messages/:id - Buscar mensagem por ID
	app.get('/messages/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
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
			const message = await prisma.messages.findUnique({ 
				where: { Id: params.id },
				include: {
					Media: true
				}
			});
			if (!message) return (reply as any).status(404).send({ message: 'Mensagem não encontrada' });
			return message;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /chats/:chatId/messages - Listar mensagens por chat
	app.get('/chats/:chatId/messages', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					chatId: { type: 'string', format: 'uuid' }
				},
				required: ['chatId']
			},
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', default: 50 },
					offset: { type: 'integer', default: 0 }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ chatId: z.string().uuid() }).parse((req as any).params);
			const query = z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0)
			}).parse((req as any).query);

			const messages = await prisma.messages.findMany({ 
				where: { Chat_Id: params.chatId },
				take: query.limit,
				skip: query.offset,
				orderBy: { Created_At: 'asc' },
				include: {
					Media: { select: { Id: true, Mime_Type: true, Storage_Key: true } }
				}
			});
			return messages;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /clients/:clientId/messages - Listar mensagens por cliente (com retenção híbrida)
	app.get('/clients/:clientId/messages', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					clientId: { type: 'string', format: 'uuid' }
				},
				required: ['clientId']
			},
			querystring: {
				type: 'object',
				properties: {
					sessionId: { type: 'string', format: 'uuid' },
					beforeDate: { type: 'string', format: 'date-time' },
					days: { type: 'integer', default: 7 },
					limit: { type: 'integer', default: 50 }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ clientId: z.string().uuid() }).parse((req as any).params);
			const query = z.object({
				sessionId: z.string().uuid().optional(),
				beforeDate: z.string().datetime().optional(),
				days: z.number().int().min(1).max(90).optional().default(7),
				limit: z.number().int().min(1).max(200).optional().default(50)
			}).parse((req as any).query);

			// Validar que sessionId é obrigatório
			if (!query.sessionId) {
				return (reply as any).status(400).send({ message: 'sessionId é obrigatório' });
			}

			// Verificar permissões do usuário
			const user = (req as any).user;
			const client = await prisma.clients.findUnique({
				where: { Id: params.clientId },
				include: { Company: true }
			});

			if (!client) {
				return (reply as any).status(404).send({ message: 'Cliente não encontrado' });
			}

			// Verificar se o usuário tem acesso ao cliente
			// ADMIN pode ver clientes de qualquer empresa
			// MANAGER só pode ver clientes de sua empresa
			if (user.role === 1 && client.Company_Id !== user.companyId) {
				return (reply as any).status(403).send({ message: 'Acesso negado. Você só pode ver clientes de sua empresa.' });
			}

			console.log(`🔍 Buscando mensagens para cliente ${params.clientId} na sessão ${query.sessionId}`);
			
			// Usar serviço de retenção híbrida
			const requestParams: any = {
				clientId: params.clientId,
				sessionId: query.sessionId,
				days: query.days,
				limit: query.limit
			};

			if (query.beforeDate) {
				requestParams.beforeDate = new Date(query.beforeDate);
			}

			const result = await messageRetentionService.getMessagesWithRetention(requestParams);
			
			console.log(`📨 Resultado da busca: ${result.messages.length} mensagens encontradas (fonte: ${result.source})`);

			return {
				messages: result.messages,
				hasMore: result.hasMore,
				oldestDate: result.oldestDate,
				source: result.source, // 'database', 'hybrid', 'none'
				periodDays: query.days
			};
		} catch (error: any) {
			console.error('Erro ao buscar mensagens do cliente:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao buscar mensagens' });
		}
	});

	// POST /messages/cleanup/cache - Limpar cache expirado manualmente (ADMIN)
	app.post('/messages/cleanup/cache', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Messages'],
			security: [{ bearerAuth: [] }]
		}
	}, async (req, reply) => {
		try {
			const count = await messageRetentionService.cleanExpiredCache();
			return { message: 'Cache limpo com sucesso', count };
		} catch (error: any) {
			return (reply as any).status(500).send({ message: 'Erro ao limpar cache' });
		}
	});

	// POST /messages/cleanup/old - Limpar mensagens antigas manualmente (ADMIN)
	app.post('/messages/cleanup/old', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Messages'],
			security: [{ bearerAuth: [] }],
			querystring: {
				type: 'object',
				properties: {
					companyId: { type: 'string', format: 'uuid' }
				}
			}
		}
	}, async (req, reply) => {
		try {
			const query = z.object({
				companyId: z.string().uuid().optional()
			}).parse((req as any).query);

			const count = await messageRetentionService.cleanOldMessages(query.companyId);
			return { message: 'Mensagens antigas removidas com sucesso', count };
		} catch (error: any) {
			return (reply as any).status(500).send({ message: 'Erro ao limpar mensagens' });
		}
	});

	// POST /messages - Criar nova mensagem (envio)
	app.post('/messages', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Session_Id: { type: 'string', format: 'uuid' },
					Chat_Id: { type: 'string', format: 'uuid' },
					WA_Message_Id: { type: 'string' },
					Direction: { type: 'integer' },
					Message_Type: { type: 'integer' },
					Body: { type: 'string', nullable: true },
					From_Me: { type: 'boolean' },
					Ack_Status: { type: 'integer' }
				},
				required: ['Company_Id', 'Session_Id', 'Chat_Id', 'WA_Message_Id', 'Direction', 'Message_Type', 'From_Me', 'Ack_Status']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Session_Id: z.string().uuid(),
				Chat_Id: z.string().uuid(),
				WA_Message_Id: z.string().min(1).max(128),
				Direction: z.number().int(),
				Type: z.number().int(),
				Body: z.string().optional(),
				Status: z.number().int(),
				Media_Id: z.string().uuid().optional()
			}).parse(req.body);

			const created = await prisma.messages.create({ 
				data: {
					Company_Id: body.Company_Id,
					Session_Id: body.Session_Id,
					Chat_Id: body.Chat_Id,
					WA_Message_Id: body.WA_Message_Id,
					Direction: body.Direction,
					Type: body.Type,
					Body: body.Body || null,
					Status: body.Status,
					Media_Id: body.Media_Id || null
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /messages/:id/ack - Atualizar status de ACK da mensagem
	app.put('/messages/:id/ack', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Messages'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					id: { type: 'string', format: 'uuid' }
				},
				required: ['id']
			},
			body: {
				type: 'object',
				properties: {
					Ack_Status: { type: 'integer' }
				},
				required: ['Ack_Status']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Status: z.number().int()
			}).parse(req.body);

			const message = await prisma.messages.findUnique({ where: { Id: params.id } });
			if (!message) {
				return (reply as any).status(404).send({ message: 'Mensagem não encontrada' });
			}

			const updated = await prisma.messages.update({ 
				where: { Id: params.id }, 
				data: { Status: body.Status }
			});
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// Endpoint para sincronizar mensagens de 60 dias
	app.post('/messages/sync/:sessionId', {
		schema: {
			description: 'Sincronizar mensagens de até 60 dias atrás',
			params: {
				type: 'object',
				properties: {
					sessionId: { type: 'string', format: 'uuid' }
				}
			},
			querystring: {
				type: 'object',
				properties: {
					days: { type: 'integer', minimum: 1, maximum: 60, default: 60 }
				}
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ sessionId: z.string().uuid() }).parse((req as any).params);
		console.log(`🔄 Cadastrando clientes de conversas existentes para sessão ${params.sessionId}`);
		
		const result = await messageRetentionService.syncClientsFromExistingChats(params.sessionId);

			return {
				message: 'Sincronização concluída com sucesso',
				stats: result
			};
		} catch (error: any) {
			console.error('❌ Erro na sincronização:', error);
			return (reply as any).status(500).send({ 
				message: 'Erro na sincronização', 
				error: error.message 
			});
		}
	});
}

