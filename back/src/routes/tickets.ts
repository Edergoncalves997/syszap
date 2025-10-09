import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';
import { ticketService } from '../services/ticketService';

export async function ticketsRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /tickets - Listar todos os tickets
	app.get('/tickets', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.tickets.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' },
			include: {
				Client: { select: { Id: true, Name: true, WhatsApp_Number: true, Profile_Pic_URL: true } },
				User: { select: { Id: true, Name: true, Email: true } },
				Queue: { select: { Id: true, Name: true } },
				Category: { select: { Id: true, Name: true } }
			}
		});
	});

	// GET /tickets/:id - Buscar ticket por ID
	app.get('/tickets/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
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
			const ticket = await prisma.tickets.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				include: {
					Client: true,
					User: { select: { Id: true, Name: true, Email: true } },
					Queue: true,
					Category: true,
					Chat: true
				}
			});
			if (!ticket) return (reply as any).status(404).send({ message: 'Ticket não encontrado' });
			return ticket;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /tickets - Criar novo ticket
	app.post('/tickets', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Client_Id: { type: 'string', format: 'uuid' },
					User_Id: { type: 'string', format: 'uuid' },
					Queue_Id: { type: 'string', format: 'uuid', nullable: true },
					Category_Id: { type: 'string', format: 'uuid', nullable: true },
					Chat_Id: { type: 'string', format: 'uuid', nullable: true },
					Subject: { type: 'string' },
					Status: { type: 'integer' },
					Priority: { type: 'integer', nullable: true }
				},
				required: ['Company_Id', 'Client_Id', 'User_Id', 'Subject', 'Status']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Client_Id: z.string().uuid(),
				User_Id: z.string().uuid(),
				Queue_Id: z.string().uuid().optional(),
				Category_Id: z.string().uuid().optional(),
				Chat_Id: z.string().uuid().optional(),
				Subject: z.string().min(1).max(200),
				Status: z.number().int(),
				Priority: z.number().int().optional()
			}).parse(req.body);

			const created = await prisma.tickets.create({ 
				data: {
					Company_Id: body.Company_Id,
					Client_Id: body.Client_Id,
					User_Id: body.User_Id,
					Queue_Id: body.Queue_Id || null,
					Category_Id: body.Category_Id || null,
					Chat_Id: body.Chat_Id || null,
					Subject: body.Subject,
					Status: body.Status,
					Priority: body.Priority || null,
					Reopened_Count: 0
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /tickets/:id - Atualizar ticket
	app.put('/tickets/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
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
					User_Id: { type: 'string', format: 'uuid' },
					Queue_Id: { type: 'string', format: 'uuid', nullable: true },
					Category_Id: { type: 'string', format: 'uuid', nullable: true },
					Subject: { type: 'string' },
					Resolution_Text: { type: 'string', nullable: true },
					Status: { type: 'integer' },
					Priority: { type: 'integer', nullable: true }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				User_Id: z.string().uuid().optional(),
				Queue_Id: z.string().uuid().optional().nullable(),
				Category_Id: z.string().uuid().optional().nullable(),
				Subject: z.string().min(1).max(200).optional(),
				Resolution_Text: z.string().optional().nullable(),
				Status: z.number().int().optional(),
				Priority: z.number().int().optional().nullable()
			}).parse(req.body);

			// Verificar se o ticket existe e não está deletado
			const existing = await prisma.tickets.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existing) {
				return (reply as any).status(404).send({ message: 'Ticket não encontrado' });
			}

			const data: any = {};
			if (body.User_Id !== undefined) data.User_Id = body.User_Id;
			if (body.Queue_Id !== undefined) data.Queue_Id = body.Queue_Id;
			if (body.Category_Id !== undefined) data.Category_Id = body.Category_Id;
			if (body.Subject !== undefined) data.Subject = body.Subject;
			if (body.Resolution_Text !== undefined) data.Resolution_Text = body.Resolution_Text;
			if (body.Status !== undefined) data.Status = body.Status;
			if (body.Priority !== undefined) data.Priority = body.Priority;

			const updated = await prisma.tickets.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /tickets/:id - Deletar ticket (lógico)
	app.delete('/tickets/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
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

			// Verificar se o ticket existe e não está deletado
			const ticket = await prisma.tickets.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!ticket) {
				return (reply as any).status(404).send({ message: 'Ticket não encontrado' });
			}

			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.tickets, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /tickets/:id/restore - Restaurar ticket deletado
	app.post('/tickets/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
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

			// Verificar se o ticket existe e está deletado
			const ticket = await prisma.tickets.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!ticket) {
				return (reply as any).status(404).send({ message: 'Ticket deletado não encontrado' });
			}

			// Restaurar ticket
			await SoftDeleteUtils.restore(prisma, prisma.tickets, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Ticket restaurado com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:companyId/tickets - Listar tickets por empresa
	app.get('/companies/:companyId/tickets', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
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
			const tickets = await prisma.tickets.findMany({ 
				where: { 
					Company_Id: params.companyId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' },
				include: {
					Client: { select: { Id: true, Name: true, WhatsApp_Number: true, Profile_Pic_URL: true } },
					User: { select: { Id: true, Name: true } }
				}
			});
			return tickets;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /clients/:clientId/tickets - Listar tickets por cliente
	app.get('/clients/:clientId/tickets', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Tickets'], 
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
			const tickets = await prisma.tickets.findMany({ 
				where: { 
					Client_Id: params.clientId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' }
			});
			return tickets;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /tickets/:id/assume - Assumir um ticket (atendente pega o ticket da fila)
	app.post('/tickets/:id/assume', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Assumir um ticket da fila',
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
			const user = (req as any).user;

			const ticket = await ticketService.assumeTicket(params.id, user.userId);
			
			return (reply as any).status(200).send({
				message: 'Ticket assumido com sucesso',
				ticket
			});
		} catch (error: any) {
			console.error('Erro ao assumir ticket:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao assumir ticket' });
		}
	});

	// POST /tickets/:id/finish - Finalizar um ticket
	app.post('/tickets/:id/finish', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Finalizar um ticket',
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
					Resolution_Text: { type: 'string', nullable: true }
				}
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Resolution_Text: z.string().optional()
			}).parse(req.body);
			const user = (req as any).user;

			const ticket = await ticketService.finishTicket(params.id, user.userId, body.Resolution_Text);
			
			return (reply as any).status(200).send({
				message: 'Ticket finalizado com sucesso',
				ticket
			});
		} catch (error: any) {
			console.error('Erro ao finalizar ticket:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao finalizar ticket' });
		}
	});

	// POST /tickets/:id/transfer - Transferir ticket para outra fila
	app.post('/tickets/:id/transfer', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Transferir ticket para outra fila',
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
					Queue_Id: { type: 'string', format: 'uuid' }
				},
				required: ['Queue_Id']
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Queue_Id: z.string().uuid()
			}).parse(req.body);
			const user = (req as any).user;

			const ticket = await ticketService.transferTicket(params.id, body.Queue_Id, user.userId);
			
			return (reply as any).status(200).send({
				message: 'Ticket transferido com sucesso',
				ticket
			});
		} catch (error: any) {
			console.error('Erro ao transferir ticket:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao transferir ticket' });
		}
	});

	// GET /users/:userId/queue-tickets - Listar tickets das filas do usuário
	app.get('/users/:userId/queue-tickets', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Listar tickets das filas que o usuário atende',
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
					status: { type: 'integer', description: 'Filtrar por status específico' }
				}
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ userId: z.string().uuid() }).parse((req as any).params);
			const query = z.object({
				status: z.number().int().optional()
			}).parse((req as any).query);

			const tickets = await ticketService.getQueueTicketsForUser(params.userId, query.status);
			
			return {
				tickets,
				total: tickets.length
			};
		} catch (error: any) {
			console.error('Erro ao buscar tickets da fila:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao buscar tickets' });
		}
	});

	// GET /tickets/my-tickets - Listar tickets das filas do usuário logado
	app.get('/tickets/my-tickets', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Listar tickets das filas que eu atendo (usuário logado)',
			querystring: {
				type: 'object',
				properties: {
					status: { type: 'integer', description: 'Filtrar por status específico' }
				}
			}
		}
	}, async (req, reply) => {
		try {
			const user = (req as any).user;
			const query = z.object({
				status: z.number().int().optional()
			}).parse((req as any).query);

			const tickets = await ticketService.getQueueTicketsForUser(user.userId, query.status);
			
			return {
				tickets,
				total: tickets.length
			};
		} catch (error: any) {
			console.error('Erro ao buscar meus tickets:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao buscar tickets' });
		}
	});

	// POST /tickets/:id/send-message - Enviar mensagem de atendimento
	app.post('/tickets/:id/send-message', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Enviar mensagem de atendimento via WhatsApp',
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
					message: { type: 'string', minLength: 1 }
				},
				required: ['message']
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				message: z.string().min(1)
			}).parse(req.body);
			const user = (req as any).user;

			const result = await ticketService.sendMessage(params.id, user.userId, body.message);
			
			return (reply as any).status(200).send({
				message: 'Mensagem enviada com sucesso',
				data: result
			});
		} catch (error: any) {
			console.error('Erro ao enviar mensagem:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao enviar mensagem' });
		}
	});

	// GET /tickets/:id/messages - Buscar mensagens de um ticket
	app.get('/tickets/:id/messages', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Tickets'],
			security: [{ bearerAuth: [] }],
			description: 'Buscar mensagens de um ticket',
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
			const user = (req as any).user;

			// Verificar se o usuário tem acesso ao ticket
			const ticket = await prisma.tickets.findFirst({
				where: {
					Id: params.id,
					Deleted_At: null,
					OR: [
						{ User_Id: user.userId }, // Usuário está atendendo
						{ Status: 0 } // Ticket sem fila (todos podem ver)
					]
				}
			});

			if (!ticket) {
				return (reply as any).status(404).send({ message: 'Ticket não encontrado ou sem permissão' });
			}

			// Buscar mensagens do ticket através do chat
			const messages = ticket.Chat_Id ? await prisma.messages.findMany({
				where: {
					Chat_Id: ticket.Chat_Id
				},
				orderBy: {
					Created_At: 'asc'
				}
			}) : [];

			return {
				messages,
				total: messages.length
			};
		} catch (error: any) {
			console.error('Erro ao buscar mensagens:', error);
			return (reply as any).status(400).send({ message: error.message || 'Erro ao buscar mensagens' });
		}
	});
}


