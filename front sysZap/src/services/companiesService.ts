import api from './api';
import { Company, CreateCompanyData, UpdateCompanyData } from '../types/api';

export const companiesService = {
  // Get all companies
  async getAll(): Promise<{ companies: Company[]; total: number }> {
    const { data } = await api.get<{ companies: Company[]; total: number }>('/companies');
    return data;
  },

  // Get company by ID
  async getById(id: string): Promise<Company> {
    const { data } = await api.get<Company>(`/companies/${id}`);
    return data;
  },

  // Create company
  async create(companyData: CreateCompanyData): Promise<Company> {
    const { data } = await api.post<Company>('/companies', companyData);
    return data;
  },

  // Update company
  async update(id: string, companyData: UpdateCompanyData): Promise<Company> {
    const { data } = await api.put<Company>(`/companies/${id}`, companyData);
    return data;
  },

  // Delete company
  async delete(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },

  // Restore company
  async restore(id: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/companies/${id}/restore`);
    return data;
  },
};



