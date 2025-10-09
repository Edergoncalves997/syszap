import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function categoriesRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	// GET /categories - Listar todas as categorias
	app.get('/categories', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
			security: [{ bearerAuth: [] }] 
		} 
	}, async () => {
		return prisma.categories.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' }
		});
	});

	// GET /categories/:id - Buscar categoria por ID
	app.get('/categories/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
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
			const category = await prisma.categories.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!category) return (reply as any).status(404).send({ message: 'Categoria não encontrada' });
			return category;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /categories - Criar nova categoria
	app.post('/categories', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid' },
					Name: { type: 'string' },
					Description: { type: 'string' }
				},
				required: ['Company_Id', 'Name', 'Description']
			}
		} 
	}, async (req, reply) => {
		try {
			const body = z.object({
				Company_Id: z.string().uuid(),
				Name: z.string().min(1).max(100),
				Description: z.string().min(1).max(255)
			}).parse(req.body);

			const created = await prisma.categories.create({ 
				data: {
					Company_Id: body.Company_Id,
					Name: body.Name,
					Description: body.Description
				}
			});
			return (reply as any).status(201).send(created);
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// PUT /categories/:id - Atualizar categoria
	app.put('/categories/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
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
					Description: { type: 'string' }
				}
			}
		} 
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Name: z.string().min(1).max(100).optional(),
				Description: z.string().min(1).max(255).optional()
			}).parse(req.body);

			// Verificar se a categoria existe e não está deletada
			const existing = await prisma.categories.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existing) {
				return (reply as any).status(404).send({ message: 'Categoria não encontrada' });
			}

			const data: any = {};
			if (body.Name !== undefined) data.Name = body.Name;
			if (body.Description !== undefined) data.Description = body.Description;

			const updated = await prisma.categories.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	// DELETE /categories/:id - Deletar categoria (lógico)
	app.delete('/categories/:id', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
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

			// Verificar se a categoria existe e não está deletada
			const category = await prisma.categories.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!category) {
				return (reply as any).status(404).send({ message: 'Categoria não encontrada' });
			}

			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.categories, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// POST /categories/:id/restore - Restaurar categoria deletada
	app.post('/categories/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Categories'],
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

			// Verificar se a categoria existe e está deletada
			const category = await prisma.categories.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!category) {
				return (reply as any).status(404).send({ message: 'Categoria deletada não encontrada' });
			}

			// Restaurar categoria
			await SoftDeleteUtils.restore(prisma, prisma.categories, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Categoria restaurada com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:companyId/categories - Listar categorias por empresa
	app.get('/companies/:companyId/categories', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Categories'], 
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
			const categories = await prisma.categories.findMany({ 
				where: { 
					Company_Id: params.companyId,
					...SoftDeleteUtils.getNotDeletedFilter()
				},
				orderBy: { Created_At: 'desc' }
			});
			return categories;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}

