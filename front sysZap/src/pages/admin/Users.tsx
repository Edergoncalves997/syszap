import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { User } from '../../types/api';
import { UserRole, getRoleName } from '../../types/api';

const Users: React.FC = () => {
  const { users, companies, loadUsers, loadCompanies, addUser, updateUser, deleteUser } = useAuth();
  const { isOpen } = useSidebar();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({
    Name: '',
    Email: '',
    Password: '',
    Company_Id: '',
    Role: UserRole.USER,
    Is_Active: true,
  });

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUser) {
        // Ao editar, só envia senha se foi preenchida
        const userData: any = {
          Company_Id: form.Company_Id || null,
          Name: form.Name,
          Email: form.Email,
          Role: form.Role,
          Is_Active: form.Is_Active,
        };
        
        // Só adiciona senha se foi preenchida
        if (form.Password && form.Password.trim() !== '') {
          userData.Password = form.Password;
        }
        
        await updateUser(editingUser.Id, userData);
      } else {
        // Ao criar, senha é obrigatória
        const userData = {
          Company_Id: form.Company_Id || null,
          Name: form.Name,
          Email: form.Email,
          Password: form.Password,
          Role: form.Role,
        };
        await addUser(userData);
      }
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      Name: '',
      Email: '',
      Password: '',
      Company_Id: '',
      Role: UserRole.USER,
      Is_Active: true,
    });
    setEditingUser(null);
    setShowModal(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      Name: user.Name,
      Email: user.Email,
      Password: '',
      Company_Id: user.Company_Id || '',
      Role: user.Role,
      Is_Active: user.Is_Active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(id);
        loadUsers();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Usuários" subtitle="Gestão completa de usuários" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Total: {users.length}</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Novo Usuário</span>
            </button>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Papel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const company = companies.find((c) => c.Id === user.Company_Id);
                  return (
                    <tr key={user.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.Name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.Email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{company?.Name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.Role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                          user.Role === UserRole.MANAGER ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getRoleName(user.Role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.Is_Active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.Is_Active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.Id)}
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

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={form.Name}
              onChange={(e) => setForm({ ...form, Name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={form.Email}
              onChange={(e) => setForm({ ...form, Email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha {editingUser && '(deixe em branco para não alterar)'}
            </label>
            <input
              type="password"
              value={form.Password}
              onChange={(e) => setForm({ ...form, Password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required={!editingUser}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
            <select
              value={form.Company_Id}
              onChange={(e) => setForm({ ...form, Company_Id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sem empresa</option>
              {companies.map((company) => (
                <option key={company.Id} value={company.Id}>
                  {company.Name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Papel</label>
            <select
              value={form.Role}
              onChange={(e) => setForm({ ...form, Role: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value={UserRole.USER}>Usuário</option>
              <option value={UserRole.MANAGER}>Gerente</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={form.Is_Active}
              onChange={(e) => setForm({ ...form, Is_Active: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label className="ml-2 text-sm text-gray-700">Ativo</label>
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

export default Users;
