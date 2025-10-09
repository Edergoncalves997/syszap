import jwt, { SignOptions } from 'jsonwebtoken';

const DEFAULT_EXP: SignOptions['expiresIn'] = '7d';

export function signJwt(payload: object, secret = process.env.JWT_SECRET || 'dev-secret', expiresIn: SignOptions['expiresIn'] = DEFAULT_EXP): string {
	return jwt.sign(payload as any, secret, { expiresIn } as SignOptions);
}

export function verifyJwt<T = any>(token: string, secret = process.env.JWT_SECRET || 'dev-secret'): T {
	return jwt.verify(token, secret) as T;
}
