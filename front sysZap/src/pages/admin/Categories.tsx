import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { categoriesService, Category } from '../../services/categoriesService';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Categories() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    Name: '',
    Description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      if (user?.Company_Id) {
        const data = await categoriesService.getByCompany(user.Company_Id);
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      alert('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.Company_Id) {
      alert('Empresa não identificada');
      return;
    }

    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory.Id, formData);
        alert('Categoria atualizada com sucesso!');
      } else {
        await categoriesService.create({
          Company_Id: user.Company_Id,
          ...formData
        });
        alert('Categoria criada com sucesso!');
      }
      
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ Name: '', Description: '' });
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      alert(error.response?.data?.message || 'Erro ao salvar categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      Name: category.Name,
      Description: category.Description
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      await categoriesService.delete(id);
      alert('Categoria excluída com sucesso!');
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      alert(error.response?.data?.message || 'Erro ao excluir categoria');
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ Name: '', Description: '' });
    setShowModal(true);
  };

  return (
    <>
      <Sidebar />
      <Header title="Categorias" />
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
              <p className="text-gray-600 mt-1">Gerencie as categorias de atendimento</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Categoria
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando categorias...</p>
            </div>
          ) : (
            /* Lista de Categorias */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                  <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">Nenhuma categoria cadastrada</p>
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Criar primeira categoria
                  </button>
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.Id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{category.Name}</h3>
                        <p className="text-sm text-gray-600">{category.Description}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      Criada em: {new Date(category.Created_At).toLocaleDateString('pt-BR')}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.Id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Criar/Editar Categoria */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Suporte Técnico"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Descreva o propósito desta categoria..."
                    required
                    maxLength={255}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setFormData({ Name: '', Description: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
