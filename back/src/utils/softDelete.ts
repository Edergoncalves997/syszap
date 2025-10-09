import { PrismaClient } from '../generated/prisma';

/**
 * Utilitários para exclusão lógica
 */
export class SoftDeleteUtils {
  /**
   * Marca um registro como deletado (exclusão lógica)
   */
  static async softDelete<T>(
    prisma: PrismaClient,
    model: any,
    where: any
  ): Promise<T> {
    return model.update({
      where,
      data: { Deleted_At: new Date() }
    });
  }

  /**
   * Restaura um registro deletado
   */
  static async restore<T>(
    prisma: PrismaClient,
    model: any,
    where: any
  ): Promise<T> {
    return model.update({
      where,
      data: { Deleted_At: null }
    });
  }

  /**
   * Exclusão física (remove permanentemente)
   */
  static async hardDelete<T>(
    prisma: PrismaClient,
    model: any,
    where: any
  ): Promise<T> {
    return model.delete({ where });
  }

  /**
   * Filtro padrão para excluir registros deletados
   */
  static getNotDeletedFilter() {
    return { Deleted_At: null };
  }

  /**
   * Filtro para incluir apenas registros deletados
   */
  static getDeletedFilter() {
    return { Deleted_At: { not: null } };
  }

  /**
   * Filtro para incluir todos os registros (deletados e não deletados)
   */
  static getAllFilter() {
    return {};
  }
}

