import { getPrisma } from '../plugins/prisma';

export class SessionLogger {
  static async log(
    sessionId: string,
    companyId: string,
    level: 'INFO' | 'WARN' | 'ERROR',
    event: string,
    details?: string
  ): Promise<void> {
    const prisma = getPrisma();

    try {
      await prisma.session_Logs.create({
        data: {
          Company_Id: companyId,
          Session_Id: sessionId,
          Level: level === 'INFO' ? 0 : level === 'WARN' ? 1 : 2,
          Message: event,
          Meta_JSON: details || null
        }
      });
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error);
    }
  }

  static async getLogs(sessionId: string, limit: number = 50): Promise<any[]> {
    const prisma = getPrisma();

    try {
      return await prisma.session_Logs.findMany({
        where: { Session_Id: sessionId },
        orderBy: { Created_At: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      return [];
    }
  }
}

