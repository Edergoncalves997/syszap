import { useState, useEffect } from 'react';
import { Clock, CheckCircle, User, MessageSquare, Send, ArrowLeft, Phone, UserCircle } from 'lucide-react';
import { ticketsService, Ticket, Message, getTicketStatusName, getTicketStatusColor } from '../services/ticketsService';
import { queuesService, Queue } from '../services/queuesService';
import { categoriesService, Category } from '../services/categoriesService';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Tickets() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const { on } = useWebSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [finishFormData, setFinishFormData] = useState({
    Subject: '',
    Category_Id: '',
    Resolution_Text: ''
  });
  const [targetQueueId, setTargetQueueId] = useState('');
  
  // Estados do chat
  const [showChat, setShowChat] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadTickets();
    loadQueues();
    loadCategories();
  }, [selectedStatus]);

  // WebSocket: Atualizar mensagens em tempo real
  useEffect(() => {
    if (!showChat || !currentTicket) {
      console.log('🔌 WebSocket: Chat não está aberto ou ticket não selecionado');
      return;
    }

    console.log('🔌 WebSocket: Configurando listener para chat:', {
      ticketId: currentTicket.Id,
      chatId: currentTicket.Chat_Id
    });

    // Nova mensagem recebida
    const cleanup = on('new_message', (data: any) => {
      console.log('🔌 WebSocket: Nova mensagem recebida no chat', {
        messageId: data.Id,
        chatId: data.Chat_Id,
        direction: data.Direction,
        body: data.Body?.substring(0, 50) + '...',
        currentChatId: currentTicket.Chat_Id
      });
      
      // Se for do chat atual, adicionar às mensagens
      if (currentTicket && data.Chat_Id === currentTicket.Chat_Id) {
        console.log('✅ WebSocket: Mensagem é do chat atual, processando...');
        setMessages((prev) => {
          // Verificar se a mensagem já existe para evitar duplicação
          const exists = prev.some(msg => msg.Id === data.Id || 
            (msg.Body === data.Body && 
             msg.Created_At === data.Created_At && 
             msg.Direction === data.Direction));
          
          if (exists) {
            console.log('⚠️ Mensagem já existe, ignorando duplicação:', {
              messageId: data.Id,
              body: data.Body,
              direction: data.Direction
            });
            return prev;
          }

          // Se for uma mensagem de saída (Direction === 1), substituir mensagem temporária
          if (data.Direction === 1) {
            const filtered = prev.filter(msg => !msg.Id.startsWith('temp-'));
            console.log('✅ Adicionando mensagem real via WebSocket (substituindo temporária):', {
              messageId: data.Id,
              body: data.Body,
              direction: data.Direction,
              totalMessages: filtered.length + 1
            });
            return [...filtered, data];
          }

          console.log('✅ Adicionando nova mensagem via WebSocket:', {
            messageId: data.Id,
            body: data.Body,
            direction: data.Direction,
            totalMessages: prev.length + 1
          });
          return [...prev, data];
        });
      } else {
        console.log('⚠️ WebSocket: Mensagem não é do chat atual, ignorando');
      }
    });

    return cleanup;
  }, [on, showChat, currentTicket]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketsService.getMyTickets(selectedStatus);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      alert('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadQueues = async () => {
    try {
      const data = await queuesService.getAll();
      setQueues(data);
    } catch (error) {
      console.error('Erro ao carregar filas:', error);
    }
  };

  const loadCategories = async () => {
    try {
      if (user?.Company_Id) {
        const data = await categoriesService.getByCompany(user.Company_Id);
        setCategories(data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleAssumeTicket = async (ticketId: string) => {
    if (!confirm('Deseja assumir este ticket?')) return;
    
    try {
      await ticketsService.assume(ticketId);
      alert('Ticket assumido com sucesso!');
      loadTickets();
    } catch (error: any) {
      console.error('Erro ao assumir ticket:', error);
      alert(error.response?.data?.message || 'Erro ao assumir ticket');
    }
  };

  const handleFinishTicket = async () => {
    if (!selectedTicket) return;
    
    if (!finishFormData.Subject.trim()) {
      alert('Por favor, preencha o título do atendimento');
      return;
    }

    if (!finishFormData.Category_Id) {
      alert('Por favor, selecione uma categoria');
      return;
    }

    if (!finishFormData.Resolution_Text.trim()) {
      alert('Por favor, descreva o que foi feito no atendimento');
      return;
    }
    
    try {
      // Atualizar o ticket com título, categoria e resolução
      await ticketsService.update(selectedTicket.Id, {
        Subject: finishFormData.Subject,
        Category_Id: finishFormData.Category_Id,
        Resolution_Text: finishFormData.Resolution_Text
      });

      // Finalizar o ticket
      await ticketsService.finish(selectedTicket.Id, finishFormData.Resolution_Text);
      
      alert('Ticket finalizado com sucesso!');
      setShowFinishModal(false);
      setSelectedTicket(null);
      setFinishFormData({ Subject: '', Category_Id: '', Resolution_Text: '' });
      loadTickets();
    } catch (error: any) {
      console.error('Erro ao finalizar ticket:', error);
      alert(error.response?.data?.message || 'Erro ao finalizar ticket');
    }
  };

  const handleTransferTicket = async () => {
    if (!selectedTicket || !targetQueueId) return;
    
    try {
      await ticketsService.transfer(selectedTicket.Id, targetQueueId);
      alert('Ticket transferido com sucesso!');
      setShowTransferModal(false);
      setSelectedTicket(null);
      setTargetQueueId('');
      loadTickets();
    } catch (error: any) {
      console.error('Erro ao transferir ticket:', error);
      alert(error.response?.data?.message || 'Erro ao transferir ticket');
    }
  };

  const openFinishModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFinishFormData({
      Subject: ticket.Subject,
      Category_Id: ticket.Category_Id || '',
      Resolution_Text: ticket.Resolution_Text || ''
    });
    setShowFinishModal(true);
  };

  const openTransferModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTransferModal(true);
  };

  // Funções do chat
  const openChat = async (ticket: Ticket) => {
    try {
      setCurrentTicket(ticket);
      setShowChat(true);
      await loadMessages(ticket.Id);
    } catch (error) {
      console.error('Erro ao abrir chat:', error);
      alert('Erro ao carregar mensagens');
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const data = await ticketsService.getMessages(ticketId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentTicket || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Limpar imediatamente para melhor UX

    // Criar mensagem temporária para mostrar imediatamente
    const tempMessage: Message = {
      Id: `temp-${Date.now()}`,
      Company_Id: currentTicket.Company_Id,
      Session_Id: '',
      Chat_Id: currentTicket.Chat_Id!,
      Direction: 1, // OUT
      Type: 0,
      Body: messageText,
      Caption: null,
      Media_Id: null,
      WA_Message_Id: '',
      WA_Timestamp: null,
      Status: 1,
      Error_Code: null,
      Error_Message: null,
      Metadata_JSON: null,
      Fetched_From_WhatsApp: false,
      Cache_Until: null,
      Created_At: new Date().toISOString(),
      Updated_At: new Date().toISOString()
    };

    // Adicionar mensagem temporária imediatamente
    setMessages(prev => [...prev, tempMessage]);

    try {
      setSendingMessage(true);
      const result = await ticketsService.sendMessage(currentTicket.Id, messageText);
      
      console.log('✅ Mensagem enviada com sucesso:', result);
      
      // Aguardar um pouco para o WebSocket processar
      setTimeout(() => {
        // Se a mensagem real ainda não chegou via WebSocket, recarregar
        setMessages(prev => {
          const hasRealMessage = prev.some(msg => 
            msg.Body === result.message && 
            msg.Id !== tempMessage.Id
          );
          
          if (!hasRealMessage) {
            console.log('⚠️ Mensagem real não chegou via WebSocket, recarregando...');
            loadMessages(currentTicket.Id);
          } else {
            console.log('✅ Mensagem real chegou via WebSocket');
          }
          
          return prev;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.Id !== tempMessage.Id));
      
      alert(error.response?.data?.message || 'Erro ao enviar mensagem');
      setNewMessage(messageText); // Restaurar mensagem em caso de erro
    } finally {
      setSendingMessage(false);
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setCurrentTicket(null);
    setMessages([]);
    setNewMessage('');
  };

  // Estatísticas
  const stats = {
    aguardando: tickets.filter(t => t.Status === 1).length,
    emAtendimento: tickets.filter(t => t.Status === 2).length,
    total: tickets.length
  };

  return (
    <>
      <Sidebar />
      <Header title="Meus Tickets" />
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} p-8`}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Atendimentos</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie seus tickets de atendimento</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aguardando</p>
                <p className="text-3xl font-bold text-blue-600">{stats.aguardando}</p>
              </div>
              <Clock className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atendimento</p>
                <p className="text-3xl font-bold text-green-600">{stats.emAtendimento}</p>
              </div>
              <MessageSquare className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <User className="text-gray-900" size={40} />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filtrar por status:</label>
            <select
              value={selectedStatus ?? ''}
              onChange={(e) => setSelectedStatus(e.target.value ? Number(e.target.value) : undefined)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="0">Aguardando Escolha de Fila</option>
              <option value="1">Aguardando Atendente</option>
              <option value="2">Em Atendimento</option>
              <option value="3">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando tickets...</p>
          </div>
        ) : (
          /* Lista de Tickets */
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">Nenhum ticket encontrado</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.Id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between">
                    {/* Info Principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Foto do Cliente */}
                        {ticket.Client?.Profile_Pic_URL ? (
                          <img 
                            src={ticket.Client.Profile_Pic_URL} 
                            alt={ticket.Client.Name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCircle size={28} className="text-gray-500" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{ticket.Subject}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.Status)}`}>
                              {getTicketStatusName(ticket.Status)}
                            </span>
                            {ticket.Priority && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                ticket.Priority === 3 ? 'bg-red-100 text-red-800' :
                                ticket.Priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                Prioridade {ticket.Priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Cliente:</span> {ticket.Client?.Name}
                        </div>
                        <div>
                          <span className="font-medium">WhatsApp:</span> {ticket.Client?.WhatsApp_Number}
                        </div>
                        <div>
                          <span className="font-medium">Fila:</span> {ticket.Queue?.Name || 'Aguardando escolha'}
                        </div>
                        <div>
                          <span className="font-medium">Atendente:</span> {ticket.User?.Name || 'Nenhum atendente'}
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {new Date(ticket.Created_At).toLocaleString('pt-BR')}
                        </div>
                        {ticket.Last_Message_At && (
                          <div>
                            <span className="font-medium">Última mensagem:</span> {new Date(ticket.Last_Message_At).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>

                      {ticket.Resolution_Text && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Resolução:</p>
                          <p className="text-sm text-gray-600">{ticket.Resolution_Text}</p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      {(ticket.Status === 0 || ticket.Status === 1) && (
                        <button
                          onClick={() => handleAssumeTicket(ticket.Id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                        >
                          <CheckCircle size={16} />
                          {ticket.Status === 0 ? 'Assumir' : 'Assumir'}
                        </button>
                      )}
                      
                      {ticket.Status === 2 && (
                        <>
                          <button
                            onClick={() => openChat(ticket)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                          >
                            <MessageSquare size={16} />
                            Atender
                          </button>
                          <button
                            onClick={() => openFinishModal(ticket)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                          >
                            <CheckCircle size={16} />
                            Finalizar
                          </button>
                          <button
                            onClick={() => openTransferModal(ticket)}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                          >
                            <User size={16} />
                            Transferir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Interface do Chat */}
      {showChat && currentTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header do Chat */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeChat}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                
                {/* Foto do Cliente */}
                {currentTicket.Client?.Profile_Pic_URL ? (
                  <img 
                    src={currentTicket.Client.Profile_Pic_URL} 
                    alt={currentTicket.Client.Name} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserCircle size={24} className="text-gray-500" />
                  </div>
                )}
                
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{currentTicket.Subject}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {currentTicket.Client?.Name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {currentTicket.Client?.WhatsApp_Number}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(currentTicket.Status)}`}>
                      {getTicketStatusName(currentTicket.Status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    closeChat();
                    openTransferModal(currentTicket);
                  }}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  Transferir
                </button>
                <button
                  onClick={() => {
                    closeChat();
                    openFinishModal(currentTicket);
                  }}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  Finalizar
                </button>
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.Id}
                    className={`flex ${message.Direction === 1 ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.Direction === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.Body}</p>
                      <p className={`text-xs mt-1 ${
                        message.Direction === 1 ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.Created_At).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Área de Input */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalizar Ticket */}
      {showFinishModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Finalizar Ticket</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Cliente:</span> {selectedTicket.Client?.Name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">WhatsApp:</span> {selectedTicket.Client?.WhatsApp_Number}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Atendimento *
              </label>
              <input
                type="text"
                value={finishFormData.Subject}
                onChange={(e) => setFinishFormData({ ...finishFormData, Subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Problema resolvido - Configuração de rede"
                required
                maxLength={200}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={finishFormData.Category_Id}
                onChange={(e) => setFinishFormData({ ...finishFormData, Category_Id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map(category => (
                  <option key={category.Id} value={category.Id}>
                    {category.Name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Nenhuma categoria cadastrada. Solicite ao administrador criar categorias.
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O que foi feito neste atendimento? *
              </label>
              <textarea
                value={finishFormData.Resolution_Text}
                onChange={(e) => setFinishFormData({ ...finishFormData, Resolution_Text: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                placeholder="Descreva detalhadamente o que foi feito para resolver o problema do cliente..."
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  setSelectedTicket(null);
                  setFinishFormData({ Subject: '', Category_Id: '', Resolution_Text: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinishTicket}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Finalizar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferir Ticket */}
      {showTransferModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Transferir Ticket</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Cliente:</span> {selectedTicket.Client?.Name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Fila Atual:</span> {selectedTicket.Queue?.Name || 'Não atribuída'}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Fila *
              </label>
              <select
                value={targetQueueId}
                onChange={(e) => setTargetQueueId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione a fila...</option>
                {queues
                  .filter(q => q.Is_Active && q.Id !== selectedTicket.Queue_Id)
                  .map(q => (
                    <option key={q.Id} value={q.Id}>{q.Name}</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedTicket(null);
                  setTargetQueueId('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferTicket}
                disabled={!targetQueueId}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transferir
              </button>
          </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}