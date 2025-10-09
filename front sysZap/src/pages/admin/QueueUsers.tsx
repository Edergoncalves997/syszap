import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { userQueuesService } from '../../services/userQueuesService';
import { queuesService, Queue } from '../../services/queuesService';
import { usersService } from '../../services/usersService';
import { User } from '../../types/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function QueueUsers() {
  const { queueId } = useParams<{ queueId: string }>();
  const navigate = useNavigate();
  const { isOpen } = useSidebar();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [queueUsers, setQueueUsers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (queueId) {
      loadData();
    }
  }, [queueId]);

  const loadData = async () => {
    if (!queueId) return;
    
    try {
      setLoading(true);
      
      // Carregar dados da fila
      const queueData = await queuesService.getById(queueId);
      setQueue(queueData);
      
      // Carregar usuários vinculados à fila
      const usersData = await userQueuesService.getQueueUsers(queueId);
      setQueueUsers(usersData.users || []);
      
      // Carregar todos os usuários para o select
      const allUsers = await usersService.getAll();
      setAvailableUsers(allUsers);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId || !queueId) return;
    
    try {
      await userQueuesService.linkUserToQueue({
        User_Id: selectedUserId,
        Queue_Id: queueId
      });
      alert('Usuário vinculado com sucesso!');
      setShowModal(false);
      setSelectedUserId('');
      loadData();
    } catch (error: any) {
      console.error('Erro ao vincular usuário:', error);
      alert(error.response?.data?.message || 'Erro ao vincular usuário');
    }
  };

  const handleRemoveUser = async (userQueueId: string) => {
    if (!confirm('Tem certeza que deseja desvincular este usuário da fila?')) return;
    
    try {
      await userQueuesService.unlinkById(userQueueId);
      alert('Usuário desvinculado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao desvincular usuário:', error);
      alert('Erro ao desvincular usuário');
    }
  };

  // Filtrar usuários que já estão vinculados
  const linkedUserIds = queueUsers.map(qu => qu.Id);
  const usersToAdd = availableUsers.filter(u => !linkedUserIds.includes(u.Id));

  return (
    <>
      <Sidebar />
      <Header title="Gerenciar Usuários da Fila" />
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/queues')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar para Filas
          </button>
          
          {queue && (
            <>
              <h1 className="text-3xl font-bold text-gray-900">{queue.Name}</h1>
              <p className="text-gray-600 mt-1">Gerencie os usuários que atendem esta fila</p>
            </>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Botão Adicionar */}
            <div className="mb-6">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Adicionar Usuário
              </button>
            </div>

            {/* Lista de Usuários */}
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Perfil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vinculado em
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {queueUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Nenhum usuário vinculado a esta fila
                        </td>
                      </tr>
                    ) : (
                      queueUsers.map((queueUser) => (
                        <tr key={queueUser.userQueueId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {queueUser.Name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{queueUser.Email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {queueUser.Role === 0 ? 'Admin' : queueUser.Role === 1 ? 'Manager' : 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              queueUser.Is_Active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {queueUser.Is_Active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(queueUser.linkedAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveUser(queueUser.userQueueId)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                            >
                              <Trash2 size={16} />
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Adicionar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Adicionar Usuário à Fila</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Usuário
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {usersToAdd.map((user) => (
                  <option key={user.Id} value={user.Id}>
                    {user.Name} - {user.Email}
                  </option>
                ))}
              </select>
              {usersToAdd.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Todos os usuários já estão vinculados a esta fila
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedUserId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUser}
                disabled={!selectedUserId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
