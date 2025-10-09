import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt } from '../utils/jwt';

export interface AuthUser {
	userId: string;
	companyId?: string | null;
	role: number;
}

export function authGuard() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
    const token = header.substring(7);
    try {
      const payload = verifyJwt<AuthUser>(token);
      (req as any).user = payload;
    } catch (e) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
  };
}

export function requireManagerOrAdmin() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
    const token = header.substring(7);
    try {
      const payload = verifyJwt<AuthUser>(token);
      // Role: 0=ADMIN, 1=MANAGER, 2=USER
      if (payload.role > 1) {
        return reply.code(403).send({ message: 'Access denied. Manager or Admin required.' });
      }
      (req as any).user = payload;
    } catch (e) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
  };
}

export function requireManagerOrAdminWithCompanyAccess() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
    const token = header.substring(7);
    try {
      const payload = verifyJwt<AuthUser>(token);
      // Role: 0=ADMIN, 1=MANAGER, 2=USER
      if (payload.role > 1) {
        return reply.code(403).send({ message: 'Access denied. Manager or Admin required.' });
      }
      
      // Verificar acesso à empresa
      const companyId = (req as any).params?.companyId;
      if (payload.role === 1 && payload.companyId !== companyId) { // MANAGER só pode acessar sua empresa
        return reply.code(403).send({ message: 'Access denied. You can only access your company users.' });
      }
      // ADMIN pode acessar qualquer empresa
      
      (req as any).user = payload;
    } catch (e) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
  };
}

export function requireAdmin() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
    const token = header.substring(7);
    try {
      const payload = verifyJwt<AuthUser>(token);
      // Role: 0=ADMIN, 1=MANAGER, 2=USER
      if (payload.role !== 0) {
        return reply.code(403).send({ message: 'Access denied. Admin required.' });
      }
      (req as any).user = payload;
    } catch (e) {
      return reply.code(401).send({ message: 'Invalid token' });
    }
  };
}
