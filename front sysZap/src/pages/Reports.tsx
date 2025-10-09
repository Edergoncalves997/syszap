import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { isOpen } = useSidebar();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Relatórios" subtitle="Análise e estatísticas" />

        <div className="p-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <BarChart3 size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Relatórios e Estatísticas
            </h2>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade será integrada com a API em breve.
            </p>
            <p className="text-sm text-gray-500">
              Dashboards e relatórios analíticos serão disponibilizados em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
