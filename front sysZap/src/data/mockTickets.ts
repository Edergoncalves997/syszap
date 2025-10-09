export interface Message {
  id: number;
  content: string;
  sender: 'client' | 'agent';
  timestamp: string;
}

export interface Ticket {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: number | null;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export const mockTickets: Ticket[] = [
  {
    id: 1,
    clientId: 1,
    clientName: 'Roberto Alves',
    clientPhone: '+55 11 98765-4321',
    subject: 'Problema com login',
    status: 'open',
    priority: 'high',
    assignedTo: 3,
    companyId: 1,
    createdAt: '2025-10-06 08:30:00',
    updatedAt: '2025-10-06 08:30:00',
    messages: [
      {
        id: 1,
        content: 'Olá, estou com problema para fazer login no sistema',
        sender: 'client',
        timestamp: '2025-10-06 08:30:00',
      },
    ],
  },
  {
    id: 2,
    clientId: 2,
    clientName: 'Juliana Ferreira',
    clientPhone: '+55 11 91234-5678',
    subject: 'Dúvida sobre faturamento',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 3,
    companyId: 1,
    createdAt: '2025-10-05 14:20:00',
    updatedAt: '2025-10-06 09:15:00',
    messages: [
      {
        id: 1,
        content: 'Bom dia! Gostaria de saber sobre o faturamento deste mês',
        sender: 'client',
        timestamp: '2025-10-05 14:20:00',
      },
      {
        id: 2,
        content: 'Olá Juliana! Vou verificar as informações para você.',
        sender: 'agent',
        timestamp: '2025-10-06 09:15:00',
      },
    ],
  },
  {
    id: 3,
    clientId: 3,
    clientName: 'Fernando Lima',
    clientPhone: '+55 21 99876-5432',
    subject: 'Solicitação de suporte técnico',
    status: 'resolved',
    priority: 'low',
    assignedTo: 4,
    companyId: 1,
    createdAt: '2025-10-04 10:00:00',
    updatedAt: '2025-10-05 16:30:00',
    messages: [
      {
        id: 1,
        content: 'Preciso de ajuda com a instalação',
        sender: 'client',
        timestamp: '2025-10-04 10:00:00',
      },
      {
        id: 2,
        content: 'Claro! Vou te enviar o passo a passo.',
        sender: 'agent',
        timestamp: '2025-10-04 10:15:00',
      },
      {
        id: 3,
        content: 'Consegui! Muito obrigado!',
        sender: 'client',
        timestamp: '2025-10-05 16:30:00',
      },
    ],
  },
  {
    id: 4,
    clientId: 4,
    clientName: 'Paula Rodrigues',
    clientPhone: '+55 11 97777-8888',
    subject: 'Atualização de cadastro',
    status: 'open',
    priority: 'medium',
    assignedTo: 2,
    companyId: 2,
    createdAt: '2025-10-06 11:00:00',
    updatedAt: '2025-10-06 11:00:00',
    messages: [
      {
        id: 1,
        content: 'Preciso atualizar meus dados cadastrais',
        sender: 'client',
        timestamp: '2025-10-06 11:00:00',
      },
    ],
  },
  {
    id: 5,
    clientId: 5,
    clientName: 'Ricardo Mendes',
    clientPhone: '+55 11 96666-7777',
    subject: 'Consulta de pedido',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 5,
    companyId: 2,
    createdAt: '2025-10-06 09:30:00',
    updatedAt: '2025-10-06 10:00:00',
    messages: [
      {
        id: 1,
        content: 'Gostaria de consultar o status do meu pedido #1234',
        sender: 'client',
        timestamp: '2025-10-06 09:30:00',
      },
      {
        id: 2,
        content: 'Vou verificar para você agora',
        sender: 'agent',
        timestamp: '2025-10-06 10:00:00',
      },
    ],
  },
];


