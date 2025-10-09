import api from './api';
import { Client, CreateClientData, UpdateClientData } from '../types/api';

export const clientsService = {
  // Get all clients
  async getAll(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/clients');
    return data;
  },

  // Get client by ID
  async getById(id: string): Promise<Client> {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  // Create client
  async create(clientData: CreateClientData): Promise<Client> {
    const { data } = await api.post<Client>('/clients', clientData);
    return data;
  },

  // Update client
  async update(id: string, clientData: UpdateClientData): Promise<Client> {
    const { data } = await api.put<Client>(`/clients/${id}`, clientData);
    return data;
  },

  // Delete client
  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  // Restore client
  async restore(id: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/clients/${id}/restore`);
    return data;
  },

  // Get clients by company
  async getByCompany(companyId: string): Promise<Client[]> {
    const { data } = await api.get<Client[]>(`/companies/${companyId}/clients`);
    return data;
  },
};



