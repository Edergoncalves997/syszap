import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'manager' | 'user')[];
}

const roleMap: Record<string, number> = {
  'admin': UserRole.ADMIN,
  'manager': UserRole.MANAGER,
  'user': UserRole.USER,
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRoleNumber = user.Role;
    const allowedRoleNumbers = allowedRoles.map(role => roleMap[role]);
    
    if (!allowedRoleNumbers.includes(userRoleNumber)) {
      return <Navigate to="/tickets" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;


