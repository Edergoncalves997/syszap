import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// Log da URL da API para debug
console.log('🔗 API URL configurada:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: !!token,
      baseURL: config.baseURL
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro no request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ Erro na requisição:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      console.warn('⚠️ Token inválido ou expirado. Redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

