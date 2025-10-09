import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { Company } from '../../types/api';

const Companies: React.FC = () => {
  const { user, companies, loadCompanies, addCompany, updateCompany, deleteCompany } = useAuth();
  const { isOpen } = useSidebar();
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log user role
  useEffect(() => {
    console.log('User atual:', user);
    console.log('Role:', user?.Role);
    console.log('Token:', localStorage.getItem('token'));
  }, [user]);

  const [form, setForm] = useState({
    Name: '',
    CNPJ: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const companyData = {
        Name: form.Name,
        CNPJ: form.CNPJ || undefined,
      };

      console.log('Salvando empresa:', companyData);
      console.log('Modo:', editingCompany ? 'EDITAR' : 'CRIAR');

      if (editingCompany) {
        console.log('ID da empresa:', editingCompany.Id);
        await updateCompany(editingCompany.Id, companyData);
      } else {
        await addCompany(companyData);
      }
      resetForm();
      await loadCompanies();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      // Erro já foi tratado no contexto
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      Name: '',
      CNPJ: '',
    });
    setEditingCompany(null);
    setShowModal(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      Name: company.Name,
      CNPJ: company.CNPJ || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      setIsLoading(true);
      try {
        await deleteCompany(id);
        await loadCompanies();
      } catch (error: any) {
        console.error('Erro ao deletar empresa:', error);
        // Erro já foi tratado no contexto
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Empresas" subtitle="Gestão completa de empresas" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Total: {companies.length}</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-light transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Nova Empresa</span>
            </button>
          </div>

          {/* Cards de Empresas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.Id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary-light rounded-lg">
                      <Building2 className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{company.Name}</h3>
                      {company.CNPJ && (
                        <p className="text-sm text-gray-600">CNPJ: {formatCNPJ(company.CNPJ)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(company)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(company.Id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma empresa cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
            <input
              type="text"
              value={form.Name}
              onChange={(e) => setForm({ ...form, Name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ (opcional)</label>
            <input
              type="text"
              value={form.CNPJ}
              onChange={(e) => setForm({ ...form, CNPJ: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
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

// Função auxiliar para formatar CNPJ
const formatCNPJ = (cnpj: string): string => {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

export default Companies;
