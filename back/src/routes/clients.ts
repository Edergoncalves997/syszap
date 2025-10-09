import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function clientsRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /clients - Listar todos os clientes
	app.get('/clients', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.clients.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' },
			select: { 
				Id: true, 
				Company_Id: true, 
				Name: true, 
				WhatsApp_Number: true, 
				Profile_Pic_URL: true,
				Is_Blocked: true,
				Last_Contact_At: true,
				Created_At: true 
			}
		});
	});

	// GET /clients/:id - Buscar cliente por ID
	app.get('/clients/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
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
			const client = await prisma.clients.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!client) return (reply as any).status(404).send({ message: 'Cliente não encontrado' });
			return client;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /clients - Criar novo cliente
	app.post('/clients', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Name: { type: 'string' },
					WhatsApp_Number: { type: 'string' },
					WA_User_Id: { type: 'string', nullable: true },
					Chat_Id_Alias: { type: 'string', nullable: true },
					Profile_Pic_URL: { type: 'string', nullable: true },
					Language: { type: 'string', nullable: true }
				},
				required: ['Company_Id', 'Name', 'WhatsApp_Number']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Name: z.string().min(1).max(120),
				WhatsApp_Number: z.string().min(1).max(20),
				WA_User_Id: z.string().max(64).optional(),
				Chat_Id_Alias: z.string().max(128).optional(),
				Profile_Pic_URL: z.string().optional(),
				Language: z.string().max(10).optional()
			}).parse(req.body);

			// Verificar se já existe um cliente com o mesmo número na empresa
			const existing = await prisma.clients.findFirst({
				where: {
					Company_Id: body.Company_Id,
					WhatsApp_Number: body.WhatsApp_Number,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (existing) {
				return (reply as any).status(409).send({ message: 'Cliente com este número já existe nesta empresa' });
			}

			const created = await prisma.clients.create({ 
				data: {
					Company_Id: body.Company_Id,
					Name: body.Name,
					WhatsApp_Number: body.WhatsApp_Number,
					WA_User_Id: body.WA_User_Id || null,
					Chat_Id_Alias: body.Chat_Id_Alias || null,
					Profile_Pic_URL: body.Profile_Pic_URL || null,
					Language: body.Language || null,
					Is_Blocked: false
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /clients/:id - Atualizar cliente
	app.put('/clients/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
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
					WhatsApp_Number: { type: 'string' },
					Profile_Pic_URL: { type: 'string', nullable: true },
					Is_Blocked: { type: 'boolean' },
					Language: { type: 'string', nullable: true }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Name: z.string().min(1).max(120).optional(),
				WhatsApp_Number: z.string().min(1).max(20).optional(),
				Profile_Pic_URL: z.string().optional().nullable(),
				Is_Blocked: z.boolean().optional(),
				Language: z.string().max(10).optional().nullable()
			}).parse(req.body);

			// Verificar se o cliente existe e não está deletado
			const existing = await prisma.clients.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existing) {
				return (reply as any).status(404).send({ message: 'Cliente não encontrado' });
			}

			// Se está alterando o WhatsApp, verificar se não há duplicação
			if (body.WhatsApp_Number && body.WhatsApp_Number !== existing.WhatsApp_Number) {
				const duplicate = await prisma.clients.findFirst({
					where: {
						Company_Id: existing.Company_Id,
						WhatsApp_Number: body.WhatsApp_Number,
						Id: { not: params.id },
						...SoftDeleteUtils.getNotDeletedFilter()
					}
				});
				if (duplicate) {
					return (reply as any).status(409).send({ message: 'Outro cliente com este número já existe nesta empresa' });
				}
			}

			const data: any = {};
			if (body.Name !== undefined) data.Name = body.Name;
			if (body.WhatsApp_Number !== undefined) data.WhatsApp_Number = body.WhatsApp_Number;
			if (body.Profile_Pic_URL !== undefined) data.Profile_Pic_URL = body.Profile_Pic_URL;
			if (body.Is_Blocked !== undefined) data.Is_Blocked = body.Is_Blocked;
			if (body.Language !== undefined) data.Language = body.Language;

			const updated = await prisma.clients.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /clients/:id - Deletar cliente (lógico)
	app.delete('/clients/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
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

			// Verificar se o cliente existe e não está deletado
			const client = await prisma.clients.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!client) {
				return (reply as any).status(404).send({ message: 'Cliente não encontrado' });
			}

			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.clients, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /clients/:id/restore - Restaurar cliente deletado
	app.post('/clients/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Clients'],
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

			// Verificar se o cliente existe e está deletado
			const client = await prisma.clients.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!client) {
				return (reply as any).status(404).send({ message: 'Cliente deletado não encontrado' });
			}

			// Restaurar cliente
			await SoftDeleteUtils.restore(prisma, prisma.clients, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Cliente restaurado com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:companyId/clients - Listar clientes por empresa
	app.get('/companies/:companyId/clients', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Clients'], 
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
			const clients = await prisma.clients.findMany({ 
				where: { 
					Company_Id: params.companyId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' }
			});
			return clients;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}


