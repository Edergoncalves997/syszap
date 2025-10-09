export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  companyId: number;
  lastContact: string;
  totalTickets: number;
}

export const mockClients: Client[] = [
  {
    id: 1,
    name: 'Roberto Alves',
    phone: '+55 11 98765-4321',
    email: 'roberto@email.com',
    companyId: 1,
    lastContact: '2025-10-06 08:30:00',
    totalTickets: 5,
  },
  {
    id: 2,
    name: 'Juliana Ferreira',
    phone: '+55 11 91234-5678',
    email: 'juliana@email.com',
    companyId: 1,
    lastContact: '2025-10-06 09:15:00',
    totalTickets: 3,
  },
  {
    id: 3,
    name: 'Fernando Lima',
    phone: '+55 21 99876-5432',
    email: 'fernando@email.com',
    companyId: 1,
    lastContact: '2025-10-05 16:30:00',
    totalTickets: 2,
  },
  {
    id: 4,
    name: 'Paula Rodrigues',
    phone: '+55 11 97777-8888',
    email: 'paula@email.com',
    companyId: 2,
    lastContact: '2025-10-06 11:00:00',
    totalTickets: 4,
  },
  {
    id: 5,
    name: 'Ricardo Mendes',
    phone: '+55 11 96666-7777',
    companyId: 2,
    lastContact: '2025-10-06 10:00:00',
    totalTickets: 1,
  },
  {
    id: 6,
    name: 'Carla Souza',
    phone: '+55 11 95555-6666',
    email: 'carla@email.com',
    companyId: 3,
    lastContact: '2025-10-04 15:20:00',
    totalTickets: 7,
  },
];


