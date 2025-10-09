import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireAdmin, requireManagerOrAdmin } from '../middlewares/auth';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function companiesRoutes(app: FastifyInstance) {
	app.get('/companies', { schema: { tags: ['Companies'] } }, async () => {
		const prisma = getPrisma();
		const companies = await prisma.companies.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			take: 50, 
			orderBy: { Created_At: 'desc' },
			select: { Id: true, Name: true, CNPJ: true, Created_At: true, Updated_At: true }
		});
		return { companies, total: companies.length };
	});

	app.post('/companies', {
		preHandler: requireAdmin(),
		schema: {
			tags: ['Companies'],
			security: [{ bearerAuth: [] }],
			body: { type: 'object', properties: { Name: { type: 'string' }, CNPJ: { type: 'string', nullable: true } }, required: ['Name'] },
			response: { 201: { type: 'object' } }
		}
	}, async (req, reply) => {
		const schema = z.object({
			Name: z.string().min(1).max(150),
			CNPJ: z.string().optional().nullable(),
		});
		const body = schema.parse(req.body);
		const prisma = getPrisma();
		
		// Normalizar CNPJ (remover pontos, traços, espaços)
		let normalizedCNPJ = null;
		if (body.CNPJ) {
			normalizedCNPJ = body.CNPJ.replace(/[^\d]/g, '');
			if (normalizedCNPJ.length !== 14) {
				return (reply as any).status(400).send({ message: 'CNPJ deve ter 14 dígitos' });
			}
		}
		
		// Verificar se CNPJ já existe
		if (normalizedCNPJ) {
			const exists = await prisma.companies.findUnique({ where: { CNPJ: normalizedCNPJ } });
			if (exists) {
				return (reply as any).status(409).send({ message: 'CNPJ já cadastrado' });
			}
		}
		
		const created = await prisma.companies.create({ data: { Name: body.Name, CNPJ: normalizedCNPJ } });
		return reply.code(201).send(created);
	});

	app.get('/companies/:id', { 
		preHandler: requireAdmin(), 
		schema: { 
			tags: ['Companies'], 
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
			const prisma = getPrisma();
			const company = await prisma.companies.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				} 
			});
			if (!company) return (reply as any).status(404).send({ message: 'Empresa não encontrada' });
			return company;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	app.put('/companies/:id', {
		preHandler: requireAdmin(),
		schema: {
			tags: ['Companies'],
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
					CNPJ: { type: 'string', nullable: true },
					Retention_Days: { type: 'integer', minimum: 1 },
					Cache_Fetched_Days: { type: 'integer', minimum: 1 }
				} 
			}
		}
	}, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Name: z.string().min(1).max(150).optional(),
				CNPJ: z.string().optional().nullable(),
				Retention_Days: z.number().int().min(1).max(365).optional(),
				Cache_Fetched_Days: z.number().int().min(1).max(90).optional()
			}).parse(req.body);
			const prisma = getPrisma();
			
			// Verificar se a empresa existe e não está deletada
			const existingCompany = await prisma.companies.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existingCompany) {
				return (reply as any).status(404).send({ message: 'Empresa não encontrada' });
			}
			
			// Normalizar CNPJ (remover pontos, traços, espaços)
			let normalizedCNPJ = null;
			if (body.CNPJ !== undefined) {
				if (body.CNPJ) {
					normalizedCNPJ = body.CNPJ.replace(/[^\d]/g, '');
					if (normalizedCNPJ.length !== 14) {
						return (reply as any).status(400).send({ message: 'CNPJ deve ter 14 dígitos' });
					}
					
					// Verificar se CNPJ já existe (exceto para a própria empresa e registros deletados)
					const exists = await prisma.companies.findFirst({ 
						where: { 
							CNPJ: normalizedCNPJ,
							Id: { not: params.id },
							...SoftDeleteUtils.getNotDeletedFilter()
						} 
					});
					if (exists) {
						return (reply as any).status(409).send({ message: 'CNPJ já cadastrado' });
					}
				}
			}
			
			const data: any = {};
			if (body.Name !== undefined) data.Name = body.Name;
			if (body.CNPJ !== undefined) data.CNPJ = normalizedCNPJ;
			if (body.Retention_Days !== undefined) data.Retention_Days = body.Retention_Days;
			if (body.Cache_Fetched_Days !== undefined) data.Cache_Fetched_Days = body.Cache_Fetched_Days;
			const updated = await prisma.companies.update({ where: { Id: params.id }, data });
			return updated;
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	app.delete('/companies/:id', {
		preHandler: requireAdmin(),
		schema: {
			tags: ['Companies'],
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
			const prisma = getPrisma();
			
			// Verificar se a empresa existe e não está deletada
			const company = await prisma.companies.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				} 
			});
			if (!company) {
				return (reply as any).status(404).send({ message: 'Empresa não encontrada' });
			}
			
			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.companies, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// Endpoint para restaurar empresa deletada (opcional)
	app.post('/companies/:id/restore', {
		preHandler: requireAdmin(),
		schema: {
			tags: ['Companies'],
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
			const prisma = getPrisma();
			
			// Verificar se a empresa existe e está deletada
			const company = await prisma.companies.findFirst({ 
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				} 
			});
			if (!company) {
				return (reply as any).status(404).send({ message: 'Empresa deletada não encontrada' });
			}
			
			// Restaurar empresa
			await SoftDeleteUtils.restore(prisma, prisma.companies, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Empresa restaurada com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	// GET /companies/:id/chats - Buscar chats de uma empresa
	app.get('/companies/:id/chats', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Companies'],
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
			const user = (req as any).user;
			const prisma = getPrisma();

			// Verificar se a empresa existe
			const company = await prisma.companies.findFirst({
				where: { Id: params.id }
			});

			if (!company) {
				return (reply as any).status(404).send({ message: 'Empresa não encontrada' });
			}

			// Verificar permissões do usuário
			// MANAGER só pode ver chats de sua empresa
			if (user.role === 1 && company.Id !== user.companyId) {
				return (reply as any).status(403).send({ message: 'Acesso negado. Você só pode ver chats de sua empresa.' });
			}
			// ADMIN pode ver chats de qualquer empresa

			// Buscar chats da empresa
			const chats = await prisma.chats.findMany({
				where: {
					Company_Id: params.id
				},
				include: {
					Client: {
						select: {
							Id: true,
							Name: true,
							WhatsApp_Number: true
						}
					}
				},
				orderBy: {
					Created_At: 'desc'
				}
			});

			return chats;
		} catch (error: any) {
			console.error('Erro ao buscar chats da empresa:', error);
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}


