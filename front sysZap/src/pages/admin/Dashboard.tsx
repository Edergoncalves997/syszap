import React, { useEffect } from 'react';
import { Building2, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { getRoleName } from '../../types/api';

const Dashboard: React.FC = () => {
  const { user, users, companies, loadUsers, loadCompanies } = useAuth();
  const { isOpen } = useSidebar();

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  if (!user) return null;

  const activeUsers = users.filter(u => u.Is_Active).length;

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Dashboard" subtitle="Visão geral do sistema" />

        <div className="p-8">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Empresas</p>
                  <p className="text-3xl font-bold text-gray-800">{companies.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Usuários Totais</p>
                  <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-gray-800">{activeUsers}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Tickets</p>
                  <p className="text-3xl font-bold text-gray-800">-</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MessageSquare className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Empresas */}
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Empresas Cadastradas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">CNPJ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usuários</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => {
                    const companyUsers = users.filter(u => u.Company_Id === company.Id).length;
                    return (
                      <tr key={company.Id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{company.Name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company.CNPJ || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{companyUsers}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(company.Created_At).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {companies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma empresa cadastrada
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Usuários Recentes */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Últimos Usuários</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Papel</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.slice(0, 10).map((user) => {
                    const company = companies.find(c => c.Id === user.Company_Id);
                    return (
                      <tr key={user.Id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.Name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.Email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company?.Name || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {getRoleName(user.Role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.Is_Active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.Is_Active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário cadastrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
