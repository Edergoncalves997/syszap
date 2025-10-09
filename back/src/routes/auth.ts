import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../plugins/prisma';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { signJwt } from '../utils/jwt';
import { SoftDeleteUtils } from '../utils/softDelete';
import { authGuard } from '../middlewares/auth';

export async function authRoutes(app: FastifyInstance) {
	const prisma = getPrisma();

	app.post('/auth/register', {
		schema: {
			tags: ['Auth'],
			body: {
				type: 'object',
				properties: {
					Company_Id: { type: 'string', format: 'uuid', nullable: true },
					Name: { type: 'string' },
					Email: { type: 'string', format: 'email' },
					Password: { type: 'string' },
					Role: { type: 'integer', description: '0=ADMIN, 1=MANAGER, 2=USER' }
				},
				required: ['Name', 'Email', 'Password']
			},
			response: {
				201: {
					type: 'object',
					properties: {
						token: { type: 'string' },
						user: {
							type: 'object',
							properties: { Id: { type: 'string' }, Name: { type: 'string' }, Email: { type: 'string' }, Company_Id: { type: 'string', nullable: true }, Role: { type: 'integer' } }
						}
					}
				}
			}
		}
	}, async (req, reply) => {
		const schema = z.object({
			Company_Id: z.string().uuid().nullable().optional(),
			Name: z.string().min(1),
			Email: z.string().email(),
			Password: z.string().min(6),
			Role: z.number().int().optional().default(2)
		});
		const body = schema.parse(req.body);
		const exists = await prisma.users.findUnique({ where: { Email: body.Email } });
		if (exists) return (reply as any).status(409).send({ message: 'Email já cadastrado' });
		const passwordHash = await hashPassword(body.Password);
		const user = await prisma.users.create({ data: {
			Company_Id: body.Company_Id ?? null,
			Name: body.Name,
			Email: body.Email,
			Password_Hash: passwordHash,
			Role: body.Role,
			Is_Active: true
		}});
		const token = signJwt({ userId: user.Id, companyId: user.Company_Id, role: user.Role });
		return reply.code(201).send({ token, user: { Id: user.Id, Name: user.Name, Email: user.Email, Company_Id: user.Company_Id, Role: user.Role } });
	});

	app.post('/auth/login', {
		schema: {
			tags: ['Auth'],
			body: { 
				type: 'object', 
				properties: { 
					Email: { type: 'string', format: 'email' }, 
					Password: { type: 'string' } 
				}, 
				required: ['Email', 'Password'] 
			},
			response: { 200: { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object', properties: { Id: { type: 'string' }, Name: { type: 'string' }, Email: { type: 'string' }, Company_Id: { type: 'string', nullable: true }, Role: { type: 'integer' } } } } } }
		}
	}, async (req, reply) => {
		const schema = z.object({ Email: z.string().email(), Password: z.string().min(6) });
		const body = schema.parse(req.body);
		const user = await prisma.users.findFirst({ 
			where: { 
				Email: body.Email,
				...SoftDeleteUtils.getNotDeletedFilter()
			} 
		});
		if (!user) return (reply as any).status(401).send({ message: 'Credenciais inválidas' });
		const ok = await verifyPassword(body.Password, user.Password_Hash);
		if (!ok) return (reply as any).status(401).send({ message: 'Credenciais inválidas' });
		const token = signJwt({ userId: user.Id, companyId: user.Company_Id, role: user.Role });
		return { token, user: { Id: user.Id, Name: user.Name, Email: user.Email, Company_Id: user.Company_Id, Role: user.Role } };
	});

	app.get('/auth/me', { preHandler: authGuard(), schema: { tags: ['Auth'], security: [{ bearerAuth: [] }] } }, async (req, reply) => {
		const { userId } = (req as any).user as { userId: string };
		const user = await prisma.users.findFirst({ 
			where: { 
				Id: userId,
				...SoftDeleteUtils.getNotDeletedFilter()
			}, 
			select: { Id: true, Name: true, Email: true, Company_Id: true, Role: true, Is_Active: true, Created_At: true } 
		});
		if (!user) return (reply as any).status(404).send({ message: 'Usuário não encontrado' });
		return { user };
	});
}
