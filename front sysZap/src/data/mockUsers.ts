export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'user';
  companyId: number;
  status: 'active' | 'inactive';
}

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Eder Farias',
    email: 'admin@sys3.com',
    password: '123',
    role: 'admin',
    companyId: 1,
    status: 'active',
  },
  {
    id: 2,
    name: 'Carlos Silva',
    email: 'carlos@techplus.com',
    password: '123',
    role: 'manager',
    companyId: 2,
    status: 'active',
  },
  {
    id: 3,
    name: 'João Pereira',
    email: 'joao@sys3.com',
    password: '123',
    role: 'user',
    companyId: 1,
    status: 'active',
  },
  {
    id: 4,
    name: 'Maria Santos',
    email: 'maria@sys3.com',
    password: '123',
    role: 'user',
    companyId: 1,
    status: 'active',
  },
  {
    id: 5,
    name: 'Pedro Oliveira',
    email: 'pedro@techplus.com',
    password: '123',
    role: 'user',
    companyId: 2,
    status: 'inactive',
  },
  {
    id: 6,
    name: 'Ana Costa',
    email: 'ana@digital.com',
    password: '123',
    role: 'manager',
    companyId: 3,
    status: 'active',
  },
];


