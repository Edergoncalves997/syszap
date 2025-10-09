import React, { useState, useEffect } from 'react';
import { Plus, Power, PowerOff, QrCode, RefreshCw, Smartphone, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Modal from '../../components/Modal';
import { whatsappService } from '../../services/whatsappService';
import { Session, getSessionStatusName, getSessionStatusColor } from '../../types/api';
import { toast } from 'react-hot-toast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { API_BASE_URL } from '../../config/env';

const WhatsAppSessions: React.FC = () => {
  const { companies } = useAuth();
  const { isOpen } = useSidebar();
  const { on } = useWebSocket();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingSession, setSyncingSession] = useState<string | null>(null);

  const [form, setForm] = useState({
    Company_Id: '',
    Session_Name: '',
    Phone_Number: '',
    Session_Token: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  // WebSocket: Atualizar QR Code em tempo real
  useEffect(() => {
    const cleanup1 = on('qr_code', (data: any) => {
      console.log('🔌 WebSocket: QR Code recebido', data);
      
      if (selectedSession && data.sessionId === selectedSession.Id) {
        setQrCode(data.qrCode);
        toast.success('✅ QR Code atualizado automaticamente!');
      }
    });

    const cleanup2 = on('session_status', (data: any) => {
      console.log('🔌 WebSocket: Status da sessão atualizado', data);
      
      // Recarregar sessões quando status mudar
      loadSessions();
      
      // Fechar modal de QR se conectou
      if (data.status === 'connected' && selectedSession && data.sessionId === selectedSession.Id) {
        toast.success('✅ WhatsApp conectado com sucesso!');
        setShowQRModal(false);
        setQrCode(null);
        setSelectedSession(null);
      }
    });

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [on, selectedSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast.error('Erro ao carregar sessões');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...form,
          Status: 0
        })
      });

      if (!response.ok) throw new Error('Erro ao criar sessão');

      toast.success('✅ Sessão criada com sucesso!');
      resetForm();
      await loadSessions();
    } catch (error: any) {
      toast.error('❌ Erro ao criar sessão');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (session: Session) => {
    setIsLoading(true);
    try {
      const result = await whatsappService.startSession(session.Id);
      
      // Abrir modal imediatamente
      setSelectedSession(session);
      setShowQRModal(true);
      
      if (result.qrCode) {
        // QR Code já foi gerado
        setQrCode(result.qrCode);
        toast.success('✅ QR Code gerado! Escaneie com seu WhatsApp.');
        setIsLoading(false);
      } else {
        // QR Code será recebido via WebSocket automaticamente
        toast.success('⏳ Aguardando QR Code... Será exibido automaticamente.', { duration: 3000 });
        setIsLoading(false);
      }

      await loadSessions();
    } catch (error: any) {
      console.error('Erro ao iniciar sessão:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('❌ Erro de conexão com o backend!');
      } else if (error.response?.status === 403) {
        toast.error('❌ Acesso negado! Apenas ADMIN pode iniciar sessões.');
      } else {
        toast.error(`❌ Erro ao iniciar sessão: ${error.response?.data?.message || error.message}`);
      }
      setIsLoading(false);
    }
  };

  const handleStopSession = async (sessionId: string) => {
    if (!window.confirm('Deseja desconectar esta sessão WhatsApp?')) return;

    setIsLoading(true);
    try {
      await whatsappService.stopSession(sessionId);
      toast.success('✅ Sessão desconectada com sucesso!');
      await loadSessions();
    } catch (error: any) {
      toast.error(`❌ Erro ao parar sessão: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQR = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const result = await whatsappService.getQRCode(sessionId);
      setQrCode(result.qrCode);
      toast.success('✅ QR Code atualizado!');
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('❌ QR Code não disponível. Inicie a sessão primeiro.');
      } else if (error.response?.status === 410) {
        toast.error('❌ QR Code expirado! Reinicie a sessão.');
      } else {
        toast.error('❌ Erro ao atualizar QR Code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      Company_Id: '',
      Session_Name: '',
      Phone_Number: '',
      Session_Token: '',
    });
    setShowModal(false);
  };

  const generateToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setForm({ ...form, Session_Token: token });
  };

  const handleSyncMessages = async (sessionId: string) => {
    setSyncingSession(sessionId);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/sync/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Erro na sincronização');

      const result = await response.json();
      
      toast.success(`✅ Cadastro de clientes concluído! 
        👤 ${result.stats.newClients} clientes novos cadastrados
        ✅ ${result.stats.existingClients} clientes já existentes`);
      
      console.log('📊 Estatísticas do cadastro:', result.stats);
    } catch (error: any) {
      toast.error('❌ Erro no cadastro de clientes');
      console.error(error);
    } finally {
      setSyncingSession(null);
    }
  };

  return (
    <div className="flex h-screen bg-neutral">
      <Sidebar />
      
      <div className={`flex-1 ${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 overflow-auto`}>
        <Header title="Sessões WhatsApp" subtitle="Gerenciamento de conexões WhatsApp" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Total: {sessions.length}</h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Nova Sessão WhatsApp</span>
            </button>
          </div>

          {/* Grid de Sessões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const company = companies.find(c => c.Id === session.Company_Id);
              return (
                <div key={session.Id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        session.Status === 1 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Smartphone className={
                          session.Status === 1 ? 'text-green-600' : 'text-gray-600'
                        } size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{session.Session_Name}</h3>
                        <p className="text-sm text-gray-600">{session.Phone_Number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Empresa:</span>
                      <span className="font-medium text-gray-800">{company?.Name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSessionStatusColor(session.Status)}`}>
                        {getSessionStatusName(session.Status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between space-x-2 pt-4 border-t border-gray-200">
                    {session.Status === 0 && (
                      <button
                        onClick={() => handleStartSession(session)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        title="Conectar"
                      >
                        <Power size={16} />
                        <span className="text-sm">Conectar</span>
                      </button>
                    )}

                    {session.Status === 2 && (
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          handleRefreshQR(session.Id);
                          setShowQRModal(true);
                        }}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        title="Ver QR Code"
                      >
                        <QrCode size={16} />
                        <span className="text-sm">Ver QR</span>
                      </button>
                    )}

                    {session.Status === 1 && (
                      <>
                        <button
                          onClick={() => handleSyncMessages(session.Id)}
                          disabled={syncingSession === session.Id}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          title="Cadastrar clientes de conversas existentes"
                        >
                          {syncingSession === session.Id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <UserPlus size={16} />
                          )}
                          <span className="text-sm">
                            {syncingSession === session.Id ? 'Cadastrando...' : 'Cadastrar Clientes'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleStopSession(session.Id)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          title="Desconectar"
                        >
                          <PowerOff size={16} />
                          <span className="text-sm">Desconectar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Smartphone size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma sessão WhatsApp cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Sessão */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title="Nova Sessão WhatsApp"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Empresa *</label>
            <select
              value={form.Company_Id}
              onChange={(e) => setForm({ ...form, Company_Id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione uma empresa</option>
              {companies.map((company) => (
                <option key={company.Id} value={company.Id}>
                  {company.Name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Sessão *</label>
            <input
              type="text"
              value={form.Session_Name}
              onChange={(e) => setForm({ ...form, Session_Name: e.target.value })}
              placeholder="Atendimento Principal"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número WhatsApp *</label>
            <input
              type="tel"
              value={form.Phone_Number}
              onChange={(e) => setForm({ ...form, Phone_Number: e.target.value })}
              placeholder="5511999999999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: Código país + DDD + número (ex: 5511999999999)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Token da Sessão *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={form.Session_Token}
                onChange={(e) => setForm({ ...form, Session_Token: e.target.value })}
                placeholder="Token único"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={generateToken}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Gerar
              </button>
            </div>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Sessão'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de QR Code */}
      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrCode(null);
          setSelectedSession(null);
        }}
        title="QR Code WhatsApp"
      >
        <div className="text-center space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            {qrCode ? (
              <img src={qrCode} alt="QR Code WhatsApp" className="mx-auto max-w-sm" />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              📱 Escaneie com seu WhatsApp:
            </p>
            <ol className="text-xs text-gray-600 text-left space-y-1 bg-blue-50 p-4 rounded-lg">
              <li>1. Abra o WhatsApp no celular</li>
              <li>2. Toque em "Mais opções" ou "Configurações"</li>
              <li>3. Selecione "Dispositivos vinculados"</li>
              <li>4. Toque em "Vincular um dispositivo"</li>
              <li>5. Aponte o celular para esta tela</li>
            </ol>
          </div>

          <button
            onClick={() => selectedSession && handleRefreshQR(selectedSession.Id)}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} />
            <span>Atualizar QR Code</span>
          </button>

          <p className="text-xs text-gray-500">
            O QR Code expira em 1 minuto. Clique em "Atualizar" se necessário.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default WhatsAppSessions;

