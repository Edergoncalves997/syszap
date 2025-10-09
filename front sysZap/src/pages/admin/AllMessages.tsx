import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye, User as UserIcon, Phone, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { UserRole } from '../../types/api';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/env';

interface Message {
  Id: string;
  Body: string | null;
  Caption: string | null;
  Direction: number;
  Type: number;
  Status: number;
  Created_At: string;
  WA_Timestamp: string | null;
  Company_Id: string;
  Chat: {
    WA_Chat_Id: string;
    Client: {
      Name: string;
      WhatsApp_Number: string;
    };
  };
  Media?: {
    Id: string;
    Mime_Type: string;
    Storage_Key: string;
    Storage_Provider: string;
  };
}

interface Chat {
  Id: string;
  WA_Chat_Id: string;
  Type: number;
  Client_Id: string | null;
  Client?: {
    Id: string;
    Name: string;
    WhatsApp_Number: string;
    Profile_Pic_URL?: string;
  };
}

const AllMessages: React.FC = () => {
  const { user, companies } = useAuth();
  const { isOpen } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedChat && selectedCompany) {
      loadMessages();

      // Polling: Atualizar mensagens a cada 5 segundos
      const interval = setInterval(() => {
        loadMessages();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedChat, selectedCompany]);

  const loadChats = async (companyId: string) => {
    try {
      setIsLoadingChats(true);
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/chats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar chats');
      }

      const data = await response.json();
      setChats(data);
      setSelectedCompany(companyId);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast.error('❌ Erro ao carregar chats');
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat) return;

    try {
      setIsLoadingMessages(true);
      const response = await fetch(
        `${API_BASE_URL}/clients/${selectedChat.Client_Id}/messages?sessionId=${selectedChat.WA_Chat_Id}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = !searchTerm || 
      chat.Client?.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.Client?.WhatsApp_Number.includes(searchTerm) ||
      chat.WA_Chat_Id.includes(searchTerm);
    
    return matchesSearch;
  });

  const handleCompanySelect = (companyId: string) => {
    loadChats(companyId);
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedCompany('');
    setSelectedChat(null);
    setChats([]);
    setMessages([]);
  };

  const formatWhatsApp = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    return number;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (user?.Role !== UserRole.ADMIN) {
    return (
      <div className="flex h-screen bg-neutral">
        <Sidebar />
        <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 flex flex-col`}>
          <Header title="Todas as Mensagens" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Eye className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Acesso Restrito
              </h2>
              <p className="text-gray-500">
                Apenas administradores podem visualizar todas as mensagens.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header 
          title={selectedCompany ? `Mensagens - ${companies.find(c => c.Id === selectedCompany)?.Name}` : "Todas as Mensagens"} 
          subtitle={!selectedCompany ? "Selecione uma empresa para visualizar as conversas" : ""}
        />

        <div className="p-8">
          {!selectedCompany ? (
            // Seleção de Empresa
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Selecione uma Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <div
                    key={company.Id}
                    onClick={() => handleCompanySelect(company.Id)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.Name}</h3>
                    <p className="text-sm text-gray-500">Clique para ver conversas</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Layout de Chat estilo WhatsApp
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar - Lista de Chats */}
              <div className="lg:col-span-1 space-y-4">
                {/* Botão Voltar */}
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
                >
                  <ChevronLeft size={20} />
                  <span>Voltar para empresas</span>
                </button>

                {/* Busca */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>

                {/* Lista de Chats */}
                <div className="bg-white rounded-lg shadow-lg max-h-[600px] overflow-y-auto">
                  {isLoadingChats ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conversa encontrada</p>
                    </div>
                  ) : (
                    <div>
                      {filteredChats.map((chat) => (
                        <button
                          key={chat.Id}
                          onClick={() => handleChatSelect(chat)}
                          className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            selectedChat?.Id === chat.Id ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {chat.Client?.Profile_Pic_URL ? (
                              <img src={chat.Client.Profile_Pic_URL} alt={chat.Client.Name} className="w-12 h-12 rounded-full" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <UserIcon size={24} className="text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {chat.Client?.Name || 'Chat sem cliente'}
                              </p>
                              <p className="text-xs text-gray-500">{formatWhatsApp(chat.Client?.WhatsApp_Number || chat.WA_Chat_Id)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg h-[700px] flex flex-col">
                  {/* Header do Chat */}
                  <div className="p-4 border-b border-gray-200 bg-green-50">
                    {selectedChat && selectedChat.Client ? (
                      <div className="flex items-center space-x-3">
                        {selectedChat.Client.Profile_Pic_URL ? (
                          <img src={selectedChat.Client.Profile_Pic_URL} alt={selectedChat.Client.Name} className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            <UserIcon size={24} className="text-green-700" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-800">{selectedChat.Client.Name}</h3>
                          <p className="text-sm text-gray-600 flex items-center space-x-1">
                            <Phone size={12} />
                            <span>{formatWhatsApp(selectedChat.Client.WhatsApp_Number)}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <MessageSquare size={24} className="mx-auto mb-2" />
                        <p className="text-sm">Selecione uma conversa</p>
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
                              {/* Mídia (Imagem, Vídeo, etc) */}
                              {msg.Media && msg.Media.Storage_Key && (
                                <div className="mb-2">
                                  {msg.Media.Mime_Type?.startsWith('image/') ? (
                                    <img 
                                      src={`data:${msg.Media.Mime_Type};base64,${msg.Media.Storage_Key}`}
                                      alt="Imagem enviada"
                                      className="rounded-lg max-w-full max-h-64 object-contain"
                                    />
                                  ) : msg.Media.Mime_Type?.startsWith('video/') ? (
                                    <video 
                                      controls
                                      className="rounded-lg max-w-full max-h-64"
                                    >
                                      <source src={`data:${msg.Media.Mime_Type};base64,${msg.Media.Storage_Key}`} type={msg.Media.Mime_Type} />
                                      Seu navegador não suporta vídeos.
                                    </video>
                                  ) : msg.Media.Mime_Type?.startsWith('audio/') ? (
                                    <audio controls className="w-full">
                                      <source src={`data:${msg.Media.Mime_Type};base64,${msg.Media.Storage_Key}`} type={msg.Media.Mime_Type} />
                                      Seu navegador não suporta áudio.
                                    </audio>
                                  ) : (
                                    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                                      <span className="text-sm">📎 Arquivo</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Texto/Caption */}
                              {(msg.Body || msg.Caption) && (
                                <p className="text-sm whitespace-pre-wrap">
                                  {msg.Body || msg.Caption}
                                </p>
                              )}
                              
                              {/* Horário e Status */}
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className={`text-xs ${
                                  msg.Direction === 1 ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {formatDate(msg.Created_At)}
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
                          <p className="text-xs mt-2">Selecione uma conversa</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rodapé - Apenas visualização (Admin não envia) */}
                  <div className="p-4 border-t border-gray-200 bg-gray-100">
                    <p className="text-sm text-gray-500 text-center">
                      ℹ️ Modo visualização - Use a tela de Mensagens WhatsApp para enviar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllMessages;