import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';

export async function mediaRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /media - Listar todas as mídias
	app.get('/media', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Media'], 
			security: [{ bearerAuth: [] }],
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', default: 50 },
					offset: { type: 'integer', default: 0 }
				}
			}
		} 
	}, async (req) => {
		const query = z.object({
			limit: z.number().int().min(1).max(100).optional().default(50),
			offset: z.number().int().min(0).optional().default(0)
		}).parse((req as any).query);

		return prisma.media.findMany({ 
			take: query.limit,
			skip: query.offset,
			orderBy: { Created_At: 'desc' },
			select: {
				Id: true,
				Company_Id: true,
				Storage_Provider: true,
				Storage_Key: true,
				Mime_Type: true,
				Size_Bytes: true,
				Created_At: true
			}
		});
	});

	// GET /media/:id - Buscar mídia por ID
	app.get('/media/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Media'], 
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
			const media = await prisma.media.findUnique({ 
				where: { Id: params.id },
				include: {
					Messages: { select: { Id: true, Body: true, Created_At: true } }
				}
			});
			if (!media) return (reply as any).status(404).send({ message: 'Mídia não encontrada' });
			return media;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /messages/:messageId/media - Buscar mídia por mensagem
	app.get('/messages/:messageId/media', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Media'], 
			security: [{ bearerAuth: [] }],
			params: {
				type: 'object',
				properties: {
					messageId: { type: 'string', format: 'uuid' }
				},
				required: ['messageId']
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ messageId: z.string().uuid() }).parse((req as any).params);
			// Buscar mensagem e sua mídia associada
			const message = await prisma.messages.findUnique({
				where: { Id: params.messageId },
				include: { Media: true }
			});
			if (!message) {
				return (reply as any).status(404).send({ message: 'Mensagem não encontrada' });
			}
			return message.Media || null;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /media - Criar nova mídia
	app.post('/media', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Media'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Storage_Provider: { type: 'string' },
					Storage_Key: { type: 'string' },
					Mime_Type: { type: 'string' },
					Size_Bytes: { type: 'integer' },
					SHA256: { type: 'string', nullable: true }
				},
				required: ['Company_Id', 'Storage_Provider', 'Storage_Key', 'Mime_Type', 'Size_Bytes']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Storage_Provider: z.string().max(20),
				Storage_Key: z.string().min(1),
				Mime_Type: z.string().min(1),
				Size_Bytes: z.number().int(),
				SHA256: z.string().optional()
			}).parse(req.body);

			const created = await prisma.media.create({ 
				data: {
					Company_Id: body.Company_Id,
					Storage_Provider: body.Storage_Provider,
					Storage_Key: body.Storage_Key,
					Mime_Type: body.Mime_Type,
					Size_Bytes: body.Size_Bytes,
					SHA256: body.SHA256 || null
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /media/:id - Deletar mídia
	app.delete('/media/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Media'], 
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

			const media = await prisma.media.findUnique({ where: { Id: params.id } });
			if (!media) {
				return (reply as any).status(404).send({ message: 'Mídia não encontrada' });
			}

			await prisma.media.delete({ where: { Id: params.id } });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}

