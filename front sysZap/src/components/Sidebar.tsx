import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
  Smartphone,
  MessageCircle,
  ChevronLeft,
  Menu,
  ListOrdered,
  Ticket,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { UserRole, getRoleName } from '../types/api';

const Sidebar: React.FC = () => {
  const { user, companies, logout } = useAuth();
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      logout();
    }
  };

  const handleMenuClick = () => {
    // Em telas pequenas, fechar o sidebar ao clicar em um item
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  if (!user) return null;

  const company = companies.find((c) => c.Id === user.Company_Id);

  const isActive = (path: string) => location.pathname === path;

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/companies', icon: Building2, label: 'Empresas' },
    { path: '/admin/users', icon: Users, label: 'Usuários' },
    { path: '/clients', icon: UserCircle, label: 'Clientes' },
    { path: '/admin/queues', icon: ListOrdered, label: 'Filas' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categorias' },
    { path: '/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/admin/whatsapp', icon: Smartphone, label: 'Sessões WhatsApp' },
    { path: '/admin/messages', icon: MessageCircle, label: 'Todas as Mensagens' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const managerMenuItems = [
    { path: '/tickets', icon: Ticket, label: 'Meus Tickets' },
    { path: '/admin/queues', icon: ListOrdered, label: 'Filas' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categorias' },
    { path: '/whatsapp', icon: Smartphone, label: 'WhatsApp' },
    { path: '/clients', icon: UserCircle, label: 'Clientes' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const userMenuItems = [
    { path: '/tickets', icon: Ticket, label: 'Meus Tickets' },
    { path: '/whatsapp', icon: Smartphone, label: 'WhatsApp' },
    { path: '/clients', icon: UserCircle, label: 'Clientes' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const menuItems =
    user.Role === UserRole.ADMIN
      ? adminMenuItems
      : user.Role === UserRole.MANAGER
      ? managerMenuItems
      : userMenuItems;

  return (
    <>
      {/* Botão de Toggle (sempre visível) */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary-light transition-all duration-300 ${
          isOpen ? 'left-60' : 'left-4'
        }`}
        title={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar sidebar em mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`w-64 h-screen bg-primary text-white flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary-light/20">
          <h1 className="text-2xl font-bold">Sys3 Atendimento</h1>
        </div>

        {/* Menu Items com scroll */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleMenuClick}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-white text-primary'
                      : 'hover:bg-primary-light/20'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-primary-light/20">
          <div className="bg-primary-light/20 rounded-lg p-3 mb-3">
            <p className="font-semibold text-sm">{user.Name}</p>
            <p className="text-xs opacity-80">{getRoleName(user.Role)}</p>
            {company && (
              <p className="text-xs opacity-70 mt-1">{company.Name}</p>
            )}
          </div>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/20 text-white rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;


