import React from 'react';
import { User, Building2, Bell, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { UserRole, getRoleName } from '../types/api';

const Settings: React.FC = () => {
  const { user, companies, logout } = useAuth();
  const { isOpen } = useSidebar();

  if (!user) return null;

  const company = companies.find((c) => c.Id === user.Company_Id);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
    }
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Configurações" subtitle="Gerencie suas preferências" />

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Informações do Usuário */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Informações do Usuário</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={user.Name}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user.Email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                {company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                    <input
                      type="text"
                      value={company.Name}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Papel</label>
                  <input
                    type="text"
                    value={getRoleName(user.Role)}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Informações da Empresa */}
            {user.Role !== UserRole.ADMIN && company && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Building2 className="text-primary" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Informações da Empresa</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                    <input
                      type="text"
                      value={company.Name}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  
                  {company.CNPJ && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={company.CNPJ}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notificações */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Notificações</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Novos Tickets</p>
                    <p className="text-sm text-gray-600">Receba notificações de novos atendimentos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Mensagens</p>
                    <p className="text-sm text-gray-600">Receba notificações de novas mensagens</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Segurança</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <button className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
                    Alterar Senha
                  </button>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    Recomendamos alterar sua senha periodicamente para manter sua conta segura.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto justify-center"
                  >
                    <LogOut size={20} />
                    <span>Sair da Conta</span>
                  </button>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    Ao sair, seu token será removido e você precisará fazer login novamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
