import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { queuesService, Queue } from '../../services/queuesService';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function Queues() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);
  const [formData, setFormData] = useState({
    Name: '',
    Greeting_Message: '',
    Is_Active: true
  });

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    try {
      setLoading(true);
      const data = await queuesService.getAll();
      setQueues(data);
    } catch (error) {
      console.error('Erro ao carregar filas:', error);
      alert('Erro ao carregar filas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingQueue) {
        // Atualizar
        await queuesService.update(editingQueue.Id, formData);
        alert('Fila atualizada com sucesso!');
      } else {
        // Criar
        if (!user?.Company_Id) {
          alert('ID da empresa não encontrado');
          return;
        }
        await queuesService.create({
          Company_Id: user.Company_Id,
          ...formData
        });
        alert('Fila criada com sucesso!');
      }
      
      setShowModal(false);
      setEditingQueue(null);
      setFormData({ Name: '', Greeting_Message: '', Is_Active: true });
      loadQueues();
    } catch (error: any) {
      console.error('Erro ao salvar fila:', error);
      alert(error.response?.data?.message || 'Erro ao salvar fila');
    }
  };

  const handleEdit = (queue: Queue) => {
    setEditingQueue(queue);
    setFormData({
      Name: queue.Name,
      Greeting_Message: queue.Greeting_Message,
      Is_Active: queue.Is_Active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fila?')) return;
    
    try {
      await queuesService.delete(id);
      alert('Fila excluída com sucesso!');
      loadQueues();
    } catch (error) {
      console.error('Erro ao excluir fila:', error);
      alert('Erro ao excluir fila');
    }
  };

  const openNewModal = () => {
    setEditingQueue(null);
    setFormData({ Name: '', Greeting_Message: '', Is_Active: true });
    setShowModal(true);
  };

  return (
    <>
      <Sidebar />
      <Header title="Filas de Atendimento" />
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Filas de Atendimento</h1>
            <p className="text-gray-600 mt-1">Gerencie as filas de atendimento da sua empresa</p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Fila
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando filas...</p>
          </div>
        ) : (
          /* Lista de Filas */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {queues.map((queue) => (
              <div key={queue.Id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{queue.Name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      queue.Is_Active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {queue.Is_Active ? (
                        <>
                          <CheckCircle size={12} />
                          Ativa
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Inativa
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Mensagem de Saudação */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Mensagem de Saudação:</p>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {queue.Greeting_Message}
                  </p>
                </div>

                {/* Data de Criação */}
                <p className="text-xs text-gray-500 mb-4">
                  Criada em {new Date(queue.Created_At).toLocaleDateString('pt-BR')}
                </p>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/queues/${queue.Id}/users`)}
                    className="flex-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2 text-sm font-medium"
                    title="Gerenciar usuários"
                  >
                    <Users size={16} />
                    Usuários
                  </button>
                  <button
                    onClick={() => handleEdit(queue)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(queue.Id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center"
                    title="Excluir fila"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && queues.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg mb-4">Nenhuma fila cadastrada</p>
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar primeira fila
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingQueue ? 'Editar Fila' : 'Nova Fila'}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Nome */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Fila *
                </label>
                <input
                  type="text"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Vendas, Suporte, Financeiro..."
                  required
                  maxLength={100}
                />
              </div>

              {/* Mensagem de Saudação */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de Saudação *
                </label>
                <textarea
                  value={formData.Greeting_Message}
                  onChange={(e) => setFormData({ ...formData, Greeting_Message: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Ex: Olá! Você foi direcionado para o setor de Vendas. Em breve um de nossos atendentes irá responder."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta mensagem será enviada ao cliente após ele escolher esta fila
                </p>
              </div>

              {/* Ativo */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Is_Active}
                    onChange={(e) => setFormData({ ...formData, Is_Active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Fila ativa</span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  Filas inativas não aparecem nas opções para o cliente
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQueue(null);
                    setFormData({ Name: '', Greeting_Message: '', Is_Active: true });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingQueue ? 'Atualizar' : 'Criar'}
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
