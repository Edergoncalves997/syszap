import React from 'react';
import { User, Phone, Mail, Calendar, MessageSquare } from 'lucide-react';
import { Ticket } from '../data/mockTickets';
import { Client } from '../data/mockClients';

interface ClientDetailsProps {
  ticket: Ticket | null;
  clients: Client[];
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ ticket, clients }) => {
  if (!ticket) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <p className="text-gray-500 text-center">Nenhum chamado selecionado</p>
      </div>
    );
  }

  const client = clients.find((c) => c.id === ticket.clientId);

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Detalhes do Cliente</h3>

        <div className="space-y-4">
          {/* Client Name */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="text-sm font-medium text-gray-800">{ticket.clientName}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Phone size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Telefone</p>
              <p className="text-sm font-medium text-gray-800">{ticket.clientPhone}</p>
            </div>
          </div>

          {/* Email */}
          {client?.email && (
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Mail size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-800">{client.email}</p>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Calendar size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Abertura</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(ticket.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Total Tickets */}
          {client && (
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total de Chamados</p>
                <p className="text-sm font-medium text-gray-800">{client.totalTickets}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ticket Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Informações do Ticket</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-800 capitalize mt-1">
                {ticket.status.replace('_', ' ')}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Prioridade</p>
              <p className="text-sm font-medium text-gray-800 capitalize mt-1">
                {ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Última Atualização</p>
              <p className="text-sm font-medium text-gray-800 mt-1">
                {new Date(ticket.updatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;


