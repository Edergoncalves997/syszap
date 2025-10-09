/**
 * Configuração Centralizada de URLs e Variáveis de Ambiente
 * 
 * Este é o ÚNICO arquivo que deve conter configurações de URLs.
 * Todos os outros arquivos devem importar deste arquivo.
 */

// URL base da API (Backend)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// URL do WebSocket
export const getWebSocketURL = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = API_BASE_URL.replace('http://', '').replace('https://', '');
  return `${protocol}//${host}/ws`;
};

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔗 Configuração de URLs:', {
    API_BASE_URL,
    WEBSOCKET_URL: getWebSocketURL(),
    ENV: import.meta.env.MODE
  });
}

// Exportar configurações
export const config = {
  API_BASE_URL,
  WEBSOCKET_URL: getWebSocketURL(),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

export default config;

