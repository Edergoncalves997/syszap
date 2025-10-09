import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Client } from '../types/api';
import { authService } from '../services/authService';
import { usersService } from '../services/usersService';
import { companiesService } from '../services/companiesService';
import { clientsService } from '../services/clientsService';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config/env';

interface AuthContextType {
  user: User | null;
  users: User[];
  companies: Company[];
  clients: Client[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUsers: () => Promise<void>;
  loadCompanies: () => Promise<void>;
  loadClients: () => Promise<void>;
  addUser: (userData: any) => Promise<void>;
  updateUser: (id: string, userData: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addCompany: (companyData: any) => Promise<void>;
  updateCompany: (id: string, companyData: any) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addClient: (clientData: any) => Promise<void>;
  updateClient: (id: string, clientData: any) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
      // Verificar se o token é válido
      authService.me()
        .then(({ user: currentUser }) => {
          setUser(currentUser);
        })
        .catch(() => {
          authService.logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ Email: email, Password: password });
      setUser(response.user as unknown as User);
      toast.success('✅ Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Mensagens de erro específicas
      if (error.response?.status === 401) {
        toast.error('❌ Email ou senha inválidos!');
      } else if (error.response?.status === 400) {
        toast.error('❌ Dados inválidos! Verifique email e senha.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('❌ Erro de conexão! Verifique se o backend está rodando.');
      } else {
        toast.error(`❌ Erro ao fazer login: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setUsers([]);
    setCompanies([]);
    setClients([]);
  };

  // Carregar usuários
  const loadUsers = async () => {
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  // Carregar empresas
  const loadCompanies = async () => {
    try {
      const data = await companiesService.getAll();
      setCompanies(data.companies);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar empresas');
    }
  };

  // Adicionar usuário
  const addUser = async (userData: any) => {
    try {
      const newUser = await usersService.create(userData);
      setUsers([...users, newUser]);
      toast.success('✅ Usuário criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      // Mensagens de erro específicas
      if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem criar usuários.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 409) {
        toast.error('❌ Email já cadastrado! Use outro email.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao criar usuário: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Atualizar usuário
  const updateUser = async (id: string, userData: any) => {
    try {
      const updatedUser = await usersService.update(id, userData);
      setUsers(users.map((u) => (u.Id === id ? updatedUser : u)));
      toast.success('✅ Usuário atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      // Mensagens de erro específicas
      if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem editar usuários.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Usuário não encontrado! Ele pode ter sido deletado.');
      } else if (error.response?.status === 409) {
        toast.error('❌ Email já cadastrado! Use outro email.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao atualizar usuário: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Deletar usuário
  const deleteUser = async (id: string) => {
    try {
      await usersService.delete(id);
      setUsers(users.filter((u) => u.Id !== id));
      toast.success('✅ Usuário deletado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      
      // Mensagens de erro específicas
      if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem deletar usuários.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Usuário não encontrado! Ele pode ter sido deletado anteriormente.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ ID inválido: ${error.response?.data?.message || 'Verifique o ID'}`);
      } else {
        toast.error(`❌ Erro ao deletar usuário: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Adicionar empresa
  const addCompany = async (companyData: any) => {
    try {
      const newCompany = await companiesService.create(companyData);
      setCompanies([...companies, newCompany]);
      toast.success('Empresa criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error(`❌ Erro de conexão! Backend não está respondendo. Verifique se está rodando em ${API_BASE_URL}`);
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas usuários ADMIN podem criar empresas.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 409) {
        toast.error('❌ CNPJ já cadastrado! Use outro CNPJ.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao criar empresa: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Atualizar empresa
  const updateCompany = async (id: string, companyData: any) => {
    try {
      const updatedCompany = await companiesService.update(id, companyData);
      setCompanies(companies.map((c) => (c.Id === id ? updatedCompany : c)));
      toast.success('✅ Empresa atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      console.error('Status:', error.response?.status);
      console.error('Resposta:', error.response?.data);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error(`❌ Erro de conexão! Backend não está respondendo. Verifique se está rodando em ${API_BASE_URL}`);
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas usuários ADMIN podem editar empresas.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Empresa não encontrada! Ela pode ter sido deletada.');
      } else if (error.response?.status === 409) {
        toast.error('❌ CNPJ já cadastrado! Use outro CNPJ.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao atualizar empresa: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Deletar empresa
  const deleteCompany = async (id: string) => {
    try {
      await companiesService.delete(id);
      setCompanies(companies.filter((c) => c.Id !== id));
      toast.success('✅ Empresa deletada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar empresa:', error);
      console.error('Status:', error.response?.status);
      console.error('Resposta:', error.response?.data);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error(`❌ Erro de conexão! Backend não está respondendo. Verifique se está rodando em ${API_BASE_URL}`);
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas usuários ADMIN podem deletar empresas.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Empresa não encontrada! Ela pode ter sido deletada anteriormente.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ ID inválido: ${error.response?.data?.message || 'Verifique o ID'}`);
      } else {
        toast.error(`❌ Erro ao deletar empresa: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Carregar clientes
  const loadClients = async () => {
    try {
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  // Adicionar cliente
  const addClient = async (clientData: any) => {
    try {
      const newClient = await clientsService.create(clientData);
      setClients([...clients, newClient]);
      toast.success('✅ Cliente criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('❌ Erro de conexão! Backend não está respondendo.');
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem criar clientes.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 409) {
        toast.error('❌ Cliente com este número já existe nesta empresa!');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao criar cliente: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Atualizar cliente
  const updateClient = async (id: string, clientData: any) => {
    try {
      const updatedClient = await clientsService.update(id, clientData);
      setClients(clients.map((c) => (c.Id === id ? updatedClient : c)));
      toast.success('✅ Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('❌ Erro de conexão! Backend não está respondendo.');
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem editar clientes.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Cliente não encontrado! Ele pode ter sido deletado.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ Dados inválidos: ${error.response?.data?.message || 'Verifique os campos'}`);
      } else {
        toast.error(`❌ Erro ao atualizar cliente: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  // Deletar cliente
  const deleteClient = async (id: string) => {
    try {
      await clientsService.delete(id);
      setClients(clients.filter((c) => c.Id !== id));
      toast.success('✅ Cliente deletado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      
      // Mensagens de erro específicas
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('❌ Erro de conexão! Backend não está respondendo.');
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN/MANAGER podem deletar clientes.');
      } else if (error.response?.status === 401) {
        toast.error('❌ Não autenticado! Faça login novamente.');
      } else if (error.response?.status === 404) {
        toast.error('❌ Cliente não encontrado! Ele pode ter sido deletado anteriormente.');
      } else if (error.response?.status === 400) {
        toast.error(`❌ ID inválido: ${error.response?.data?.message || 'Verifique o ID'}`);
      } else {
        toast.error(`❌ Erro ao deletar cliente: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        companies,
        clients,
        isLoading,
        login,
        logout,
        loadUsers,
        loadCompanies,
        loadClients,
        addUser,
        updateUser,
        deleteUser,
        addCompany,
        updateCompany,
        deleteCompany,
        addClient,
        updateClient,
        deleteClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
