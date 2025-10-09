import api from './api';

export interface Queue {
  Id: string;
  Company_Id: string;
  Name: string;
  Greeting_Message: string;
  Is_Active: boolean;
  Created_At: string;
  Updated_At: string;
  Deleted_At?: string | null;
}

export interface CreateQueueData {
  Company_Id: string;
  Name: string;
  Greeting_Message: string;
  Is_Active?: boolean;
}

export interface UpdateQueueData {
  Name?: string;
  Greeting_Message?: string;
  Is_Active?: boolean;
}

export const queuesService = {
  // Listar todas as filas
  async getAll(): Promise<Queue[]> {
    const response = await api.get('/queues');
    return response.data;
  },

  // Buscar fila por ID
  async getById(id: string): Promise<Queue> {
    const response = await api.get(`/queues/${id}`);
    return response.data;
  },

  // Criar nova fila
  async create(data: CreateQueueData): Promise<Queue> {
    const response = await api.post('/queues', data);
    return response.data;
  },

  // Atualizar fila
  async update(id: string, data: UpdateQueueData): Promise<Queue> {
    const response = await api.put(`/queues/${id}`, data);
    return response.data;
  },

  // Deletar fila (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/queues/${id}`);
  },

  // Restaurar fila deletada
  async restore(id: string): Promise<void> {
    await api.post(`/queues/${id}/restore`);
  },

  // Listar filas por empresa
  async getByCompany(companyId: string): Promise<Queue[]> {
    const response = await api.get(`/companies/${companyId}/queues`);
    return response.data;
  },

  // Listar tickets de uma fila por usuário
  async getQueueTicketsByUser(queueId: string, userId: string, params?: {
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get(`/queues/${queueId}/tickets/user/${userId}`, { params });
    return response.data;
  },

  // Listar todos os tickets de um usuário (de todas as filas)
  async getAllUserTickets(userId: string, params?: {
    limit?: number;
    offset?: number;
    status?: number;
  }) {
    const response = await api.get(`/queues/tickets/user/${userId}`, { params });
    return response.data;
  },

  // Listar usuários de uma fila
  async getQueueUsers(queueId: string) {
    const response = await api.get(`/queues/${queueId}/users`);
    return response.data;
  }
};
