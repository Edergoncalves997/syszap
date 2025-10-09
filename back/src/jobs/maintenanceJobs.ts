import cron from 'node-cron';
import { messageRetentionService } from '../services/messageRetentionService';

export class MaintenanceJobs {
  startAll() {
    console.log('🔄 Iniciando jobs de manutenção...');

    // Job 1: Limpar cache expirado (diariamente às 2h)
    cron.schedule('0 2 * * *', async () => {
      console.log('🗑️ [Job] Limpando cache expirado...');
      try {
        const count = await messageRetentionService.cleanExpiredCache();
        console.log(`✅ [Job] Cache limpo: ${count} mensagens removidas`);
      } catch (error) {
        console.error('❌ [Job] Erro ao limpar cache:', error);
      }
    });

    // Job 2: Limpar mensagens antigas (semanalmente, domingo às 3h)
    cron.schedule('0 3 * * 0', async () => {
      console.log('🗑️ [Job] Limpando mensagens antigas fora da retenção...');
      try {
        const count = await messageRetentionService.cleanOldMessages();
        console.log(`✅ [Job] Mensagens antigas removidas: ${count}`);
      } catch (error) {
        console.error('❌ [Job] Erro ao limpar mensagens antigas:', error);
      }
    });

    console.log('✅ Jobs de manutenção agendados:');
    console.log('  - Cache expirado: Diariamente às 02:00');
    console.log('  - Mensagens antigas: Domingos às 03:00');
  }

  // Métodos para executar manualmente (útil para testes)
  async runCacheCleanup() {
    console.log('🧹 Executando limpeza de cache manualmente...');
    return await messageRetentionService.cleanExpiredCache();
  }

  async runMessageCleanup(companyId?: string) {
    console.log('🧹 Executando limpeza de mensagens antigas manualmente...');
    return await messageRetentionService.cleanOldMessages(companyId);
  }
}

export const maintenanceJobs = new MaintenanceJobs();
