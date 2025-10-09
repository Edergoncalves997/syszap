import bcrypt from 'bcryptjs';

const DEFAULT_ROUNDS = 10;

export async function hashPassword(plain: string, rounds: number = DEFAULT_ROUNDS): Promise<string> {
	return await bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(plain, hash);
}
