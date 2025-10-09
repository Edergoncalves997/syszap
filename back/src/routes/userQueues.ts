import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';

export async function userQueuesRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// POST /user-queues - Vincular usuário a uma fila (ADMIN/MANAGER)
	app.post('/user-queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Vincular um usuário a uma fila de atendimento',
			body: {
				type: 'object',
				properties: {
					User_Id: { type: 'string', format: 'uuid' },
					Queue_Id: { type: 'string', format: 'uuid' }
				},
				required: ['User_Id', 'Queue_Id']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				User_Id: z.string().uuid(),
				Queue_Id: z.string().uuid()
			}).parse(req.body);

			// Verificar se o usuário existe
			const user = await prisma.users.findUnique({
				where: { Id: body.User_Id }
			});

			if (!user) {
				return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
			}

			// Verificar se a fila existe
			const queue = await prisma.queues.findUnique({
				where: { Id: body.Queue_Id }
			});

			if (!queue) {
				return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			}

			// Verificar se já existe o vínculo
			const existing = await prisma.user_Queues.findFirst({
				where: {
					User_Id: body.User_Id,
					Queue_Id: body.Queue_Id
				}
			});

			if (existing) {
				return (reply as any).status(409).send({ message: 'Usuário já está vinculado a esta fila' });
			}

			// Criar vínculo
			const userQueue = await prisma.user_Queues.create({
				data: {
					User_Id: body.User_Id,
					Queue_Id: body.Queue_Id
				},
				include: {
					User: {
						select: {
							Id: true,
							Name: true,
							Email: true,
							Role: true
						}
					},
					Queue: {
						select: {
							Id: true,
							Name: true,
							Greeting_Message: true,
							Is_Active: true
						}
					}
				}
			});

			return (reply as any).status(201).send(userQueue);
		} catch (error: any) {
			console.error('Erro ao vincular usuário à fila:', error);
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /user-queues/:id - Desvincular usuário de uma fila (ADMIN/MANAGER)
	app.delete('/user-queues/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Desvincular usuário de uma fila',
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

			// Verificar se o vínculo existe
			const userQueue = await prisma.user_Queues.findUnique({
				where: { Id: params.id }
			});

			if (!userQueue) {
				return (reply as any).status(404).send({ message: 'Vínculo não encontrado' });
			}

			// Deletar vínculo
			await prisma.user_Queues.delete({
				where: { Id: params.id }
			});

			return reply.code(204).send();
		} catch (error: any) {
			console.error('Erro ao desvincular usuário da fila:', error);
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// DELETE /user-queues/user/:userId/queue/:queueId - Desvincular usuário de fila específica
	app.delete('/user-queues/user/:userId/queue/:queueId', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Desvincular usuário de uma fila específica usando IDs de usuário e fila',
			params: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'uuid' },
					queueId: { type: 'string', format: 'uuid' }
				},
				required: ['userId', 'queueId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ 
				userId: z.string().uuid(),
				queueId: z.string().uuid()
			}).parse((req as any).params);

			// Buscar e deletar o vínculo
			const userQueue = await prisma.user_Queues.findFirst({
				where: {
					User_Id: params.userId,
					Queue_Id: params.queueId
				}
			});

			if (!userQueue) {
				return (reply as any).status(404).send({ message: 'Vínculo não encontrado' });
			}

			await prisma.user_Queues.delete({
				where: { Id: userQueue.Id }
			});

			return reply.code(204).send();
		} catch (error: any) {
			console.error('Erro ao desvincular usuário da fila:', error);
			return (reply as any).status(400).send({ message: 'IDs inválidos' });
		}
	});

	// GET /users/:userId/queues - Listar todas as filas de um usuário
	app.get('/users/:userId/queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Listar todas as filas vinculadas a um usuário',
			params: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'uuid' }
				},
				required: ['userId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ userId: z.string().uuid() }).parse((req as any).params);

			// Verificar se o usuário existe
			const user = await prisma.users.findUnique({
				where: { Id: params.userId },
				select: {
					Id: true,
					Name: true,
					Email: true,
					Role: true
				}
			});

			if (!user) {
				return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
			}

			// Buscar todas as filas do usuário
			const userQueues = await prisma.user_Queues.findMany({
				where: { User_Id: params.userId },
				include: {
					Queue: {
						select: {
							Id: true,
							Name: true,
							Greeting_Message: true,
							Is_Active: true,
							Company_Id: true,
							Created_At: true
						}
					}
				},
				orderBy: {
					Created_At: 'desc'
				}
			});

			return {
				user,
				queues: userQueues.map(uq => ({
					userQueueId: uq.Id,
					linkedAt: uq.Created_At,
					...uq.Queue
				})),
				total: userQueues.length
			};
		} catch (error: any) {
			console.error('Erro ao buscar filas do usuário:', error);
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /queues/:queueId/users - Listar todos os usuários de uma fila
	app.get('/queues/:queueId/users', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Listar todos os usuários vinculados a uma fila',
			params: {
				type: 'object',
				properties: {
					queueId: { type: 'string', format: 'uuid' }
				},
				required: ['queueId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ queueId: z.string().uuid() }).parse((req as any).params);

			// Verificar se a fila existe
			const queue = await prisma.queues.findUnique({
				where: { Id: params.queueId },
				select: {
					Id: true,
					Name: true,
					Greeting_Message: true,
					Is_Active: true,
					Company_Id: true,
					Created_At: true
				}
			});

			if (!queue) {
				return (reply as any).status(404).send({ message: 'Fila não encontrada' });
			}

			// Buscar todos os usuários da fila
			const queueUsers = await prisma.user_Queues.findMany({
				where: { Queue_Id: params.queueId },
				include: {
					User: {
						select: {
							Id: true,
							Name: true,
							Email: true,
							Role: true,
							Is_Active: true,
							Company_Id: true
						}
					}
				},
				orderBy: {
					Created_At: 'desc'
				}
			});

			return {
				queue,
				users: queueUsers.map(qu => ({
					userQueueId: qu.Id,
					linkedAt: qu.Created_At,
					...qu.User
				})),
				total: queueUsers.length
			};
		} catch (error: any) {
			console.error('Erro ao buscar usuários da fila:', error);
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /user-queues/bulk - Vincular usuário a múltiplas filas de uma vez
	app.post('/user-queues/bulk', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Vincular um usuário a múltiplas filas de uma só vez',
			body: {
				type: 'object',
				properties: {
					User_Id: { type: 'string', format: 'uuid' },
					Queue_Ids: { 
						type: 'array',
						items: { type: 'string', format: 'uuid' }
					}
				},
				required: ['User_Id', 'Queue_Ids']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				User_Id: z.string().uuid(),
				Queue_Ids: z.array(z.string().uuid()).min(1)
			}).parse(req.body);

			// Verificar se o usuário existe
			const user = await prisma.users.findUnique({
				where: { Id: body.User_Id }
			});

			if (!user) {
				return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
			}

			// Verificar quais filas já estão vinculadas
			const existingLinks = await prisma.user_Queues.findMany({
				where: {
					User_Id: body.User_Id,
					Queue_Id: { in: body.Queue_Ids }
				}
			});

			const existingQueueIds = existingLinks.map(link => link.Queue_Id);
			const newQueueIds = body.Queue_Ids.filter(id => !existingQueueIds.includes(id));

			// Criar novos vínculos apenas para filas que ainda não estão vinculadas
			const created = await Promise.all(
				newQueueIds.map(queueId => 
					prisma.user_Queues.create({
						data: {
							User_Id: body.User_Id,
							Queue_Id: queueId
						},
						include: {
							Queue: {
								select: {
									Id: true,
									Name: true,
									Is_Active: true
								}
							}
						}
					})
				)
			);

			return (reply as any).status(201).send({
				message: 'Usuário vinculado às filas com sucesso',
				created: created.length,
				skipped: existingQueueIds.length,
				links: created
			});
		} catch (error: any) {
			console.error('Erro ao vincular usuário às filas:', error);
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /users/:userId/queues/all - Desvincular usuário de todas as suas filas
	app.delete('/users/:userId/queues/all', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Desvincular usuário de todas as filas',
			params: {
				type: 'object',
				properties: {
					userId: { type: 'string', format: 'uuid' }
				},
				required: ['userId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ userId: z.string().uuid() }).parse((req as any).params);

			// Deletar todos os vínculos do usuário
			const result = await prisma.user_Queues.deleteMany({
				where: { User_Id: params.userId }
			});

			return {
				message: 'Usuário desvinculado de todas as filas',
				removed: result.count
			};
		} catch (error: any) {
			console.error('Erro ao desvincular usuário de todas as filas:', error);
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /user-queues - Listar todos os vínculos (com paginação e filtros)
	app.get('/user-queues', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['User Queues'], 
			security: [{ bearerAuth: [] }],
			description: 'Listar todos os vínculos usuário-fila',
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', default: 50 },
					offset: { type: 'integer', default: 0 },
					userId: { type: 'string', format: 'uuid' },
					queueId: { type: 'string', format: 'uuid' },
					companyId: { type: 'string', format: 'uuid' }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const query = z.object({
				limit: z.number().int().min(1).max(100).optional().default(50),
				offset: z.number().int().min(0).optional().default(0),
				userId: z.string().uuid().optional(),
				queueId: z.string().uuid().optional(),
				companyId: z.string().uuid().optional()
			}).parse((req as any).query);

			// Construir filtros
			const where: any = {};
			
			if (query.userId) {
				where.User_Id = query.userId;
			}
			
			if (query.queueId) {
				where.Queue_Id = query.queueId;
			}

			// Filtro por empresa através de joins
			if (query.companyId) {
				where.Queue = {
					Company_Id: query.companyId
				};
			}

			// Buscar vínculos
			const userQueues = await prisma.user_Queues.findMany({
				where,
				take: query.limit,
				skip: query.offset,
				include: {
					User: {
						select: {
							Id: true,
							Name: true,
							Email: true,
							Role: true,
							Company_Id: true
						}
					},
					Queue: {
						select: {
							Id: true,
							Name: true,
							Is_Active: true,
							Company_Id: true
						}
					}
				},
				orderBy: {
					Created_At: 'desc'
				}
			});

			// Contar total
			const total = await prisma.user_Queues.count({ where });

			return {
				userQueues,
				total,
				limit: query.limit,
				offset: query.offset
			};
		} catch (error: any) {
			console.error('Erro ao listar vínculos:', error);
			return (reply as any).status(400).send({ message: 'Parâmetros inválidos' });
		}
	});
}
