# Configuração de URLs do Sistema

## 📁 Arquivo de Configuração Único

Este diretório contém o arquivo **`env.ts`** que centraliza **TODAS** as configurações de URLs do sistema.

### ⚠️ REGRA IMPORTANTE

**NUNCA** coloque URLs hardcoded (fixas) em outros arquivos!  
**SEMPRE** importe as configurações deste arquivo.

---

## 🔧 Como Usar

### 1. Importar a configuração

```typescript
// Para importar a URL base da API
import { API_BASE_URL } from '../config/env';

// Para importar a função que gera a URL do WebSocket
import { getWebSocketURL } from '../config/env';

// Para importar todas as configurações
import { config } from '../config/env';
```

### 2. Usar nas requisições

#### Com `fetch`:
```typescript
const response = await fetch(`${API_BASE_URL}/sessions`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Com `axios` (já configurado no `api.ts`):
```typescript
import api from '../services/api';

// A URL base já está configurada automaticamente
const response = await api.get('/sessions');
```

#### Com WebSocket:
```typescript
import { getWebSocketURL } from '../config/env';

const wsUrl = getWebSocketURL();
const ws = new WebSocket(wsUrl);
```

---

## 🌍 Variáveis de Ambiente

A URL da API é configurada através da variável de ambiente `VITE_API_URL`.

### Arquivo `.env` (frontend)
```bash
# Desenvolvimento local
VITE_API_URL=http://localhost:3000

# Produção ou rede local
VITE_API_URL=http://192.168.1.100:3000
```

### Fallback
Se `VITE_API_URL` não estiver definida, o sistema usa `http://localhost:3000` por padrão.

---

## 📝 Exemplos de Arquivos Atualizados

Os seguintes arquivos já foram **atualizados** para usar a configuração centralizada:

✅ `src/services/api.ts`  
✅ `src/services/websocketService.ts`  
✅ `src/pages/WhatsAppMessages.tsx`  
✅ `src/pages/admin/AllMessages.tsx`  
✅ `src/pages/admin/WhatsAppSessions.tsx`  
✅ `src/context/AuthContext.tsx`

---

## 🚫 O que NÃO fazer

```typescript
// ❌ ERRADO - URL hardcoded
const response = await fetch('http://localhost:3000/sessions');

// ❌ ERRADO - URL hardcoded
const ws = new WebSocket('ws://localhost:3000/ws');
```

## ✅ O que fazer

```typescript
// ✅ CORRETO - Usando configuração centralizada
import { API_BASE_URL } from '../config/env';
const response = await fetch(`${API_BASE_URL}/sessions`);

// ✅ CORRETO - Usando função do config
import { getWebSocketURL } from '../config/env';
const ws = new WebSocket(getWebSocketURL());
```

---

## 🔍 Como Verificar

Para verificar se há URLs hardcoded no código, execute:

```bash
# No diretório raiz do projeto
grep -r "http://localhost:3000" front\ sysZap/src/
```

Se o comando retornar resultados, significa que existem URLs hardcoded que precisam ser substituídas.

---

## 📚 Estrutura do Arquivo de Configuração

```typescript
// env.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getWebSocketURL = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = API_BASE_URL.replace('http://', '').replace('https://', '');
  return `${protocol}//${host}/ws`;
};

export const config = {
  API_BASE_URL,
  WEBSOCKET_URL: getWebSocketURL(),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
```

---

## 🎯 Benefícios

1. **Centralização**: Um único lugar para gerenciar URLs
2. **Manutenção**: Fácil de atualizar e manter
3. **Flexibilidade**: Usa variáveis de ambiente
4. **Segurança**: Evita URLs hardcoded no código
5. **Deploy**: Fácil de configurar para diferentes ambientes

---

## 📞 Suporte

Se tiver dúvidas sobre como usar a configuração centralizada, consulte este arquivo ou entre em contato com a equipe de desenvolvimento.

