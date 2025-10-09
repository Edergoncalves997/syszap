import api from './api';

export interface UserQueue {
  Id: string;
  User_Id: string;
  Queue_Id: string;
  Created_At: string;
  User?: {
    Id: string;
    Name: string;
    Email: string;
    Role: number;
    Is_Active: boolean;
    Company_Id: string;
  };
  Queue?: {
    Id: string;
    Name: string;
    Greeting_Message: string;
    Is_Active: boolean;
    Company_Id: string;
  };
}

export interface LinkUserToQueueData {
  User_Id: string;
  Queue_Id: string;
}

export interface BulkLinkData {
  User_Id: string;
  Queue_Ids: string[];
}

export const userQueuesService = {
  // Vincular usuário a uma fila
  async linkUserToQueue(data: LinkUserToQueueData): Promise<UserQueue> {
    const response = await api.post('/user-queues', data);
    return response.data;
  },

  // Desvincular por ID do vínculo
  async unlinkById(userQueueId: string): Promise<void> {
    await api.delete(`/user-queues/${userQueueId}`);
  },

  // Desvincular usuário de fila específica
  async unlinkUserFromQueue(userId: string, queueId: string): Promise<void> {
    await api.delete(`/user-queues/user/${userId}/queue/${queueId}`);
  },

  // Listar filas de um usuário
  async getUserQueues(userId: string) {
    const response = await api.get(`/users/${userId}/queues`);
    return response.data;
  },

  // Listar usuários de uma fila
  async getQueueUsers(queueId: string) {
    const response = await api.get(`/queues/${queueId}/users`);
    return response.data;
  },

  // Vincular usuário a múltiplas filas
  async bulkLink(data: BulkLinkData) {
    const response = await api.post('/user-queues/bulk', data);
    return response.data;
  },

  // Desvincular usuário de todas as filas
  async unlinkAllUserQueues(userId: string) {
    const response = await api.delete(`/users/${userId}/queues/all`);
    return response.data;
  },

  // Listar todos os vínculos (com filtros)
  async getAll(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    queueId?: string;
    companyId?: string;
  }) {
    const response = await api.get('/user-queues', { params });
    return response.data;
  }
};
