import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function sessionsRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /sessions - Listar todas as sessões
	app.get('/sessions', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.sessions.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' },
			select: {
				Id: true,
				Company_Id: true,
				Session_Name: true,
				Phone_Number: true,
				Status: true,
				Last_Heartbeat: true,
				Reauth_Required: true,
				Created_At: true,
				Updated_At: true
			}
		});
	});

	// GET /sessions/:id - Buscar sessão por ID
	app.get('/sessions/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
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
			const session = await prisma.sessions.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!session) return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
			return session;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /sessions - Criar nova sessão
	app.post('/sessions', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Session_Name: { type: 'string' },
					Phone_Number: { type: 'string' },
					Status: { type: 'integer' },
					Session_Token: { type: 'string' },
					Webhook_URL: { type: 'string', nullable: true },
					Storage_Type: { type: 'string', nullable: true }
				},
				required: ['Company_Id', 'Session_Name', 'Phone_Number', 'Status', 'Session_Token']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Session_Name: z.string().min(1).max(100),
				Phone_Number: z.string().min(1).max(20),
				Status: z.number().int(),
				Session_Token: z.string().min(1).max(255),
				Webhook_URL: z.string().optional(),
				Storage_Type: z.string().optional()
			}).parse(req.body);

			// Verificar se já existe uma sessão com o mesmo número na empresa
			const existing = await prisma.sessions.findFirst({
				where: {
					Company_Id: body.Company_Id,
					Phone_Number: body.Phone_Number,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (existing) {
				return (reply as any).status(409).send({ message: 'Sessão com este número já existe nesta empresa' });
			}

			const created = await prisma.sessions.create({ 
				data: {
					Company_Id: body.Company_Id,
					Session_Name: body.Session_Name,
					Phone_Number: body.Phone_Number,
					Status: body.Status,
					Session_Token: body.Session_Token,
					Webhook_URL: body.Webhook_URL || null,
					Storage_Type: body.Storage_Type || null,
					Reauth_Required: false
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /sessions/:id - Atualizar sessão
	app.put('/sessions/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
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
					Session_Name: { type: 'string' },
					Status: { type: 'integer' },
					Session_Token: { type: 'string' },
					Webhook_URL: { type: 'string', nullable: true },
					QR_SVG: { type: 'string', nullable: true },
					Reauth_Required: { type: 'boolean' },
					Storage_Type: { type: 'string', nullable: true }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Session_Name: z.string().min(1).max(100).optional(),
				Status: z.number().int().optional(),
				Session_Token: z.string().min(1).max(255).optional(),
				Webhook_URL: z.string().optional().nullable(),
				QR_SVG: z.string().optional().nullable(),
				Reauth_Required: z.boolean().optional(),
				Storage_Type: z.string().optional().nullable()
			}).parse(req.body);

			// Verificar se a sessão existe e não está deletada
			const existing = await prisma.sessions.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existing) {
				return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
			}

			const data: any = {};
			if (body.Session_Name !== undefined) data.Session_Name = body.Session_Name;
			if (body.Status !== undefined) data.Status = body.Status;
			if (body.Session_Token !== undefined) data.Session_Token = body.Session_Token;
			if (body.Webhook_URL !== undefined) data.Webhook_URL = body.Webhook_URL;
			if (body.QR_SVG !== undefined) data.QR_SVG = body.QR_SVG;
			if (body.Reauth_Required !== undefined) data.Reauth_Required = body.Reauth_Required;
			if (body.Storage_Type !== undefined) data.Storage_Type = body.Storage_Type;

			const updated = await prisma.sessions.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /sessions/:id - Deletar sessão (lógico)
	app.delete('/sessions/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
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

			// Verificar se a sessão existe e não está deletada
			const session = await prisma.sessions.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!session) {
				return (reply as any).status(404).send({ message: 'Sessão não encontrada' });
			}

			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.sessions, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /sessions/:id/restore - Restaurar sessão deletada
	app.post('/sessions/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Sessions'],
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

			// Verificar se a sessão existe e está deletada
			const session = await prisma.sessions.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!session) {
				return (reply as any).status(404).send({ message: 'Sessão deletada não encontrada' });
			}

			// Restaurar sessão
			await SoftDeleteUtils.restore(prisma, prisma.sessions, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Sessão restaurada com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:companyId/sessions - Listar sessões por empresa
	app.get('/companies/:companyId/sessions', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Sessions'], 
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
			const sessions = await prisma.sessions.findMany({ 
				where: { 
					Company_Id: params.companyId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' },
				select: {
					Id: true,
					Session_Name: true,
					Phone_Number: true,
					Status: true,
					Last_Heartbeat: true,
					Reauth_Required: true,
					Created_At: true
				}
			});
			return sessions;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}



