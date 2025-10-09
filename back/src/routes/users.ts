import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { requireManagerOrAdmin, requireManagerOrAdminWithCompanyAccess } from '../middlewares/auth';
import { hashPassword } from '../utils/crypto';
import { SoftDeleteUtils } from '../utils/softDelete';

export async function usersRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	app.get('/users', { preHandler: requireManagerOrAdmin(), schema: { tags: ['Users'], security: [{ bearerAuth: [] }] } }, async () => {
		return prisma.users.findMany({ 
			where: SoftDeleteUtils.getNotDeletedFilter(),
			select: { Id: true, Company_Id: true, Name: true, Email: true, Role: true, Is_Active: true, Created_At: true } 
		});
	});

	app.get('/users/:id', { preHandler: requireManagerOrAdmin(), schema: { tags: ['Users'], security: [{ bearerAuth: [] }] } }, async (req, reply) => {
		const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
		const user = await prisma.users.findFirst({ 
			where: { 
				Id: params.id,
				...SoftDeleteUtils.getNotDeletedFilter()
			}, 
			select: { Id: true, Company_Id: true, Name: true, Email: true, Role: true, Is_Active: true, Created_At: true } 
		});
		if (!user) return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
		return user;
	});

	app.post('/users', { 
		preHandler: requireManagerOrAdmin(), 
		schema: { 
			tags: ['Users'], 
			security: [{ bearerAuth: [] }],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid', nullable: true },
					Name: { type: 'string' },
					Email: { type: 'string', format: 'email' },
					Password: { type: 'string', minLength: 6 },
					Role: { type: 'integer', description: '0=ADMIN, 1=MANAGER, 2=USER' }
				},
				required: ['Name', 'Email', 'Password', 'Role']
			}
		} 
	}, async (req, reply) => {
		const body = z.object({
			Company_Id: z.string().uuid().nullable().optional(),
			Name: z.string().min(1),
			Email: z.string().email(),
			Password: z.string().min(6),
			Role: z.number().int()
		}).parse(req.body);
		const exists = await prisma.users.findUnique({ where: { Email: body.Email } });
		if (exists) return reply.code(409).send({ message: 'Email já cadastrado' });
		const passwordHash = await hashPassword(body.Password);
		const created = await prisma.users.create({ data: { Company_Id: body.Company_Id ?? null, Name: body.Name, Email: body.Email, Password_Hash: passwordHash, Role: body.Role, Is_Active: true } });
		return reply.code(201).send({ Id: created.Id, Company_Id: created.Company_Id, Name: created.Name, Email: created.Email, Role: created.Role, Is_Active: created.Is_Active, Created_At: created.Created_At });
	});

	app.put('/users/:id', { preHandler: requireManagerOrAdmin(), schema: { tags: ['Users'], security: [{ bearerAuth: [] }] } }, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			const body = z.object({
				Company_Id: z.string().uuid().nullable().optional(),
				Name: z.string().min(1).optional(),
				Email: z.string().email().optional(),
				Password: z.string().min(6).optional(),
				Role: z.number().int().optional(),
				Is_Active: z.boolean().optional()
			}).parse(req.body);
			
			// Verificar se o usuário existe e não está deletado
			const existingUser = await prisma.users.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!existingUser) {
				return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
			}
			
			const data: any = {};
			if (body.Company_Id !== undefined) data.Company_Id = body.Company_Id;
			if (body.Name !== undefined) data.Name = body.Name;
			if (body.Email !== undefined) data.Email = body.Email;
			if (body.Role !== undefined) data.Role = body.Role;
			if (body.Is_Active !== undefined) data.Is_Active = body.Is_Active;
			if (body.Password !== undefined) data.Password_Hash = await hashPassword(body.Password);
			const updated = await prisma.users.update({ where: { Id: params.id }, data });
			return { Id: updated.Id, Company_Id: updated.Company_Id, Name: updated.Name, Email: updated.Email, Role: updated.Role, Is_Active: updated.Is_Active, Created_At: updated.Created_At };
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'Dados inválidos' });
		}
	});

	app.delete('/users/:id', { preHandler: requireManagerOrAdmin(), schema: { tags: ['Users'], security: [{ bearerAuth: [] }] } }, async (req, reply) => {
		try {
			const params = z.object({ id: z.string().uuid() }).parse((req as any).params);
			
			// Verificar se o usuário existe e não está deletado
			const user = await prisma.users.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getNotDeletedFilter()
				}
			});
			if (!user) {
				return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
			}
			
			// Exclusão lógica
			await SoftDeleteUtils.softDelete(prisma, prisma.users, { Id: params.id });
			return reply.code(204).send();
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});

	app.get('/companies/:companyId/users', { 
		preHandler: requireManagerOrAdminWithCompanyAccess(), 
		schema: { 
			tags: ['Users'], 
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
		const params = z.object({ companyId: z.string().uuid() }).parse((req as any).params);
		const users = await prisma.users.findMany({ 
			where: { 
				Company_Id: params.companyId,
				...SoftDeleteUtils.getNotDeletedFilter()
			},
			select: { 
				Id: true, 
				Company_Id: true, 
				Name: true, 
				Email: true, 
				Role: true, 
				Is_Active: true, 
				Created_At: true 
			},
			orderBy: { Created_At: 'desc' }
		});
		return users;
	});

	// Endpoint para restaurar usuário deletado (opcional)
	app.post('/users/:id/restore', {
		preHandler: requireManagerOrAdmin(),
		schema: {
			tags: ['Users'],
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
			
			// Verificar se o usuário existe e está deletado
			const user = await prisma.users.findFirst({
				where: { 
					Id: params.id,
					...SoftDeleteUtils.getDeletedFilter()
				}
			});
			if (!user) {
				return (reply as any).status(404).send({ message: 'Usuário deletado não encontrado' });
			}
			
			// Restaurar usuário
			await SoftDeleteUtils.restore(prisma, prisma.users, { Id: params.id });
			return (reply as any).status(200).send({ message: 'Usuário restaurado com sucesso' });
		} catch (error: any) {
			return (reply as any).status(400).send({ message: 'ID inválido' });
		}
	});
}
