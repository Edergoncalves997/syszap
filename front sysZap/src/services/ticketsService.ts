import api from './api';

export interface Message {
  Id: string;
  Company_Id: string;
  Session_Id: string;
  Chat_Id: string;
  Direction: number; // 0=IN, 1=OUT
  Type: number; // MessageType
  Body: string | null;
  Caption: string | null;
  Media_Id: string | null;
  WA_Message_Id: string;
  WA_Timestamp: string | null;
  Status: number; // MessageStatus
  Error_Code: string | null;
  Error_Message: string | null;
  Metadata_JSON: string | null;
  Fetched_From_WhatsApp: boolean;
  Cache_Until: string | null;
  Created_At: string;
  Updated_At: string;
}

export interface Ticket {
  Id: string;
  Company_Id: string;
  Client_Id: string;
  User_Id: string;
  Queue_Id?: string | null;
  Category_Id?: string | null;
  Chat_Id?: string | null;
  Subject: string;
  Resolution_Text?: string | null;
  Status: number; // 0=AGUARDANDO_CLIENTE, 1=AGUARDANDO_ATENDENTE, 2=EM_ATENDIMENTO, 3=FINALIZADO, 4=CANCELADO
  Priority?: number | null;
  SLA_Due_At?: string | null;
  Last_Message_At?: string | null;
  Reopened_Count: number;
  Created_At: string;
  Updated_At: string;
  Deleted_At?: string | null;
  Client?: {
    Id: string;
    Name: string;
    WhatsApp_Number: string;
    Profile_Pic_URL?: string;
  };
  User?: {
    Id: string;
    Name: string;
    Email: string;
  };
  Queue?: {
    Id: string;
    Name: string;
  };
  Category?: {
    Id: string;
    Name: string;
  };
}

export interface CreateTicketData {
  Company_Id: string;
  Client_Id: string;
  User_Id: string;
  Queue_Id?: string;
  Category_Id?: string;
  Chat_Id?: string;
  Subject: string;
  Status: number;
  Priority?: number;
}

export interface UpdateTicketData {
  User_Id?: string;
  Queue_Id?: string | null;
  Category_Id?: string | null;
  Subject?: string;
  Resolution_Text?: string | null;
  Status?: number;
  Priority?: number | null;
}

export const ticketsService = {
  // Listar todos os tickets
  async getAll(): Promise<Ticket[]> {
    const response = await api.get('/tickets');
    return response.data;
  },

  // Buscar ticket por ID
  async getById(id: string): Promise<Ticket> {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Criar novo ticket
  async create(data: CreateTicketData): Promise<Ticket> {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  // Atualizar ticket
  async update(id: string, data: UpdateTicketData): Promise<Ticket> {
    const response = await api.put(`/tickets/${id}`, data);
    return response.data;
  },

  // Deletar ticket (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/tickets/${id}`);
  },

  // Restaurar ticket deletado
  async restore(id: string): Promise<void> {
    await api.post(`/tickets/${id}/restore`);
  },

  // Listar tickets por empresa
  async getByCompany(companyId: string): Promise<Ticket[]> {
    const response = await api.get(`/companies/${companyId}/tickets`);
    return response.data;
  },

  // Listar tickets por cliente
  async getByClient(clientId: string): Promise<Ticket[]> {
    const response = await api.get(`/clients/${clientId}/tickets`);
    return response.data;
  },

  // Assumir um ticket (atendente pega da fila)
  async assume(ticketId: string) {
    const response = await api.post(`/tickets/${ticketId}/assume`);
    return response.data;
  },

  // Finalizar um ticket
  async finish(ticketId: string, resolutionText?: string) {
    const response = await api.post(`/tickets/${ticketId}/finish`, {
      Resolution_Text: resolutionText
    });
    return response.data;
  },

  // Transferir ticket para outra fila
  async transfer(ticketId: string, queueId: string) {
    const response = await api.post(`/tickets/${ticketId}/transfer`, {
      Queue_Id: queueId
    });
    return response.data;
  },

  // Listar tickets das filas do usuário
  async getUserQueueTickets(userId: string, status?: number) {
    const response = await api.get(`/users/${userId}/queue-tickets`, {
      params: status !== undefined ? { status } : {}
    });
    return response.data;
  },

  // Listar meus tickets (usuário logado)
  async getMyTickets(status?: number) {
    const response = await api.get('/tickets/my-tickets', {
      params: status !== undefined ? { status } : {}
    });
    return response.data;
  },

  // Enviar mensagem de atendimento
  async sendMessage(ticketId: string, message: string) {
    const response = await api.post(`/tickets/${ticketId}/send-message`, { message });
    return response.data.data;
  },

  // Buscar mensagens de um ticket
  async getMessages(ticketId: string) {
    const response = await api.get(`/tickets/${ticketId}/messages`);
    return response.data;
  }
};

// Helper para obter o nome do status
export const getTicketStatusName = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Aguardando Cliente',
    1: 'Aguardando Atendente',
    2: 'Em Atendimento',
    3: 'Finalizado',
    4: 'Cancelado'
  };
  return statusMap[status] || 'Desconhecido';
};

// Helper para obter a cor do status
export const getTicketStatusColor = (status: number): string => {
  const colorMap: Record<number, string> = {
    0: 'bg-yellow-100 text-yellow-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-gray-100 text-gray-800',
    4: 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
