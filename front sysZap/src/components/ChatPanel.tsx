import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Ticket, Message } from '../data/mockTickets';

interface ChatPanelProps {
  ticket: Ticket | null;
  onSendMessage: (ticketId: number, content: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ ticket, onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && ticket) {
      onSendMessage(ticket.id, message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Selecione um chamado para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">{ticket.subject}</h2>
        <p className="text-sm text-gray-600">{ticket.clientName} • {ticket.clientPhone}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ticket.messages.map((msg: Message) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender === 'agent'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.sender === 'agent' ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={handleSend}
            className="bg-primary text-white p-2 rounded-lg hover:bg-primary-light transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;


