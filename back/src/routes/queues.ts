import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function queuesRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /queues - Listar todas as filas
	app.get('/queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.queues.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' }
		});
	});

	// GET /queues/:id - Buscar fila por ID
	app.get('/queues/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
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
			const queue = await prisma.queues.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!queue) return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			return queue;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /queues - Criar nova fila
	app.post('/queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Name: { type: 'string' },
					Greeting_Message: { type: 'string' },
					Is_Active: { type: 'boolean' }
				},
				required: ['Company_Id', 'Name', 'Greeting_Message']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Name: z.string().min(1).max(100),
				Greeting_Message: z.string().min(1),
				Is_Active: z.boolean().optional()
			}).parse(req.body);

			const created = await prisma.queues.create({ 
				data: {
					Company_Id: body.Company_Id,
					Name: body.Name,
					Greeting_Message: body.Greeting_Message,
					Is_Active: body.Is_Active ?? true
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /queues/:id - Atualizar fila
	app.put('/queues/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
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
					Name: { type: 'string' },
					Greeting_Message: { type: 'string' },
					Is_Active: { type: 'boolean' }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Name: z.string().min(1).max(100).optional(),
				Greeting_Message: z.string().min(1).optional(),
				Is_Active: z.boolean().optional()
			}).parse(req.body);

			// Verificar se a fila existe e não está deletada
			const existing = await prisma.queues.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existing) {
				return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			}

			const data: any = {};
			if (body.Name !== undefined) data.Name = body.Name;
			if (body.Greeting_Message !== undefined) data.Greeting_Message = body.Greeting_Message;
			if (body.Is_Active !== undefined) data.Is_Active = body.Is_Active;

			const updated = await prisma.queues.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /queues/:id - Deletar fila (lógico)
	app.delete('/queues/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
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

			// Verificar se a fila existe e não está deletada
			const queue = await prisma.queues.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!queue) {
				return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			}

			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.queues, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /queues/:id/restore - Restaurar fila deletada
	app.post('/queues/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Queues'],
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

			// Verificar se a fila existe e está deletada
			const queue = await prisma.queues.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!queue) {
				return (reply as any).status(404).send({ message: 'Fila deletada não encontrada' });
			}

			// Restaurar fila
			await SoftDeleteUtils.restore(prisma, prisma.queues, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Fila restaurada com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:companyId/queues - Listar filas por empresa
	app.get('/companies/:companyId/queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					companyId: { type: 'string', format: 'uuid' }
				},
				required: ['companyId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ companyId: z.string().uuid() }).parse((req as any).params);
			const queues = await prisma.queues.findMany({ 
				where: { 
					Company_Id: params.companyId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' }
			});
			return queues;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /queues/:queueId/tickets/user/:userId - Listar tickets de uma fila por usuário
	app.get('/queues/:queueId/tickets/user/:userId', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					queueId: { type: 'string', format: 'uuid' },
					userId: { type: 'string', format: 'uuid' }
				},
				required: ['queueId', 'userId']
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
			const params = z.object({ 
				queueId: z.string().uuid(),
				userId: z.string().uuid()
			}).parse((req as any).params);
			
			const query = z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0)
			}).parse((req as any).query);

			// Verificar se a fila existe
			const queue = await prisma.queues.findFirst({
				where: { 
					Id: params.queueId,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!queue) {
				return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			}

			// Buscar tickets da fila para o usuário específico
			const tickets = await prisma.tickets.findMany({ 
				where: { 
					Queue_Id: params.queueId,
					User_Id: params.userId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				take: query.limit,
				skip: query.offset,
				orderBy: { Created_At: 'desc' },
				include: {
					Client: { select: { Id: true, Name: true, WhatsApp_Number: true } },
					Category: { select: { Id: true, Name: true } }
				}
			});

			// Contar total de tickets
			const total = await prisma.tickets.count({
				where: { 
					Queue_Id: params.queueId,
					User_Id: params.userId,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});

			return { tickets, total, limit: query.limit, offset: query.offset };
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /queues/tickets/user/:userId - Listar TODOS os tickets de um usuário (de todas as filas)
	app.get('/queues/tickets/user/:userId', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Queues'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'uuid' }
				},
				required: ['userId']
			},
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', default: 50 },
					offset: { type: 'integer', default: 0 },
					status: { type: 'integer', description: 'Filtrar por status do ticket' }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ 
				userId: z.string().uuid()
			}).parse((req as any).params);
			
			const query = z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0),
				status: z.number().int().optional()
			}).parse((req as any).query);

			// Construir filtro
			const where: any = { 
				User_Id: params.userId,
				...SoftDeleteUtils.getNotDeletedFilter()
			};

			// Adicionar filtro de status se fornecido
			if (query.status !== undefined) {
				where.Status = query.status;
			}

			// Buscar tickets do usuário
			const tickets = await prisma.tickets.findMany({ 
				where,
				take: query.limit,
				skip: query.offset,
				orderBy: { Created_At: 'desc' },
				include: {
					Client: { select: { Id: true, Name: true, WhatsApp_Number: true } },
					Queue: { select: { Id: true, Name: true } },
					Category: { select: { Id: true, Name: true } }
				}
			});

			// Contar total de tickets
			const total = await prisma.tickets.count({ where });

			return { tickets, total, limit: query.limit, offset: query.offset };
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Parâmetros inválidos' });
		}
	});
}

