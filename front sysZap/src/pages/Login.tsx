import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.Role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/tickets');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        // Redirecionar baseado no papel do usuário
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          if (currentUser.Role === UserRole.ADMIN) {
            navigate('/admin/dashboard');
          } else {
            navigate('/tickets');
          }
        }
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Sys3 Atendimento</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão Multiempresa</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Test Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">
            Primeiro acesso: Crie um usuário ADMIN via API
          </p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="bg-gray-50 p-2 rounded text-center">
              <strong>POST /auth/register</strong>
              <br />
              Email, Password, Name, Role: 0 (ADMIN)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

