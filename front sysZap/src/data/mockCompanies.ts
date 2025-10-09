export interface Company {
  id: number;
  name: string;
  cnpj?: string;
  status: 'connected' | 'disconnected';
  lastCheck: string;
}

export const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Sys3 Sistemas',
    cnpj: '12.345.678/0001-90',
    status: 'connected',
    lastCheck: '2025-10-06 10:30:00',
  },
  {
    id: 2,
    name: 'TechPlus',
    cnpj: '98.765.432/0001-11',
    status: 'disconnected',
    lastCheck: '2025-10-05 14:20:00',
  },
  {
    id: 3,
    name: 'Digital Solutions',
    cnpj: '11.222.333/0001-44',
    status: 'connected',
    lastCheck: '2025-10-06 09:15:00',
  },
];


