import api from './api';

export interface Category {
  Id: string;
  Company_Id: string;
  Name: string;
  Description: string;
  Created_At: string;
  Deleted_At?: string | null;
}

export interface CreateCategoryData {
  Company_Id: string;
  Name: string;
  Description: string;
}

export interface UpdateCategoryData {
  Name?: string;
  Description?: string;
}

export const categoriesService = {
  // Listar todas as categorias
  async getAll(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },

  // Buscar categoria por ID
  async getById(id: string): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Criar nova categoria
  async create(data: CreateCategoryData): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  // Atualizar categoria
  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Deletar categoria (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  // Restaurar categoria deletada
  async restore(id: string): Promise<void> {
    await api.post(`/categories/${id}/restore`);
  },

  // Listar categorias por empresa
  async getByCompany(companyId: string): Promise<Category[]> {
    const response = await api.get(`/companies/${companyId}/categories`);
    return response.data;
  }
};
