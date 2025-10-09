import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Ticket } from '../data/mockTickets';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, selectedTicket, onSelectTicket }) => {
  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado',
    };
    return {
      color: colors[status as keyof typeof colors] || colors.open,
      label: labels[status as keyof typeof labels] || status,
    };
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="bg-white border-r border-gray-200 overflow-y-auto h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Mensagens</h2>
        <p className="text-sm text-gray-500 mt-1">{tickets.length} conversa(s)</p>
      </div>

      <div className="divide-y divide-gray-100">
        {tickets.map((ticket) => {
          const status = getStatusBadge(ticket.status);
          const isSelected = selectedTicket?.id === ticket.id;
          const lastMessage = ticket.messages[ticket.messages.length - 1];

          return (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className={`p-4 cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">{ticket.clientName}</h3>
                  <p className="text-xs text-gray-600 mt-1 truncate" title={lastMessage?.content}>
                    {lastMessage?.sender === 'agent' ? 'Você: ' : ''}{lastMessage?.content || 'Sem mensagens'}
                  </p>
                </div>
                {getPriorityIcon(ticket.priority)}
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                  {status.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {ticket.messages.length}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    {new Date(ticket.updatedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketList;


