import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, UserCircle, Phone, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { Client, UserRole } from '../types/api';

const Clients: React.FC = () => {
  const { user, clients, companies, loadClients, loadCompanies, addClient, updateClient, deleteClient } = useAuth();
  const { isOpen } = useSidebar();
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCompany, setFilterCompany] = useState('all');

  const [form, setForm] = useState({
    Company_Id: '',
    Name: '',
    WhatsApp_Number: '',
    Profile_Pic_URL: '',
    Language: 'pt-BR',
  });

  useEffect(() => {
    loadClients();
    loadCompanies();
  }, []);

  // Filtrar clientes baseado na empresa selecionada e permissões do usuário
  const filteredClients = clients.filter((client) => {
    // Se for MANAGER, só mostra clientes da sua empresa
    if (user?.Role === UserRole.MANAGER && user.Company_Id) {
      if (client.Company_Id !== user.Company_Id) return false;
    }
    
    // Filtro adicional por empresa
    if (filterCompany !== 'all' && client.Company_Id !== filterCompany) {
      return false;
    }
    
    return true;
  });

  // Empresas disponíveis para seleção
  const availableCompanies = user?.Role === UserRole.ADMIN 
    ? companies 
    : companies.filter(c => c.Id === user?.Company_Id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const clientData = {
        Company_Id: form.Company_Id,
        Name: form.Name,
        WhatsApp_Number: form.WhatsApp_Number.replace(/\D/g, ''), // Remove formatação
        Profile_Pic_URL: form.Profile_Pic_URL || undefined,
        Language: form.Language || undefined,
      };

      if (editingClient) {
        // Ao editar, permite alterar WhatsApp_Number também
        const updateData = {
          Name: form.Name,
          WhatsApp_Number: form.WhatsApp_Number.replace(/\D/g, ''), // Remove formatação
          Profile_Pic_URL: form.Profile_Pic_URL || null,
          Language: form.Language || null,
        };
        await updateClient(editingClient.Id, updateData);
      } else {
        await addClient(clientData);
      }
      resetForm();
      await loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Se for MANAGER, pré-seleciona a empresa dele
    const defaultCompanyId = user?.Role === UserRole.MANAGER ? (user.Company_Id || '') : '';
    
    setForm({
      Company_Id: defaultCompanyId,
      Name: '',
      WhatsApp_Number: '',
      Profile_Pic_URL: '',
      Language: 'pt-BR',
    });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      Company_Id: client.Company_Id,
      Name: client.Name,
      WhatsApp_Number: client.WhatsApp_Number,
      Profile_Pic_URL: client.Profile_Pic_URL || '',
      Language: client.Language || 'pt-BR',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setIsLoading(true);
      try {
        await deleteClient(id);
        await loadClients();
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatWhatsApp = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    
    // Remover "55" do início para formatação visual
    let numberToFormat = cleaned;
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      numberToFormat = cleaned.substring(2);
    }
    
    // Formato: (11) 99999-9999
    if (numberToFormat.length === 11) {
      return `+55 (${numberToFormat.substring(0, 2)}) ${numberToFormat.substring(2, 7)}-${numberToFormat.substring(7)}`;
    } else if (numberToFormat.length === 10) {
      return `+55 (${numberToFormat.substring(0, 2)}) ${numberToFormat.substring(2, 6)}-${numberToFormat.substring(6)}`;
    }
    
    return `+55 ${number}`;
  };

  // Função para formatar o input enquanto o usuário digita
  const handleWhatsAppChange = (value: string) => {
    // Remove tudo que não for número
    let cleaned = value.replace(/\D/g, '');
    
    // Se não começar com 55, adiciona automaticamente
    if (cleaned.length > 0 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    // Limita ao tamanho máximo (55 + 11 dígitos = 13)
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    setForm({ ...form, WhatsApp_Number: cleaned });
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Clientes" subtitle="Gestão de clientes e contatos WhatsApp" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-800">Total: {filteredClients.length}</h2>
              
              {/* Filtro por Empresa (apenas para ADMIN) */}
              {user?.Role === UserRole.ADMIN && (
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Todas as Empresas</option>
                  {companies.map((company) => (
                    <option key={company.Id} value={company.Id}>
                      {company.Name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">WhatsApp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Último Contato</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const company = companies.find((c) => c.Id === client.Company_Id);
                  return (
                    <tr key={client.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {client.Profile_Pic_URL ? (
                            <img 
                              src={client.Profile_Pic_URL} 
                              alt={client.Name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserCircle size={24} className="text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{client.Name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone size={16} />
                          <span>{formatWhatsApp(client.WhatsApp_Number)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Building2 size={16} />
                          <span>{company?.Name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.Is_Blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {client.Is_Blocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.Last_Contact_At 
                          ? new Date(client.Last_Contact_At).toLocaleString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(client.Id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <UserCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Empresa (apenas ao criar) */}
          {!editingClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa {user?.Role === UserRole.ADMIN && '*'}
              </label>
              <select
                value={form.Company_Id}
                onChange={(e) => setForm({ ...form, Company_Id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={user?.Role === UserRole.MANAGER} // MANAGER só vê sua empresa
              >
                <option value="">Selecione uma empresa</option>
                {availableCompanies.map((company) => (
                  <option key={company.Id} value={company.Id}>
                    {company.Name}
                  </option>
                ))}
              </select>
              {user?.Role === UserRole.MANAGER && user.Company_Id && (
                <p className="text-xs text-gray-500 mt-1">
                  Você só pode cadastrar clientes para sua empresa
                </p>
              )}
            </div>
          )}

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp * {!editingClient && <span className="text-xs text-gray-500">(+55 será adicionado automaticamente)</span>}
            </label>
            <input
              type="tel"
              value={form.WhatsApp_Number}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              placeholder="11999999999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={!editingClient && !form.Company_Id}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                {form.WhatsApp_Number ? formatWhatsApp(form.WhatsApp_Number) : 'Digite apenas números'}
              </p>
              {form.WhatsApp_Number && (
                <span className="text-xs font-medium text-green-600">
                  {form.WhatsApp_Number.length - 2} dígitos
                </span>
              )}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              type="text"
              value={form.Name}
              onChange={(e) => setForm({ ...form, Name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              maxLength={120}
            />
          </div>

          {/* Foto de Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Foto de Perfil (opcional)
            </label>
            <input
              type="url"
              value={form.Profile_Pic_URL}
              onChange={(e) => setForm({ ...form, Profile_Pic_URL: e.target.value })}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Idioma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <select
              value={form.Language}
              onChange={(e) => setForm({ ...form, Language: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;
