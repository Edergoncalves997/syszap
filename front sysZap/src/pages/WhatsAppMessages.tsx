import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MediaMessage from '../components/MediaMessage';
import { whatsappService } from '../services/whatsappService';
import { Session, Client, UserRole } from '../types/api';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_BASE_URL } from '../config/env';

const WhatsAppMessages: React.FC = () => {
  const { user, clients, loadClients } = useAuth();
  const { isOpen } = useSidebar();
  const { on } = useWebSocket();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
    loadClients();
  }, []);

  // WebSocket: Atualizar mensagens e clientes em tempo real
  useEffect(() => {
    // Nova mensagem recebida
    const cleanup1 = on('new_message', (data: any) => {
      console.log('🔌 WebSocket: Nova mensagem recebida', data);
      
      // Se for do cliente selecionado, adicionar às mensagens
      if (selectedClient && data.Chat && data.Chat.WA_Chat_Id === `${selectedClient.WhatsApp_Number}@c.us`) {
        setMessages((prev) => [...prev, data]);
        toast.success('💬 Nova mensagem recebida!', { duration: 2000 });
      } else {
        // Notificar que há mensagem de outro cliente
        if (data.Client) {
          toast('💬 Nova mensagem de ' + data.Client.Name, { duration: 3000, icon: '📨' });
        }
      }
    });

    // Cliente atualizado (nome ou foto)
    const cleanup2 = on('client_update', (data: any) => {
      console.log('🔌 WebSocket: Cliente atualizado', data);
      loadClients(); // Recarregar lista de clientes
    });

    // Novo cliente cadastrado
    const cleanup3 = on('new_client', (data: any) => {
      console.log('🔌 WebSocket: Novo cliente cadastrado', data);
      loadClients(); // Recarregar lista de clientes
      toast.success('👤 Novo cliente cadastrado: ' + data.Name, { duration: 3000 });
    });

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, [on, selectedClient]);

  // Carregar mensagens quando selecionar um cliente
  useEffect(() => {
    if (selectedClient && selectedSession) {
      loadMessages();
      
      // Não precisa mais de polling! WebSocket vai atualizar em tempo real
      // const interval = setInterval(() => { loadMessages(); }, 5000);
      // return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedClient, selectedSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Filtrar apenas sessões conectadas
      const connectedSessions = data.filter((s: Session) => s.Status === 1);
      setSessions(connectedSessions);

      // Auto-selecionar primeira sessão conectada
      if (connectedSessions.length > 0 && !selectedSession) {
        setSelectedSession(connectedSessions[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedClient || !selectedSession) return;

    try {
      setIsLoadingMessages(true);
      const response = await fetch(
        `${API_BASE_URL}/clients/${selectedClient.Id}/messages?sessionId=${selectedSession.Id}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao carregar mensagens:', errorData);
        toast.error(`Erro ao carregar mensagens: ${errorData.message || response.statusText}`);
        throw new Error('Erro ao carregar mensagens');
      }

      const data = await response.json();
      console.log('📨 Dados recebidos do backend:', data);
      setMessages(data.messages || []);
      
      if (data.messages && data.messages.length > 0) {
        console.log(`✅ ${data.messages.length} mensagens carregadas com sucesso`);
      } else {
        console.log('ℹ️ Nenhuma mensagem encontrada para este cliente');
      }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      if (!error.message.includes('Erro ao carregar mensagens')) {
        toast.error('Erro ao carregar mensagens. Verifique sua conexão.');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const availableClients = user?.Role === UserRole.ADMIN
    ? clients
    : clients.filter(c => c.Company_Id === user?.Company_Id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) {
      toast.error('❌ Selecione uma sessão WhatsApp');
      return;
    }

    if (!selectedClient) {
      toast.error('❌ Selecione um cliente');
      return;
    }

    if (!message.trim()) {
      toast.error('❌ Digite uma mensagem');
      return;
    }

    setIsLoading(true);
    try {
      await whatsappService.sendMessage({
        sessionId: selectedSession.Id,
        to: selectedClient.WhatsApp_Number,
        message: message.trim()
      });

      toast.success('✅ Mensagem enviada com sucesso!');
      setMessage('');

      // Recarregar mensagens para incluir a mensagem enviada
      setTimeout(() => {
        loadMessages();
      }, 500); // Aguarda 500ms para garantir que foi salva no banco
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.response?.status === 500) {
        const errorMsg = error.response?.data?.message || '';
        if (errorMsg.includes('não conectada')) {
          toast.error('❌ Sessão não está conectada! Conecte primeiro.');
        } else {
          toast.error(`❌ Erro ao enviar: ${errorMsg}`);
        }
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado!');
      } else {
        toast.error('❌ Erro ao enviar mensagem');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatWhatsApp = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    return number;
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Mensagens WhatsApp" subtitle="Envie mensagens para seus clientes" />

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Seleção de Sessão e Cliente */}
            <div className="lg:col-span-1 space-y-4">
              {/* Sessão Ativa */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Sessão WhatsApp</h3>
                {sessions.length > 0 ? (
                  <select
                    value={selectedSession?.Id || ''}
                    onChange={(e) => {
                      const session = sessions.find(s => s.Id === e.target.value);
                      setSelectedSession(session || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {sessions.map((session) => (
                      <option key={session.Id} value={session.Id}>
                        {session.Session_Name} ({session.Phone_Number})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma sessão conectada</p>
                )}
              </div>

              {/* Lista de Clientes */}
              <div className="bg-white rounded-lg shadow-lg p-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Clientes</h3>
                <div className="space-y-2">
                  {availableClients.map((client) => (
                    <button
                      key={client.Id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                        selectedClient?.Id === client.Id
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {client.Profile_Pic_URL ? (
                          <img src={client.Profile_Pic_URL} alt={client.Name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon size={20} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{client.Name}</p>
                          <p className="text-xs text-gray-500">{formatWhatsApp(client.WhatsApp_Number)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {availableClients.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum cliente cadastrado</p>
                )}
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg h-[700px] flex flex-col">
                {/* Header do Chat */}
                <div className="p-4 border-b border-gray-200 bg-green-50">
                  {selectedClient ? (
                    <div className="flex items-center space-x-3">
                      {selectedClient.Profile_Pic_URL ? (
                        <img src={selectedClient.Profile_Pic_URL} alt={selectedClient.Name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                          <UserIcon size={24} className="text-green-700" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800">{selectedClient.Name}</h3>
                        <p className="text-sm text-gray-600 flex items-center space-x-1">
                          <Phone size={12} />
                          <span>{formatWhatsApp(selectedClient.WhatsApp_Number)}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <MessageSquare size={24} className="mx-auto mb-2" />
                      <p className="text-sm">Selecione um cliente para iniciar</p>
                    </div>
                  )}
                </div>

                {/* Mensagens */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p>Carregando mensagens...</p>
                      </div>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((msg: any) => (
                        <div
                          key={msg.Id}
                          className={`flex ${msg.Direction === 1 ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            msg.Direction === 1
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            {/* Mídia */}
                            {msg.Media && msg.Media.Storage_Key && (
                              <MediaMessage 
                                media={msg.Media}
                                caption={msg.Caption}
                                direction={msg.Direction}
                              />
                            )}
                            
                            {/* Texto (apenas se não for mídia ou se for mídia com caption) */}
                            {msg.Body && !msg.Media && (
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.Body}
                              </p>
                            )}
                            
                            {/* Horário e Status */}
                            <div className="flex items-center justify-between mt-1 gap-2">
                              <p className={`text-xs ${
                                msg.Direction === 1 ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                {new Date(msg.Created_At).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                              {msg.Direction === 1 && (
                                <span className="text-xs">
                                  {msg.Status === 1 && '⏳'}
                                  {msg.Status === 2 && '✓'}
                                  {msg.Status === 3 && '✓✓'}
                                  {msg.Status === 4 && '✓✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-xs mt-2">Selecione um cliente e envie uma mensagem</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input de Mensagem */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        !selectedSession ? 'Nenhuma sessão conectada' :
                        !selectedClient ? 'Selecione um cliente...' :
                        'Digite sua mensagem...'
                      }
                      disabled={!selectedSession || !selectedClient || isLoading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!selectedSession || !selectedClient || !message.trim() || isLoading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send size={20} />
                      <span>{isLoading ? 'Enviando...' : 'Enviar'}</span>
                    </button>
                  </form>

                  {!selectedSession && sessions.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ Nenhuma sessão WhatsApp está conectada. Peça ao administrador para conectar uma sessão.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;


