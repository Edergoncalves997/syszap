import api from './api';
import { User, CreateUserData, UpdateUserData } from '../types/api';

export const usersService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  },

  // Get user by ID
  async getById(id: string): Promise<User> {
    const { data} = await api.get<User>(`/users/${id}`);
    return data;
  },

  // Create user
  async create(userData: CreateUserData): Promise<User> {
    const { data } = await api.post<User>('/users', userData);
    return data;
  },

  // Update user
  async update(id: string, userData: UpdateUserData): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, userData);
    return data;
  },

  // Delete user
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Restore user
  async restore(id: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/users/${id}/restore`);
    return data;
  },

  // Get users by company
  async getByCompany(companyId: string): Promise<User[]> {
    const { data } = await api.get<User[]>(`/companies/${companyId}/users`);
    return data;
  },
};



